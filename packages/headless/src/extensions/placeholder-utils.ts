import type { Editor } from "@tiptap/core";

type PlaceholderNode = {
  attrs: Record<string, unknown>;
  type: {
    name: string;
  };
};

export const resolvePlaceholderText = ({
  editor,
  node,
  pos,
}: {
  editor: Editor;
  node: PlaceholderNode;
  pos: number;
}) => {
  if (node.type.name === "heading") {
    const level = node.attrs.level;
    return `Heading ${typeof level === "number" ? level : ""}`.trimEnd();
  }

  if (node.type.name !== "paragraph") {
    return "";
  }

  const $pos = editor.state.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const nodeName = $pos.node(depth).type.name;
    if (nodeName === "tableCell" || nodeName === "tableHeader") {
      return "";
    }
  }

  return "Press '/' for commands";
};
