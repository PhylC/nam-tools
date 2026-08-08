import Link from "next/link";
import { ToolPage } from "../../components/Shell";
import { privateMetadata } from "../../seo";

export const metadata = privateMetadata(
  "Commercial Calculators Redirect",
  "Redirects to the canonical commercial calculators index.",
);

export default function Page() {
  return (
    <ToolPage
      slug="quick-commercial-calculators"
      intro="Use these for quick revenue, margin, invoice and support checks when you do not need a full scenario plan."
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
