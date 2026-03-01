import type { Doc as YDoc } from "yjs";

export type CollabStatus = "connected" | "disconnected";

export type CollabMode = "liveblocks" | "local";

export type CollabProviderListener = (...args: unknown[]) => void;

export type CollabAwareness = {
  getStates: () => Map<number, unknown>;
  setLocalState: (state: unknown) => void;
};

export type CollabProvider = {
  awareness: CollabAwareness;
  restoredFromSnapshot: boolean;
  destroy: () => void;
  getPeerCount: () => number;
  hasRemoteUpdates: () => boolean;
  isSynced: () => boolean;
  off: (event: string, callback: CollabProviderListener) => void;
  on: (event: string, callback: CollabProviderListener) => void;
};

export type CollabSession = {
  doc: YDoc;
  mode: CollabMode;
  provider: CollabProvider;
};
