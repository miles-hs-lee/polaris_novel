export type MathEditorLike = {
  isActive: (name: string) => boolean;
  chain: () => {
    focus: () => {
      setLatex: (attrs: { latex: string }) => { run: () => boolean };
      unsetLatex: () => { run: () => boolean };
    };
  };
  state: {
    selection: {
      from: number;
      to: number;
    };
    doc: {
      textBetween: (from: number, to: number) => string;
    };
  };
};

export const toggleMathSelection = (editor: MathEditorLike) => {
  if (editor.isActive("math")) {
    editor.chain().focus().unsetLatex().run();
    return true;
  }

  const { from, to } = editor.state.selection;
  const latex = editor.state.doc.textBetween(from, to);
  if (!latex) return false;

  editor.chain().focus().setLatex({ latex }).run();
  return true;
};
