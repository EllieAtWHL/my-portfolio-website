import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import Header from "../components/Header";

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
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nokora:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <div className="wrapper">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
