import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

test("module page headers render only the main title", () => {
  const pageHeader = read("src/shared/components/PageHeader.tsx");
  const layoutCss = read("src/styles/layout.css");

  assert.ok(pageHeader.includes("description?"), "PageHeader should keep description as a compatibility prop");
  assert.ok(!pageHeader.includes("<p>{description}</p>"), "PageHeader must not render title subtitles");
  assert.ok(!pageHeader.includes("description ?"), "PageHeader must not conditionally render title subtitles");
  assert.ok(!layoutCss.includes(".page-title p"), "Layout CSS should not keep page-title subtitle styles");
});

test("legacy standalone page headers do not render top subtitle copy", () => {
  const placeholders = read("src/pages/Placeholders.tsx");

  assert.ok(!placeholders.includes("styles.desc"), "Placeholder page should not render title description copy");
});
