import type { Metadata } from "next";
import { Space_Grotesk, Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import CanvasRoot from "@/components/canvas/CanvasRoot";
import Header from "@/components/layout/Header";
import MenuOverlay from "@/components/layout/MenuOverlay";
import Cursor from "@/components/layout/Cursor";
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
  title: "LUSION — 3D & Interactive Web Studio (reproduction)",
  description:
    "A faithful reproduction of the lusion.co immersive WebGL experience, built with Next.js, React Three Fiber and GSAP. Works on desktop and mobile.",
  openGraph: {
    title: "LUSION — reproduction",
    description:
      "Immersive WebGL studio site reproduction — preloader, physics hero, kinetic type, cinematic 3D journey.",
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
    >
      <body>
        <AppProviders>
          <Preloader />
          <CanvasRoot />
          <Cursor />
          <Header />
          <MenuOverlay />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
