import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeGate MVP",
  description: "AI-mediated pre-trade execution checkpoint for discretionary traders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-slate-100 antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff)] text-slate-950">
        {children}
      </body>
    </html>
  );
}
