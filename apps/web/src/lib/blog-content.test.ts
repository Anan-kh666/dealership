import { describe, expect, it } from "vitest";
import { parseContent, readMinutes } from "./blog-content";

describe("parseContent", () => {
  it("parses headings, paragraphs, lists and quotes", () => {
    const blocks = parseContent(
      [
        "Intro paragraph that wraps",
        "onto a second line.",
        "",
        "## Section",
        "",
        "- one",
        "- two",
        "",
        "> A pull quote.",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { kind: "p", text: "Intro paragraph that wraps onto a second line." },
      { kind: "h2", text: "Section" },
      { kind: "ul", items: ["one", "two"] },
      { kind: "quote", text: "A pull quote." },
    ]);
  });

  it("treats a heading followed by text in the same chunk as heading + paragraph", () => {
    expect(parseContent("## Title\nBody text")).toEqual([
      { kind: "h2", text: "Title" },
      { kind: "p", text: "Body text" },
    ]);
  });

  it("never interprets HTML — it stays literal text", () => {
    const [block] = parseContent("<script>alert(1)</script>");
    expect(block).toEqual({ kind: "p", text: "<script>alert(1)</script>" });
  });

  it("handles CRLF line endings and blank input", () => {
    expect(parseContent("a\r\n\r\nb")).toHaveLength(2);
    expect(parseContent("   ")).toEqual([]);
  });
});

describe("readMinutes", () => {
  it("rounds to whole minutes with a one-minute floor", () => {
    expect(readMinutes("")).toBe(1);
    expect(readMinutes("word ".repeat(220))).toBe(1);
    expect(readMinutes("word ".repeat(1100))).toBe(5);
  });
});
