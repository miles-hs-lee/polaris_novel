export type JsonNode = {
  type?: string;
  text?: string;
  content?: JsonNode[];
};

const EMPTY_SCAFFOLD_TYPES = new Set(["doc", "paragraph", "text", "hardBreak"]);

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

export const shouldBootstrapDefaultContent = ({
  restoredFromSnapshot,
  hasRemoteUpdates,
  peerCount,
  isEmpty,
}: {
  restoredFromSnapshot: boolean;
  hasRemoteUpdates: boolean;
  peerCount: number;
  isEmpty: boolean;
}) => {
  return !restoredFromSnapshot && !hasRemoteUpdates && peerCount === 0 && isEmpty;
};

