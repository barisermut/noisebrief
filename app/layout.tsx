import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ThemeProvider } from "./components/ThemeProvider";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time, preloaded, with a metric-matched fallback (no layout shift on swap).
const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-syne",
});

const siteUrl = getSiteUrl();
const description =
  "Daily one-pager: what happened today in tech? AI-summarized from Hacker News, TechCrunch, The Verge, Wired, and Reddit.";

export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Noisebrief | Today's tech noise. Briefly.",
  description,
  applicationName: "Noisebrief",
  openGraph: {
    title: "Noisebrief | Today's Tech News, Briefly",
    description,
    url: siteUrl,
    siteName: "Noisebrief",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noisebrief | Today's Tech News, Briefly",
    description: "Daily AI-generated tech news digest.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

/** Sets the theme class before first paint so there is no light/dark flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={syne.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full min-w-0 font-sans antialiased noise-overlay bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
