import type { Editor } from "@tiptap/core";

type PlaceholderNode = {
  attrs: Record<string, any>;
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
    return `Heading ${node.attrs.level}`;
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

