import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import * as Y from "yjs";
import { persistDocSnapshot, restoreDocSnapshot } from "./persistence";

type CollabStatus = "connected" | "disconnected";

type SyncRequestMessage = {
  sender: string;
  stateVector: number[];
  type: "sync-request";
};

type SyncResponseMessage = {
  sender: string;
  target: string;
  type: "sync-response";
  update: number[];
};

type DocUpdateMessage = {
  sender: string;
  type: "doc-update";
  update: number[];
};

type AwarenessUpdateMessage = {
  sender: string;
  type: "awareness-update";
  update: number[];
};

type LocalBroadcastMessage = SyncRequestMessage | SyncResponseMessage | DocUpdateMessage | AwarenessUpdateMessage;
type ProviderListener = (...args: unknown[]) => void;

const SNAPSHOT_DEBOUNCE_MS = 500;
const SYNC_FALLBACK_MS = 350;

const toNumberArray = (bytes: Uint8Array) => Array.from(bytes);
const toUint8Array = (values: number[]) => Uint8Array.from(values);

const createClientId = () => {
  if (typeof window !== "undefined" && "crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export class LocalBroadcastProvider {
  public readonly awareness: Awareness;
  public readonly restoredFromSnapshot: boolean;

  private readonly channel: BroadcastChannel;
  private readonly clientId: string;
  private readonly doc: Y.Doc;
  private readonly docId: string;
  private destroyed = false;
  private hasSynced = false;
  private hasRemoteDocumentUpdate = false;
  private listeners = new Map<string, Set<ProviderListener>>();
  private saveTimer: number | null = null;
  private syncFallbackTimer: number | null = null;

  constructor({ doc, docId }: { doc: Y.Doc; docId: string }) {
    this.doc = doc;
    this.docId = docId;
    this.clientId = createClientId();
    this.awareness = new Awareness(this.doc);
    this.channel = new BroadcastChannel(`novel-collab:${docId}`);
    this.restoredFromSnapshot = restoreDocSnapshot(docId, doc);

    this.channel.onmessage = this.handleMessage;
    this.doc.on("update", this.handleDocUpdate);
    this.awareness.on("update", this.handleAwarenessUpdate);
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    this.emit("status", { status: "connected" as CollabStatus });
    this.requestSync();

    if (this.restoredFromSnapshot) {
      this.markSynced();
    } else {
      this.syncFallbackTimer = window.setTimeout(() => this.markSynced(), SYNC_FALLBACK_MS);
    }
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.syncFallbackTimer) {
      window.clearTimeout(this.syncFallbackTimer);
      this.syncFallbackTimer = null;
    }

    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      persistDocSnapshot(this.docId, this.doc);
    }

    this.awareness.setLocalState(null);
    removeAwarenessStates(this.awareness, [this.doc.clientID], this);

    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("update", this.handleAwarenessUpdate);
    this.channel.close();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);

    this.emit("status", { status: "disconnected" as CollabStatus });
    this.listeners.clear();
  }

  public on(event: string, callback: ProviderListener) {
    const callbacks = this.listeners.get(event) ?? new Set();
    callbacks.add(callback);
    this.listeners.set(event, callbacks);
  }

  public off(event: string, callback: ProviderListener) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) this.listeners.delete(event);
  }

  public hasRemoteUpdates() {
    return this.hasRemoteDocumentUpdate;
  }

  public getPeerCount() {
    let peers = 0;

    for (const clientId of this.awareness.getStates().keys()) {
      if (clientId !== this.doc.clientID) {
        peers += 1;
      }
    }

    return peers;
  }

  private emit(event: string, ...args: unknown[]) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    for (const callback of callbacks) {
      callback(...args);
    }
  }

  private markSynced() {
    if (this.hasSynced) return;
    this.hasSynced = true;
    this.emit("synced", true);
  }

  private requestSync() {
    const stateVector = Y.encodeStateVector(this.doc);

    this.broadcast({
      sender: this.clientId,
      stateVector: toNumberArray(stateVector),
      type: "sync-request",
    });
  }

  private scheduleSnapshotWrite() {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
    }

    this.saveTimer = window.setTimeout(() => {
      persistDocSnapshot(this.docId, this.doc);
      this.saveTimer = null;
    }, SNAPSHOT_DEBOUNCE_MS);
  }

  private broadcast(message: LocalBroadcastMessage) {
    if (this.destroyed) return;
    this.channel.postMessage(message);
  }

  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    this.scheduleSnapshotWrite();

    if (origin === this) return;

    this.broadcast({
      sender: this.clientId,
      type: "doc-update",
      update: toNumberArray(update),
    });
  };

  private handleAwarenessUpdate = ({
    added,
    removed,
    updated,
  }: {
    added: number[];
    removed: number[];
    updated: number[];
  }, origin: unknown) => {
    if (origin === this) return;

    const changedClients = [...added, ...updated, ...removed];
    if (changedClients.length === 0) return;

    const update = encodeAwarenessUpdate(this.awareness, changedClients);
    this.broadcast({
      sender: this.clientId,
      type: "awareness-update",
      update: toNumberArray(update),
    });
  };

  private handleMessage = (event: MessageEvent<LocalBroadcastMessage>) => {
    const message = event.data;

    if (!message || message.sender === this.clientId) return;

    switch (message.type) {
      case "sync-request": {
        const stateVector = toUint8Array(message.stateVector);
        const diff = Y.encodeStateAsUpdate(this.doc, stateVector);

        this.broadcast({
          sender: this.clientId,
          target: message.sender,
          type: "sync-response",
          update: toNumberArray(diff),
        });
        return;
      }

      case "sync-response": {
        if (message.target !== this.clientId) return;

        const update = toUint8Array(message.update);
        if (update.byteLength > 0) {
          this.hasRemoteDocumentUpdate = true;
          Y.applyUpdate(this.doc, update, this);
        }
        this.markSynced();
        return;
      }

      case "doc-update": {
        const update = toUint8Array(message.update);
        this.hasRemoteDocumentUpdate = true;
        Y.applyUpdate(this.doc, update, this);
        this.markSynced();
        return;
      }

      case "awareness-update": {
        const awarenessUpdate = toUint8Array(message.update);
        applyAwarenessUpdate(this.awareness, awarenessUpdate, this);
      }
    }
  };

  private handleBeforeUnload = () => {
    this.awareness.setLocalState(null);
  };
}
