import type { Metadata } from "next";
import Link from "next/link";
import { ToolPage } from "../../components/Shell";

export const metadata: Metadata = {
  title: "Commercial Calculators for Account Managers | Account Planning Tools",
  description:
    "Fast SOA, invoice price, retail margin, sales tax / VAT / IVA and promotion calculators for national account managers and commercial teams.",
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
          ROI tool.
        </p>
      }
    >
      <article className="card judgement-card">
        <h2>Calculators now have their own index.</h2>
        <p>
          Choose the specific SOA, retailer margin, invoice price, tax or markup
          calculator you need from the dedicated calculators area.
        </p>
        <div className="cta-row">
          <Link className="button" href="/calculators/quick-calculators">
            Browse calculators
          </Link>
          <Link className="button button-secondary" href="/calculators">
            View all calculators
          </Link>
        </div>
      </article>
    </ToolPage>
  );
}
