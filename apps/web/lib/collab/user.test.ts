import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalCollabUser } from "./user";

const USER_KEY = "novel-collab:user";

describe("local collab user (browser)", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns stored user when session value is valid", () => {
    const expected = { color: "#2563EB", name: "Guest-321" };
    sessionStorage.setItem(USER_KEY, JSON.stringify(expected));

    expect(getLocalCollabUser()).toEqual(expected);
  });

  it("creates and stores a new user when stored JSON is malformed", () => {
    sessionStorage.setItem(USER_KEY, "{broken");

    const user = getLocalCollabUser();

    expect(user.name).toMatch(/^Guest-\d{3}$/);
    expect(user.color).toMatch(/^#/);
    expect(sessionStorage.getItem(USER_KEY)).toBeTruthy();
  });

  it("creates and returns user when stored object shape is invalid", () => {
    sessionStorage.setItem(USER_KEY, JSON.stringify({ name: 1 }));

    const user = getLocalCollabUser();

    expect(user.name).toMatch(/^Guest-\d{3}$/);
    expect(user.color).toMatch(/^#/);
  });

  it("still returns user when sessionStorage.setItem throws", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const user = getLocalCollabUser();

    expect(user.name).toMatch(/^Guest-\d{3}$/);
    expect(user.color).toMatch(/^#/);
    setItemSpy.mockRestore();
  });
});

