import type { Metadata, Viewport } from "next";
import { SITE } from "@dealership/types";
import { fontDisplay, fontMono, fontSans } from "@/lib/fonts";
import { siteUrl } from "@/lib/site-url";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — Authorised new-car dealership in Malaysia`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Explore the 2026 lineup, configure your car, browse in-stock units, book a test drive and apply for financing — all from our Petaling Jaya showroom.",
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_MY",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html
      lang="en-MY"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
