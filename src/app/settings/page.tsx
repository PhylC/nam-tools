import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { SettingsClient } from "./SettingsClient";

export const metadata = privateMetadata(
  "Settings",
  "Set practical Account Planning Tools defaults for currency, tax, profile details, exports and Pro presentation templates.",
);

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <Hero title="Settings">
        <p>
          Save your usual calculator and export setup so APT starts closer to the way you work.
        </p>
      </Hero>
      <SettingsClient />
    </div>
  );
}
