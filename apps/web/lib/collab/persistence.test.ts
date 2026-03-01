import * as Y from "yjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { persistDocSnapshot, restoreDocSnapshot } from "./persistence";

const getSnapshotKey = (docId: string) => `novel-collab:snapshot:${docId}`;

describe("collab snapshot persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and restores a Yjs document snapshot", () => {
    const docId = "persist-doc";
    const sourceDoc = new Y.Doc();

    sourceDoc.getText("content").insert(0, "hello");
    persistDocSnapshot(docId, sourceDoc);

    const restoredDoc = new Y.Doc();
    const restored = restoreDocSnapshot(docId, restoredDoc);

    expect(restored).toBe(true);
    expect(restoredDoc.getText("content").toString()).toBe("hello");
  });

  it("returns false when no snapshot exists", () => {
    const restoredDoc = new Y.Doc();

    expect(restoreDocSnapshot("missing-doc", restoredDoc)).toBe(false);
  });

  it("removes malformed snapshot and returns false", () => {
    const docId = "broken-doc";
    localStorage.setItem(getSnapshotKey(docId), "not-a-valid-snapshot");

    const restoredDoc = new Y.Doc();
    const restored = restoreDocSnapshot(docId, restoredDoc);

    expect(restored).toBe(false);
    expect(localStorage.getItem(getSnapshotKey(docId))).toBeNull();
  });

  it("swallows localStorage write failures", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    const doc = new Y.Doc();
    doc.getText("content").insert(0, "value");

    expect(() => persistDocSnapshot("quota-doc", doc)).not.toThrow();
    setItemSpy.mockRestore();
  });

  it("returns false when localStorage read throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const restoredDoc = new Y.Doc();
    expect(restoreDocSnapshot("blocked-doc", restoredDoc)).toBe(false);
    getItemSpy.mockRestore();
  });
});

