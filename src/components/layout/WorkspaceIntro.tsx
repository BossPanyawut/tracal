import Link from "next/link";

export function WorkspaceIntro({ eyebrow, title, description, steps, companion }: {
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  companion: { href: string; label: string; detail: string };
}) {
  return <section className="workspace-intro">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="workspace-description">{description}</p>
      <ol className="workflow-steps">{steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
    </div>
    <Link className="companion-card" href={companion.href}><span>ไปต่อ</span><strong>{companion.label}</strong><small>{companion.detail}</small><i aria-hidden="true">→</i></Link>
  </section>;
}
