import type { Metadata } from "next";
import { Geist, Geist_Mono, Cedarville_Cursive } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cedarvilleCursive = Cedarville_Cursive({
  weight: "400",
  variable: "--font-cedarville",
  subsets: ["latin"],
});

const fridgeMagnet = localFont({
  src: "./fonts/AlphaFridgeMagnetsAllCaps.ttf",
  variable: "--font-fridge-magnet",
});

const fridgeMagnetText = localFont({
  src: "./fonts/AlphaFridgeMagnets.ttf",
  variable: "--font-fridge-magnet-text",
});

export const metadata: Metadata = {
  title: "snapchef",
  description: "Turn recipe screenshots into a categorized grocery list.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cedarvilleCursive.variable} ${fridgeMagnet.variable} ${fridgeMagnetText.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
