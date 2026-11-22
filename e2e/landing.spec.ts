import { expect, test } from "@playwright/test";

test("opens on a full-screen meeting film with a mature page structure", async ({ page }) => {
  await page.goto("/");

  const film = page.locator('video[data-film="/videos/meeting.mp4"]');
  await expect(film).toBeVisible();
  const box = await film.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
  }

  await expect(page.getByRole("heading", { level: 1 })).toContainText("clear and private");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "How it works" }).first()).toBeVisible();

  for (const id of ["proof", "about", "how", "doors", "guide", "faq", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("answers the common chama questions before sign-in", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "The answers, before you sign in." })).toBeVisible();
  const firstAnswer = page.getByText("No. A member sees only their own savings, loan, statement, and goal progress.");
  await expect(firstAnswer).toBeVisible();

  const secondQuestion = page.getByText("Does the Excel sheet need a special format?");
  await secondQuestion.click();
  await expect(
    page.getByText(/The agent reads the column names it finds/),
  ).toBeVisible();

  await expect(page.locator('a[href^="mailto:hello@pamoja.iq"]').first()).toBeVisible();
});
