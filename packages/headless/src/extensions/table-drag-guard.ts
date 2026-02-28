import { Extension } from "@tiptap/core";
import { type Slice } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, type Selection } from "@tiptap/pm/state";
import { type EditorView } from "@tiptap/pm/view";

type DraggingState = {
  move: boolean;
  slice: Slice;
};

const getTablePos = (selection: Selection, view: EditorView) => {
  if (selection instanceof NodeSelection && selection.node.type.name === "table") {
    return selection.from;
  }

  const $from = view.state.doc.resolve(selection.from);
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "table") {
      return $from.before(depth);
    }
  }

  return null;
};

export const TableDragGuard = Extension.create({
  name: "tableDragGuard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("tableDragGuard"),
        view: (view) => {
          const onDragStart = (event: Event) => {
            const dragEvent = event as DragEvent;
            const target = dragEvent.target;

            if (!(target instanceof HTMLElement) || !target.classList.contains("drag-handle")) {
              return;
            }

            const tablePos = getTablePos(view.state.selection, view);
            if (tablePos == null) {
              return;
            }

            const selection = NodeSelection.create(view.state.doc, tablePos);
            view.dispatch(view.state.tr.setSelection(selection));

            const slice = view.state.selection.content();
            if (dragEvent.dataTransfer) {
              const dragImage = view.nodeDOM(tablePos);
              if (dragImage instanceof HTMLElement) {
                dragEvent.dataTransfer.setDragImage(dragImage, 0, 0);
              }
            }

            (view as EditorView & { dragging?: DraggingState }).dragging = {
              slice,
              move: !!dragEvent.ctrlKey,
            };
          };

          const container = view.dom.parentElement;
          if (!container) {
            return {
              destroy() {},
            };
          }

          container.addEventListener("dragstart", onDragStart);

          return {
            destroy() {
              container.removeEventListener("dragstart", onDragStart);
            },
          };
        },
      }),
    ];
  },
});
