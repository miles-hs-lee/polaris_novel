import { describe, expect, it, vi } from "vitest";
import { __mathematicsTestUtils } from "./mathematics";

type TokenLike = {
  markup?: string;
  content?: string;
  attrs: Record<string, string>;
  attrSet: (name: string, value: string) => void;
  attrGet: (name: string) => string | null;
};

const createInlineState = (source: string, position = 0) => {
  const tokens: TokenLike[] = [];

  const state = {
    pos: position,
    src: source,
    push: (_type: string, _tag: string, _nesting: number) => {
      const token: TokenLike = {
        attrs: {},
        attrSet(name: string, value: string) {
          this.attrs[name] = value;
        },
        attrGet(name: string) {
          return this.attrs[name] ?? null;
        },
      };

      tokens.push(token);
      return token;
    },
  };

  return { state, tokens };
};

describe("mathematics markdown tokenizer internals", () => {
  it("tokenizes a valid inline math expression", () => {
    const { state, tokens } = createInlineState("$x^2$");
    const matched = __mathematicsTestUtils.tokenizeInlineMath(state, false);

    expect(matched).toBe(true);
    expect(state.pos).toBe(5);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.content).toBe("x^2");
    expect(tokens[0]?.attrGet("data-type")).toBe("math");
  });

  it("does not tokenize escaped math markers", () => {
    const { state } = createInlineState("\\$x$", 1);
    const matched = __mathematicsTestUtils.tokenizeInlineMath(state, false);

    expect(matched).toBe(false);
  });

  it("does not parse currency-like values as math", () => {
    const { state } = createInlineState("$12$");
    const matched = __mathematicsTestUtils.tokenizeInlineMath(state, false);

    expect(matched).toBe(false);
  });

  it("does not parse the second $ of a $$...$$ sequence", () => {
    const { state } = createInlineState("$$x$$", 1);
    const matched = __mathematicsTestUtils.tokenizeInlineMath(state, false);

    expect(matched).toBe(false);
  });

  it("normalizes and escapes latex for markdown export", () => {
    const normalized = __mathematicsTestUtils.normalizeInlineLatexForExport("  E = mc$2\n\n");
    expect(normalized).toBe("E = mc\\$2");
  });

  it("installs markdown-it rule only once", () => {
    const afterSpy = vi.fn();
    const markdownIt: Parameters<typeof __mathematicsTestUtils.setupInlineMathMarkdownRule>[0] = {
      inline: {
        ruler: {
          after: afterSpy,
        },
      },
      renderer: {
        rules: {},
      },
    };

    __mathematicsTestUtils.setupInlineMathMarkdownRule(markdownIt);
    __mathematicsTestUtils.setupInlineMathMarkdownRule(markdownIt);

    expect(afterSpy).toHaveBeenCalledTimes(1);
    expect(typeof markdownIt.renderer.rules.novel_inline_math).toBe("function");
  });

  it("renders inline math token with escaped html", () => {
    const tokens: Parameters<typeof __mathematicsTestUtils.renderInlineMathToken>[0] = [
      {
        content: "<x>&\"",
        attrSet: () => {},
        attrGet: () => null,
      },
    ];

    const html = __mathematicsTestUtils.renderInlineMathToken(tokens, 0);

    expect(html).toContain("&lt;x&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("data-type=\"math\"");
  });
});
