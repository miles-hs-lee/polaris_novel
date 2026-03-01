import { describe, expect, it } from "vitest";
import { __definitionListTestUtils } from "./definition-list";

describe("definition list markdown paragraph parser", () => {
  it("parses one term and one description", () => {
    const parsed = __definitionListTestUtils.parseDefinitionParagraph("Term\n: Definition");

    expect(parsed).toEqual({
      terms: ["Term"],
      descriptions: [["Definition"]],
    });
  });

  it("parses multiple terms and descriptions in the same group", () => {
    const parsed = __definitionListTestUtils.parseDefinitionParagraph("Term A\nTerm B\n: First\n: Second");

    expect(parsed).toEqual({
      terms: [
        "Term A",
        "Term B",
      ],
      descriptions: [["First"], ["Second"]],
    });
  });

  it("keeps continuation lines inside description", () => {
    const parsed = __definitionListTestUtils.parseDefinitionParagraph("Term\n: First line\n  continuation");

    expect(parsed).toEqual({
      terms: ["Term"],
      descriptions: [["First line", "continuation"]],
    });
  });

  it("returns null when paragraph has no definition marker", () => {
    expect(__definitionListTestUtils.parseDefinitionParagraph("Term only")).toBeNull();
  });

  it("returns null when terms section has an internal blank line", () => {
    const parsed = __definitionListTestUtils.parseDefinitionParagraph("Term A\n\nTerm B\n: Definition");
    expect(parsed).toBeNull();
  });
});

