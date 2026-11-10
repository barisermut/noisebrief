import type { BriefParagraph } from "@/types/brief";
import { ParagraphWithKeyword } from "./ParagraphWithKeyword";

/** Brief body. Rendered immediately (no entrance animation) so it is the fast, stable LCP element. */
export function BriefParagraphs({ paragraphs }: { paragraphs: BriefParagraph[] }) {
  return (
    <div className="space-y-6">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-foreground sm:text-lg sm:leading-relaxed">
          <ParagraphWithKeyword paragraph={p} />
        </p>
      ))}
    </div>
  );
}
