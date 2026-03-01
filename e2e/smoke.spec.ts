import { expect, test, type Locator, type Page } from "@playwright/test";

const openEditor = async (page: Page, path: string) => {
  await page.goto(path);
  const editor = page.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();
  return editor;
};

const waitForSync = async (page: Page) => {
  await expect(page.getByTestId("sync-status-badge")).toContainText(/Connecting|Synced/);
  await expect(page.getByTestId("sync-status-badge")).toContainText("Synced", { timeout: 10_000 });
};

const typeSlashCommand = async (page: Page, editor: Locator, command: string, commandTestId: string) => {
  await waitForSync(page);
  const commandItem = page.getByTestId(commandTestId);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(command);

    if (await commandItem.isVisible()) {
      return commandItem;
    }

    await page.waitForTimeout(200);
  }

  await expect(commandItem).toBeVisible({ timeout: 7_500 });
  return commandItem;
};

const ensureMenuOpen = async (page: Page) => {
  const markdownExport = page.getByTestId("menu-export-markdown");
  if (await markdownExport.isVisible()) return;

  await page.getByTestId("menu-trigger").click();
  await expect(markdownExport).toBeVisible();
};

const createBlankDocument = async (page: Page) => {
  await ensureMenuOpen(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "새 문서" }).click();
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
  const tableEditor = await openEditor(page, "/?mode=local&doc=e2e-slash-table");
  await createBlankDocument(page);
  await typeSlashCommand(page, tableEditor, "/table", "slash-command-table");
  await page.keyboard.press("Enter");
  await expect(page.locator("table.is-empty").first()).toBeVisible();

  const definitionEditor = await openEditor(page, "/?mode=local&doc=e2e-slash-definition");
  await createBlankDocument(page);
  await typeSlashCommand(page, definitionEditor, "/definition", "slash-command-definition-list");
  await page.keyboard.press("Enter");
  await expect(page.locator('dl[data-type="definitionList"]').filter({ hasText: "Term" })).toBeVisible();
});

test("E2E-003 markdown and json export trigger downloads", async ({ page }) => {
  await page.addInitScript(() => {
    const downloadFilenames: string[] = [];
    // @ts-expect-error add test hook to window
    window.__downloadFilenames = downloadFilenames;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick() {
      if (this.download) {
        downloadFilenames.push(this.download);
      }

      return originalClick.call(this);
    };
  });

  await openEditor(page, "/?mode=local&doc=e2e-export");

  await ensureMenuOpen(page);
  await page.getByTestId("menu-export-markdown").click();
  await expect
    .poll(async () => {
      const filenames = await page.evaluate(() => {
        // @ts-expect-error read test hook from window
        return window.__downloadFilenames as string[] | undefined;
      });
      return filenames?.length ?? 0;
    })
    .toBe(1);

  const filenamesAfterMarkdown = await page.evaluate(() => {
    // @ts-expect-error read test hook from window
    return window.__downloadFilenames as string[] | undefined;
  });
  expect(filenamesAfterMarkdown?.[0]).toMatch(/^novel-\d{8}\.md$/);

  await ensureMenuOpen(page);
  await page.getByTestId("menu-export-json").click();
  await expect
    .poll(async () => {
      const filenames = await page.evaluate(() => {
        // @ts-expect-error read test hook from window
        return window.__downloadFilenames as string[] | undefined;
      });
      return filenames?.length ?? 0;
    })
    .toBe(2);

  const filenamesAfterJson = await page.evaluate(() => {
    // @ts-expect-error read test hook from window
    return window.__downloadFilenames as string[] | undefined;
  });
  expect(filenamesAfterJson?.[1]).toMatch(/^novel-\d{8}\.json$/);
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

test("E2E-005 image paste falls back to local data URL when /api/upload returns 401", async ({ page }) => {
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
  await createBlankDocument(page);
  await editor.click();
  await page.evaluate(async ({ imageBase64 }) => {
    const target = document.querySelector('[contenteditable="true"]');
    if (!target) return;

    const binary = atob(imageBase64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const file = new File([bytes], "upload-test.png", { type: "image/png" });
    const clipboardData = new DataTransfer();
    clipboardData.items.add(file);

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: clipboardData,
    });

    target.dispatchEvent(pasteEvent);
  }, { imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOZ5n94AAAAASUVORK5CYII=" });

  await expect(page.locator('img[src^="data:image"]').first()).toBeVisible({ timeout: 10_000 });
});

test("E2E-006 appearance menu toggles dark and light theme", async ({ page }) => {
  await openEditor(page, "/?mode=local&doc=e2e-theme");

  await ensureMenuOpen(page);
  await page.getByTestId("appearance-theme-dark").click({ force: true });
  await expect(page.locator("html")).toHaveClass(/dark/);

  await ensureMenuOpen(page);
  await page.getByTestId("appearance-theme-light").click({ force: true });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("E2E-007 generate api returns 501 (AI disabled)", async ({ request }) => {
  const response = await request.post("/api/generate");
  const text = await response.text();

  expect(response.status()).toBe(501);
  expect(text).toContain("disabled");
});
