import type { Metadata, Viewport } from "next";
import "../globals.css";
import "../../styles/spurs-theme-layer.css";
import SpursHeader from "../../components/spurs-women/SpursHeader";
import SpursFooter from "../../components/spurs-women/SpursFooter";
import { SpursWrapper } from "../../components/SpursWrapper";
import { SkipLink } from "../../components/SkipLink";

export const metadata: Metadata = {
  title: "Tottenham Hotspur Women",
  description: "Latest news, matches, and updates for Tottenham Hotspur Women FC",
  manifest: '/spurs-women/manifest.webmanifest',
  icons: {
    icon: '/spurs-women/icons/icon-512.png',
    shortcut: '/spurs-women/icons/icon-512.png',
    apple: '/spurs-women/icons/apple-touch-icon.png',
  },
  // Manifest-driven install covers Android; iOS Safari ignores the manifest
  // for "Add to Home Screen" and needs these instead.
  appleWebApp: {
    capable: true,
    // 'default' keeps the status bar opaque and content below it - the
    // fixed SpursHeader has no safe-area-inset padding, so
    // 'black-translucent' (full-bleed under the status bar/notch) would
    // clip the top of the nav on iOS.
    statusBarStyle: 'default',
    title: 'Spurs Women',
  },
};

export const viewport: Viewport = {
  themeColor: '#081521',
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
