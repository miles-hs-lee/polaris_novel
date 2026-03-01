import { describe, expect, it, vi } from "vitest";
import Page from "./page";

vi.mock("@/components/tailwind/advanced-editor", () => ({
  default: ({ docId }: { docId: string }) => <div data-doc-id={docId} data-testid="advanced-editor" />,
}));

describe("page docId normalization", () => {
  const getDocIdFromElement = (element: ReturnType<typeof Page>) => {
    const editorElement = element.props.children;
    return editorElement.props.docId as string;
  };

  it("uses local-default when doc query is missing", () => {
    const element = Page({});
    expect(getDocIdFromElement(element)).toBe("local-default");
  });

  it("uses first query value when doc is array", () => {
    const element = Page({ searchParams: { doc: ["alpha", "beta"] } });
    expect(getDocIdFromElement(element)).toBe("alpha");
  });

  it("trims doc query text", () => {
    const element = Page({ searchParams: { doc: "  alpha-doc  " } });
    expect(getDocIdFromElement(element)).toBe("alpha-doc");
  });

  it("falls back when doc query is blank", () => {
    const element = Page({ searchParams: { doc: "   " } });
    expect(getDocIdFromElement(element)).toBe("local-default");
  });
});
