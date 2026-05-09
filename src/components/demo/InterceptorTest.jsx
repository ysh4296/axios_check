import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosVuln, axiosFix, VULN_VERSION, FIX_VERSION } from '../../lib/axiosInstances.js';

const CRLF_PAYLOAD = 'valid-session\r\nX-Admin: true\r\nX-AWS-Token: stolen';
const HEADER_KEY   = 'X-Session-Id';

function buildOutput({ status, isFetching, data, error }) {
  if (!isFetching && status === 'pending') return '버튼을 눌러 실행하세요.';
  if (isFetching) return '테스트 실행 중...';

  if (status === 'success') {
    const capturedHeaders = data;
    const lines = [
      '[ 결과 ] ⚠ 요청 완료 — CRLF가 포함된 채 어댑터에 전달됨!',
      '',
      '캡처된 헤더:',
    ];

    Object.entries(capturedHeaders).forEach(([k, v]) => {
      const rawVal  = String(v ?? '');
      const hasCrlf = /[\r\n]/.test(rawVal);
      const display = rawVal.replace(/\r\n/g, '\\r\\n').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
      lines.push(`  ${k}: ${display}${hasCrlf ? '  ← CRLF 포함!' : ''}`);
    });

    const sessionVal = Object.entries(capturedHeaders)
      .find(([k]) => k.toLowerCase() === HEADER_KEY.toLowerCase())?.[1] ?? '';

    if (sessionVal) {
      lines.push('');
      lines.push('HTTP 파서가 해석하는 실제 헤더:');
      const parts = sessionVal.split(/\r\n|\r|\n/);
      lines.push(`  ${HEADER_KEY}: ${parts[0]}`);
      parts.slice(1).filter(p => p.trim()).forEach(p => {
        lines.push(`  ${p}  ← 주입된 헤더!`);
      });
    }

    lines.push('');
    lines.push('위험: useQuery refetch마다 악성 헤더가 반복 전송됨');
    return lines.join('\n');
  }

  if (status === 'error') {
    return [
      '[ 결과 ] ✓ 인터셉터에서 즉시 차단됨!',
      '',
      `오류: "${error.message}"`,
      '',
      'config.headers.set()이 AxiosError를 던져 요청이 차단됨.',
      'TanStack Query: queryFn이 reject되어 error 상태로 전환.',
      '→ 악성 헤더가 서버에 단 한 번도 전달되지 않음',
    ].join('\n');
  }

  return '';
}

function InterceptorPanel({ side }) {
  const isVuln    = side === 'vuln';
  const axiosInst = isVuln ? axiosVuln : axiosFix;
  const version   = isVuln ? VULN_VERSION : FIX_VERSION;

  const { data, error, status, isFetching, refetch } = useQuery({
    queryKey: ['interceptor-test', side],
    enabled: false,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const capturedHeaders = {};

      // 모의 어댑터 — queryFn 내부 apiClient.get()과 동일한 역할
      const instance = axiosInst.create({
        adapter: (config) => {
          const h = typeof config.headers?.toJSON === 'function'
            ? (config.headers.toJSON(true) ?? {})
            : {};
          Object.assign(capturedHeaders, h);
          return Promise.resolve({
            data: capturedHeaders,
            status: 200, statusText: 'OK',
            headers: {}, config,
          });
        },
      });

      // 인터셉터: 취약한 React 패턴 — 외부 값을 headers.set()으로 전달
      // 1.14.0: set() 성공 → 요청 진행
      // 1.15.0: set() AxiosError throw → Promise reject
      instance.interceptors.request.use((config) => {
        config.headers.set(HEADER_KEY, CRLF_PAYLOAD);
        return config;
      });

      const response = await instance.get('https://api.myapp.com/dashboard', {
        headers: { Authorization: 'Bearer user-token' },
      });

      return response.data; // capturedHeaders
    },
  });

  const resultClass = status === 'success' ? 'result-vulnerable'
                    : status === 'error'   ? 'result-safe' : '';
  const statusText  = isFetching           ? '테스트 중...'
                    : status === 'success' ? '⚠ 취약 확인됨'
                    : status === 'error'   ? '✓ 안전 (패치됨)' : '대기 중';
  const statusClass = status === 'success' ? 'vulnerable'
                    : status === 'error'   ? 'safe-result' : '';

  return (
    <div className={`demo-panel ${isVuln ? 'panel-vuln' : 'panel-safe'}`}>
      <div className="panel-header">
        <span className={`version-badge ${isVuln ? 'vuln' : 'safe'}`}>
          axios {version} — {isVuln ? '취약' : '패치'}
        </span>
        <span className={`status-dot ${statusClass}`}>{statusText}</span>
      </div>
      <div className="panel-body">
        <div className="demo-label">인터셉터 헤더 페이로드 (CRLF 포함):</div>
        <pre className="demo-payload">
          &quot;valid-session\r\nX-Admin: true\r\nX-AWS-Token: stolen&quot;
        </pre>
        <button
          className={`run-btn ${isVuln ? 'vuln-btn' : 'safe-btn'}`}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? '실행 중...' : `${isVuln ? '취약' : '패치'} 버전 테스트`}
        </button>
        <div className={`result-box ${resultClass}`}>
          <pre>{buildOutput({ status, isFetching, data, error })}</pre>
        </div>
      </div>
    </div>
  );
}

export default function InterceptorTest() {
  const qc = useQueryClient();

  const runBoth = () => {
    qc.refetchQueries({ queryKey: ['interceptor-test', 'vuln'] });
    qc.refetchQueries({ queryKey: ['interceptor-test', 'safe'] });
  };

  return (
    <>
      <div className="demo-context">
        <strong>시뮬레이션: </strong>
        <span className="mono">interceptors.request</span>에서{' '}
        <span className="mono">config.headers.set()</span>으로 CRLF 페이로드 설정.
        1.14.0은 인터셉터 통과 후 어댑터까지 도달, 1.15.0은 인터셉터에서 즉시 차단.
        TanStack Query의 <span className="mono">status</span>가 실시간으로 반영됩니다.
      </div>
      <div className="demo-grid">
        <InterceptorPanel side="vuln" />
        <div className="demo-divider">
          <div className="vs-circle">VS</div>
        </div>
        <InterceptorPanel side="safe" />
      </div>
      <button className="run-both-btn" onClick={runBoth}>
        양쪽 동시 실행
      </button>
    </>
  );
}
