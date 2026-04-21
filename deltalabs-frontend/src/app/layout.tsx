/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Root } from "@/theme";
import "./globals.css";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta Labs",
  description: "Delta Labs frontend application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Root>{children}</Root>
      </body>
    </html>
  );
}
/** ################################ /COMPONENT ############################# */