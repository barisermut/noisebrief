/** Serializes JSON-LD for a <script> tag; escapes `<` so data can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
