import type { Metadata } from "next";
import { Space_Grotesk, Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import CanvasRoot from "@/components/canvas/CanvasRoot";
import MenuOverlay from "@/components/layout/MenuOverlay";
import Preloader from "@/components/layout/Preloader";

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overnight Success — Creative & Engineering Studio",
  description:
    "Overnight Success builds AI, web, and interactive experiences. We build on top of many things — most importantly, to solve real problems. onstud.io",
  openGraph: {
    title: "Overnight Success",
    description:
      "A studio building AI, web, and interactive experiences — preloader, physics hero, kinetic type, cinematic 3D journey.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppProviders>
          <Preloader />
          <CanvasRoot />
          <MenuOverlay />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
