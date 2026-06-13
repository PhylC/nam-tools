import type { Metadata } from "next";
import { Hero } from "../components/Shell";
import { WorkspaceClient } from "./WorkspaceClient";

export const metadata: Metadata = {
  title: "My workspace",
  description:
    "Find saved Account Planning Tools analyses, scenarios, decks and exports in one workspace.",
};

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
