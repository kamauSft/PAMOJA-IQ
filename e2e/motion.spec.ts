import { expect, test } from "@playwright/test";

async function expectFilm(page: import("@playwright/test").Page, source: string) {
  const film = page.locator(`video[data-film="${source}"]`);
  await expect(film).toBeVisible();
  const box = await film.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
  }
  await expect
    .poll(() => film.evaluate((video) => (video as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);

  const before = await film.evaluate((video) => (video as HTMLVideoElement).currentTime);
  await page.waitForTimeout(1_200);
  const after = await film.evaluate((video) => (video as HTMLVideoElement).currentTime);
  expect(after).toBeGreaterThan(before);

  expect(await film.evaluate((video) => (video as HTMLVideoElement).muted)).toBe(true);
  expect(await film.evaluate((video) => (video as HTMLVideoElement).loop)).toBe(true);
}

test("fills the member sign-in page with a meeting scene", async ({ page }) => {
  await page.goto("/login?door=member");
  await expectFilm(page, "/videos/gathering.mp4");
});

test("fills the treasurer sign-in page with a meeting scene", async ({ page }) => {
  await page.goto("/login?door=treasurer");
  await expectFilm(page, "/videos/meeting.mp4");
});

test("keeps the member film when the stills begin rotating", async ({ page }) => {
  await page.goto("/login?door=member");
  await expectFilm(page, "/videos/gathering.mp4");
  await page.waitForTimeout(8_500);
  await expect(page.locator('video[data-film="/videos/gathering.mp4"]')).toBeVisible();
  await expect(page.locator('video[data-film="/videos/meeting.mp4"]')).toHaveCount(0);
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
