import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8").toLowerCase();
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    if (!statSync(fullPath).isFile()) {
      return [];
    }
    return fullPath;
  });
}

test("global tokens use the saved LiteAPI component palette", () => {
  const tokens = read("src/styles/tokens.css");

  assert.match(tokens, /--pih-primary:\s*#505aac/);
  assert.match(tokens, /--google-blue:\s*#505aac/);
  assert.match(tokens, /--bg:\s*#f8fafc/);
  assert.match(tokens, /--surface-soft:\s*#f1f5f9/);
  assert.match(tokens, /--line:\s*#e5e7eb/);
  assert.match(tokens, /--line-soft:\s*#e2e8f0/);
  assert.match(tokens, /--active-bg:\s*#f0f1fa/);
  assert.match(tokens, /--muted-strong:\s*#475569/);
});

test("chart files follow the saved chart responsibility palettes", () => {
  const chartTheme = read("src/shared/charts/chart-theme.ts");
  const chartOptions = read("src/data/chart-options.ts");
  const chartSeries = read("src/data/chart-series.ts");

  for (const color of ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]) {
    assert.ok(chartTheme.includes(color), `chart theme should include ${color}`);
  }

  for (const color of ["#def7e7", "#edf8dc", "#fcf4da", "#fde3e3"]) {
    assert.ok(chartOptions.includes(color), `quality band palette should include ${color}`);
  }

  for (const color of ["#c3c6e2", "#b5badc", "#a6acd5", "#999fce", "#8b92c8", "#7c84c1"]) {
    assert.ok(chartOptions.includes(color), `donut palette should include ${color}`);
  }

  assert.ok(chartOptions.includes("#4f5aab"), "bar/line chart primary should use #4F5AAB");
  assert.ok(chartOptions.includes("#94a3b8"), "combo chart bars should use #94A3B8");
  assert.ok(chartSeries.includes("#10b981"), "feed palette should use the saved green");
  assert.ok(chartSeries.includes("#ec4899"), "feed palette should use the saved pink");
});

test("overview funnel and destination country charts use the google palette swatch", () => {
  const chartTheme = read("src/shared/charts/chart-theme.ts");
  const overview = read("src/features/overview/OverviewPage.tsx");
  const performance = read("src/features/performance/PerformancePage.tsx");

  assert.match(chartTheme, /googlepaletteswatch/);
  assert.match(overview, /googlepaletteswatch/);
  assert.match(performance, /googlepaletteswatch/);
  assert.match(overview, /const funnelstages/);
  assert.match(overview, /googlepaletteswatch\[index % googlepaletteswatch\.length\]/);
  assert.match(performance, /const country_colors = googlepaletteswatch/);
});

test("legacy colors are removed from frontend source", () => {
  const legacyColors = [
    "#1a73e8",
    "#e8f0fe",
    "#4f5fb8",
    "#4c4597",
    "#97a5b9",
    "#e8edf4",
    "#8b95a6",
    "#526078",
    "#f8fafd",
    "#fceef1",
    "#d9e8ff",
    "#e54897",
    "#12b981",
    "#ea0345",
    "#c4003c",
    "#dfe5ef",
    "#edf1f7",
    "#f4f6fa",
    "#f8f9fc",
    "#604696",
    "#3b75ba",
    "#92c020",
    "#f08905",
    "#93979a",
    "#fff0f5",
    "#fff5f5",
    "#ffc5c5",
    "#c0392b",
    "#ecfeff",
    "#12a052",
    "#3f4fb2",
    "#4d5cbc",
    "#1e2b4d",
    "#17213f",
    "#f5222d",
    "#00924c",
    "#0ca34f",
    "#1769ff",
    "#8b35ff",
    "#66728a",
    "#fff5e8",
    "#eef5ff",
    "#eefaf1",
    "#f5edff",
    "#217346",
    "#5d6676",
    "#778199",
    "#9299a8",
    "#e1e5ec",
    "#f6f7fa",
    "#15803d"
  ];

  const sourceFiles = walk(join(root, "src")).filter((path) => /\.(css|ts|tsx|json)$/i.test(path));
  const matches = [];

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath, "utf8").toLowerCase();
    for (const color of legacyColors) {
      if (content.includes(color)) {
        matches.push(`${filePath.replace(`${root}\\`, "")}: ${color}`);
      }
    }
  }

  assert.deepEqual(matches, []);
});

test("visible modules do not use legacy brand semantics for primary UI", () => {
  const semanticLegacy = [
    "var(--dida-navy)",
    "#000947",
    "#eef1ff",
    "rgba(234,3,69",
    "rgba(234, 3, 69",
    "#f0f4ff",
    "#6b7fd4",
    "#34d399",
    "#16a34a",
    "#d97706",
    "#dc2626",
    "#22c55e",
    "#1d4ed8",
    "#2563eb",
    "#f97316",
    "#fbbf24",
    "#84cc16",
    "#818cf8",
    "#7c3aed",
    "#0891b2",
    "#e0e6f0",
    "#f0e7ff",
    "#f7f4ff",
    "#e3d9fb",
    "var(--dida-red)",
    "var(--dida-purple)"
  ];

  const allowed = new Set(["src\\styles\\tokens.css"]);
  const sourceFiles = walk(join(root, "src")).filter((path) => /\.(css|ts|tsx|json)$/i.test(path));
  const matches = [];

  for (const filePath of sourceFiles) {
    const relative = filePath.replace(`${root}\\`, "");
    if (allowed.has(relative)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8").toLowerCase();
    for (const marker of semanticLegacy) {
      if (content.includes(marker)) {
        matches.push(`${relative}: ${marker}`);
      }
    }
  }

  assert.deepEqual(matches, []);
});
