import SectionWrapper from '../components/SectionWrapper';

interface Props {
  num: number;
}

export default function Remediation({ num }: Props) {
  return (
    <SectionWrapper id="remediation" num={num} title="해결 방법">

      <div className="card">
        <div className="remedy-header">
          <div className="remedy-num">1</div>
          <h3 className="sub-title">패키지 업그레이드 (권장)</h3>
        </div>
        <div className="code-block safe-code">
          <div className="code-label safe-label">즉시 실행</div>
          <pre>{`npm install axios@^1.15.0

# 또는
yarn upgrade axios@^1.15.0
pnpm update axios@^1.15.0`}
          </pre>
        </div>
        <p style={{ marginTop: '0.75rem' }}>
          <strong className="text-green">효과:</strong> <span className="mono">AxiosHeaders.set()</span>이
          CRLF 포함 값을 받으면 즉시 <span className="mono text-red">AxiosError</span>를 throw합니다.
          TanStack Query는 이를 자동으로 <span className="mono">status = 'error'</span>로 처리하여
          악성 요청이 서버에 도달하지 않습니다.
        </p>
      </div>

      <div className="card">
        <div className="remedy-header">
          <div className="remedy-num">2</div>
          <h3 className="sub-title">임시 방어 — 인터셉터 입력 검증</h3>
        </div>
        <p>즉시 업그레이드가 어려운 경우, 인터셉터에서 외부 값을 헤더로 설정하기 전에 검증합니다.</p>
        <div className="code-block">
          <div className="code-label">인터셉터 CRLF 방어 패턴</div>
          <pre>{`// src/lib/apiClient.js
function sanitizeHeaderValue(value) {
  if (typeof value !== 'string') return value;
  // CRLF 제거 (임시 방어 — 업그레이드가 근본 해결책)
  return value.replace(/[\\r\\n]/g, '');
}

apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  // ⚠ 임시 방어: sanitize 후 설정
  config.headers.set('X-Session-Id', sanitizeHeaderValue(sessionId));
  return config;
});`}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="remedy-header">
          <div className="remedy-num">3</div>
          <h3 className="sub-title">TanStack Query 에러 경계 처리</h3>
        </div>
        <p>패치 후 CRLF가 감지되면 <span className="mono">queryFn</span>이 reject됩니다.
          적절한 에러 처리로 사용자 경험을 보호합니다.</p>
        <div className="code-block">
          <div className="code-label">에러 처리 패턴</div>
          <pre>{`// 개별 쿼리 에러 처리
function Dashboard() {
  const { data, error, status } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard'),
  });

  if (status === 'error') {
    // axios 1.15.0: AxiosError with ERR_INVALID_HEADER_VALUE code
    if (error?.code === 'ERR_INVALID_HEADER_VALUE') {
      return <div>보안 오류: 잘못된 헤더 값이 감지되었습니다.</div>;
    }
    return <div>오류가 발생했습니다.</div>;
  }

  return <div>{/* 정상 렌더링 */}</div>;
}

// 전역 에러 처리 (QueryClient 설정)
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error?.code === 'ERR_INVALID_HEADER_VALUE') {
        console.error('[Security] Invalid header value detected:', error.message);
      }
    },
  }),
});`}
          </pre>
        </div>
      </div>
    </SectionWrapper>
  );
}
