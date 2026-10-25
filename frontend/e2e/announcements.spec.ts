import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers";

test("lecture et création d’annonce (bureau)", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await page.locator('nav a[href="/announcements"]').click();
  await expect(page).toHaveURL(/\/announcements$/);
  await expect(page.getByRole("heading", { name: "Annonces" })).toBeVisible();

  await page.getByRole("link", { name: /AG extraordinaire vendredi/i }).click();
  await expect(page).toHaveURL(/\/announcements\/[^/]+$/);
  await expect(
    page.getByRole("heading", { name: "AG extraordinaire vendredi" }),
  ).toBeVisible();
  await expect(page.getByText(/Réunion de bureau/i)).toBeVisible();

  await page.getByRole("link", { name: "← Annonces" }).click();
  await page.getByRole("link", { name: "Publier" }).click();
  await expect(page).toHaveURL(/\/announcements\/new$/);

  const title = `E2E annonce ${Date.now()}`;
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Contenu").fill("Contenu publié par le smoke E2E bureau.");
  await page.getByRole("button", { name: /Publier|Enregistrer/i }).click();

  await expect(page).toHaveURL(/\/announcements\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByText("Contenu publié par le smoke E2E bureau."),
  ).toBeVisible();
});
