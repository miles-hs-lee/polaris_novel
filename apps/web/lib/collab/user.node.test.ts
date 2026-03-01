/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import { getLocalCollabUser } from "./user";

describe("local collab user (server)", () => {
  it("returns deterministic fallback user when window is undefined", () => {
    expect(getLocalCollabUser()).toEqual({
      color: "#E11D48",
      name: "Guest",
    });
  });
});

