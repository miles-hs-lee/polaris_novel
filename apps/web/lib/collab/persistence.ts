import * as Y from "yjs";

const SNAPSHOT_KEY_PREFIX = "novel-collab:snapshot:";

const getSnapshotKey = (docId: string) => `${SNAPSHOT_KEY_PREFIX}${docId}`;

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
};

const fromBase64 = (encoded: string) => {
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

export const restoreDocSnapshot = (docId: string, doc: Y.Doc) => {
  if (typeof window === "undefined") return false;

  const snapshot = window.localStorage.getItem(getSnapshotKey(docId));
  if (!snapshot) return false;

  try {
    Y.applyUpdate(doc, fromBase64(snapshot), "local-snapshot");
    return true;
  } catch {
    window.localStorage.removeItem(getSnapshotKey(docId));
    return false;
  }
};

export const persistDocSnapshot = (docId: string, doc: Y.Doc) => {
  if (typeof window === "undefined") return;

  try {
    const update = Y.encodeStateAsUpdate(doc);
    window.localStorage.setItem(getSnapshotKey(docId), toBase64(update));
  } catch {
    // Ignore localStorage quota or serialization failures.
  }
};
