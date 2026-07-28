import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SafeGlobal3DField } from "@/components/shared/safe-global-3d-field";
import { Providers } from "@/app/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b14",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SANTRA AI | Autonomous GTM Intelligence Agent",
  description:
    "SANTRA AI is a B2B GTM intelligence agent for revenue and competitive intel teams — autonomous monitoring, live web evidence, and human-approved automation.",
  openGraph: {
    title: "SANTRA AI",
    description:
      "Autonomous GTM intelligence agent for B2B teams — competitive monitoring, executive briefs, and human-in-the-loop automation.",
    type: "website",
    siteName: "SANTRA AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SANTRA AI",
    description:
      "B2B GTM intelligence agent — monitor competitors, collect evidence, approve actions before automation runs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} ${displayFont.variable} font-sans antialiased`}>
        <Providers>
          <SafeGlobal3DField />
          {children}
        </Providers>
      </body>
    </html>
  );
}
