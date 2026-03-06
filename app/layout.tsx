import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/syne/400.css";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noisebrief — Today's tech noise. Briefly.",
  description:
    "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="min-h-screen min-w-0 bg-[#0a0a0f] text-zinc-200 font-sans antialiased noise-overlay overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
