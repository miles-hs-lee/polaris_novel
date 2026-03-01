import { getHTMLFromFragment, mergeAttributes, Node } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

export interface DefinitionListOptions {
  HTMLAttributes: Record<string, string>;
}

export interface DefinitionTermOptions {
  HTMLAttributes: Record<string, string>;
}

export interface DefinitionDescriptionOptions {
  HTMLAttributes: Record<string, string>;
}

export interface SetDefinitionListOptions {
  term?: string;
  description?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    definitionList: {
      /**
       * Insert a definition list.
       */
      setDefinitionList: (options?: SetDefinitionListOptions) => ReturnType;
    };
  }
}

type DefinitionGroup = {
  terms: string[];
  descriptions: string[][];
};

const serializeHtmlBlock = (node: ProseMirrorNode) => {
  const html = getHTMLFromFragment(Fragment.from(node), node.type.schema);
  return `\n${html}\n`;
};

const serializeFragmentToMarkdown = (editor: { storage: Record<string, any> }, fragment: Fragment) => {
  const markdownStorage = editor.storage["markdown"] as
    | {
        serializer?: {
          serialize: (content: Fragment) => string;
        };
      }
    | undefined;
  return markdownStorage?.serializer?.serialize(fragment).trimEnd() ?? "";
};

const isMarkdownSerializable = (node: ProseMirrorNode) => {
  const children: ProseMirrorNode[] = [];
  node.forEach((child) => {
    children.push(child);
  });

  if (children.length < 2) {
    return false;
  }

  let index = 0;
  while (index < children.length) {
    let termCount = 0;
    while (index < children.length && children[index]?.type.name === "definitionTerm") {
      termCount += 1;
      index += 1;
    }
    if (termCount === 0) {
      return false;
    }

    let descriptionCount = 0;
    while (index < children.length && children[index]?.type.name === "definitionDescription") {
      const descriptionNode = children[index];
      if (!descriptionNode) {
        return false;
      }
      descriptionCount += 1;
      index += 1;
    }
  }

  return true;
};

const parseDefinitionParagraph = (text: string): DefinitionGroup | null => {
  const normalizedText = text.replace(/\r\n/g, "\n");
  if (!normalizedText.includes("\n")) {
    return null;
  }

  const lines = normalizedText.split("\n");
  const terms: string[] = [];

  const descriptions: string[][] = [];
  let currentDescription: string[] | null = null;
  let seenDefinition = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, " ");
    const marker = line.match(/^\s*:\s?(.*)$/);

    if (marker) {
      seenDefinition = true;
      if (currentDescription) {
        descriptions.push(currentDescription);
      }
      currentDescription = [marker[1] ?? ""];
      continue;
    }

    if (!seenDefinition) {
      const term = line.trim();
      if (!term) {
        if (terms.length === 0) {
          continue;
        }
        return null;
      }
      terms.push(term);
      continue;
    }

    if (!currentDescription) {
      if (line.trim() === "") {
        continue;
      }
      return null;
    }

    if (line.trim() === "") {
      currentDescription.push("");
      continue;
    }

    // markdown-it strips continuation indentation, so we keep the line as continuation text.
    currentDescription.push(line.replace(/^\s+/, ""));
  }

  if (currentDescription) {
    descriptions.push(currentDescription);
  }

  if (terms.length === 0 || descriptions.length === 0) {
    return null;
  }

  return {
    terms,
    descriptions,
  };
};

const appendDescription = (documentRef: Document, dl: HTMLDListElement, lines: string[]) => {
  const dd = documentRef.createElement("dd");
  dd.setAttribute("data-type", "definitionDescription");

  const paragraphs: string[][] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = [];
      }
      continue;
    }
    currentParagraph.push(line);
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  if (paragraphs.length === 0) {
    const paragraph = documentRef.createElement("p");
    paragraph.textContent = "";
    dd.appendChild(paragraph);
  } else {
    for (const paragraphLines of paragraphs) {
      const paragraph = documentRef.createElement("p");
      paragraph.textContent = paragraphLines.join("\n");
      dd.appendChild(paragraph);
    }
  }

  dl.appendChild(dd);
};

const createDefinitionListElement = (documentRef: Document, groups: DefinitionGroup[]) => {
  const dl = documentRef.createElement("dl");
  dl.setAttribute("data-type", "definitionList");

  for (const group of groups) {
    for (const term of group.terms) {
      const dt = documentRef.createElement("dt");
      dt.setAttribute("data-type", "definitionTerm");
      dt.textContent = term;
      dl.appendChild(dt);
    }

    for (const descriptionLines of group.descriptions) {
      appendDescription(documentRef, dl, descriptionLines);
    }
  }

  return dl;
};

type GroupBoundary = {
  groupEndIndex: number;
  hasDescription: boolean;
};

const getGroupBoundary = (dlNode: ProseMirrorNode, termIndex: number): GroupBoundary => {
  let cursor = termIndex + 1;
  while (cursor < dlNode.childCount && dlNode.child(cursor)?.type.name === "definitionTerm") {
    cursor += 1;
  }

  const descriptionStart = cursor;
  while (cursor < dlNode.childCount && dlNode.child(cursor)?.type.name === "definitionDescription") {
    cursor += 1;
  }

  return {
    groupEndIndex: cursor,
    hasDescription: cursor > descriptionStart,
  };
};

const getChildStartPos = (parentPos: number, parentNode: ProseMirrorNode, childIndex: number) => {
  let offset = 0;
  for (let index = 0; index < childIndex; index += 1) {
    offset += parentNode.child(index)?.nodeSize ?? 0;
  }
  return parentPos + 1 + offset;
};

export const DefinitionList = Node.create<DefinitionListOptions>({
  name: "definitionList",
  group: "block",
  content: "(definitionTerm+ definitionDescription*)+",
  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "dl",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "dl",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDefinitionList:
        (options = {}) =>
        ({ commands }) => {
          const term = options.term?.trim() || "Term";
          const description = options.description?.trim() || "Definition";

          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "definitionTerm",
                content: [{ type: "text", text: term }],
              },
              {
                type: "definitionDescription",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: description }],
                  },
                ],
              },
            ],
          });
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(this: { editor: { storage: Record<string, any> } }, state: any, node: ProseMirrorNode) {
          if (!isMarkdownSerializable(node)) {
            state.write(serializeHtmlBlock(node));
            state.closeBlock(node);
            return;
          }

          const children: ProseMirrorNode[] = [];
          node.forEach((child) => {
            children.push(child);
          });

          const groups: Array<{ termNodes: ProseMirrorNode[]; descriptions: ProseMirrorNode[] }> = [];
          let index = 0;

          while (index < children.length) {
            const termNodes: ProseMirrorNode[] = [];
            while (index < children.length && children[index]?.type.name === "definitionTerm") {
              const termNode = children[index];
              if (!termNode) {
                break;
              }
              termNodes.push(termNode);
              index += 1;
            }

            if (termNodes.length === 0) {
              state.write(serializeHtmlBlock(node));
              state.closeBlock(node);
              return;
            }
            const descriptions: ProseMirrorNode[] = [];

            while (index < children.length && children[index]?.type.name === "definitionDescription") {
              const descriptionNode = children[index];
              if (!descriptionNode) {
                break;
              }
              descriptions.push(descriptionNode);
              index += 1;
            }

            if (descriptions.length === 0) {
              state.write(serializeHtmlBlock(node));
              state.closeBlock(node);
              return;
            }

            groups.push({
              termNodes,
              descriptions,
            });
          }

          groups.forEach((group, groupIndex) => {
            group.termNodes.forEach((termNode) => {
              const termMarkdown = serializeFragmentToMarkdown(this.editor, termNode.content)
                .replace(/\s*\n+\s*/g, " ")
                .trim();

              state.write(termMarkdown || "Term");
              state.ensureNewLine();
            });

            group.descriptions.forEach((descriptionNode) => {
              const descriptionMarkdown = serializeFragmentToMarkdown(this.editor, descriptionNode.content);
              if (!descriptionMarkdown) {
                state.write(":");
                state.ensureNewLine();
                return;
              }

              const descriptionLines = descriptionMarkdown.split("\n");
              const [firstLine = "", ...continuationLines] = descriptionLines;

              state.write(`: ${firstLine}`);
              state.ensureNewLine();

              continuationLines.forEach((line) => {
                state.write(`  ${line}`);
                state.ensureNewLine();
              });
            });

            if (group.descriptions.length === 0) {
              state.write(":");
              state.ensureNewLine();
            }

            if (groupIndex < groups.length - 1) {
              state.ensureNewLine();
            }
          });

          state.closeBlock(node);
        },
        parse: {
          updateDOM: (element: HTMLElement) => {
            let cursor = element.firstElementChild;

            while (cursor) {
              if (cursor.tagName !== "P") {
                cursor = cursor.nextElementSibling;
                continue;
              }

              const currentGroup = parseDefinitionParagraph(cursor.textContent ?? "");
              if (!currentGroup) {
                cursor = cursor.nextElementSibling;
                continue;
              }

              const groups: DefinitionGroup[] = [currentGroup];
              let next = cursor.nextElementSibling;

              while (next && next.tagName === "P") {
                const parsed = parseDefinitionParagraph(next.textContent ?? "");
                if (!parsed) {
                  break;
                }

                groups.push(parsed);
                const sibling = next.nextElementSibling;
                next.remove();
                next = sibling;
              }

              const replacement = createDefinitionListElement(element.ownerDocument, groups);
              cursor.replaceWith(replacement);
              cursor = next;
            }
          },
        },
      },
    };
  },
});

export const DefinitionTerm = Node.create<DefinitionTermOptions>({
  name: "definitionTerm",
  content: "inline*",
  defining: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "dt",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "dt",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state, view } = editor;
        const { selection, schema } = state;
        const { definitionList, definitionTerm, definitionDescription } = schema.nodes;

        if (!definitionList || !definitionTerm || !definitionDescription) {
          return false;
        }

        const $from = selection.$from;
        if ($from.parent.type !== definitionTerm) {
          return false;
        }

        const termDepth = $from.depth;
        let listDepth = -1;
        for (let depth = termDepth; depth > 0; depth -= 1) {
          if ($from.node(depth).type === definitionList) {
            listDepth = depth;
            break;
          }
        }

        if (listDepth < 0) {
          return false;
        }

        const listNode = $from.node(listDepth);
        const listPos = $from.before(listDepth);
        const termIndex = $from.index(listDepth);
        const currentTermPos = getChildStartPos(listPos, listNode, termIndex);
        const currentTermNode = listNode.child(termIndex);

        if (!currentTermNode) {
          return false;
        }

        const { groupEndIndex, hasDescription } = getGroupBoundary(listNode, termIndex);
        const transaction = state.tr;

        if (!hasDescription) {
          const descriptionNode = definitionDescription.createAndFill();
          if (!descriptionNode) {
            return false;
          }

          const insertPos = currentTermPos + currentTermNode.nodeSize;
          transaction.insert(insertPos, descriptionNode);
          transaction.setSelection(TextSelection.near(transaction.doc.resolve(insertPos + 1), 1));
          view.dispatch(transaction.scrollIntoView());
          return true;
        }

        const newTermNode = definitionTerm.create();
        const insertPos = getChildStartPos(listPos, listNode, groupEndIndex);
        transaction.insert(insertPos, newTermNode);
        transaction.setSelection(TextSelection.near(transaction.doc.resolve(insertPos + 1), 1));
        view.dispatch(transaction.scrollIntoView());
        return true;
      },
    };
  },
});

export const DefinitionDescription = Node.create<DefinitionDescriptionOptions>({
  name: "definitionDescription",
  content: "block+",
  defining: true,
  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "dd",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "dd",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },
});

export const __definitionListTestUtils = {
  parseDefinitionParagraph,
};
