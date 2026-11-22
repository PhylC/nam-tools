import Link from "next/link";

export function ResourceMethodology({ children, reviewedOn }: { children: string; reviewedOn: string }) {
  const reviewed = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(reviewedOn));
  return (
    <aside className="resource-methodology" aria-label="Methodology and review date">
      <h2>Methodology</h2>
      <p>{children}</p>
      <p>Last reviewed <time dateTime={reviewedOn}>{reviewed}</time> · <Link href="/about">About Account Planning Tools</Link></p>
    </aside>
  );
}
