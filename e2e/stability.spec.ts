import { expect, test } from "@playwright/test";

test("keeps the treasurer signed in after a refresh", async ({ page }) => {
  await page.goto("/login?who=treasurer");
  await page.getByRole("button", { name: "Continue" }).click();
  const demo = page.getByTestId("demo-code");
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("SMS code").fill((await demo.innerText()).trim());
  await page.getByRole("button", { name: "Confirm code" }).click();
  await expect(page).toHaveURL(/\/desk$/, { timeout: 20_000 });
  await page.reload();
  await expect(page).toHaveURL(/\/desk$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("meeting");
});
