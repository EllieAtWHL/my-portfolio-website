import type { Metadata } from "next";
import "./globals.css";

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
    <div data-path="spurs-women" className="min-h-screen relative">
      <div className="content">
        <main className="scrollable">{children}</main>
      </div>
    </div>
  );
}
