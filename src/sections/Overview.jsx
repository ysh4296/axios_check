import SectionWrapper from '../components/SectionWrapper.jsx';

export default function Overview({ num }) {
  return (
    <SectionWrapper id="overview" num={num} title="개요 — React 스택에서 왜 중요한가">
      <div className="card">
        <p>
          React 프로젝트에서는 <span className="mono text-blue">axios.create()</span>로 만든{' '}
          <strong>공유 인스턴스</strong>를 Context나 모듈 싱글턴으로 앱 전체에 제공하는 패턴이 일반적입니다.
          <strong>CVE-2026-40175</strong>는 이 인스턴스의 헤더 값에{' '}
          CRLF(<span className="mono text-red">\r\n</span>)를 삽입할 수 있는 취약점으로,
          <strong> 한 번 오염되면 해당 인스턴스를 사용하는 모든 API 호출이 영향을 받습니다.</strong>
        </p>
        <p>
          <span className="mono text-purple">useQuery</span> /{' '}
          <span className="mono text-purple">useMutation</span>은 queryFn 내부에서 axios를 호출하므로,
          오염된 인스턴스를 쿼리가 재실행될 때마다 — staleTime 만료, 윈도우 포커스, refetch —
          반복적으로 악성 헤더를 전송합니다.
        </p>
        <p>
          서드파티 패키지의 <strong>프로토타입 오염</strong> 취약점과 결합되면,
          사용자 코드를 전혀 수정하지 않고도 모든 axios 요청 헤더에 공격자 키가 자동 삽입되는{' '}
          <strong>가젯 체인</strong>이 완성됩니다.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <strong className="text-green">해결:</strong>{' '}
          <span className="mono">npm install axios@^1.15.0</span>
        </p>
      </div>
    </SectionWrapper>
  );
}
