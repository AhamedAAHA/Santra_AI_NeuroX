"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { migrateSentraBrandStorage } from "@/lib/brand-migration";
import { SettingsProvider } from "@/settings/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    migrateSentraBrandStorage();
  }, []);

  return (
    <SettingsProvider>
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          className: "border-white/10 bg-santra-panel/95 text-white backdrop-blur-xl",
        }}
      />
    </SettingsProvider>
  );
}
