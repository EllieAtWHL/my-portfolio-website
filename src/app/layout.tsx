import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";

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
    >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function getSystemPreference() {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
              }
              
              function getStoredTheme() {
                try {
                  return localStorage.getItem('theme');
                } catch (e) {
                  return null;
                }
              }
              
              function applyTheme() {
                const stored = getStoredTheme();
                const systemPreference = getSystemPreference();
                const isDark = stored === 'dark' || (!stored && systemPreference);
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
                
                // Remove the loading attribute to show content
                document.documentElement.removeAttribute('data-theme-loading');
              }
              
              // Apply theme immediately
              applyTheme();
            })();
          `
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nokora:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
