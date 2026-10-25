import { expect, type Page } from "@playwright/test";

export async function loginAs(
  page: Page,
  email: string,
  password = "Demo123!",
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: /Continuer|Se connecter/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
