import { test, expect, type Page } from "@playwright/test";

// Drives the dark "Terminal Dossier" single-story player through ALL FIVE gates of the
// checkout-flakiness fresher trip, asserting every component renders and its key
// interaction works — including the live red→green test runner in G4.

const SLUG = "story-checkout-flakiness";

async function continueTransition(page: Page) {
  const btn = page.getByTestId("transition-continue");
  await expect(btn).toBeVisible();
  await btn.click();
}

test("fresher walks the whole checkout-flakiness trip, every component", async ({ page }) => {
  await page.goto(`/story/${SLUG}`);

  // ── house-rules / incident briefing ──
  await expect(page.getByTestId("route-leg-G1")).toBeVisible();
  await expect(page.getByTestId("route-leg-G5")).toBeVisible();
  await page.getByTestId("start-trip").click();

  // ── G1 · restate & probe ── sharp question surfaces a hidden fact ──
  await page.getByTestId("chat-input").fill("what changed in Friday's deploy?");
  await page.getByTestId("chat-input").press("Enter");
  await expect(page.getByTestId("yield-meter")).toContainText("1/4");
  await page.getByTestId("g1-done").click();
  await continueTransition(page);

  // ── G2 · pick & defend ── commit + defend + switch condition ──
  await page.getByTestId("approach-a").click();
  await page.getByTestId("g2-commit").click();
  await page.getByTestId("g2-why").fill("Fixes the null at the source so every reader is safe.");
  await page.getByTestId("g2-switch").fill("the app-layer guard if a prod migration were risky.");
  await page.getByTestId("g2-submit").click();
  await continueTransition(page);

  // ── G3 · find the target block ── read-only IDE, mark the suspect ──
  await page.getByTestId("g3-tab-adapter.ts").click();
  await page.locator('[data-testid="g3-editor"] .cm-content').click();
  await page.keyboard.press("ControlOrMeta+a"); // select the suspect range
  await expect(page.getByTestId("g3-selection")).toContainText("selected");
  await page.getByTestId("g3-mark").click();
  await expect(page.getByTestId("g3-marked")).toContainText("adapter.ts");
  await page.getByTestId("g3-confirm").click();
  await continueTransition(page);

  // ── G4 · the assignment ── live tests go red, then green after the one-line fix ──
  await page.getByTestId("g4-run").click();
  await expect(page.getByTestId("g4-summary")).toContainText("1/4 passing");

  // apply the canonical fix through the dev/e2e test seam, then re-run
  await page.evaluate(() => {
    const fixed = `import type { CartRow, Cart } from "./types";

export function adaptCart(row: CartRow): Cart {
  return {
    id: row.id,
    user_id: row.user_id,
    items: row.items,
    discount_pct: row.discount_pct ?? 0,
  };
}
`;
    (window as unknown as { __storyG4: { setFile: (p: string, c: string) => void } }).__storyG4.setFile(
      "adapter.ts",
      fixed
    );
  });
  await page.waitForTimeout(150);
  await page.evaluate(() =>
    (window as unknown as { __storyG4: { run: () => void } }).__storyG4.run()
  );
  await expect(page.getByTestId("g4-summary")).toContainText("4/4 passing");
  await page.getByTestId("g4-reflection").fill("Fixed once at the adapter seam; discounted cart still totals 900.");
  await page.getByTestId("g4-submit").click();
  await continueTransition(page);

  // ── G5 · the curveball ── countdown ring + a judgment call ──
  await expect(page.getByTestId("g5-timer")).toBeVisible();
  await page.getByTestId("g5-option-ship_flag").click();
  await page.getByTestId("g5-why").fill("Confirm the fix is live, then 20% behind a flag for a small cohort.");
  await page.getByTestId("g5-submit").click();

  // ── debrief ── flight log names every move; all five legs stamped ──
  await expect(page.getByTestId("debrief")).toBeVisible();
  for (const id of ["G1", "G2", "G3", "G4", "G5"]) {
    await expect(page.getByTestId(`flightlog-${id}`)).toBeVisible();
  }
});
