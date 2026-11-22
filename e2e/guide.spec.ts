import { expect, test } from "@playwright/test";

test("offers a guided tour on the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Meet Asha/ })).toBeVisible();
  await page.getByRole("button", { name: "Play the guided tour" }).first().click();

  const dialog = page.getByRole("dialog", { name: "Guided tour" });
  await expect(dialog).toBeVisible();
  const film = dialog.locator('video[src="/videos/guide.mp4"]');
  await expect(film).toBeVisible();
  await expect(film).toHaveAttribute("controls", "");
  await dialog.getByText("Read the tour transcript").click();
  const transcript = (await dialog.innerText()).toLowerCase();
  expect(transcript).toContain("agentic ai");
  expect(transcript).not.toContain("lock");
  expect(transcript).not.toContain("fifteen");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("serves the narrated tour as a small video file", async ({ request }) => {
  const response = await request.get("/videos/guide.mp4");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("video/mp4");
  const bytes = (await response.body()).length;
  expect(bytes).toBeGreaterThan(10_000);
  expect(bytes).toBeLessThan(2_000_000);
});
