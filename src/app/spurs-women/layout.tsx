import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tottenham Hotspur Women",
  description: "Latest news, matches, and updates for Tottenham Hotspur Women FC",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function SpursWomenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-white transition-colors duration-200 min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(120,190,232,0.08),_transparent_40%),linear-gradient(135deg,_#0a1929_0%,_#0d1b2a_50%,#081521_100%)] bg-noise relative`}>
        <div data-path="spurs-women">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
