import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosVuln, axiosFix, VULN_VERSION, FIX_VERSION } from '../../lib/axiosInstances';

const CRLF_PAYLOAD = 'legit-trace-id\r\nX-Injected: hacked-by-crlf';
const HEADER_KEY   = 'X-Trace-Id';

interface CrlfResult {
  stored: unknown;
  hasCRLF: boolean;
  allHeaders: Record<string, unknown>;
}

interface BuildOutputArgs {
  status: 'pending' | 'error' | 'success';
  isFetching: boolean;
  data: CrlfResult | undefined;
  error: Error | null;
}

function buildOutput({ status, isFetching, data, error }: BuildOutputArgs): string {
  if (!isFetching && status === 'pending') return '버튼을 눌러 실행하세요.';
  if (isFetching) return '테스트 실행 중...';

  if (status === 'success') {
    const stored  = data?.stored;
    const hasCRLF = data?.hasCRLF;

    if (hasCRLF) {
      const parts = String(stored).split(/\r\n|\r|\n/);
      return [
        '[ 결과 ] ⚠ CRLF가 최종 헤더 값에 잔존',
        '',
        `최종 헤더 값: ${JSON.stringify(stored)}`,
        '',
        'HTTP 파서가 해석하는 헤더:',
        `  ${HEADER_KEY}: ${parts[0]}`,
        ...parts.slice(1).filter(p => p.trim()).map(p => `  ${p}  ← 주입 가능`),
        '',
        '판정: 취약 — axios request() 파이프라인 통과 후 CRLF 잔존',
      ].join('\n');
    }

    return [
      '[ 결과 ] ✓ CRLF가 최종 헤더에서 제거됨',
      '',
      `최종 헤더 값: ${JSON.stringify(stored)}`,
      '',
      '판정: 패치 또는 런타임 방어로 인해 CRLF가 남지 않음',
    ].join('\n');
  }

  if (status === 'error') {
    return [
      '[ 결과 ] ✓ 예외 발생 — 요청 차단',
      '',
      `오류 메시지: "${error?.message ?? ''}"`,
      '',
      '판정: 요청 생성/전송 전 단계에서 AxiosError로 차단됨',
    ].join('\n');
  }

  return '';
}

interface PanelProps {
  side: 'vuln' | 'safe';
  runTrigger: number;
}

function CrlfPanel({ side, runTrigger }: PanelProps) {
  const isVuln    = side === 'vuln';
  const axiosInst = isVuln ? axiosVuln : axiosFix;
  const version   = isVuln ? VULN_VERSION : FIX_VERSION;

  const { data, error, status, isFetching, refetch } = useQuery<CrlfResult, Error>({
    queryKey: ['crlf-test', side],
    enabled: false,
    retry: false,
    staleTime: Infinity,
    // AxiosHeaders.set() 단독이 아니라 axios.request() 파이프라인 전체를 통과시킨다.
    // custom adapter가 dispatch 이후 도착한 최종 config.headers를 캡처한다.
    queryFn: async () => {
      const res = await axiosInst.request({
        url: '/crlf-demo',
        method: 'GET',
        headers: { [HEADER_KEY]: CRLF_PAYLOAD },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adapter: async (config: any): Promise<any> => {
          const headers = config.headers;
          const stored  =
            typeof headers?.get === 'function'
              ? headers.get(HEADER_KEY)
              : headers?.[HEADER_KEY];

          return {
            status: 200, statusText: 'OK',
            headers: {}, config, request: {},
            data: {
              stored,
              hasCRLF: typeof stored === 'string' && /[\r\n]/.test(stored),
              allHeaders:
                typeof headers?.toJSON === 'function'
                  ? headers.toJSON()
                  : { ...headers },
            },
          };
        },
      });

      return res.data as CrlfResult;
    },
  });

  useEffect(() => {
    if (runTrigger > 0) refetch();
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // status가 아니라 최종 헤더의 CRLF 잔존 여부로 취약/안전 판정
  const isUnsafe = status === 'success' && data?.hasCRLF;
  const isSafe   = status === 'error'   || (status === 'success' && !data?.hasCRLF);

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
        <div className="demo-label">axios.request() 헤더로 전달되는 페이로드:</div>
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
  const [runTrigger, setRunTrigger] = useState(0);

  return (
    <>
      <div className="demo-context">
        <strong>체크 포인트: </strong>
        <span className="mono">axios.request()</span>를 custom adapter로 실행 후,
        dispatch까지 통과한{' '}
        <span className="mono">config.headers</span>에{' '}
        <span className="mono text-red">\r\n</span>이 잔존하는지 검사.
        판정 기준은 <span className="mono">status</span>가 아니라{' '}
        <span className="mono">hasCRLF</span>입니다.
      </div>
      <div className="demo-grid">
        <CrlfPanel side="vuln" runTrigger={runTrigger} />
        <div className="demo-divider">
          <div className="vs-circle">VS</div>
        </div>
        <CrlfPanel side="safe" runTrigger={runTrigger} />
      </div>
      <button className="run-both-btn" onClick={() => setRunTrigger(t => t + 1)}>
        양쪽 동시 실행
      </button>
    </>
  );
}
