import { describe, expect, it } from "vitest";
import { resolvePlaceholderText } from "./placeholder-utils";

const createEditorWithAncestors = (ancestors: string[]) => {
  return {
    state: {
      doc: {
        resolve: () => ({
          depth: ancestors.length - 1,
          node: (depth: number) => ({
            type: {
              name: ancestors[depth] ?? "doc",
            },
          }),
        }),
      },
    },
  } as any;
};

describe("REG-TABLE regression pack (headless)", () => {
  it("REG-TABLE-002: should hide slash placeholder inside table cells", () => {
    const placeholder = resolvePlaceholderText({
      editor: createEditorWithAncestors(["doc", "table", "tableRow", "tableCell", "paragraph"]),
      node: {
        type: { name: "paragraph" },
        attrs: {},
      },
      pos: 0,
    });

    expect(placeholder).toBe("");
  });

  it("REG-TABLE-002: should show slash placeholder in regular paragraph", () => {
    const placeholder = resolvePlaceholderText({
      editor: createEditorWithAncestors(["doc", "paragraph"]),
      node: {
        type: { name: "paragraph" },
        attrs: {},
      },
      pos: 0,
    });

    expect(placeholder).toBe("Press '/' for commands");
  });
});
