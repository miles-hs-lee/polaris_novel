import { describe, expect, it } from "vitest";
import { getUrlFromString, isValidUrl } from "./index";

describe("url utilities", () => {
  it("validates absolute URL strings", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("returns unchanged value for valid URL", () => {
    expect(getUrlFromString("https://example.com/path")).toBe("https://example.com/path");
  });

  it("adds https scheme for host-like values", () => {
    expect(getUrlFromString("example.com")).toBe("https://example.com/");
  });

  it("returns null for non-url plain text", () => {
    expect(getUrlFromString("example com")).toBeUndefined();
  });
});
