"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  GitFork,
  Lock,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/shared/brand-mark";
import { ParticleField } from "@/components/shared/particle-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLocalAccount, markNewUserGuidePending, setLocalSessionFromServer, signInLocalAccount } from "@/lib/local-auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
};

type AuthCapabilities = {
  database?: string;
  providers: { email: boolean; google: boolean; github: boolean };
  oauthCallbacks?: { github: string; google: string; appOrigin: string };
  workspaceReady: boolean | null;
  demoAuthAllowed?: boolean;
  workspaceError?: string;
};

const DEFAULT_CAPABILITIES: AuthCapabilities = {
  database: "none",
  providers: { email: false, google: false, github: false },
  workspaceReady: false,
  demoAuthAllowed: true,
};

function Field({
  id,
  label,
  icon: Icon,
  action,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[11px] uppercase text-white/45">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        {children}
      </div>
    </div>
  );
}

export function AuthShell({ mode }: AuthShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = mode === "sign-up";
  const [mongoEnabled, setMongoEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const demoAuthAllowed = capabilities?.demoAuthAllowed ?? false;
  const mongoWorkspaceReady = mongoEnabled && capabilities?.workspaceReady === true;
  const allowLocalAuth =
    (!mongoEnabled && process.env.NODE_ENV !== "production") ||
    (demoAuthAllowed && !mongoWorkspaceReady);
  const nextPath = safeRedirectPath(searchParams.get("next"));
  const authError = searchParams.get("error");
  const checkingCapabilities = capabilities === null;
  const workspaceUnavailable = mongoEnabled && capabilities?.workspaceReady === false;
  const canSubmit =
    !loading &&
    capabilities !== null &&
    (allowLocalAuth || mongoWorkspaceReady) &&
    !(isSignUp && workspaceUnavailable && mongoEnabled && !allowLocalAuth);
  const nextQuery = nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : "";
  const signInHref = `/sign-in${nextQuery}`;
  const signUpHref = `/sign-up${nextQuery}`;
  const submitLabel = checkingCapabilities
    ? "Checking workspace…"
    : allowLocalAuth
      ? isSignUp
        ? "Create local account"
        : "Sign in locally"
      : mongoWorkspaceReady
        ? isSignUp
          ? "Create intelligence workspace"
          : "Sign in to workspace"
        : "Workspace unavailable";
  const oauthProviders = capabilities?.providers;
  const showGithubOAuth = Boolean(mongoWorkspaceReady && oauthProviders?.github);
  const showGoogleOAuth = Boolean(mongoWorkspaceReady && oauthProviders?.google);
  const showOAuth = showGithubOAuth || showGoogleOAuth;
  const workspaceLabel = checkingCapabilities
    ? "Checking workspace"
    : mongoWorkspaceReady
      ? "MongoDB Atlas workspace"
      : mongoEnabled
        ? "Workspace unavailable"
        : "Browser-local workspace";
  const description = mongoEnabled
    ? showOAuth
      ? "Continue with GitHub or Google, or use your work email."
      : "Use your work email and password to reach your workspace."
    : allowLocalAuth
      ? "No MongoDB URI detected, so this account stays in this browser."
      : "Cloud authentication is required in production. Configure MONGODB_URI to continue.";

  function startOAuth(provider: "github" | "google") {
    const params = new URLSearchParams();
    if (nextPath !== "/dashboard") params.set("next", nextPath);
    const query = params.toString();
    window.location.assign(`/api/auth/oauth/${provider}${query ? `?${query}` : ""}`);
  }

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
    const failSafe = window.setTimeout(() => {
      setCapabilities((current) => current ?? DEFAULT_CAPABILITIES);
    }, 6000);

    const timeout = window.setTimeout(() => {
      void fetch("/api/auth/capabilities", { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          const data = response.ok
            ? ((await response.json()) as AuthCapabilities)
            : DEFAULT_CAPABILITIES;
          setCapabilities(data);
          setMongoEnabled(data.database === "mongodb");
        })
        .catch(() => {
          setCapabilities(DEFAULT_CAPABILITIES);
        });
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(failSafe);
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

    if (mongoEnabled && mongoWorkspaceReady) {
      if (checkingCapabilities) {
        toast.message("Checking workspace setup. Please try again in a moment.");
        return;
      }
      await handleMongoAuth();
      return;
    }

    if (!allowLocalAuth) {
      toast.error("Workspace is not ready.", {
        description:
          capabilities?.workspaceError ||
          "MongoDB is unreachable from this host. Demo sign-in is disabled.",
      });
      return;
    }

    await handleLocalAuth();
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-x-hidden px-4 py-12 sm:px-6">
      <ParticleField />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(83,244,255,0.16),transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-52 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14),transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-44 -right-28 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(63,156,255,0.13),transparent_65%)] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[27rem]"
      >
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Santra home" className="sentra-focus relative inline-flex rounded-3xl">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgba(83,244,255,0.3),transparent_70%)] blur-2xl"
            />
            <BrandLogo className="h-[84px] w-[126px]" />
          </Link>
          <Badge variant={mongoWorkspaceReady ? "cyan" : "default"} className="mt-5 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {workspaceLabel}
          </Badge>
        </div>

        <Card className="mt-7 p-6 sm:p-8" glow>
          <nav className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            {[
              { label: "Sign in", href: signInHref, active: !isSignUp },
              { label: "Create account", href: signUpHref, active: isSignUp },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={cn(
                  "sentra-focus rounded-full px-4 py-2 text-center text-sm font-medium transition-colors duration-300",
                  tab.active
                    ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14)]"
                    : "text-white/45 hover:text-white/80",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="mt-7">
            <h1 className="text-[1.7rem] font-semibold leading-tight text-white">
              {isSignUp ? "Create your workspace" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
          </div>

          {authError && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-2">
                <p>Sign-in could not be completed. The link may be expired, invalid, or missing redirect configuration.</p>
                {capabilities?.oauthCallbacks && (
                  <div className="rounded-xl border border-rose-200/10 bg-black/20 p-3 text-xs text-rose-50/90">
                    <p className="font-medium text-rose-50">Register these exact callback URLs in your OAuth app:</p>
                    <p className="mt-2 break-all font-mono">GitHub: {capabilities.oauthCallbacks.github}</p>
                    <p className="mt-1 break-all font-mono">Google: {capabilities.oauthCallbacks.google}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {workspaceUnavailable && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Cloud workspace setup is incomplete. Verify MONGODB_URI in .env.local and restart the dev server.</p>
            </div>
          )}

          {showOAuth && (
            <>
              <div className={cn("mt-6 grid gap-3", showGithubOAuth && showGoogleOAuth && "sm:grid-cols-2")}>
                {showGithubOAuth && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="w-full"
                    disabled={loading}
                    onClick={() => startOAuth("github")}
                  >
                    <GitFork className="h-4 w-4" />
                    GitHub
                  </Button>
                )}
                {showGoogleOAuth && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="w-full"
                    disabled={loading}
                    onClick={() => startOAuth("google")}
                  >
                    <span className="text-sm font-semibold">G</span>
                    Google
                  </Button>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 text-[11px] uppercase text-white/30">
                <span className="h-px flex-1 bg-white/10" />
                <span>or continue with email</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form className="mt-6 grid gap-5" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <Field id="auth-company" label="Company" icon={Building2}>
                <Input
                  id="auth-company"
                  className="pl-11"
                  placeholder="Acme Inc."
                  autoComplete="organization"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </Field>
            )}

            <Field id="auth-email" label="Work email" icon={Mail}>
              <Input
                id="auth-email"
                className="pl-11"
                placeholder="you@company.com"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field
              id="auth-password"
              label="Password"
              icon={Lock}
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="sentra-focus inline-flex items-center gap-1.5 rounded-full px-1 text-[11px] font-medium text-white/45 hover:text-white/80"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            >
              <Input
                id="auth-password"
                className="pl-11"
                placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                type={showPassword ? "text" : "password"}
                required={isSignUp || !mongoEnabled}
                minLength={isSignUp ? 6 : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Button variant="neon" size="lg" className="mt-1 w-full" disabled={!canSubmit} type="submit">
              {loading ? "Please wait…" : submitLabel}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs leading-5 text-white/35">
          {mongoWorkspaceReady
            ? "GTM monitors, reports, and chat history are saved to MongoDB Atlas."
            : "Monitors and reports stay in this browser until MONGODB_URI is configured."}
        </p>
      </motion.div>
    </main>
  );
}
