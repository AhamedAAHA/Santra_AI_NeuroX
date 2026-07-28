"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RiskTrendPoint } from "@/lib/reports/view-model";

export function ReportTrendChart({ points }: { points: RiskTrendPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
        Run a few more checks to unlock risk over time.
      </p>
    );
  }

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.12)" }}
            contentStyle={{
              background: "#0c0f1a",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${value}`,
              name === "riskScore" ? "Risk" : "Confidence",
            ]}
          />
          <Line
            type="monotone"
            dataKey="riskScore"
            stroke="#fb7185"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#fb7185", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#53f4ff"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "#53f4ff", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
