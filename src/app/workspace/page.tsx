import { Hero } from "../components/Shell";
import { privateMetadata } from "../seo";
import { WorkspaceClient } from "./WorkspaceClient";

export const metadata = privateMetadata(
  "My workspace",
  "Find saved Account Planning Tools analyses, scenarios, decks and exports in one workspace.",
);

export default function WorkspacePage() {
  return (
    <div className="page-stack">
      <Hero eyebrow="Workspace" title="My workspace">
        <p>Find your saved analyses, decks, scenarios and exports in one place.</p>
      </Hero>
      <WorkspaceClient />
    </div>
  );
}
