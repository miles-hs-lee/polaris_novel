import { expect, test, type Page } from "@playwright/test";

const openEditor = async (page: Page, path: string) => {
  await page.goto(path);
  const editor = page.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();
  return editor;
};

test("E2E-001 basic editing toggles save status", async ({ page }) => {
  const editor = await openEditor(page, "/?mode=local&doc=e2e-basic");

  await expect(page.getByTestId("sync-status-badge")).toContainText(/Connecting|Synced/);
  await expect(page.getByTestId("sync-status-badge")).toContainText("Synced", { timeout: 10_000 });

  await editor.click();
  await page.keyboard.type(" E2E basic typing");

  await expect(page.getByTestId("save-status-badge")).toHaveText("Unsaved");
  await expect(page.getByTestId("save-status-badge")).toHaveText("Saved", { timeout: 5_000 });
});

test("E2E-002 slash command inserts table and definition list", async ({ page }) => {
  const editor = await openEditor(page, "/?mode=local&doc=e2e-slash");

  await editor.click();
  await page.keyboard.type("/table");
  await page.getByText("Table", { exact: true }).click();
  await expect(page.locator("table")).toBeVisible();

  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/definition list");
  await page.getByText("Definition List", { exact: true }).click();
  await expect(page.locator('dl[data-type="definitionList"]')).toBeVisible();
});

test("E2E-003 markdown and json export trigger downloads", async ({ page }) => {
  await openEditor(page, "/?mode=local&doc=e2e-export");

  await page.getByRole("button", { name: "Open menu" }).click();
  const [mdDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "MD 내보내기" }).click(),
  ]);
  expect(mdDownload.suggestedFilename()).toMatch(/^novel-\d{8}\.md$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "JSON 내보내기" }).click(),
  ]);
  expect(jsonDownload.suggestedFilename()).toMatch(/^novel-\d{8}\.json$/);
});

test("E2E-004 collaboration syncs between pages with same doc id", async ({ browser }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();
  const docId = `e2e-sync-${Date.now()}`;
  const token = `sync-${Date.now()}`;

  await openEditor(pageA, `/?mode=local&doc=${docId}`);
  await openEditor(pageB, `/?mode=local&doc=${docId}`);

  await pageA.locator('[contenteditable="true"]').first().click();
  await pageA.keyboard.type(` ${token}`);

  await expect(pageB.locator('[contenteditable="true"]').first()).toContainText(token, { timeout: 10_000 });
  await context.close();
});

test("E2E-005 upload falls back to local data URL when /api/upload returns 401", async ({ page }) => {
  await page.route("**/api/upload", async (route) => {
    await route.fulfill({
      status: 401,
      body: "Missing BLOB_READ_WRITE_TOKEN",
      headers: {
        "content-type": "text/plain",
      },
    });
  });

  const editor = await openEditor(page, "/?mode=local&doc=e2e-upload-fallback");
  await editor.click();
  await page.keyboard.type("/image");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByText("Image", { exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "upload-test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOZ5n94AAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(page.locator('img[src^="data:image"]').first()).toBeVisible({ timeout: 10_000 });
});

test("E2E-006 appearance menu toggles dark and light theme", async ({ page }) => {
  await openEditor(page, "/?mode=local&doc=e2e-theme");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("E2E-007 generate api returns 501 (AI disabled)", async ({ request }) => {
  const response = await request.post("/api/generate");
  const text = await response.text();

  expect(response.status()).toBe(501);
  expect(text).toContain("disabled");
});
