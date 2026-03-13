import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { BriefProvider } from "./components/BriefProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { getSiteUrl } from "@/lib/site";
import "@fontsource/syne/400.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "./globals.css";

const siteUrl = getSiteUrl();

export const viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Noisebrief — Today's tech noise. Briefly.",
  description:
    "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.",
  openGraph: {
    title: "Noisebrief — Today's tech noise. Briefly.",
    description:
      "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.",
    url: siteUrl,
    siteName: "Noisebrief",
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noisebrief — Today's tech noise. Briefly.",
    description:
      "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.",
    images: [`${siteUrl}/og-image.png`],
  },
  // Explicit static files from /public so every browser finds the icon (no file-convention magic).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else if (theme === 'light') document.documentElement.classList.remove('dark');
      else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch(e) {}
  })()
` }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full min-w-0 font-sans antialiased noise-overlay bg-background text-foreground">
        <ThemeProvider>
          <BriefProvider>
            {children}
          </BriefProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
