import { expect, test } from "@playwright/test";

import { goSideNav, loginAs } from "./helpers";

test("admin membres — toggle actif (bureau)", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await goSideNav(page, "/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Administration" }),
  ).toBeVisible();

  await page.locator('a[href="/admin/members"]').click();
  await expect(page).toHaveURL(/\/admin\/members$/);
  await expect(page.getByRole("heading", { name: "Membres" })).toBeVisible();

  const membreRow = page.locator("li").filter({ hasText: "membre@ensem.jee" });
  await expect(membreRow).toBeVisible();

  const toggle = membreRow.getByRole("button", {
    name: /Désactiver|Activer/,
  });
  const before = (await toggle.textContent())?.trim() ?? "";
  await toggle.click();
  await expect(toggle).not.toHaveText(before, { timeout: 10_000 });

  // Restore so later specs keep a usable demo account
  await toggle.click();
  await expect(toggle).toHaveText(before, { timeout: 10_000 });
});

test("admin demandes — page accessible (bureau)", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await page.goto("/admin/requests");
  await expect(
    page.getByRole("heading", { name: /Demandes d’adhésion/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Aucune demande|En attente|Accepter/i).first(),
  ).toBeVisible();
});
