"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

const display = "font-[family-name:var(--font-pitch-display)]";
const mono = "font-[family-name:var(--font-pitch-mono)]";

export const PITCH_APP_URL = "https://santra-ai-neurox.vercel.app/";
/** Judges/audience QR — start session + review funnel (production) */
export const PITCH_TRY_URL = "https://santra-ai-neurox.vercel.app/try?from=pitch";
export const PITCH_LIVE_URL = "https://santra-ai-neurox.vercel.app/pitch/live";
/** Local try funnel — use on closing slide while developing */
export const LOCAL_PITCH_TRY_URL = "http://localhost:3001/try?from=pitch";
export const LOCAL_PITCH_LIVE_URL = "http://localhost:3001/pitch/live";

export type PitchTeamMember = {
  name: string;
  role: string;
  photo?: string;
  initials: string;
  accent: string;
};

export const PITCH_TEAM: PitchTeamMember[] = [
  {
    name: "Hubaib Ahamed",
    role: "Leader",
    photo: "/pitch/team/hubaib-ahamed.png",
    initials: "HA",
    accent: "from-cyan-400/40 to-sky-500/20",
  },
  {
    name: "Avashik Ahamed",
    role: "Team",
    photo: "/pitch/team/avashik-ahamed.png",
    initials: "AA",
    accent: "from-sky-400/35 to-indigo-500/20",
  },
  {
    name: "Aathil Akmal",
    role: "Team",
    initials: "AK",
    accent: "from-teal-400/35 to-cyan-600/20",
  },
  {
    name: "Tharmithan",
    role: "Team",
    photo: "/pitch/team/tharmithan.png",
    initials: "TH",
    accent: "from-blue-400/35 to-cyan-500/20",
  },
];

function TeamAvatar({ member }: { member: PitchTeamMember }) {
  if (member.photo) {
    return (
      <div className="relative mx-auto h-24 w-24 overflow-hidden border border-cyan-300/30 sm:h-28 sm:w-28">
        <Image
          src={member.photo}
          alt={member.name}
          fill
          className="object-cover object-[center_18%]"
          sizes="112px"
          priority={member.role === "Leader"}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex h-24 w-24 items-center justify-center border border-white/15 bg-gradient-to-br sm:h-28 sm:w-28",
        member.accent,
      )}
    >
      <span className={cn(display, "text-2xl font-semibold tracking-wide text-cyan-50 sm:text-3xl")}>
        {member.initials}
      </span>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),transparent_55%)]" />
    </div>
  );
}

export function TeamMemberCard({
  member,
  className,
}: {
  member: PitchTeamMember;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-white/[0.1] bg-[#070d1a]/92 px-4 py-5 text-center sm:px-5 sm:py-6",
        member.role === "Leader" && "border-cyan-400/35 bg-cyan-400/[0.06]",
        className,
      )}
    >
      <TeamAvatar member={member} />
      <p className={cn(display, "mt-4 text-base font-semibold text-white sm:text-lg")}>{member.name}</p>
      <p
        className={cn(
          mono,
          "mt-1.5 text-[0.65rem] uppercase tracking-[0.2em]",
          member.role === "Leader" ? "text-cyan-300" : "text-white/55",
        )}
      >
        {member.role}
      </p>
    </div>
  );
}

/** Animated QR — opens judge/audience try funnel */
export function AppLoginQr({
  className,
  size = 168,
  label = "Scan to try SANTRA AI",
  href = PITCH_TRY_URL,
}: {
  className?: string;
  size?: number;
  label?: string;
  href?: string;
}) {
  const displayUrl = href.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative p-3">
        {/* Soft pulse rings */}
        <motion.span
          className="pointer-events-none absolute inset-0 border border-cyan-300/35"
          animate={{ opacity: [0.15, 0.55, 0.15], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        />
        <motion.span
          className="pointer-events-none absolute inset-[-6px] border border-cyan-400/20"
          animate={{ opacity: [0.05, 0.35, 0.05], scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.35 }}
        />

        <div className="relative overflow-hidden border border-white/15 bg-white p-3">
          <QRCodeSVG
            value={href}
            size={size}
            level="M"
            bgColor="#ffffff"
            fgColor="#020617"
            marginSize={1}
            title="Try SANTRA AI"
          />
          {/* Scan sweep */}
          <motion.div
            className="pointer-events-none absolute inset-x-3 top-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ top: ["12%", "88%", "12%"] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          />
        </div>
      </div>
      <p className={cn(mono, "mt-3 text-center text-[0.65rem] uppercase tracking-[0.18em] text-cyan-200/90")}>
        {label}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-1 max-w-[240px] truncate text-center text-xs text-white/50 transition hover:text-cyan-200"
      >
        {displayUrl}
      </a>
    </div>
  );
}
