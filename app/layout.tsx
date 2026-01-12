import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeColor } from "@/components/theme-color";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TropiTrack",
  description: "Construction project management and payroll tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TropiTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/images/tropitrack-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/images/tropitrack-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/tropitrack-logo.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "TropiTrack",
    description: "Construction project management and payroll tracking",
    images: [
      {
        url: "/images/tropitrack-logo.png",
        width: 1200,
        height: 630,
        alt: "TropiTrack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TropiTrack",
    description: "Construction project management and payroll tracking",
    images: ["/images/tropitrack-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f4f6", // Will be updated dynamically by ThemeColor component
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/tropitrack-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/tropitrack-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/tropitrack-logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TropiTrack" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColor />
          {children}
          {/* <DevNav /> */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
