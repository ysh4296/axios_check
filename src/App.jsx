import Header from './components/Header.jsx';
import DemoSection from './components/demo/DemoSection.jsx';
import Overview from './sections/Overview.jsx';
import Analysis from './sections/Analysis.jsx';
import Scenarios from './sections/Scenarios.jsx';
import Checklist from './sections/Checklist.jsx';
import Remediation from './sections/Remediation.jsx';
import Timeline from './sections/Timeline.jsx';
import References from './sections/References.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Overview    num={1} />
        <Analysis    num={2} />
        <Scenarios   num={3} />
        <DemoSection num={4} />
        <Checklist   num={5} />
        <Remediation num={6} />
        <Timeline    num={7} />
        <References  num={8} />
      </main>
      <footer>
        <p>교육 목적 보안 보고서 — CVE-2026-40175 / axios CRLF Injection</p>
      </footer>
    </>
  );
}
