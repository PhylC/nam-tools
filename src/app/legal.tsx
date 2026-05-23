import { Hero } from "./components/Shell";

export function LegalPage({
  title,
  intro = "Plain-English information for Account Planning Tools users.",
  body,
}: {
  title: string;
  intro?: string;
  body: string[];
}) {
  return (
    <div className="page-stack">
      <Hero eyebrow="Compliance" title={title}>
        <p>{intro}</p>
      </Hero>
      <section className="shell section legal-copy card">
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h2>Contact</h2>
        <p>
          Questions can be sent to{" "}
          <a className="text-link" href="mailto:hello@accountplanningtools.co.uk">hello@accountplanningtools.co.uk</a>.
        </p>
      </section>
    </div>
  );
}
