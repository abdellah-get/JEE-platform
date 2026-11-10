import { expect, test } from "@playwright/test";

import { goSideNav, loginAs } from "./helpers";

test("CRM — liste accessible (bureau)", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await goSideNav(page, "/crm");
  await expect(page).toHaveURL(/\/crm$/);
  await expect(page.getByRole("heading", { name: /CRM/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Missions|Créer/i }).first(),
  ).toBeVisible();
});

test("Finance — résumé bureau", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await goSideNav(page, "/finance");
  await expect(page).toHaveURL(/\/finance$/);
  await expect(page.getByRole("heading", { name: /Finance/i })).toBeVisible();
  await expect(
    page.getByText(/Budgets|notes de frais|Export|En attente/i).first(),
  ).toBeVisible();
});

test("Admin recrutement — pipeline accessible", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await page.goto("/admin/recruitment");
  await expect(page).toHaveURL(/\/admin\/recruitment$/);
  await expect(
    page.getByRole("heading", { name: /Recrutement/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Candidature|Entretien|Nouveau pôle/i).first(),
  ).toBeVisible();
});
