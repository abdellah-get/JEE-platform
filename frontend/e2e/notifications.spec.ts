import { expect, test } from "@playwright/test";

import { goSideNav, loginAs } from "./helpers";

test("notifications — pin annonce puis mark all (chef)", async ({
  page,
  browser,
}) => {
  // Bureau pins an announcement → notifs for other active members
  const bureau = await browser.newPage();
  await loginAs(bureau, "bureau@ensem.jee");
  await goSideNav(bureau, "/announcements");
  await bureau
    .getByRole("link", { name: /AG extraordinaire vendredi/i })
    .click();
  await expect(bureau).toHaveURL(/\/announcements\/[^/]+$/);

  const pinBtn = bureau.getByRole("button", {
    name: /Épingler urgent|Retirer l’épingle/,
  });
  const pinLabel = await pinBtn.textContent();
  if (pinLabel?.includes("Retirer")) {
    await pinBtn.click();
    await expect(
      bureau.getByRole("button", { name: /Épingler urgent/ }),
    ).toBeVisible();
  }
  await bureau.getByRole("button", { name: /Épingler urgent/ }).click();
  await expect(
    bureau.getByRole("button", { name: /Retirer l’épingle/ }),
  ).toBeVisible();
  await bureau.close();

  await loginAs(page, "chef@ensem.jee");
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();

  const markAll = page.getByRole("button", { name: /Tout marquer lu/i });
  await expect(markAll).toBeVisible({ timeout: 15_000 });
  await markAll.click();
  await expect(markAll).toBeHidden({ timeout: 10_000 });

  // Bell uses aria-label "Notifications" (or "N notifications non lues")
  await page
    .getByRole("button", { name: /notifications/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Notifications" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Tout lu" })).toHaveCount(0);
});
