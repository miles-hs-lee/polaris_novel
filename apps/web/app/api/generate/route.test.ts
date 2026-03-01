/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/generate", () => {
  it("returns 501 while AI generation is disabled", async () => {
    const response = await POST();

    expect(response.status).toBe(501);
    expect(await response.text()).toContain("disabled");
  });
});

