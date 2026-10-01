import HangTag from './HangTag';

export default function AuthShell({ tone = 'found', asideTitle, asideText, title, lead, children }) {
  return (
    <main className="authPage">
      <div className="authCard">
        <aside className="authAside" aria-hidden="true">
          <div className="rail" />
          <HangTag tone={tone} title={asideTitle} text={asideText} />
        </aside>
        <section className="authBody">
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </section>
      </div>
    </main>
  );
}
