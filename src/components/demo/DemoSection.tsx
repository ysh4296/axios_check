import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import CrlfTest from './CrlfTest';
import InterceptorTest from './InterceptorTest';

interface Props {
  num: number;
}

export default function DemoSection({ num }: Props) {
  const [activeTab, setActiveTab] = useState<'crlf' | 'interceptor'>('crlf');

  return (
    <SectionWrapper id="demo" num={num} title="라이브 데모 — axios 1.14.0 vs 1.15.0">
      <div className="demo-warning">
        ⚠ 교육 목적 데모입니다. 실제 HTTP 요청은 전송되지 않으며 모의 어댑터를 사용합니다.
        우측 하단 TanStack Query Devtools에서 쿼리 상태를 실시간 확인할 수 있습니다.
      </div>

      <div className="demo-tabs">
        <button
          className={`tab-btn ${activeTab === 'crlf' ? 'active' : ''}`}
          onClick={() => setActiveTab('crlf')}
        >
          테스트 1 — AxiosHeaders.set() 직접 테스트
        </button>
        <button
          className={`tab-btn ${activeTab === 'interceptor' ? 'active' : ''}`}
          onClick={() => setActiveTab('interceptor')}
        >
          테스트 2 — 인터셉터 체인 CRLF 전파
        </button>
      </div>

      {activeTab === 'crlf'        && <CrlfTest />}
      {activeTab === 'interceptor' && <InterceptorTest />}
    </SectionWrapper>
  );
}
