const LINES = ["w-full", "w-full", "w-[85%]", "spacer", "w-full", "w-full", "w-[70%]"];

/** Placeholder while another date's brief loads. CSS-only pulse; respects reduced motion. */
export function SummarySkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading brief">
      {LINES.map((w, i) =>
        w === "spacer" ? (
          <div key={i} className="pt-2" />
        ) : (
          <div key={i} className={`skeleton h-4 rounded bg-muted ${w}`} style={{ animationDelay: `${(i % 3) * 0.2}s` }} />
        )
      )}
    </div>
  );
}
