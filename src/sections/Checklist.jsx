import SectionWrapper from '../components/SectionWrapper.jsx';

export default function Checklist({ num }) {
  return (
    <SectionWrapper id="checklist" num={num} title="React 프로젝트 점검 체크리스트">
      <div className="card">
        <h3 className="sub-title">즉시 확인해야 할 패턴</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>점검 항목</th>
                <th>위험 패턴</th>
                <th>위험도</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>인터셉터 헤더 설정</td>
                <td><span className="mono text-red">config.headers.set(key, externalValue)</span></td>
                <td><span className="text-red">높음</span></td>
              </tr>
              <tr>
                <td>인스턴스 기본 헤더</td>
                <td><span className="mono text-red">defaults.headers.common[key] = userInput</span></td>
                <td><span className="text-red">높음</span></td>
              </tr>
              <tr>
                <td>요청별 헤더 직접 설정</td>
                <td><span className="mono text-yellow">axios.get(url, {'{ headers: { X: val } }'})</span></td>
                <td><span className="text-yellow">중간</span></td>
              </tr>
              <tr>
                <td>useQuery queryFn 내부 헤더</td>
                <td><span className="mono text-yellow">queryFn에서 외부 값 → headers 설정</span></td>
                <td><span className="text-yellow">중간</span></td>
              </tr>
              <tr>
                <td>useMutation mutationFn 헤더</td>
                <td><span className="mono text-yellow">mutationFn에서 외부 값 → headers 설정</span></td>
                <td><span className="text-yellow">중간</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="sub-title">코드베이스 취약 패턴 검색</h3>
        <div className="code-block">
          <div className="code-label">터미널에서 즉시 실행 — 취약 패턴 grep</div>
          <pre>{`# 인터셉터에서 headers.set() 사용
grep -r "headers\\.set(" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# defaults.headers 변경
grep -r "defaults\\.headers" src/

# AxiosHeaders 직접 생성 + set
grep -r "new.*AxiosHeaders" src/

# 결과 중 외부 변수(params, userInput, response.data 등)를 헤더 값으로 전달하는 패턴을 수동 검토`}
          </pre>
        </div>
      </div>

      <div className="card">
        <h3 className="sub-title">환경별 영향 요약</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>환경</th>
                <th>영향</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>브라우저 (React SPA)</td>
                <td><span className="text-yellow">중간</span></td>
                <td>브라우저 HTTP 스택이 일부 CRLF 차단 가능하나 불확실</td>
              </tr>
              <tr>
                <td>Node.js SSR (Next.js)</td>
                <td><span className="text-red">높음</span></td>
                <td>Node.js http 모듈이 CRLF 허용하는 경우 있음</td>
              </tr>
              <tr>
                <td>AWS EC2 / ECS</td>
                <td><span className="text-red">CVSS 9.9 Critical</span></td>
                <td>IMDSv2 SSRF 체인으로 자격증명 탈취 가능</td>
              </tr>
              <tr>
                <td>Electron / React Native</td>
                <td><span className="text-red">높음</span></td>
                <td>네이티브 HTTP 스택 직접 사용, 브라우저 보호 없음</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapper>
  );
}
