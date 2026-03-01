import { describe, expect, it, vi } from "vitest";
import {
  canRunTableAction,
  isTableHeaderActive,
  runTableAction,
  shouldShowTableBubble,
  type TableEditorLike,
} from "@/lib/editor/table-actions";

type TableActionName =
  | "addRowBefore"
  | "addRowAfter"
  | "addColumnBefore"
  | "addColumnAfter"
  | "mergeCells"
  | "splitCell"
  | "toggleHeaderRow"
  | "deleteRow"
  | "deleteColumn"
  | "deleteTable";

const createTableEditorMock = (options?: {
  activeHeader?: boolean;
  disabledActions?: TableActionName[];
}): {
  editor: TableEditorLike;
  chain: {
    focus: ReturnType<typeof vi.fn>;
    addRowBefore: ReturnType<typeof vi.fn>;
    addRowAfter: ReturnType<typeof vi.fn>;
    addColumnBefore: ReturnType<typeof vi.fn>;
    addColumnAfter: ReturnType<typeof vi.fn>;
    mergeCells: ReturnType<typeof vi.fn>;
    splitCell: ReturnType<typeof vi.fn>;
    toggleHeaderRow: ReturnType<typeof vi.fn>;
    deleteRow: ReturnType<typeof vi.fn>;
    deleteColumn: ReturnType<typeof vi.fn>;
    deleteTable: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };
} => {
  const chain = {
    focus: vi.fn(() => chain),
    addRowBefore: vi.fn(() => chain),
    addRowAfter: vi.fn(() => chain),
    addColumnBefore: vi.fn(() => chain),
    addColumnAfter: vi.fn(() => chain),
    mergeCells: vi.fn(() => chain),
    splitCell: vi.fn(() => chain),
    toggleHeaderRow: vi.fn(() => chain),
    deleteRow: vi.fn(() => chain),
    deleteColumn: vi.fn(() => chain),
    deleteTable: vi.fn(() => chain),
    run: vi.fn(() => true),
  };

  const disabledActions = new Set(options?.disabledActions ?? []);
  const can = () => ({
    addRowBefore: () => !disabledActions.has("addRowBefore"),
    addRowAfter: () => !disabledActions.has("addRowAfter"),
    addColumnBefore: () => !disabledActions.has("addColumnBefore"),
    addColumnAfter: () => !disabledActions.has("addColumnAfter"),
    mergeCells: () => !disabledActions.has("mergeCells"),
    splitCell: () => !disabledActions.has("splitCell"),
    toggleHeaderRow: () => !disabledActions.has("toggleHeaderRow"),
    deleteRow: () => !disabledActions.has("deleteRow"),
    deleteColumn: () => !disabledActions.has("deleteColumn"),
    deleteTable: () => !disabledActions.has("deleteTable"),
  });

  const editor = {
    chain: vi.fn(() => chain),
    can,
    isActive: vi.fn((type: string) => type === "tableHeader" && Boolean(options?.activeHeader)),
    isEditable: true,
  };

  return { editor, chain };
};

describe("table selector helpers", () => {
  it("shows table bubble only when editable and table-related node is active", () => {
    expect(
      shouldShowTableBubble({
        isEditable: false,
        isActive: () => true,
      }),
    ).toBe(false);

    expect(
      shouldShowTableBubble({
        isEditable: true,
        isActive: (type: string) => type === "tableCell",
      }),
    ).toBe(true);

    expect(
      shouldShowTableBubble({
        isEditable: true,
        isActive: () => false,
      }),
    ).toBe(false);
  });

  it("runs add-row-before command chain", () => {
    const { editor, chain } = createTableEditorMock();

    const result = runTableAction(editor, "addRowBefore");

    expect(result).toBe(true);
    expect(chain.focus).toHaveBeenCalledTimes(1);
    expect(chain.addRowBefore).toHaveBeenCalledTimes(1);
    expect(chain.run).toHaveBeenCalledTimes(1);
  });

  it("reads disabled state from editor.can()", () => {
    const { editor } = createTableEditorMock({ disabledActions: ["deleteTable"] });

    expect(canRunTableAction(editor, "deleteTable")).toBe(false);
  });

  it("computes header action active state from editor.isActive()", () => {
    const { editor } = createTableEditorMock({ activeHeader: true });

    expect(isTableHeaderActive(editor)).toBe(true);
  });
});
