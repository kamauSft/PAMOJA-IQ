import { expect, test } from "@playwright/test";

test("runs the page under the content policy with no blocked script", async ({ page }) => {
  const blocked: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy|refused to/i.test(message.text())) {
      blocked.push(message.text());
    }
  });
  page.on("pageerror", (error) => blocked.push(error.message));

  await page.goto("/login?door=member");
  // The button only wakes once the browser has the page, so a reply proves the
  // scripts the policy allowed actually ran.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("login-error")).toBeVisible();

  expect(blocked).toEqual([]);
});
