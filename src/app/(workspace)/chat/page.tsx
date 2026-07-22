import { Suspense } from "react";
import { GtmAdvisorHub } from "@/components/chat/gtm-advisor-hub";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading GTM Advisor…</p>}>
      <GtmAdvisorHub />
    </Suspense>
  );
}
