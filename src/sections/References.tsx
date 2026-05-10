import SectionWrapper from '../components/SectionWrapper';

interface Props {
  num: number;
}

interface Reference {
  title: string;
  url: string;
  desc: string;
}

export default function References({ num }: Props) {
  const refs: Reference[] = [
    {
      title: 'GitHub Advisory GHSA-fvcv-3m26-pcqx',
      url: 'https://github.com/advisories/GHSA-fvcv-3m26-pcqx',
      desc: '공식 GitHub Security Advisory — 영향 버전, 패치 버전, CVSS 정보',
    },
    {
      title: 'NVD CVE-2026-40175',
      url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-40175',
      desc: 'NIST National Vulnerability Database 공식 등록',
    },
    {
      title: 'Aikido Security — 분석 블로그',
      url: 'https://www.aikido.dev/blog/cve-2026-40175-axios-header-injection',
      desc: '취약점 발견팀의 상세 기술 분석. Prototype Pollution 가젯 체인 포함',
    },
    {
      title: 'axios 1.15.0 릴리스 노트',
      url: 'https://github.com/axios/axios/releases/tag/v1.15.0',
      desc: '패치 커밋 및 변경 내역',
    },
    {
      title: 'Snyk — CVE-2026-40175',
      url: 'https://security.snyk.io/vuln/SNYK-JS-AXIOS-9569985',
      desc: 'Snyk 취약점 데이터베이스 — 영향 패키지 트리 분석',
    },
    {
      title: 'CWE-113: Improper Neutralization of CRLF Sequences in HTTP Headers',
      url: 'https://cwe.mitre.org/data/definitions/113.html',
      desc: 'HTTP 응답 분할(HTTP Response Splitting) 취약점 분류',
    },
  ];

  return (
    <SectionWrapper id="references" num={num} title="참고 자료">
      <div className="card">
        <div className="refs-list">
          {refs.map((ref, i) => (
            <div key={i} className="ref-item">
              <a
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="ref-title"
              >
                {ref.title}
              </a>
              <p className="ref-desc">{ref.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
