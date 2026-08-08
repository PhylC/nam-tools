import Link from "next/link";
import { Hero } from "./components/Shell";

export default function NotFound() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Page not found" title="This APT page could not be found.">
        <p>
          The page may have moved, or the link may no longer be current. Start
          with the calculators or ROI planner and choose the closest tool.
        </p>
        <div className="cta-row">
          <Link className="button" href="/calculators">
            Browse calculators
          </Link>
          <Link className="button button-secondary" href="/roi-tool">
            Open ROI planner
          </Link>
          <Link className="button button-secondary" href="/tools">
            View planning tools
          </Link>
        </div>
      </Hero>
    </div>
  );
}
