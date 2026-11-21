import { expect, test } from "@playwright/test";

test("plays the silent scene loop on the sign-in page", async ({ page }) => {
  await page.goto("/login?door=member");
  const film = page.locator("video");
  await expect(film).toBeVisible();
  await expect.poll(() => film.evaluate((video) => (video as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);

  const before = await film.evaluate((video) => (video as HTMLVideoElement).currentTime);
  await page.waitForTimeout(1_200);
  const after = await film.evaluate((video) => (video as HTMLVideoElement).currentTime);
  expect(after).toBeGreaterThan(before);

  expect(await film.evaluate((video) => (video as HTMLVideoElement).muted)).toBe(true);
  expect(await film.evaluate((video) => (video as HTMLVideoElement).loop)).toBe(true);
});

test("keeps the picture still when the device asks for less motion", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/login?door=member");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator('.scene-layer[data-active="true"] img').last()).toBeVisible();
  await context.close();
});
