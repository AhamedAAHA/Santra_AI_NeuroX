/** Email-safe HTML building blocks (table layout, inline styles, no JS/SVG). */

export const EMAIL_COLORS = {
  page: "#eef1f7",
  card: "#ffffff",
  ink: "#0b1220",
  muted: "#5b657a",
  soft: "#8a93a6",
  border: "#e3e8f2",
  cyan: "#0891b2",
  cyanSoft: "#ecfeff",
  risk: "#e11d48",
  riskSoft: "#fff1f2",
  confidence: "#0e7490",
  confidenceSoft: "#ecfeff",
  track: "#e8edf5",
  critical: "#e11d48",
  high: "#ea580c",
  medium: "#0284c7",
  low: "#64748b",
  success: "#059669",
} as const;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function percentBar(percent: number, color: string) {
  const width = Math.max(0, Math.min(100, Math.round(percent)));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td height="10" width="${width}%" style="background-color:${color};border-radius:6px 0 0 6px;font-size:0;line-height:0;">&nbsp;</td>
    <td height="10" width="${100 - width}%" style="background-color:${EMAIL_COLORS.track};border-radius:0 6px 6px 0;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

export function kpiCell(label: string, value: string, accent: string) {
  return `<td width="33%" valign="top" style="padding:8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${EMAIL_COLORS.border};border-radius:12px;background:${EMAIL_COLORS.card};">
    <tr>
      <td style="padding:14px 12px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLORS.soft};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</p>
        <p style="margin:8px 0 0;font-size:28px;line-height:1;font-weight:700;color:${accent};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(value)}</p>
      </td>
    </tr>
  </table>
</td>`;
}

export function sectionTitle(title: string) {
  return `<p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLORS.soft};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(title)}</p>`;
}

export function severityBarRow(label: string, count: number, max: number, color: string) {
  const percent = max > 0 ? Math.round((count / max) * 100) : 0;
  return `<tr>
  <td style="padding:6px 0;font-size:13px;color:${EMAIL_COLORS.ink};font-family:Arial,Helvetica,sans-serif;width:78px;">${escapeHtml(label)}</td>
  <td style="padding:6px 8px;">${percentBar(percent, color)}</td>
  <td style="padding:6px 0;font-size:13px;color:${EMAIL_COLORS.muted};font-family:Arial,Helvetica,sans-serif;width:28px;text-align:right;">${count}</td>
</tr>`;
}

export function reliabilityBarRow(name: string, reliability: number) {
  return `<tr>
  <td style="padding:6px 0;font-size:12px;color:${EMAIL_COLORS.ink};font-family:Arial,Helvetica,sans-serif;width:96px;">${escapeHtml(name)}</td>
  <td style="padding:6px 8px;">${percentBar(reliability, EMAIL_COLORS.cyan)}</td>
  <td style="padding:6px 0;font-size:12px;color:${EMAIL_COLORS.muted};font-family:Arial,Helvetica,sans-serif;width:36px;text-align:right;">${reliability}%</td>
</tr>`;
}

export function changeRow(text: string, meta?: string, severity?: string) {
  const severityColor =
    severity === "critical"
      ? EMAIL_COLORS.critical
      : severity === "high"
        ? EMAIL_COLORS.high
        : severity === "medium"
          ? EMAIL_COLORS.medium
          : EMAIL_COLORS.low;

  return `<tr>
  <td style="padding:10px 12px;border:1px solid ${EMAIL_COLORS.border};border-radius:10px;background:#fbfcfe;">
    <p style="margin:0;font-size:14px;line-height:1.5;color:${EMAIL_COLORS.ink};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(text)}</p>
    ${
      meta
        ? `<p style="margin:6px 0 0;font-size:12px;color:${EMAIL_COLORS.soft};font-family:Arial,Helvetica,sans-serif;">
            ${severity ? `<span style="color:${severityColor};font-weight:600;">${escapeHtml(severity)}</span> · ` : ""}${escapeHtml(meta)}
          </p>`
        : ""
    }
  </td>
</tr>
<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export function actionRow(index: number, text: string) {
  return `<tr>
  <td valign="top" style="padding:0 10px 10px 0;width:28px;font-size:14px;font-weight:700;color:${EMAIL_COLORS.cyan};font-family:Arial,Helvetica,sans-serif;">${index}.</td>
  <td style="padding:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_COLORS.ink};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(text)}</td>
</tr>`;
}

export function ctaButton(label: string, href: string, primary = true) {
  if (primary) {
    return `<a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:${EMAIL_COLORS.cyan};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</a>`;
  }
  return `<a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:999px;border:1px solid ${EMAIL_COLORS.border};color:${EMAIL_COLORS.ink};text-decoration:none;font-weight:600;font-size:14px;font-family:Arial,Helvetica,sans-serif;background:${EMAIL_COLORS.card};">${escapeHtml(label)}</a>`;
}
