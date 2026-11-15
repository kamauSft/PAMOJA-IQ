import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI ? {} : { channel: "chrome" as const }),
      },
    },
  ],
  /**
   * The browser tests run against a production build, not the dev server. The
   * dev server rebuilds whenever a file changes — including the database the
   * tests write to — and a rebuild during a navigation drops the request. A
   * production build also proves the strict content policy and the nonce work.
   */
  webServer: {
    command: "npm run build && npm run start -- --port 3000",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // The seeded demo is deliberate here. A real deployment never sets this.
      ALLOW_DEMO_IN_PROD: "true",
    },
  },
});
