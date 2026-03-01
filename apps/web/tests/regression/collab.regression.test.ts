import * as Y from "yjs";
import { describe, expect, it, vi } from "vitest";
import { getBootstrapDelayMs, isBootstrapOwner, shouldBootstrapDefaultContent } from "@/lib/editor/bootstrap-guards";
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

  it("REG-COLLAB-003: only bootstrap owner may initialize when peers exist", () => {
    expect(
      shouldBootstrapDefaultContent({
        restoredFromSnapshot: false,
        hasRemoteUpdates: false,
        peerCount: 1,
        isBootstrapOwner: false,
        isEmpty: true,
      }),
    ).toBe(false);

    expect(
      shouldBootstrapDefaultContent({
        restoredFromSnapshot: false,
        hasRemoteUpdates: false,
        peerCount: 1,
        isBootstrapOwner: true,
        isEmpty: true,
      }),
    ).toBe(true);
  });

  it("REG-COLLAB-004: bootstrap owner election is deterministic and delay is staggered", () => {
    expect(
      isBootstrapOwner({
        selfClientId: 2,
        awarenessClientIds: [5, 2, 9],
      }),
    ).toBe(true);

    expect(
      isBootstrapOwner({
        selfClientId: 7,
        awarenessClientIds: [3, 7, 11],
      }),
    ).toBe(false);

    const delayA = getBootstrapDelayMs(101);
    const delayB = getBootstrapDelayMs(202);
    expect(delayA).not.toBe(delayB);
    expect(delayA).toBeGreaterThanOrEqual(500);
    expect(delayB).toBeGreaterThanOrEqual(500);
  });
});
