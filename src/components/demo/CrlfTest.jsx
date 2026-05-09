import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosVuln, axiosFix, VULN_VERSION, FIX_VERSION } from '../../lib/axiosInstances.js';

// 반드시 JS 리터럴로 하드코딩 — HTML input은 브라우저가 \r\n을 자동 제거함
const CRLF_PAYLOAD = 'legit-trace-id\r\nX-Injected: hacked-by-crlf';
const HEADER_KEY   = 'X-Trace-Id';

function buildOutput({ status, isFetching, data, error }) {
  if (!isFetching && status === 'pending') return '버튼을 눌러 실행하세요.';
  if (isFetching) return '테스트 실행 중...';

  if (status === 'success') {
    const parts = CRLF_PAYLOAD.split(/\r\n|\r|\n/);
    return [
      '[ 결과 ] ⚠ 헤더 설정 성공 — CRLF가 통과됨!',
      '',
      `저장된 헤더 값: ${JSON.stringify(data.stored)}`,
      '',
      'HTTP 요청에 포함될 헤더 (파서 해석):',
      `  ${HEADER_KEY}: ${parts[0]}`,
      ...parts.slice(1).filter(p => p.trim()).map(p => `  ${p}  ← 주입된 헤더!`),
      '',
      '위험: 모든 useQuery / useMutation 요청에 이 헤더가 포함됨',
    ].join('\n');
  }

  if (status === 'error') {
    return [
      '[ 결과 ] ✓ 예외 발생 — CRLF 차단됨!',
      '',
      `오류 메시지: "${error.message}"`,
      '',
      'AxiosError로 요청이 차단되어 네트워크에 전달되지 않음.',
      'TanStack Query: 이 쿼리를 error 상태로 처리합니다.',
    ].join('\n');
  }

  return '';
}

function CrlfPanel({ side }) {
  const isVuln    = side === 'vuln';
  const axiosInst = isVuln ? axiosVuln : axiosFix;
  const version   = isVuln ? VULN_VERSION : FIX_VERSION;

  // queryFn이 throw하면 TanStack Query가 자동으로 status='error'로 처리
  const { data, error, status, isFetching, refetch } = useQuery({
    queryKey: ['crlf-test', side],
    enabled: false,        // 버튼 클릭 시에만 실행
    retry: false,
    staleTime: Infinity,
    queryFn: () => {
      const headers = new axiosInst.AxiosHeaders();
      headers.set(HEADER_KEY, CRLF_PAYLOAD); // 1.14.0: 통과 / 1.15.0: AxiosError throw
      const stored = typeof headers.get === 'function'
        ? headers.get(HEADER_KEY)
        : headers[HEADER_KEY];
      return { stored };
    },
  });

  const resultClass  = status === 'success' ? 'result-vulnerable'
                     : status === 'error'   ? 'result-safe' : '';
  const statusText   = isFetching           ? '테스트 중...'
                     : status === 'success' ? '⚠ 취약 확인됨'
                     : status === 'error'   ? '✓ 안전 (패치됨)' : '대기 중';
  const statusClass  = status === 'success' ? 'vulnerable'
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
        <div className="demo-label">인터셉터에 주입되는 헤더 페이로드:</div>
        <pre className="demo-payload">&quot;legit-trace-id\r\nX-Injected: hacked-by-crlf&quot;</pre>
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

export default function CrlfTest() {
  const qc = useQueryClient();

  const runBoth = () => {
    qc.refetchQueries({ queryKey: ['crlf-test', 'vuln'] });
    qc.refetchQueries({ queryKey: ['crlf-test', 'safe'] });
  };

  return (
    <>
      <div className="demo-context">
        <strong>시뮬레이션: </strong>
        <span className="mono">
          {'apiClient.interceptors.request.use(cfg => { cfg.headers.set("X-Trace-Id", userInput); return cfg; })'}
        </span>
        {' '} — <span className="mono">AxiosHeaders.set()</span>에 CRLF 값 직접 전달.
        취약 버전은 헤더에 저장, 패치 버전은 즉시 AxiosError.
      </div>
      <div className="demo-grid">
        <CrlfPanel side="vuln" />
        <div className="demo-divider">
          <div className="vs-circle">VS</div>
        </div>
        <CrlfPanel side="safe" />
      </div>
      <button className="run-both-btn" onClick={runBoth}>
        양쪽 동시 실행
      </button>
    </>
  );
}
