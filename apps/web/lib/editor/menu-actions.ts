import { defaultEditorContent } from "@/lib/content";

export const buildFilename = (ext: "json" | "md") => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `novel-${yyyy}${mm}${dd}.${ext}`;
};

export const downloadText = (filename: string, content: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const emptyEditorContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type MenuEditorLike = {
  commands: {
    setContent: (content: unknown, emitUpdate: boolean) => unknown;
    focus: (position?: unknown, options?: unknown) => unknown;
  };
  storage: Record<string, unknown>;
  getJSON: () => unknown;
};

export const createNewDocument = (editor: MenuEditorLike) => {
  editor.commands.setContent(emptyEditorContent, true);
  editor.commands.focus("start");
};

export const loadFeatureDocument = (editor: MenuEditorLike) => {
  editor.commands.setContent(defaultEditorContent, true);
  editor.commands.focus("start");
};

export const exportMarkdownDocument = (editor: MenuEditorLike, download = downloadText) => {
  const markdown = (editor.storage.markdown as { getMarkdown?: () => string } | undefined)?.getMarkdown?.() ?? "";
  download(buildFilename("md"), markdown, "text/markdown;charset=utf-8");
};

export const exportJsonDocument = (editor: MenuEditorLike, download = downloadText) => {
  const json = editor.getJSON();
  download(buildFilename("json"), JSON.stringify(json, null, 2), "application/json;charset=utf-8");
};

export const applyAppearanceTheme = (setTheme: (theme: string) => void, theme: string) => {
  setTheme(theme.toLowerCase());
};
