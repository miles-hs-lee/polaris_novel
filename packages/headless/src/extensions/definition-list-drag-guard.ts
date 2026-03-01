import { Extension } from "@tiptap/core";
import type { Slice } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, type Selection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const TERM_LIKE_NODE_TYPES = new Set(["definitionTerm", "definitionDescription"]);

const getDefinitionListPos = (selection: Selection, view: EditorView) => {
  if (!(selection instanceof NodeSelection)) {
    return null;
  }

  if (!TERM_LIKE_NODE_TYPES.has(selection.node.type.name)) {
    return null;
  }

  const $from = view.state.doc.resolve(selection.from);
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "definitionList") {
      return $from.before(depth);
    }
  }

  return null;
};

type DraggingState = {
  move: boolean;
  slice: Slice;
};

export const DefinitionListDragGuard = Extension.create({
  name: "definitionListDragGuard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("definitionListDragGuard"),
        view: (view) => {
          const onDragStart = (event: Event) => {
            const dragEvent = event as DragEvent;
            const target = dragEvent.target;

            if (!(target instanceof HTMLElement) || !target.classList.contains("drag-handle")) {
              return;
            }

            const definitionListPos = getDefinitionListPos(view.state.selection, view);
            if (definitionListPos == null) {
              return;
            }

            const selection = NodeSelection.create(view.state.doc, definitionListPos);
            view.dispatch(view.state.tr.setSelection(selection));

            const slice = view.state.selection.content();
            if (dragEvent.dataTransfer) {
              const dragImage = view.nodeDOM(definitionListPos);
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
