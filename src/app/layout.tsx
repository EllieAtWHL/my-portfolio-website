import type { Metadata } from "next";
import { Nokora } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import Script from "next/script";
import { OfflineBanner } from "../components/OfflineBanner";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";
import CookieConsentProvider from "../components/CookieConsentProvider";
import { CookieConsentBanner } from "../components/CookieConsentBanner";
import { FullStoryLoader } from "../components/FullStoryLoader";
import { ConsentGatedAnalytics } from "../components/ConsentGatedAnalytics";

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
        <meta name="theme-color" content="#2d5a2d" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <CookieConsentProvider>
            <OfflineBanner />
            {children}
            <CookieConsentBanner />
            <FullStoryLoader />
            <ConsentGatedAnalytics />
          </CookieConsentProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
