import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers";

test("access JWT n’est pas dans localStorage après login", async ({ page }) => {
  await loginAs(page, "chef@ensem.jee");

  const stored = await page.evaluate(() => ({
    access: localStorage.getItem("jee_access_token"),
    user: localStorage.getItem("jee_user"),
  }));

  expect(stored.access).toBeNull();
  expect(stored.user).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);

  const afterReload = await page.evaluate(() =>
    localStorage.getItem("jee_access_token"),
  );
  expect(afterReload).toBeNull();
});
