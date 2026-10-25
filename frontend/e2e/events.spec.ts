import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers";

test("liste événements + calendrier + création (bureau)", async ({ page }) => {
  await loginAs(page, "bureau@ensem.jee");

  await page.locator('nav a[href="/events"]').click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("heading", { name: "Événements" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Formation Soft Skills/i }),
  ).toBeVisible();

  await page.locator('nav a[href="/calendar"]').click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: "Calendrier" })).toBeVisible();

  await page.locator('nav a[href="/events"]').click();
  await page.getByRole("link", { name: "Créer" }).click();
  await expect(page).toHaveURL(/\/events\/new$/);

  const title = `E2E event ${Date.now()}`;
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;

  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Description").fill("Événement créé par le smoke E2E.");
  await page.getByLabel("Début").fill(local);
  await page.getByRole("button", { name: /^Créer$/ }).click();

  await expect(page).toHaveURL(/\/events\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Événement créé par le smoke E2E.")).toBeVisible();
});
