export default function SectionWrapper({ id, num, title, children }) {
  return (
    <section id={id}>
      <div className="section-header">
        <span className="section-num">{num}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
