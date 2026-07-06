"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AiOrb } from "@/components/shared/ai-orb";
import { BrandLogo } from "@/components/shared/brand-mark";
import { ParticleField } from "@/components/shared/particle-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLocalAccount, markNewUserGuidePending, setLocalSessionFromServer, signInLocalAccount } from "@/lib/local-auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
};

type AuthCapabilities = {
  database?: string;
  providers: { email: boolean; google: boolean; github: boolean };
  workspaceReady: boolean | null;
};

export function AuthShell({ mode }: AuthShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = mode === "sign-up";
  const [mongoEnabled, setMongoEnabled] = useState(false);
  const allowLocalAuth = !mongoEnabled && process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const nextPath = safeRedirectPath(searchParams.get("next"));
  const authError = searchParams.get("error");
  const checkingCapabilities = !capabilities;
  const workspaceUnavailable = mongoEnabled && capabilities?.workspaceReady === false;
  const authToggleHref = isSignUp
    ? `/sign-in${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`
    : `/sign-up${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
  const submitLabel = mongoEnabled
    ? isSignUp
      ? "Create intelligence workspace"
      : "Sign in to workspace"
    : allowLocalAuth
      ? isSignUp
        ? "Create local account"
        : "Sign in locally"
      : "Configure MongoDB to continue";

  function navigateAfterAuth(localMode: boolean) {
    if (localMode) {
      router.refresh();
      router.push(nextPath);
      return;
    }
    router.refresh();
    window.location.assign(nextPath);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void fetch("/api/auth/capabilities", { cache: "no-store", signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: AuthCapabilities | null) => {
          if (data) {
            setCapabilities(data);
            setMongoEnabled(data.database === "mongodb");
          }
        })
        .catch(() => {
          setCapabilities({
            database: "none",
            providers: { email: false, google: false, github: false },
            workspaceReady: null,
          });
        });
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleLocalAuth() {
    setLoading(true);
    try {
      if (isSignUp) {
        await createLocalAccount({ email, password, companyName });
        toast.success("Local account created", {
          description: "This account is stored only in this browser until Supabase is configured.",
        });
      } else {
        await signInLocalAccount({ email, password });
        toast.success("Signed in locally", {
          description: "Your local workspace session is active in this browser.",
        });
      }
      navigateAfterAuth(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Local authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMongoAuth() {
    setLoading(true);
    try {
      const endpoint = isSignUp ? "/api/auth/sign-up" : "/api/auth/sign-in";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, companyName }),
      });
      const payload = (await response.json()) as {
        error?: string;
        session?: { userId: string; email: string; companyName?: string; signedInAt: string };
      };
      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }
      if (payload.session) {
        setLocalSessionFromServer(payload.session);
      }
      if (isSignUp) markNewUserGuidePending();
      toast.success(isSignUp ? "Workspace created — welcome to SANTRA." : "Signed in to SANTRA.");
      navigateAfterAuth(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();

    if (mongoEnabled) {
      if (checkingCapabilities) {
        toast.message("Checking workspace setup. Please try again in a moment.");
        return;
      }
      if (workspaceUnavailable) {
        toast.error("MongoDB workspace is not ready.", {
          description: "Verify MONGODB_URI in .env.local and restart npm run dev.",
        });
        return;
      }
      await handleMongoAuth();
      return;
    }

    if (!allowLocalAuth) {
      toast.error("Cloud authentication is required.", {
        description: "Configure MONGODB_URI in .env.local to sign in to your workspace.",
      });
      return;
    }

    await handleLocalAuth();
  }

  return (
    <main className="min-h-[100svh] overflow-x-hidden overflow-y-auto">
      <ParticleField />
      <div className="container grid min-h-[100svh] items-start gap-12 py-6 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden lg:block"
        >
          <Link href="/" className="group mb-12 inline-flex text-white" aria-label="Santra home">
            <BrandLogo className="h-[220px] w-[330px]" />
          </Link>
          <Badge variant="cyan">{mongoEnabled ? "MongoDB workspace" : "Local auth"}</Badge>
          <h1 className="type-display-lg mt-5 max-w-2xl text-white">
            B2B GTM intelligence for revenue teams who move fast.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/55">
            {mongoEnabled
              ? "Sign in to save GTM monitors, reports, and chat history in MongoDB Atlas."
              : "Create a browser-local account now. MongoDB can be added via MONGODB_URI without changing the flow."}
          </p>
          <AiOrb size="lg" className="mt-12" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="mx-auto max-w-xl p-7 md:p-10" glow>
            <div className="mb-8">
              <Badge variant="violet">{isSignUp ? "Create workspace" : "Welcome back"}</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                {isSignUp ? "Start monitoring competitors" : "Sign in to your workspace"}
              </h2>
              <p className="mt-2 text-sm text-white/50">
                {mongoEnabled
                  ? "Use email and password to access your workspace."
                  : allowLocalAuth
                    ? "No MongoDB URI detected. Use email and password for local browser auth."
                    : "Cloud authentication is required in production. Configure MONGODB_URI to continue."}
              </p>
            </div>

            {authError && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Sign-in could not be completed. The link may be expired, invalid, or missing redirect configuration.</p>
              </div>
            )}

            {workspaceUnavailable && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Cloud workspace setup is incomplete. Verify MONGODB_URI in .env.local and restart the dev server.
                </p>
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleEmailAuth}>
              {isSignUp && (
                <Input
                  placeholder="Company name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              )}
              <Input
                placeholder="Work email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="space-y-2">
                <Input
                  placeholder={mongoEnabled ? "Password" : "Local password"}
                  type="password"
                  required={isSignUp || !mongoEnabled}
                  minLength={isSignUp ? 6 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button
                variant={mongoEnabled ? "neon" : "ghost"}
                size="lg"
                className="mt-2"
                disabled={loading || checkingCapabilities || (isSignUp && workspaceUnavailable) || (!mongoEnabled && !allowLocalAuth)}
                type="submit"
              >
                {submitLabel}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-white/50">
              {isSignUp ? "Already have an account?" : "New to SANTRA AI?"}{" "}
              <Link href={authToggleHref} className="font-medium text-sentra-cyan">
                {isSignUp ? "Sign in" : "Create account"}
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
