import Header from './components/Header';
import DemoSection from './components/demo/DemoSection';
import Overview from './sections/Overview';
import Analysis from './sections/Analysis';
import Scenarios from './sections/Scenarios';
import Checklist from './sections/Checklist';
import Remediation from './sections/Remediation';
import Timeline from './sections/Timeline';
import References from './sections/References';

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
