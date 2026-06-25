import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

test("finance page uses the approved control-room module structure", () => {
  const source = read("src/features/finance-status/FinanceStatusPage.tsx");

  [
    'className="finance-status-page"',
    "FinanceStatusPage.css",
    "finance-risk-notice",
    "finance-kpi-grid",
    "finance-progress-grid",
    "finance-ledger-card",
    "finance-drawer-summary",
  ].forEach((marker) => assert.ok(source.includes(marker), `Missing finance UI marker: ${marker}`));
});

test("finance page emphasizes risk and scan-friendly ledger details", () => {
  const source = read("src/features/finance-status/FinanceStatusPage.tsx");

  [
    "overdueBills",
    "overdueAmount",
    "finance-kpi-card risk",
    "finance-risk-row",
    "finance-client-token",
    "finance-money",
    "finance-mono",
  ].forEach((marker) => assert.ok(source.includes(marker), `Missing finance risk marker: ${marker}`));
});

test("finance page removes explanatory subtitle copy from the module", () => {
  const source = read("src/features/finance-status/FinanceStatusPage.tsx");
  const css = read("src/features/finance-status/FinanceStatusPage.css");

  assert.ok(!source.includes("description="), "Finance page header should not render a subtitle description");
  assert.ok(!source.includes("hint="), "Finance KPI cards should not render helper subtitles");
  assert.ok(!source.includes("finance-kpi-sub"), "Finance KPI cards should not include subtitle markup");
  assert.ok(!source.includes('<p className="tiny"'), "Finance panels and ledger header should not render tiny subtitle copy");
  assert.ok(!source.includes("<h2>"), "Finance module should not render section subtitles under the main page title");
  assert.ok(!source.includes("<p>"), "Finance drawer should not render small explanatory titles");
  assert.ok(!css.includes(".finance-kpi-sub"), "Finance CSS should not include removed KPI subtitle styles");
  assert.ok(!css.includes(".finance-drawer-hero p"), "Finance CSS should not style removed drawer subtitle copy");
  assert.ok(!css.includes(".finance-contact-list p"), "Finance CSS should not style removed contact subtitle copy");
});

test("finance styling is scoped to the finance module", () => {
  const cssPath = "src/features/finance-status/FinanceStatusPage.css";
  assert.ok(existsSync(join(root, cssPath)), "Missing finance module CSS");

  const css = read(cssPath);
  assert.ok(css.includes(".finance-status-page"), "Missing scoped finance page root");
  assert.ok(css.includes(".finance-risk-notice"), "Missing risk notice styles");
  assert.ok(css.includes(".finance-kpi-grid"), "Missing KPI grid styles");
  assert.ok(css.includes(".finance-ledger-table"), "Missing ledger table styles");
  assert.ok(!css.includes(".topbar"), "Finance CSS must not style the global topbar");
  assert.ok(!css.includes(".sidebar"), "Finance CSS must not style the global sidebar");
});
