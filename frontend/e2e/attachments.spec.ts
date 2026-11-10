import { expect, test } from "@playwright/test";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { goSideNav, loginAs } from "./helpers";

test("upload + liste pièce jointe sur projet", async ({ page }) => {
  await loginAs(page, "chef@ensem.jee");

  await goSideNav(page, "/projects");
  await page.getByRole("link", { name: /Site Junior ENSEM/i }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);

  const section = page.getByRole("region", { name: /Livrables/i });
  await expect(
    section.getByRole("heading", { name: /pièces jointes/i }),
  ).toBeVisible();

  const fileName = `e2e-livrable-${Date.now()}.txt`;
  const filePath = path.join(tmpdir(), fileName);
  writeFileSync(filePath, `E2E attachment ${Date.now()}\n`);

  try {
    await section.locator('input[type="file"]').setInputFiles(filePath);
    await expect(section.getByText(fileName)).toBeVisible({ timeout: 15_000 });
  } finally {
    try {
      unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
});
