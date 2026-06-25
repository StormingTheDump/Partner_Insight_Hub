import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8").toLowerCase();
}

test("overview top cards use a unified primary value color", () => {
  const overview = read("src/features/overview/OverviewPage.tsx");

  assert.match(overview, /overview_card_value_color\s*=\s*"#505aac"/);
  assert.match(overview, /color:\s*overview_card_value_color/);
  assert.doesNotMatch(overview, /总\s*ttv[\s\S]{0,120}#ec4899/);
});

test("overview comparison badges are only shown when previous-period comparison is enabled", () => {
  const overview = read("src/features/overview/OverviewPage.tsx");

  assert.match(overview, /getpreviousdaterange/);
  assert.match(overview, /previousfunneldata/);
  assert.match(overview, /showpreviousperiod\s*&&\s*comparison/);
  assert.match(overview, /comparisonbadgestyle/);
});

test("overview comparison badges use green, red, and yellow trend semantics", () => {
  const overview = read("src/features/overview/OverviewPage.tsx");

  assert.match(overview, /"#10b981"/);
  assert.match(overview, /"#ef4444"/);
  assert.match(overview, /"#f59e0b"/);
  assert.match(overview, /"↑"/);
  assert.match(overview, /"↓"/);
  assert.match(overview, /"→"/);
});
