import { describe, expect, it, vi } from "vitest";
import Page from "./page";

vi.mock("@/components/tailwind/advanced-editor", () => ({
  default: ({ docId, mode }: { docId: string; mode: string }) => (
    <div data-doc-id={docId} data-mode={mode} data-testid="advanced-editor" />
  ),
}));

describe("page docId normalization", () => {
  const getEditorProps = (element: Awaited<ReturnType<typeof Page>>) => {
    const editorElement = element.props.children;
    return {
      docId: editorElement.props.docId as string,
      mode: editorElement.props.mode as string,
    };
  };

  it("uses local-default when doc query is missing", async () => {
    const element = await Page({});
    expect(getEditorProps(element).docId).toBe("local-default");
  });

  it("uses first query value when doc is array", async () => {
    const element = await Page({ searchParams: Promise.resolve({ doc: ["alpha", "beta"] }) });
    expect(getEditorProps(element).docId).toBe("alpha");
  });

  it("trims doc query text", async () => {
    const element = await Page({ searchParams: Promise.resolve({ doc: "  alpha-doc  " }) });
    expect(getEditorProps(element).docId).toBe("alpha-doc");
  });

  it("falls back when doc query is blank", async () => {
    const element = await Page({ searchParams: Promise.resolve({ doc: "   " }) });
    expect(getEditorProps(element).docId).toBe("local-default");
  });

  it("uses liveblocks mode by default", async () => {
    const element = await Page({});
    expect(getEditorProps(element).mode).toBe("liveblocks");
  });

  it("supports explicit local mode", async () => {
    const element = await Page({ searchParams: Promise.resolve({ mode: "local" }) });
    expect(getEditorProps(element).mode).toBe("local");
  });
});
