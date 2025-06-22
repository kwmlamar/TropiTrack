import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TropiTrack",
  description:
    "A modern bookkeeping and payroll web app built for small businesses in The Bahamas. Track employees, manage timesheets, run payroll, and stay compliant with NIB—simple, fast, and designed for Caribbean workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${workSans.variable} antialiased`}
      >
        <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange 
        >
        {children}
        <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
