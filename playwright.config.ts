import { defineConfig, devices } from "@playwright/test";

// E2E for the single-story "Terminal Dossier" player. Boots the dev server (or reuses
// a running one) and drives the checkout-flakiness trip through every gate + component.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4477",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4477",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
