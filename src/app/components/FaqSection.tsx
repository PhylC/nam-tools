import { SectionHeader } from "./Shell";
import type { FaqItem } from "../seo";

export function FaqSection({
  eyebrow = "Questions",
  title,
  faqs,
}: {
  eyebrow?: string;
  title: string;
  faqs: FaqItem[];
}) {
  return (
    <section className="shell section faq-section">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="faq-grid">
        {faqs.map((item) => (
          <article className="faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
