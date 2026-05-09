import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosVuln, axiosFix, VULN_VERSION, FIX_VERSION } from '../../lib/axiosInstances.js';

const CRLF_PAYLOAD = 'valid-session\r\nX-Admin: true\r\nX-AWS-Token: stolen';
const HEADER_KEY   = 'X-Session-Id';

// 캡처된 헤더 객체에 CRLF가 포함된 값이 하나라도 있는지 확인
function detectCRLF(headers) {
  return Object.values(headers ?? {}).some(v => /[\r\n]/.test(String(v ?? '')));
}

function buildOutput({ status, isFetching, data, error }) {
  if (!isFetching && status === 'pending') return '버튼을 눌러 실행하세요.';
  if (isFetching) return '테스트 실행 중...';

  if (status === 'success') {
    const capturedHeaders = data ?? {};
    const hasCRLF = detectCRLF(capturedHeaders);

    const lines = [
      hasCRLF
        ? '[ 결과 ] ⚠ CRLF가 adapter에 도착한 헤더에 잔존'
        : '[ 결과 ] ✓ adapter 도착 시 CRLF 없음',
      '',
      '캡처된 헤더:',
    ];

    Object.entries(capturedHeaders).forEach(([k, v]) => {
      const rawVal   = String(v ?? '');
      const hasCrlfV = /[\r\n]/.test(rawVal);
      const display  = rawVal
        .replace(/\r\n/g, '\\r\\n')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
      lines.push(`  ${k}: ${display}${hasCrlfV ? '  ← CRLF 포함!' : ''}`);
    });

    const sessionEntry = Object.entries(capturedHeaders)
      .find(([k]) => k.toLowerCase() === HEADER_KEY.toLowerCase());
    const sessionVal = sessionEntry?.[1] ?? '';

    if (sessionVal && /[\r\n]/.test(String(sessionVal))) {
      const parts = String(sessionVal).split(/\r\n|\r|\n/);
      lines.push('');
      lines.push('HTTP 파서가 해석하는 실제 헤더:');
      lines.push(`  ${HEADER_KEY}: ${parts[0]}`);
      parts.slice(1).filter(p => p.trim()).forEach(p => {
        lines.push(`  ${p}  ← 주입된 헤더!`);
      });
      lines.push('');
      lines.push('판정: 취약 — useQuery refetch마다 악성 헤더 반복 전송');
    } else {
      lines.push('');
      lines.push('판정: CRLF가 인터셉터 또는 dispatch 과정에서 제거/차단됨');
    }

    return lines.join('\n');
  }

  if (status === 'error') {
    return [
      '[ 결과 ] ✓ 인터셉터에서 즉시 차단됨',
      '',
      `오류: "${error.message}"`,
      '',
      'config.headers.set()이 AxiosError를 던져 요청 차단.',
      'TanStack Query: queryFn이 reject → status = "error".',
      '판정: 안전 — 악성 헤더가 서버에 단 한 번도 전달되지 않음',
    ].join('\n');
  }

  return '';
}

function InterceptorPanel({ side, runTrigger }) {
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

      // 취약 패턴: 인터셉터에서 외부 값을 headers.set()으로 전달
      // 1.14.0 → set() 성공, CRLF가 adapter까지 도달
      // 1.15.0+ → set()에서 AxiosError throw, Promise reject
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

  useEffect(() => {
    if (runTrigger > 0) refetch();
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // adapter 도달 + CRLF 잔존 여부로 취약/안전 판정
  const hasCRLFInCapture = status === 'success' && detectCRLF(data);
  const isUnsafe = hasCRLFInCapture;
  const isSafe   = status === 'error' || (status === 'success' && !hasCRLFInCapture);

  const resultClass = isUnsafe ? 'result-vulnerable'
                    : isSafe   ? 'result-safe'
                    : '';
  const statusText  = isFetching ? '테스트 중...'
                    : isUnsafe  ? '⚠ CRLF 잔존 (취약)'
                    : isSafe    ? '✓ CRLF 차단/제거'
                    : '대기 중';
  const statusClass = isUnsafe ? 'vulnerable'
                    : isSafe   ? 'safe-result'
                    : '';

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
  const [runTrigger, setRunTrigger] = useState(0);

  return (
    <>
      <div className="demo-context">
        <strong>체크 포인트: </strong>
        <span className="mono">interceptors.request</span>에서{' '}
        <span className="mono">config.headers.set()</span>으로 CRLF 설정 후,
        custom adapter에 도착한 최종 헤더에 CRLF가 잔존하는지 검사.
        판정 기준은 <span className="mono">status</span>가 아니라 캡처된 헤더의{' '}
        <span className="mono">hasCRLF</span>입니다.
      </div>
      <div className="demo-grid">
        <InterceptorPanel side="vuln" runTrigger={runTrigger} />
        <div className="demo-divider">
          <div className="vs-circle">VS</div>
        </div>
        <InterceptorPanel side="safe" runTrigger={runTrigger} />
      </div>
      <button className="run-both-btn" onClick={() => setRunTrigger(t => t + 1)}>
        양쪽 동시 실행
      </button>
    </>
  );
}
