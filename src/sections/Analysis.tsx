import SectionWrapper from '../components/SectionWrapper';

interface Props {
  num: number;
}

export default function Analysis({ num }: Props) {
  return (
    <SectionWrapper id="analysis" num={num} title="취약점 분석 — 코드 레벨 원인">
      <div className="card">
        <h3 className="sub-title">근본 원인: <span className="mono text-red">normalizeValue()</span> 불완전한 정규식</h3>
        <div className="code-compare">
          <div className="code-block vuln-code">
            <div className="code-label vuln-label">axios 1.14.0 — 취약 (lib/core/AxiosHeaders.js)</div>
            <pre>{`function normalizeValue(value) {
  if (value === false || value == null) return value;
  return String(value)
    .replace(/^\\s+|\\s+$/g, '')  // trim 앞뒤 공백
    .replace(/[\\r\\n]+$/, '');   // ← 끝 CRLF만 제거!
    // ⚠ 중간 \\r\\n은 그대로 통과
}

// AxiosHeaders.set() 호출 시:
// "legit-value\\r\\nX-Injected: attack" → 그대로 저장됨`}
            </pre>
          </div>
          <div className="code-block safe-code">
            <div className="code-label safe-label">axios 1.15.0 — 패치 (lib/core/AxiosHeaders.js)</div>
            <pre>{`function assertValidHeaderValue(name, value) {
  const str = String(value);
  // 위치 무관하게 \\r, \\n 모두 차단
  if (/[\\r\\n]/.test(str)) {
    throw new AxiosError(
      \`Invalid character in header "\${name}": \${JSON.stringify(str)}\`,
      AxiosError.ERR_INVALID_HEADER_VALUE
    );
  }
}

// AxiosHeaders.set() 호출 시:
// "legit-value\\r\\nX-Injected: attack" → AxiosError 즉시 throw`}
            </pre>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="sub-title">HTTP 헤더 인젝션 원리</h3>
        <p>HTTP/1.1 프로토콜에서 헤더는 <span className="mono text-blue">CRLF(\r\n)</span>로 구분됩니다.
          서버가 이 값을 그대로 파싱하면 하나의 헤더 값이 여러 헤더로 분리됩니다.</p>
        <div className="code-block">
          <div className="code-label">실제 전송되는 HTTP 요청 (취약 버전)</div>
          <pre className="text-red">{`GET /dashboard HTTP/1.1
Host: api.myapp.com
Authorization: Bearer user-token
X-Session-Id: valid-session
X-Admin: true          ← CRLF 이후 주입된 헤더!
X-AWS-Token: stolen    ← CRLF 이후 주입된 헤더!
Content-Type: application/json`}
          </pre>
        </div>
        <div className="code-block" style={{ marginTop: '1rem' }}>
          <div className="code-label text-green">axios 1.15.0 — 인터셉터에서 즉시 차단</div>
          <pre className="text-green">{`// config.headers.set('X-Session-Id', 'valid-session\\r\\nX-Admin: true')
// → AxiosError: Invalid character in header "X-Session-Id"
// → interceptors.request 체인 중단
// → HTTP 요청 전송되지 않음
// → TanStack Query: queryFn reject → status = 'error'`}
          </pre>
        </div>
      </div>

      <div className="card">
        <h3 className="sub-title">영향 받는 axios API</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>메서드</th>
                <th>취약 여부 (1.14.0)</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="mono">AxiosHeaders.set(key, value)</span></td>
                <td><span className="text-red">취약</span></td>
                <td>인터셉터에서 가장 빈번히 사용</td>
              </tr>
              <tr>
                <td><span className="mono">axios.create({'{ headers }'})</span></td>
                <td><span className="text-red">취약</span></td>
                <td>인스턴스 생성 시 기본 헤더</td>
              </tr>
              <tr>
                <td><span className="mono">axios.get(url, {'{ headers }'})</span></td>
                <td><span className="text-red">취약</span></td>
                <td>요청별 헤더 직접 설정</td>
              </tr>
              <tr>
                <td><span className="mono">instance.defaults.headers</span></td>
                <td><span className="text-red">취약</span></td>
                <td>런타임 기본값 변경</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapper>
  );
}
