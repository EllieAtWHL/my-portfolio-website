import type { Metadata, Viewport } from "next";
import { Nokora } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import Script from "next/script";
import { OfflineBanner } from "../components/OfflineBanner";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";
import CookieConsentProvider from "../components/CookieConsentProvider";
import { CookieConsentBanner } from "../components/CookieConsentBanner";
import { FullStoryLoader } from "../components/FullStoryLoader";
import { ConsentGatedVercelScripts } from "../components/ConsentGatedVercelScripts";

const nokora = Nokora({
  subsets: ["khmer", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nokora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EllieAtWHL",
  description: "Trailblazing Salesforce Developer & Supermum Mentor",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

// A route-tree viewport export (e.g. spurs-women/layout.tsx) overrides this
// per-route; a plain <meta> tag here wouldn't be replaceable that way and
// would just end up duplicated alongside the override.
export const viewport: Viewport = {
  themeColor: '#2d5a2d',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme-loading
      className={nokora.variable}
    >
      <head>
        <Script src="/theme-script.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <CookieConsentProvider>
            <OfflineBanner />
            {/* Rendered before {children} (fixed positioning keeps it visually
                bottom-of-viewport regardless of DOM order) so keyboard users
                reach Accept/Reject early instead of after the entire page. */}
            <CookieConsentBanner />
            {children}
            <FullStoryLoader />
            <ConsentGatedVercelScripts />
          </CookieConsentProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
