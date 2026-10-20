import { expect, test } from "@playwright/test";

test("keeps the treasurer signed in after a refresh", async ({ page }) => {
  await page.goto("/login?who=treasurer");
  await page.getByLabel("Phone").fill("0712345002");
  await page.getByLabel("PIN").fill("Ab3!@cde");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/desk$/, { timeout: 20_000 });
  await page.reload();
  await expect(page).toHaveURL(/\/desk$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("meeting");
});
