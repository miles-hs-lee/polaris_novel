import { describe, expect, it, vi } from "vitest";
import { toggleMathSelection } from "@/lib/editor/math-toggle";

const createMathEditorMock = ({
  active = false,
  selectedLatex = "x^2",
}: {
  active?: boolean;
  selectedLatex?: string;
} = {}) => {
  const chain = {
    focus: vi.fn(() => chain),
    setLatex: vi.fn(() => chain),
    unsetLatex: vi.fn(() => chain),
    run: vi.fn(() => true),
  };

  const editor = {
    isActive: vi.fn((type: string) => type === "math" && active),
    chain: vi.fn(() => chain),
    state: {
      selection: {
        from: 1,
        to: 4,
      },
      doc: {
        textBetween: vi.fn(() => selectedLatex),
      },
    },
  };

  return { editor, chain };
};

describe("math selector helper", () => {
  it("unsets latex when math node is active", () => {
    const { editor, chain } = createMathEditorMock({ active: true });

    const handled = toggleMathSelection(editor as any);

    expect(handled).toBe(true);
    expect(chain.unsetLatex).toHaveBeenCalledTimes(1);
    expect(chain.setLatex).not.toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalledTimes(1);
  });

  it("sets latex from selected text when inactive", () => {
    const { editor, chain } = createMathEditorMock({ active: false, selectedLatex: "a+b" });

    const handled = toggleMathSelection(editor as any);

    expect(handled).toBe(true);
    expect(editor.state.doc.textBetween).toHaveBeenCalledWith(1, 4);
    expect(chain.setLatex).toHaveBeenCalledWith({ latex: "a+b" });
    expect(chain.run).toHaveBeenCalledTimes(1);
  });

  it("does nothing when selection text is empty", () => {
    const { editor, chain } = createMathEditorMock({ active: false, selectedLatex: "" });

    const handled = toggleMathSelection(editor as any);

    expect(handled).toBe(false);
    expect(chain.setLatex).not.toHaveBeenCalled();
    expect(chain.unsetLatex).not.toHaveBeenCalled();
    expect(chain.run).not.toHaveBeenCalled();
  });
});
