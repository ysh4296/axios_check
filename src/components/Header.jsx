import { VULN_VERSION, FIX_VERSION } from '../lib/axiosInstances.js';

export default function Header() {
  return (
    <header>
      <div className="container">
        <div className="cve-hero">
          <div className="severity-badge">Security Advisory</div>
          <h1 className="cve-id">CVE-2026-40175</h1>
          <p className="cve-title">
            axios HTTP Header Injection via CRLF — Prototype Pollution 가젯 체인
          </p>
          <div className="cve-stack">
            <span className="stack-pill">React</span>
            <span className="stack-pill">axios</span>
            <span className="stack-pill">TanStack Query</span>
          </div>
          <div className="meta-grid">
            <div className="meta-item">
              <span className="lbl">CVSS:</span>
              <span className="val-yellow">4.8 Medium</span>
              <span className="text-muted"> / </span>
              <span className="val-red">9.9 Critical (클라우드)</span>
            </div>
            <div className="meta-item">
              <span className="lbl">CWE:</span>
              <span className="val-blue">CWE-444, CWE-113</span>
            </div>
            <div className="meta-item">
              <span className="lbl">영향 버전:</span>
              <span className="val-red">axios &lt; 1.15.0</span>
            </div>
            <div className="meta-item">
              <span className="lbl">패치 버전:</span>
              <span className="val-green">axios 1.15.0 (2026-04-08)</span>
            </div>
            <div className="meta-item">
              <span className="lbl">Advisory:</span>
              <a
                href="https://github.com/advisories/GHSA-fvcv-3m26-pcqx"
                target="_blank"
                rel="noreferrer"
                className="val-blue"
              >
                GHSA-fvcv-3m26-pcqx
              </a>
            </div>
            <div className="meta-item">
              <span className="lbl">로드된 버전:</span>
              <span className="val-red">{VULN_VERSION}</span>
              <span className="text-muted"> / </span>
              <span className="val-green">{FIX_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
