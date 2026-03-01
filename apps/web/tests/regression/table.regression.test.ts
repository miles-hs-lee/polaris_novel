import { describe, expect, it } from "vitest";
import { hasMeaningfulContent, shouldBootstrapDefaultContent } from "@/lib/editor/bootstrap-guards";

describe("REG-TABLE regression pack", () => {
  it("REG-TABLE-001: should not bootstrap default content when editor has meaningful content", () => {
    const hasTableContent = hasMeaningfulContent({
      type: "doc",
      content: [{ type: "table" }],
    });

    expect(hasTableContent).toBe(true);
    expect(
      shouldBootstrapDefaultContent({
        restoredFromSnapshot: false,
        hasRemoteUpdates: false,
        peerCount: 0,
        isEmpty: false,
      }),
    ).toBe(false);
  });

  it("REG-TABLE-003: should bootstrap only when all guard conditions are satisfied", () => {
    expect(
      shouldBootstrapDefaultContent({
        restoredFromSnapshot: false,
        hasRemoteUpdates: false,
        peerCount: 0,
        isEmpty: true,
      }),
    ).toBe(true);

    expect(
      shouldBootstrapDefaultContent({
        restoredFromSnapshot: true,
        hasRemoteUpdates: false,
        peerCount: 0,
        isEmpty: true,
      }),
    ).toBe(false);
  });
});
