import type { Metadata } from "next";
import "../globals.css";
import SpursHeader from "../../components/spurs-women/SpursHeader";
import SpursFooter from "../../components/spurs-women/SpursFooter";
import UpdateBanner from "../../components/UpdateBanner";

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
      <UpdateBanner />
      <div className="spurs-wrapper min-h-screen">
        {children}
        <SpursFooter />
      </div>
    </>
  );
}
