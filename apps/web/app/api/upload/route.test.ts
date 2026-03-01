/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { putMock } = vi.hoisted(() => ({
  putMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: putMock,
}));

import { POST } from "./route";

describe("POST /api/upload", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    putMock.mockReset();
  });

  afterEach(() => {
    if (originalToken === undefined) {
      process.env.BLOB_READ_WRITE_TOKEN = "";
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    }
  });

  it("returns 401 when blob token is missing", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "";

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: "hello",
      headers: {
        "content-type": "text/plain",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.text()).toContain("Missing BLOB_READ_WRITE_TOKEN");
  });

  it("appends extension from content-type when filename has no extension", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";
    putMock.mockResolvedValueOnce({ url: "https://example.com/photo.png" });

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: "png-data",
      headers: {
        "content-type": "image/png",
        "x-vercel-filename": "photo",
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(putMock).toHaveBeenCalledWith(
      "photo.png",
      expect.anything(),
      expect.objectContaining({
        access: "public",
        contentType: "image/png",
      }),
    );
    expect(payload).toEqual({ url: "https://example.com/photo.png" });
  });

  it("keeps filename when it already contains matching extension", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";
    putMock.mockResolvedValueOnce({ url: "https://example.com/photo.jpeg" });

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: "jpeg-data",
      headers: {
        "content-type": "image/jpeg",
        "x-vercel-filename": "photo.jpeg",
      },
    });

    await POST(request);

    expect(putMock).toHaveBeenCalledWith(
      "photo.jpeg",
      expect.anything(),
      expect.objectContaining({
        contentType: "image/jpeg",
      }),
    );
  });
});
