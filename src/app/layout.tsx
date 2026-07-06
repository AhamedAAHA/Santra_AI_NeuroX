import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Global3DField } from "@/components/shared/global-3d-field";
import { Providers } from "@/app/providers";
import "./globals.css";

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
          <Global3DField />
          {children}
        </Providers>
      </body>
    </html>
  );
}
