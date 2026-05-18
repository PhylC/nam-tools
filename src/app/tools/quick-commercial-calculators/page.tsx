import type { Metadata } from "next";
import Link from "next/link";
import { ToolPage } from "../../components/Shell";

export const metadata: Metadata = {
  title: "Quick Commercial Calculators for NAMs | NAM Tools",
  description:
    "Fast SOA, invoice price, retail margin, sales tax / VAT / IVA and promotion calculators for National Account Managers and commercial teams.",
};

export default function Page() {
  return (
    <ToolPage
      slug="quick-commercial-calculators"
      intro="Fast retail, margin, invoice and SOA calculators for quick commercial checks."
      interpretation={
        <p>
          Use these for fast lookups when you only have two to four numbers.
          For a fuller supplier and retailer/customer view, move into the
          Commercial Deal Calculator.
        </p>
      }
    >
      <article className="card judgement-card">
        <h2>Quick calculators now have their own index.</h2>
        <p>
          Choose the specific SOA, retailer margin, invoice price, tax or markup
          calculator you need from the dedicated calculators area.
        </p>
        <div className="cta-row">
          <Link className="button" href="/calculators/quick-calculators">
            Choose a quick calculator
          </Link>
          <Link className="button button-secondary" href="/calculators">
            View all calculators
          </Link>
        </div>
      </article>
    </ToolPage>
  );
}
