import SectionWrapper from '../components/SectionWrapper';

interface Props {
  num: number;
}

interface TimelineEvent {
  date: string;
  label: string;
  desc: string;
  type: 'vuln' | 'safe' | 'neutral';
}

export default function Timeline({ num }: Props) {
  const events: TimelineEvent[] = [
    {
      date: '2026-02-18',
      label: '취약점 발견',
      desc: 'Aikido Security 연구팀이 AxiosHeaders.normalizeValue()의 불완전한 CRLF 처리 발견',
      type: 'vuln',
    },
    {
      date: '2026-02-20',
      label: '비공개 보고',
      desc: 'axios 메인테이너에게 책임 공개(Responsible Disclosure)로 보고',
      type: 'neutral',
    },
    {
      date: '2026-04-08',
      label: 'axios 1.15.0 릴리스',
      desc: 'assertValidHeaderValue() 추가로 CRLF 차단 패치. npm 배포 완료',
      type: 'safe',
    },
    {
      date: '2026-04-10',
      label: 'CVE 등록',
      desc: 'CVE-2026-40175 공식 등록. GitHub Advisory GHSA-fvcv-3m26-pcqx 공개',
      type: 'neutral',
    },
    {
      date: '2026-04-10',
      label: 'CVSS 점수 산정',
      desc: '기본 CVSS 4.8 (Medium). 클라우드 환경(SSRF + IMDSv2) 체인 시 9.9 Critical',
      type: 'neutral',
    },
    {
      date: '2026-04-12',
      label: '공개 분석 발표',
      desc: 'Aikido Security 블로그 상세 분석 게시. Prototype Pollution 가젯 체인 포함',
      type: 'neutral',
    },
  ];

  return (
    <SectionWrapper id="timeline" num={num} title="타임라인">
      <div className="card">
        <div className="timeline">
          {events.map((ev, i) => (
            <div key={i} className={`timeline-item tl-${ev.type}`}>
              <div className="tl-dot" />
              <div className="tl-content">
                <div className="tl-date">{ev.date}</div>
                <div className="tl-label">{ev.label}</div>
                <div className="tl-desc">{ev.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
