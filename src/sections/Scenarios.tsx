import SectionWrapper from '../components/SectionWrapper';

interface Props {
  num: number;
}

export default function Scenarios({ num }: Props) {
  return (
    <SectionWrapper id="scenarios" num={num} title="공격 시나리오 — React + TanStack Query 환경">

      <div className="card">
        <div className="scenario-badge vuln-badge">시나리오 A</div>
        <h3 className="sub-title">인터셉터에서 사용자 입력을 헤더로 직접 전달</h3>
        <p>가장 흔한 패턴 — 인터셉터에서 외부 값(URL 파라미터, localStorage, API 응답)을 헤더에 설정할 때 발생합니다.</p>
        <div className="code-block vuln-code">
          <div className="code-label vuln-label">취약한 React 코드</div>
          <pre>{`// src/lib/apiClient.js
const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  // ⚠ URL 파라미터나 외부 값을 검증 없이 헤더에 삽입
  const sessionId = new URLSearchParams(window.location.search).get('sid');
  config.headers.set('X-Session-Id', sessionId);  // CRLF 취약!
  return config;
});

// React 컴포넌트에서:
function Dashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard'),
    // staleTime 만료, 윈도우 포커스, 수동 refetch마다
    // → 오염된 헤더로 반복 요청
  });
}`}
          </pre>
        </div>
        <div className="code-block safe-code" style={{ marginTop: '0.75rem' }}>
          <div className="code-label safe-label">패치 후 동작 (axios 1.15.0)</div>
          <pre>{`// config.headers.set()이 CRLF 감지 즉시 AxiosError throw
// → queryFn이 reject → TanStack Query status = 'error'
// → 악성 요청이 서버에 도달하지 않음`}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="scenario-badge vuln-badge">시나리오 B</div>
        <h3 className="sub-title">공유 인스턴스 헤더 오염 → 앱 전체 영향</h3>
        <p>Context나 모듈 싱글턴으로 공유된 axios 인스턴스의 기본 헤더가 오염되면,
          해당 인스턴스를 사용하는 <strong>모든</strong> API 호출이 영향을 받습니다.</p>
        <div className="code-block vuln-code">
          <div className="code-label vuln-label">취약한 React 패턴 (공유 인스턴스)</div>
          <pre>{`// src/providers/ApiProvider.jsx
const apiClient = axios.create({ baseURL: '/api' });

// 로그인 응답에서 받은 세션 토큰을 기본 헤더로 설정
function setAuthHeader(token) {
  // ⚠ 서버가 조작된 토큰을 반환하면 모든 요청에 악성 헤더 포함
  apiClient.defaults.headers.common['X-Auth-Token'] = token;
}

// 이제 앱의 모든 useQuery / useMutation이 오염된 헤더 사용:
// useQuery({ queryKey: ['user'], queryFn: () => apiClient.get('/user') })
// useMutation({ mutationFn: (data) => apiClient.post('/orders', data) })
// → 모두 악성 헤더 포함`}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="scenario-badge critical-badge">시나리오 C — 클라우드 환경 (CVSS 9.9)</div>
        <h3 className="sub-title">AWS IMDSv2 토큰 탈취 (SSRF + CRLF 체인)</h3>
        <p>Node.js SSR 환경(Next.js, Express)에서 axios로 백엔드 API를 호출할 때 CRLF를 통해
          AWS Instance Metadata Service에 접근하는 시나리오입니다.</p>
        <div className="code-block vuln-code">
          <div className="code-label vuln-label">공격 흐름 (Node.js SSR)</div>
          <pre>{`// 공격자가 조작한 입력값:
const maliciousSessionId =
  'legit-id\\r\\n' +
  'X-Forwarded-Host: 169.254.169.254\\r\\n' +        // AWS IMDS
  'X-aws-ec2-metadata-token-ttl-seconds: 21600';

// 서버가 이 값을 헤더로 설정 후 내부 API 호출:
config.headers.set('X-Session-Id', maliciousSessionId);
// → HTTP 요청에 X-aws-ec2-metadata-token-ttl-seconds 헤더 포함
// → 리버스 프록시가 IMDS로 라우팅 시 IMDSv2 토큰 발급
// → EC2 인스턴스 자격증명 탈취 가능`}
          </pre>
        </div>
        <p style={{ marginTop: '0.75rem' }}>
          <strong className="text-red">영향:</strong> EC2 IAM Role 자격증명 탈취 →
          AWS 계정 전체 리소스 접근 가능 (S3, RDS, Secrets Manager 등)
        </p>
      </div>
    </SectionWrapper>
  );
}
