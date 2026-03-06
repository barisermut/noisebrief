"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Radar, Target, Zap } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const steps = [
  {
    icon: Target,
    title: "Pick your domains",
    description: "Choose 1–3 product domains you care about: AI, SaaS, Product Management, Fintech, and more.",
  },
  {
    icon: Radar,
    title: "Content from across the web",
    description: "Your digest pulls from Product Hunt, Hacker News, and Reddit—all from the last 7 days.",
  },
  {
    icon: Zap,
    title: "Get your weekly digest",
    description: "AI-summarized, relevance-scored cards so you spend less time scrolling and more time shipping.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16 sm:px-8 md:pt-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={item} className="mb-6 flex items-center gap-2">
            <Radar className="h-10 w-10 text-primary" aria-hidden />
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              PM Radar
            </span>
          </motion.div>
          <motion.p
            variants={item}
            className="font-heading text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Your weekly product intelligence briefing
          </motion.p>
          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Curated from Product Hunt, Hacker News, and Reddit. Summarized by AI. One digest per week.
          </motion.p>
          <motion.div variants={item} className="mt-10">
            <Button asChild size="lg" className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90">
              <Link href="/select">Get your radar</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-16"
        >
          <h2 className="font-heading text-center text-2xl font-bold text-foreground sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/50 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-6 px-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} PM Radar</span>
          <Link
            href="/privacy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
