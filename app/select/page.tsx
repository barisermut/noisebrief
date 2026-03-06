"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Domain } from "@/types";
import {
  Brain,
  Cloud,
  LayoutGrid,
  Wallet,
  Wrench,
  Palette,
  TrendingUp,
  Check,
  Radar,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DOMAINS: {
  id: Domain;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "AI", label: "AI", color: "text-teal-400 border-teal-500/50 bg-teal-500/10", icon: Brain },
  { id: "SaaS", label: "SaaS", color: "text-amber-400 border-amber-500/50 bg-amber-500/10", icon: Cloud },
  { id: "Product", label: "Product Management", color: "text-violet-400 border-violet-500/50 bg-violet-500/10", icon: LayoutGrid },
  { id: "Fintech", label: "Fintech", color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10", icon: Wallet },
  { id: "DevTools", label: "Dev Tools", color: "text-sky-400 border-sky-500/50 bg-sky-500/10", icon: Wrench },
  { id: "Design", label: "Design", color: "text-rose-400 border-rose-500/50 bg-rose-500/10", icon: Palette },
  { id: "Growth", label: "Growth", color: "text-orange-400 border-orange-500/50 bg-orange-500/10", icon: TrendingUp },
];

const MAX_SELECTIONS = 3;

export default function SelectPage() {
  const [selected, setSelected] = useState<Domain[]>([]);
  const [aiSummariesEnabled, setAiSummariesEnabled] = useState(true);
  const router = useRouter();

  const toggle = useCallback((domain: Domain) => {
    setSelected((prev) => {
      const next = prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : prev.length >= MAX_SELECTIONS
          ? prev
          : [...prev, domain];
      return next;
    });
  }, []);

  const handleShowRadar = useCallback(() => {
    if (selected.length === 0) return;
    const params = new URLSearchParams();
    params.set("domains", selected.join(","));
    if (!aiSummariesEnabled) params.set("ai", "0");
    router.push(`/feed?${params.toString()}`);
  }, [selected, aiSummariesEnabled, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-90">
            <Radar className="h-8 w-8 text-primary" />
            <span className="font-heading text-xl font-bold tracking-tight">PM Radar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pick your domains
          </h1>
          <p className="mt-3 text-muted-foreground">
            Choose 1 to 3 product domains to build your weekly digest around.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {DOMAINS.map((d) => {
            const isSelected = selected.includes(d.id);
            const Icon = d.icon;
            return (
              <motion.button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                className="group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-card p-5 text-left transition-colors"
                style={{
                  borderColor: isSelected ? "var(--primary)" : "var(--border)",
                  boxShadow: isSelected ? "0 0 0 1px var(--primary), 0 0 20px -4px rgba(0, 212, 170, 0.25)" : undefined,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${d.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-heading font-semibold text-foreground">
                    {d.label}
                  </span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <Check className="h-3 w-3" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <p className="text-sm text-muted-foreground">
            {selected.length} of {MAX_SELECTIONS} selected
          </p>
          <Button
            size="lg"
            disabled={selected.length === 0}
            onClick={handleShowRadar}
            className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Show my radar
          </Button>
          <div className="flex items-center gap-3">
            <Switch
              id="ai-summaries"
              checked={aiSummariesEnabled}
              onCheckedChange={setAiSummariesEnabled}
            />
            <label htmlFor="ai-summaries" className="text-sm font-medium text-foreground cursor-pointer">
              Enable AI summaries
            </label>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
