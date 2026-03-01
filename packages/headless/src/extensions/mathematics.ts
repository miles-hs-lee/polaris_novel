import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import katex, { type KatexOptions } from "katex";

export interface MathematicsOptions {
  /**
   * By default LaTeX decorations can render when mathematical expressions are not inside a code block.
   * @param state - EditorState
   * @param pos - number
   * @returns boolean
   */
  shouldRender: (state: EditorState, pos: number) => boolean;

  /**
   * @see https://katex.org/docs/options.html
   */
  katexOptions?: KatexOptions;

  HTMLAttributes: Record<string, unknown>;
}

type MarkdownToken = {
  markup?: string;
  content?: string;
  attrSet: (name: string, value: string) => void;
  attrGet?: (name: string) => string | null;
};

type MarkdownInlineState = {
  pos: number;
  src: string;
  push: (type: string, tag: string, nesting: number) => MarkdownToken;
};

type MarkdownSerializerStateLike = {
  write: (value: string) => void;
};

type MarkdownItLike = {
  inline: {
    ruler: {
      after: (
        afterName: string,
        ruleName: string,
        tokenizer: (state: MarkdownInlineState, silent: boolean) => boolean,
      ) => void;
    };
  };
  renderer: {
    rules: Record<string, (tokens: MarkdownToken[], index: number) => string>;
  };
};

type MarkdownItWithMathInline = MarkdownItLike & {
  __novelMathInlineRuleInstalled?: boolean;
};

const MARKDOWN_INLINE_MATH_RULE = "novel_inline_math";

const isWhitespaceCharCode = (charCode: number) => {
  return charCode === 0x20 || charCode === 0x09 || charCode === 0x0a || charCode === 0x0d;
};

const isDigitCharCode = (charCode: number) => {
  return charCode >= 0x30 && charCode <= 0x39;
};

const isHTMLElement = (value: unknown): value is HTMLElement => {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
};

const isEscapedAt = (value: string, index: number) => {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && value[cursor] === "\\") {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
};

const hasUnescapedDollar = (value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "$" && !isEscapedAt(value, index)) {
      return true;
    }
  }

  return false;
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const escapeHtmlAttribute = (value: string) => {
  return escapeHtml(value).replace(/"/g, "&quot;");
};

const normalizeInlineLatexForExport = (value: string) => {
  const normalized = value.replace(/\r\n?/g, "\n").replace(/\n+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  let escaped = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (char === "$" && !isEscapedAt(normalized, index)) {
      escaped += "\\$";
      continue;
    }

    escaped += char;
  }

  return escaped;
};

const findInlineMathClosingDelimiter = (source: string, start: number) => {
  let cursor = start + 1;

  while (cursor < source.length) {
    cursor = source.indexOf("$", cursor);
    if (cursor < 0) {
      return -1;
    }

    if (isEscapedAt(source, cursor)) {
      cursor += 1;
      continue;
    }

    if (isWhitespaceCharCode(source.charCodeAt(cursor - 1))) {
      cursor += 1;
      continue;
    }

    const latex = source.slice(start + 1, cursor);
    if (!latex || hasUnescapedDollar(latex)) {
      cursor += 1;
      continue;
    }

    return cursor;
  }

  return -1;
};

const tokenizeInlineMath = (state: MarkdownInlineState, silent: boolean) => {
  const start = state.pos;
  const source: string = state.src;

  if (source.charCodeAt(start) !== 0x24) {
    return false;
  }

  if (source.charCodeAt(start + 1) === 0x24) {
    return false;
  }

  // Prevent matching on the second "$" inside a "$$...$$" sequence.
  if (start > 0 && source.charCodeAt(start - 1) === 0x24 && !isEscapedAt(source, start - 1)) {
    return false;
  }

  if (isEscapedAt(source, start)) {
    return false;
  }

  const nextCharCode = source.charCodeAt(start + 1);
  if (!nextCharCode || isWhitespaceCharCode(nextCharCode)) {
    return false;
  }

  // Avoid parsing common currency notations such as "$12".
  if (isDigitCharCode(nextCharCode)) {
    return false;
  }

  const end = findInlineMathClosingDelimiter(source, start);
  if (end < 0) {
    return false;
  }

  const latex = source.slice(start + 1, end);
  if (/^\d+(?:[.,]\d+)*$/.test(latex.trim())) {
    return false;
  }

  if (silent) {
    return true;
  }

  const token = state.push(MARKDOWN_INLINE_MATH_RULE, "span", 0);
  token.markup = "$";
  token.content = latex;
  token.attrSet("data-type", "math");
  token.attrSet("latex", latex);

  state.pos = end + 1;
  return true;
};

const renderInlineMathToken = (tokens: MarkdownToken[], index: number) => {
  const token = tokens[index];
  const latex = token?.attrGet?.("latex") ?? token?.content ?? "";
  const escapedText = escapeHtml(latex);
  const escapedAttr = escapeHtmlAttribute(latex);
  return `<span data-type="math" latex="${escapedAttr}">${escapedText}</span>`;
};

const setupInlineMathMarkdownRule = (markdownit: MarkdownItLike) => {
  const md = markdownit as MarkdownItWithMathInline;
  if (md.__novelMathInlineRuleInstalled) {
    return;
  }

  md.__novelMathInlineRuleInstalled = true;
  md.inline.ruler.after("backticks", MARKDOWN_INLINE_MATH_RULE, tokenizeInlineMath);
  md.renderer.rules[MARKDOWN_INLINE_MATH_RULE] = renderInlineMathToken;
};

const getMathLatexFromElement = (element: HTMLElement) => {
  return element.getAttribute("latex") ?? element.getAttribute("data-latex") ?? element.textContent ?? "";
};

const ensureMathLatexAttributes = (root: HTMLElement, nodeType = "math") => {
  root.querySelectorAll(`span[data-type="${nodeType}"]`).forEach((candidate) => {
    if (!isHTMLElement(candidate)) {
      return;
    }

    if (candidate.getAttribute("latex") !== null || candidate.getAttribute("data-latex") !== null) {
      return;
    }

    candidate.setAttribute("latex", candidate.textContent ?? "");
  });
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    LatexCommand: {

      /**
       * Set selection to a LaTex symbol
       */
      setLatex: ({ latex }: { latex: string }) => ReturnType;

      /**
       * Unset a LaTex symbol
       */
      unsetLatex: () => ReturnType;

    };
  }
}

/**
 * This extension adds support for mathematical symbols with LaTex expression.
 * 
 * NOTE: Don't forget to import `katex/dist/katex.min.css` CSS for KaTex styling.
 * 
 * @see https://katex.org/
 */
export const Mathematics = Node.create<MathematicsOptions>({
  name: "math",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  marks: "",

  addAttributes() {
    return {
      latex: "",
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerStateLike, node: ProseMirrorNode) => {
          const rawLatex = node.attrs.latex;
          if (typeof rawLatex !== "string") {
            return;
          }

          const latex = normalizeInlineLatexForExport(rawLatex);
          if (!latex) {
            return;
          }

          state.write(`$${latex}$`);
        },
        parse: {
          setup: (markdownit: MarkdownItLike) => {
            setupInlineMathMarkdownRule(markdownit);
          },
          updateDOM: (element: HTMLElement) => {
            ensureMathLatexAttributes(element, this.name);
          },
        },
      },
    };
  },

  addOptions() {
    return {
      shouldRender: (state, pos) => {
        const $pos = state.doc.resolve(pos);

        if (!$pos.parent.isTextblock) {
          return false;
        }
        
        return $pos.parent.type.name !== "codeBlock";
      },
      katexOptions: {
        throwOnError: false,
      },
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setLatex:
        ({ latex }) =>
        ({ chain, state }) => {
          if (!latex) {
            return false;
          }
          const { from, to, $anchor } = state.selection;

          if (!this.options.shouldRender(state, $anchor.pos)) {
            return false;
          }

          return chain()
            .insertContentAt(
              { from: from, to: to },
              {
                type: "math",
                attrs: {
                  latex: latex,
                },
              }
            )
            .setTextSelection({ from: from, to: from + 1 })
            .run();
        },
      unsetLatex:
        () =>
        ({ editor, state, chain }) => {
          const latex = editor.getAttributes(this.name).latex;
          if (typeof latex !== "string") {
            return false;
          }

          const { from, to } = state.selection;

          return chain()
            .command(({ tr }) => {
              tr.insertText(latex, from, to);
              return true;
            })
            .setTextSelection({
              from: from,
              to: from + latex.length,
            })
            .run();
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
        getAttrs: (node) => {
          if (!isHTMLElement(node)) {
            return false;
          }

          const latex = getMathLatexFromElement(node);
          return { latex };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex ?? "";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": this.name,
      }),
      latex,
    ];
  },

  renderText({ node }) {
    return node.attrs.latex ?? "";
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement("span");
      const latex: string = node.attrs.latex ?? "";

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        if (typeof value === "string") {
          dom.setAttribute(key, value);
          return;
        }

        if (value !== null && value !== undefined) {
          dom.setAttribute(key, String(value));
        }
      });

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (typeof value === "string") {
          dom.setAttribute(key, value);
          return;
        }

        if (value !== null && value !== undefined) {
          dom.setAttribute(key, String(value));
        }
      });

      dom.addEventListener("click", (_evt) => {
        if (editor.isEditable && typeof getPos === "function") {
          const pos = getPos();
          const nodeSize = node.nodeSize;
          editor.commands.setTextSelection({ from: pos, to: pos + nodeSize });
        }
      });

      dom.contentEditable = "false";

      dom.innerHTML = katex.renderToString(latex, this.options.katexOptions);

      return {
        dom: dom,
      };
    };
  },
});

export const __mathematicsTestUtils = {
  ensureMathLatexAttributes,
  findInlineMathClosingDelimiter,
  getMathLatexFromElement,
  hasUnescapedDollar,
  isDigitCharCode,
  isEscapedAt,
  isWhitespaceCharCode,
  normalizeInlineLatexForExport,
  renderInlineMathToken,
  setupInlineMathMarkdownRule,
  tokenizeInlineMath,
};
