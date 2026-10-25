import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers";

test("filtres Mes tâches", async ({ page }) => {
  await loginAs(page, "chef@ensem.jee");

  await page.locator('nav a[href="/tasks"]').click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "Mes tâches" })).toBeVisible();
  await expect(page.getByText("Maquette homepage")).toBeVisible();

  await page.getByLabel("Filtrer par statut").selectOption("IN_PROGRESS");
  await expect(page.getByText("Maquette homepage")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Aucune tâche" }),
  ).toBeVisible();

  await page.getByLabel("Filtrer par statut").selectOption("DONE");
  await expect(page.getByText("Maquette homepage")).toBeVisible();

  await page.getByLabel("Filtrer par priorité").selectOption("HIGH");
  await expect(page.getByText("Maquette homepage")).toBeVisible();

  await page.getByLabel("Filtrer par priorité").selectOption("LOW");
  await expect(page.getByText("Maquette homepage")).toHaveCount(0);
});
