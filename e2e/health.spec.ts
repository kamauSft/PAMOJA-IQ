import { expect, test } from "@playwright/test";

test("says the app and the records are running", async ({ page }) => {
  await page.goto("/health");
  await expect(page.getByRole("heading", { name: "Is it running?" })).toBeVisible();
  await expect(page.getByText("App: running")).toBeVisible();
  await expect(page.getByText("Records: connected")).toBeVisible();
  await expect(page.getByText("Where: on this computer")).toBeVisible();
});
