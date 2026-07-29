import type { Metadata } from "next";
import { Nokora } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

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
        <Script
          src="/fullstory-init.js"
          strategy="beforeInteractive"
        />
        <Script src="/theme-script.js" strategy="beforeInteractive" />
        <meta name="theme-color" content="#2d5a2d" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
