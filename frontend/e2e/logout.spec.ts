import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers";

test("logout → redirect login", async ({ page }) => {
  await loginAs(page, "chef@ensem.jee");

  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
