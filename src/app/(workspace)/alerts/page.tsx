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
        title="GTM Monitors"
        description="Watch competitors, collect live evidence, detect material changes, and queue CRM actions for human approval."
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
