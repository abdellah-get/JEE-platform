import { expect, test } from "@playwright/test";

/**
 * Smoke against a seeded API (SEED_ENABLED=true).
 * Demo account: chef@ensem.jee / Demo123! — project "Site Junior ENSEM".
 */
test("login → dashboard → Kanban projet", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("chef@ensem.jee");
  await page.getByLabel("Mot de passe").fill("Demo123!");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(/Bonjour Chaimae/i)).toBeVisible();

  await page.locator('nav a[href="/projects"]').click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible();

  await page.getByRole("link", { name: /Site Junior ENSEM/i }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Site Junior ENSEM" })).toBeVisible();

  await page.getByRole("link", { name: "Kanban", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/tasks$/);
  await expect(page.getByRole("heading", { name: "Kanban" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /À faire/ })).toBeVisible();
  await expect(page.getByText("API auth JWT")).toBeVisible();
});
