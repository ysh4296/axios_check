import { ReactNode } from 'react';

interface Props {
  id: string;
  num: number;
  title: string;
  children: ReactNode;
}

export default function SectionWrapper({ id, num, title, children }: Props) {
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
