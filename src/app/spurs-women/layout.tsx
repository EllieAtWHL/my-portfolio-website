import type { Metadata } from "next";
import "../globals.css";
import SpursHeader from "../../components/spurs-women/SpursHeader";

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
    <>
      <SpursHeader />
      <div className="spurs-wrapper">
        {children}
      </div>
    </>
  );
}
