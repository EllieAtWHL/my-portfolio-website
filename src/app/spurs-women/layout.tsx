import type { Metadata } from "next";
import "../globals.css";
import "../../styles/spurs-theme-layer.css";
import SpursHeader from "../../components/spurs-women/SpursHeader";
import SpursFooter from "../../components/spurs-women/SpursFooter";
import { SpursWrapper } from "../../components/SpursWrapper";
import { SkipLink } from "../../components/SkipLink";

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
      <SkipLink />
      <SpursHeader />
      <SpursWrapper>
        {children}
        <SpursFooter />
      </SpursWrapper>
    </>
  );
}
