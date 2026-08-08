import { AccountClient } from "./AccountClient";
import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";

export const metadata = privateMetadata(
  "Account",
  "Manage your APT account, settings and workspace links.",
);

export default function AccountPage() {
  return (
    <div className="page-stack">
      <Hero title="Account">
        <p>Manage your sign-in, plan status, settings and workspace links.</p>
      </Hero>
      <AccountClient />
    </div>
  );
}
