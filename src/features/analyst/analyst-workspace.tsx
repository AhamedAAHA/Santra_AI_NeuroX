"use client";

import { WorldEngineStudio } from "@/features/world-engine/world-engine-studio";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace/workspace-page";

export function AnalystWorkspace() {
  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="Competitor IQ"
        title="Competitor Intelligence Center"
        description="Run deep B2B competitor investigations, compare positioning, and generate strategic action guidance."
      />
      <WorldEngineStudio />
    </WorkspacePage>
  );
}
