import Link from "next/link";
import { Radar } from "lucide-react";

export default function PrivacyPage() {
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
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-6 text-muted-foreground">
          Placeholder. Privacy policy will be added here.
        </p>
        <Link href="/" className="mt-8 inline-block text-primary hover:underline">
          Back to home
        </Link>
      </main>
    </div>
  );
}
