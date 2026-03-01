export type JsonNode = {
  type?: string;
  text?: string;
  content?: JsonNode[];
};

const EMPTY_SCAFFOLD_TYPES = new Set(["doc", "paragraph", "text", "hardBreak"]);
const BOOTSTRAP_BASE_DELAY_MS = 500;
const BOOTSTRAP_STAGGER_WINDOW_MS = 1800;

export const hasMeaningfulContent = (node: JsonNode): boolean => {
  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true;
  }

  if (node.type && !EMPTY_SCAFFOLD_TYPES.has(node.type)) {
    return true;
  }

  if (!node.content || node.content.length === 0) {
    return false;
  }

  return node.content.some((child) => hasMeaningfulContent(child));
};

export const isEditorDocumentEmpty = (editor: { getJSON: () => JsonNode }) => {
  const doc = editor.getJSON();
  return !hasMeaningfulContent({
    type: "doc",
    content: Array.isArray(doc.content) ? doc.content : [],
  });
};

export const getBootstrapDelayMs = (clientId: number) => {
  return BOOTSTRAP_BASE_DELAY_MS + (Math.abs(clientId) % BOOTSTRAP_STAGGER_WINDOW_MS);
};

export const isBootstrapOwner = ({
  awarenessClientIds,
  selfClientId,
}: {
  awarenessClientIds: Iterable<number>;
  selfClientId: number;
}) => {
  let ownerId = selfClientId;

  for (const clientId of awarenessClientIds) {
    ownerId = Math.min(ownerId, clientId);
  }

  return ownerId === selfClientId;
};

export const shouldBootstrapDefaultContent = ({
  restoredFromSnapshot,
  hasRemoteUpdates,
  peerCount,
  isBootstrapOwner: bootstrapOwner = false,
  isEmpty,
}: {
  restoredFromSnapshot: boolean;
  hasRemoteUpdates: boolean;
  peerCount: number;
  isBootstrapOwner?: boolean;
  isEmpty: boolean;
}) => {
  return !restoredFromSnapshot && !hasRemoteUpdates && (peerCount === 0 || bootstrapOwner) && isEmpty;
};
