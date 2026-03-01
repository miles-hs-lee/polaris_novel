import { createClient } from "@liveblocks/client";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import type { Room } from "@liveblocks/client";
import type { Doc as YDoc } from "yjs";
import type { CollabAwareness, CollabProvider, CollabProviderListener, CollabStatus } from "./types";

const LIVEBLOCKS_ROOM_PREFIX = "novel";

const getLiveblocksPublicKey = () => process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY?.trim();

let liveblocksClient: ReturnType<typeof createClient> | null = null;

const getLiveblocksClient = () => {
  const publicApiKey = getLiveblocksPublicKey();

  if (!publicApiKey) {
    throw new Error("Missing NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY");
  }

  if (!liveblocksClient) {
    liveblocksClient = createClient({
      publicApiKey,
    });
  }

  return liveblocksClient;
};

const mapRoomStatus = (status: string): CollabStatus => {
  return status === "disconnected" ? "disconnected" : "connected";
};

type LiveblocksObservable = {
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
};

export const isLiveblocksConfigured = () => Boolean(getLiveblocksPublicKey());

export const toLiveblocksRoomId = (docId: string) => `${LIVEBLOCKS_ROOM_PREFIX}:${docId}`;

export class LiveblocksCollabProvider implements CollabProvider {
  public readonly awareness: CollabAwareness;
  public readonly restoredFromSnapshot = false;

  private readonly doc: YDoc;
  private readonly listeners = new Map<string, Set<CollabProviderListener>>();
  private readonly room: Room;
  private readonly roomUnsubscribers: Array<() => void> = [];
  private readonly yProvider: LiveblocksObservable & {
    awareness: CollabAwareness;
    destroy: () => void;
    getStatus: () => string;
    getYDoc: () => YDoc;
  };
  private destroyed = false;
  private hasRemoteDocumentUpdate = false;
  private hasSynced = false;
  private leaveRoom: (() => void) | null = null;

  constructor({ docId }: { docId: string }) {
    const client = getLiveblocksClient();
    const { leave, room } = client.enterRoom(toLiveblocksRoomId(docId));
    const yProvider = getYjsProviderForRoom(room);

    this.leaveRoom = leave;
    this.room = room;
    this.yProvider = yProvider as unknown as LiveblocksCollabProvider["yProvider"];
    this.doc = yProvider.getYDoc();
    this.awareness = yProvider.awareness as CollabAwareness;

    this.roomUnsubscribers.push(this.room.events.status.subscribe(this.handleRoomStatus));
    this.doc.on("update", this.handleDocUpdate);
    this.yProvider.on("sync", this.handleProviderSync);
    this.yProvider.on("synced", this.handleProviderSync);

    this.emit("status", { status: mapRoomStatus(this.room.getStatus()) });

    if (this.yProvider.getStatus() === "synchronized") {
      this.markSynced();
    }
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.awareness.setLocalState(null);
    this.doc.off("update", this.handleDocUpdate);
    this.yProvider.off("sync", this.handleProviderSync);
    this.yProvider.off("synced", this.handleProviderSync);

    for (const unsubscribe of this.roomUnsubscribers) {
      unsubscribe();
    }
    this.roomUnsubscribers.length = 0;

    if (this.leaveRoom) {
      this.leaveRoom();
      this.leaveRoom = null;
    }

    this.emit("status", { status: "disconnected" as const });
    this.listeners.clear();
  }

  public getDoc() {
    return this.doc;
  }

  public hasRemoteUpdates() {
    return this.hasRemoteDocumentUpdate;
  }

  public isSynced() {
    return this.hasSynced;
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

  public on(event: string, callback: CollabProviderListener) {
    const callbacks = this.listeners.get(event) ?? new Set();
    callbacks.add(callback);
    this.listeners.set(event, callbacks);
  }

  public off(event: string, callback: CollabProviderListener) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) this.listeners.delete(event);
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

  private handleRoomStatus = (status: string) => {
    this.emit("status", { status: mapRoomStatus(status) });
  };

  private handleProviderSync = (...args: unknown[]) => {
    const status = this.yProvider.getStatus();
    const isSynced = typeof args[0] === "boolean" ? args[0] : status === "synchronized";

    if (isSynced) {
      this.markSynced();
    }
  };

  private handleDocUpdate = (_update: Uint8Array, origin: unknown) => {
    if (origin !== "backend") return;
    this.hasRemoteDocumentUpdate = true;
    this.markSynced();
  };
}
