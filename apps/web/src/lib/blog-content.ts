/** Pure helpers for journal content — no server-only deps, so they're unit-testable. */

const WORDS_PER_MINUTE = 220;

export function readMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}


export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "quote"; text: string };

/**
 * Parses the minimal article markup used in BlogPost.content (see the seed
 * for the format). Kept intentionally tiny — no HTML is ever interpreted, so
 * content can't inject markup.
 */
export function parseContent(content: string): Block[] {
  const blocks: Block[] = [];
  const chunks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const first = lines[0]!;
    if (first.startsWith("## ")) {
      blocks.push({ kind: "h2", text: first.slice(3).trim() });
      const rest = lines.slice(1).join(" ");
      if (rest) blocks.push({ kind: "p", text: rest });
    } else if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ kind: "ul", items: lines.map((l) => l.slice(2).trim()) });
    } else if (lines.every((l) => l.startsWith("> "))) {
      blocks.push({ kind: "quote", text: lines.map((l) => l.slice(2).trim()).join(" ") });
    } else {
      blocks.push({ kind: "p", text: lines.join(" ") });
    }
  }
  return blocks;
}
