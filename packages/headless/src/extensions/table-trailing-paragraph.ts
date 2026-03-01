import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode, NodeType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const endsWithTable = (doc: ProseMirrorNode) => {
  return doc.lastChild?.type.name === "table";
};

const createTrailingParagraph = (paragraphType: NodeType) => {
  return paragraphType.create();
};

export const TableTrailingParagraph = Extension.create({
  name: "tableTrailingParagraph",

  onCreate() {
    if (!this.editor.isEditable) {
      return;
    }

    const paragraphType = this.editor.schema.nodes.paragraph;
    if (!paragraphType || !endsWithTable(this.editor.state.doc)) {
      return;
    }

    const tr = this.editor.state.tr.insert(this.editor.state.doc.content.size, createTrailingParagraph(paragraphType));
    this.editor.view.dispatch(tr);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("tableTrailingParagraph"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!this.editor.isEditable) {
            return null;
          }

          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          const paragraphType = newState.schema.nodes.paragraph;
          if (!paragraphType || !endsWithTable(newState.doc)) {
            return null;
          }

          return newState.tr.insert(newState.doc.content.size, createTrailingParagraph(paragraphType));
        },
      }),
    ];
  },
});
