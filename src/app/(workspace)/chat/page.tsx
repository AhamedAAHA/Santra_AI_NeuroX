import { Suspense } from "react";
import { StrategyDeskHub } from "@/components/chat/gtm-advisor-hub";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading Strategy Desk…</p>}>
      <StrategyDeskHub />
    </Suspense>
  );
}
