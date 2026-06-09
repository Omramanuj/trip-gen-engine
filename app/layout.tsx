import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

// Wire the CSS variables that globals.css @theme expects.
// Departures voices: Fraunces (display) · Hanken Grotesk (body) · Geist Mono (labels).
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Trip Preview",
  description: "Play a generated trip-gen-engine trip, card by card.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
