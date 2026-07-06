"use client";

import { Suspense } from "react";
import { MonitorCenter } from "@/components/dashboard/monitor-center";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace/workspace-page";

function AlertsPageContent() {
  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="GTM Agent"
        badgeVariant="cyan"
        title="Autonomous competitive intelligence monitors"
        description="The SANTRA GTM agent watches competitors, collects live web evidence, detects material changes, and queues CRM actions for human approval."
      />

      <MonitorCenter />
    </WorkspacePage>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading monitors…</p>}>
      <AlertsPageContent />
    </Suspense>
  );
}
