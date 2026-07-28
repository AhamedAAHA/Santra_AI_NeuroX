"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

/**
 * Root-layout 3D backdrop must never crash the app.
 * R3F / WebGL failures (context loss, unsupported GPU) otherwise surface as
 * Next.js "Application error: a client-side exception has occurred".
 */
const Global3DField = dynamic(
  () => import("@/components/shared/global-3d-field").then((m) => m.Global3DField),
  { ssr: false },
);

type BoundaryState = { failed: boolean };

class FieldErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Global3DField] suppressed render error:", error.message);
    }
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function SafeGlobal3DField() {
  return (
    <FieldErrorBoundary>
      <Global3DField />
    </FieldErrorBoundary>
  );
}
