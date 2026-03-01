import * as Y from "yjs";
import { describe, expect, it, vi } from "vitest";
import { shouldBootstrapDefaultContent } from "@/lib/editor/bootstrap-guards";
import { restoreDocSnapshot } from "@/lib/collab/persistence";

describe("REG-COLLAB regression pack", () => {
  it("REG-COLLAB-001: restore should fail safely when storage access throws (private mode)", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("private-mode");
    });

    const restored = restoreDocSnapshot("private-doc", new Y.Doc());
    expect(restored).toBe(false);

    getItemSpy.mockRestore();
  });

  it("REG-COLLAB-002: restored snapshot must prevent default bootstrap", () => {
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
