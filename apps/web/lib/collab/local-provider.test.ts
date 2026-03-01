import * as Y from "yjs";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LocalBroadcastProvider } from "./local-provider";

const SNAPSHOT_KEY_PREFIX = "novel-collab:snapshot:";

class MockBroadcastChannel {
  public static channels = new Map<string, Set<MockBroadcastChannel>>();
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public readonly name: string;
  private closed = false;

  constructor(name: string) {
    this.name = name;
    const peers = MockBroadcastChannel.channels.get(name) ?? new Set<MockBroadcastChannel>();
    peers.add(this);
    MockBroadcastChannel.channels.set(name, peers);
  }

  postMessage(message: unknown) {
    const peers = MockBroadcastChannel.channels.get(this.name);
    if (!peers) return;

    for (const peer of peers) {
      if (peer === this || peer.closed) continue;
      peer.onmessage?.({ data: message } as MessageEvent);
    }
  }

  close() {
    this.closed = true;
    const peers = MockBroadcastChannel.channels.get(this.name);
    if (!peers) return;
    peers.delete(this);
    if (peers.size === 0) {
      MockBroadcastChannel.channels.delete(this.name);
    }
  }

  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

describe("LocalBroadcastProvider", () => {
  beforeAll(() => {
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel as unknown as typeof BroadcastChannel);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    MockBroadcastChannel.reset();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("marks synced through fallback timer when no snapshot exists", () => {
    vi.useFakeTimers();

    const doc = new Y.Doc();
    const provider = new LocalBroadcastProvider({ doc, docId: "fallback-doc" });
    const syncedSpy = vi.fn();
    provider.on("synced", syncedSpy);

    vi.advanceTimersByTime(349);
    expect(syncedSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(syncedSpy).toHaveBeenCalledTimes(1);

    provider.destroy();
  });

  it("propagates remote updates over broadcast channel", async () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const providerA = new LocalBroadcastProvider({ doc: docA, docId: "shared-doc" });
    const providerB = new LocalBroadcastProvider({ doc: docB, docId: "shared-doc" });

    docA.getText("content").insert(0, "hello");
    await Promise.resolve();

    expect(docB.getText("content").toString()).toBe("hello");
    expect(providerB.hasRemoteUpdates()).toBe(true);

    providerA.destroy();
    providerB.destroy();
  });

  it("stores snapshot after debounce and restores it on next provider", () => {
    vi.useFakeTimers();
    const docId = "snapshot-doc";

    const sourceDoc = new Y.Doc();
    const sourceProvider = new LocalBroadcastProvider({ doc: sourceDoc, docId });
    sourceDoc.getText("content").insert(0, "snapshot-value");

    vi.advanceTimersByTime(500);
    expect(localStorage.getItem(`${SNAPSHOT_KEY_PREFIX}${docId}`)).toBeTruthy();
    sourceProvider.destroy();

    const restoredDoc = new Y.Doc();
    const restoredProvider = new LocalBroadcastProvider({ doc: restoredDoc, docId });

    expect(restoredProvider.restoredFromSnapshot).toBe(true);
    expect(restoredDoc.getText("content").toString()).toBe("snapshot-value");

    restoredProvider.destroy();
  });

  it("emits disconnected status when destroyed", () => {
    const doc = new Y.Doc();
    const provider = new LocalBroadcastProvider({ doc, docId: "destroy-doc" });
    const statusSpy = vi.fn();
    provider.on("status", statusSpy);

    provider.destroy();

    expect(statusSpy).toHaveBeenCalledWith({ status: "disconnected" });
    expect(() => provider.destroy()).not.toThrow();
  });

  it("counts remote peers from awareness state", async () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const providerA = new LocalBroadcastProvider({ doc: docA, docId: "awareness-doc" });
    const providerB = new LocalBroadcastProvider({ doc: docB, docId: "awareness-doc" });

    expect(providerA.getPeerCount()).toBe(0);

    providerB.awareness.setLocalStateField("user", { name: "Guest-B" });
    await Promise.resolve();

    expect(providerA.getPeerCount()).toBe(1);

    providerA.destroy();
    providerB.destroy();
  });
});

