import { describe, expect, it } from "vitest";
import { __mathematicsTestUtils } from "./mathematics";

type InlineState = Parameters<typeof __mathematicsTestUtils.tokenizeInlineMath>[0];

const createInlineState = (source: string, position = 0): InlineState => {
  return {
    pos: position,
    src: source,
    push: () => ({
      attrSet: () => {},
      attrGet: () => null,
    }),
  };
};

describe("REG-MATH regression pack", () => {
  it("REG-MATH-001: should not parse currency-like $12$ as inline math", () => {
    const state = createInlineState("$12$");
    expect(__mathematicsTestUtils.tokenizeInlineMath(state, false)).toBe(false);
  });

  it("REG-MATH-002: should not parse escaped \\$x\\$ as inline math", () => {
    const state = createInlineState("\\$x$", 1);
    expect(__mathematicsTestUtils.tokenizeInlineMath(state, false)).toBe(false);
  });

  it("REG-MATH-003: should backfill latex attribute from text content when missing", () => {
    const container = document.createElement("div");
    const node = document.createElement("span");
    node.setAttribute("data-type", "math");
    node.textContent = "x^2";
    container.appendChild(node);

    __mathematicsTestUtils.ensureMathLatexAttributes(container, "math");

    expect(node.getAttribute("latex")).toBe("x^2");
  });
});
