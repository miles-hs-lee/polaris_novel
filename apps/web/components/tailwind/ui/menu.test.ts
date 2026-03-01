import { describe, expect, it, vi } from "vitest";
import { defaultEditorContent } from "@/lib/content";
import * as MenuActions from "@/lib/editor/menu-actions";

const createEditorMock = () => ({
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  storage: {
    markdown: {
      getMarkdown: vi.fn(() => "# hello"),
    },
  },
  getJSON: vi.fn(() => ({
    type: "doc",
    content: [{ type: "paragraph" }],
  })),
});

describe("menu helpers", () => {
  it("builds dated export filenames", () => {
    const filename = MenuActions.buildFilename("md");
    expect(filename).toMatch(/^novel-\d{8}\.md$/);
  });

  it("creates empty editor document", () => {
    const editor = createEditorMock();

    MenuActions.createNewDocument(editor as any);

    expect(editor.commands.setContent).toHaveBeenCalledWith(MenuActions.emptyEditorContent, true);
    expect(editor.commands.focus).toHaveBeenCalledWith("start");
  });

  it("loads feature document content", () => {
    const editor = createEditorMock();

    MenuActions.loadFeatureDocument(editor as any);

    expect(editor.commands.setContent).toHaveBeenCalledWith(defaultEditorContent, true);
    expect(editor.commands.focus).toHaveBeenCalledWith("start");
  });

  it("exports markdown through download helper", () => {
    const editor = createEditorMock();
    const download = vi.fn();

    MenuActions.exportMarkdownDocument(editor as any, download);

    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0]?.[0]).toMatch(/^novel-\d{8}\.md$/);
    expect(download.mock.calls[0]?.[1]).toBe("# hello");
    expect(download.mock.calls[0]?.[2]).toBe("text/markdown;charset=utf-8");
  });

  it("exports JSON through download helper", () => {
    const editor = createEditorMock();
    const download = vi.fn();

    MenuActions.exportJsonDocument(editor as any, download);

    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0]?.[0]).toMatch(/^novel-\d{8}\.json$/);
    expect(download.mock.calls[0]?.[1]).toContain("\"type\": \"doc\"");
    expect(download.mock.calls[0]?.[2]).toBe("application/json;charset=utf-8");
  });

  it("normalizes selected theme name to lowercase", () => {
    const setTheme = vi.fn();

    MenuActions.applyAppearanceTheme(setTheme, "Dark");

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
