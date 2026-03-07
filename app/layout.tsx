import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "@fontsource/syne/400.css";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noisebrief — Today's tech noise. Briefly.",
  description:
    "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.",
  // Single source of truth: app/favicon.ico (N logo). Cache-bust so deploy clears Vercel/browser cache.
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
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
