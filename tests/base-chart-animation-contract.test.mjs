import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8").toLowerCase();
}

test("BaseChart stages chart options through a visible entry frame", () => {
  const source = read("src/shared/charts/BaseChart.tsx");

  assert.match(source, /withchartentryinitialstate/);
  assert.match(source, /requestanimationframe/);
  assert.match(source, /setoption\(withchartentryinitialstate\(nextoption\)/);
  assert.match(source, /setoption\(nextoption/);
});

test("BaseChart initialization only creates the chart instance", () => {
  const source = read("src/shared/charts/BaseChart.tsx");
  const initEffectStart = source.indexOf("echarts.init");
  const initEffectEnd = source.indexOf("}, [empty]", initEffectStart);
  const initEffect = source.slice(initEffectStart, initEffectEnd + "}, [empty]".length);

  assert.doesNotMatch(initEffect, /\[empty,\s*mergedoption\]/);
  assert.doesNotMatch(initEffect, /setoption\(mergedoption/);
  assert.doesNotMatch(initEffect, /setoption\(withchartentryinitialstate/);
  assert.match(initEffect, /\[empty\]/);
});

test("direct ECharts charts also use staged entry animation", () => {
  const source = read("src/features/errors/ErrorsPage.tsx");

  assert.match(source, /withchartentryinitialstate/);
  assert.match(source, /requestanimationframe/);
  assert.match(source, /setoption\(withchartentryinitialstate\(nextoption\)/);
  assert.match(source, /setoption\(nextoption/);
});

test("BaseChart isolates entry animation from ordinary option updates", () => {
  const source = read("src/shared/charts/BaseChart.tsx");

  assert.match(source, /entryanimationkey\??:/);
  assert.match(source, /lastentryanimationkeyref/);
  assert.match(source, /resolvedentryanimationkey/);
  assert.match(source, /lastentryanimationkeyref\.current\s*!==\s*resolvedentryanimationkey/);
  assert.match(source, /playentryanimation\(chartref\.current,\s*mergedoption,\s*entryframeref\.current\)/);
  assert.match(source, /return;\s*}\s*},\s*\[empty,\s*mergedoption,\s*resolvedentryanimationkey\]/);
  assert.doesNotMatch(source, /chartref\.current\.setoption\(mergedoption,\s*set_option_options\)/);
});

test("BaseChart recomputes dynamic axes when legend visibility changes", () => {
  const source = read("src/shared/charts/BaseChart.tsx");
  const theme = read("src/shared/charts/chart-theme.ts");

  assert.match(theme, /withchartdefaults\(option:\s*echartsoption,\s*legendselection/);
  assert.match(source, /optionref/);
  assert.match(source, /legend_set_option_options/);
  assert.match(source, /silent:\s*true/);
  assert.match(source, /legendselectchanged/);
  assert.match(source, /params\.selected/);
  assert.match(source, /const selected = createlegendselection\(optionref\.current,\s*params,\s*lastlegendpointermodifier\)/);
  assert.match(source, /const visibleoption = withselectalllegendoption\(optionref\.current,\s*selected\)/);
  assert.match(source, /withchartdefaults\(visibleoption,\s*selected/);
  assert.match(source, /chart\.setoption\(nextoption,\s*legend_set_option_options\)/);
});

test("BaseChart supports ctrl-click legend isolation without changing normal legend toggles", () => {
  const source = read("src/shared/charts/BaseChart.tsx");

  assert.match(source, /function createlegendselection/);
  assert.match(source, /iscontrollegendclick/);
  assert.match(source, /lastlegendpointermodifier/);
  assert.match(source, /chart\.getzr\(\)\.on\("mousedown"/);
  assert.match(source, /chart\.getzr\(\)\.off\("mousedown"/);
  assert.match(source, /handlelegendpointerevent/);
  assert.match(source, /nativeevent\?\.ctrlkey/);
  assert.match(source, /modifier\?\.ctrlkey/);
  assert.match(source, /getselectablelegendnames/);
  assert.match(source, /isreferencelegendseries/);
  assert.match(source, /if\s*\(!iscontrollegendclick\(params,\s*modifier\)\)\s*return params\.selected/);
  assert.match(source, /if\s*\(!selectablenames\.includes\(params\.name\)\)\s*return params\.selected/);
  assert.match(source, /object\.fromentries\(\s*selectablenames\.map\(\(name\)\s*=>\s*\[name,\s*name\s*===\s*params\.name\]\)/);
  assert.match(source, /const selected = createlegendselection\(optionref\.current,\s*params,\s*lastlegendpointermodifier\)/);
  assert.match(source, /withchartdefaults\(visibleoption,\s*selected\)/);
});

test("BaseChart supports item legends and inserts select all as the leftmost legend item", () => {
  const source = read("src/shared/charts/BaseChart.tsx");

  assert.match(source, /select_all_legend_name\s*=\s*"select all"/);
  assert.match(source, /select_all_legend_series_id/);
  assert.match(source, /function isitemlegendseries/);
  assert.match(source, /current\.type\s*===\s*"pie"\s*\|\|\s*current\.type\s*===\s*"funnel"/);
  assert.match(source, /function getdataitemlegendnames/);
  assert.match(source, /function getlegenddisplaynames/);
  assert.match(source, /function createselectallselection/);
  assert.match(source, /params\.name\s*===\s*select_all_legend_name/);
  assert.match(source, /selectablenames\.map\(\(name\)\s*=>\s*\[name,\s*true\]\)/);
  assert.match(source, /function makeselectalllegendseries/);
  assert.match(source, /function withselectalllegendoption/);
  assert.match(source, /legendselection\?\.?\[name\]\s*===\s*false/);
  assert.match(source, /data:\s*\[select_all_legend_name,\s*\.\.\.legenddata\]/);
  assert.match(source, /series:\s*\[makeselectalllegendseries\(\),\s*\.\.\.nextseries\]/);
  assert.match(source, /const visibleoption = withselectalllegendoption\(optionref\.current,\s*selected\)/);
  assert.match(source, /withchartdefaults\(visibleoption,\s*selected\)/);
});

test("BaseChart derives a stable default entry key from chart option contents", () => {
  const source = read("src/shared/charts/BaseChart.tsx");

  assert.match(source, /function stableentrystringify/);
  assert.match(source, /function createentryanimationkey/);
  assert.match(source, /entryanimationkey\s*\?\?\s*createentryanimationkey\(mergedoption\)/);
  assert.doesNotMatch(source, /entryanimationkey\s*\?\?\s*mergedoption/);
  assert.match(source, /typeof value === "function"[\s\S]*"\[function\]"/);
  assert.match(source, /object\.keys\(record\)\.sort\(\)/);
});

test("overview relies on global chart-content isolation instead of per-chart manual keys", () => {
  const source = read("src/features/overview/OverviewPage.tsx");
  const chartTags = [...source.matchAll(/<basechart[\s\S]*?\/>/g)].map((match) => match[0]);
  const funnelTag = chartTags.find((tag) => tag.includes("funnelopt(funneldata)"));
  const comparisonLineTags = chartTags.filter((tag) => tag.includes("lineopt("));
  const sparkTags = chartTags.filter((tag) => tag.includes("sparkopt("));

  assert.ok(funnelTag, "overview funnel chart should exist");
  assert.doesNotMatch(source, /overviewdatakey|comparisonanimationkey|entryanimationkey=/);
  assert.doesNotMatch(funnelTag, /showpreviousperiod/);

  assert.equal(comparisonLineTags.length, 3, "only the three main overview line charts should use previous-period comparison");
  for (const tag of comparisonLineTags) {
    assert.match(tag, /showpreviousperiod/);
  }

  assert.ok(sparkTags.length > 0, "overview spark charts should exist");
  for (const tag of sparkTags) {
    assert.doesNotMatch(tag, /showpreviousperiod/);
  }
});
