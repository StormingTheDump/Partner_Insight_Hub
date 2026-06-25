import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8").toLowerCase();
}

test("chart behavior helper is wired into the global chart defaults", () => {
  const helperPath = join(root, "src/shared/charts/chart-motion.ts");
  assert.ok(existsSync(helperPath), "chart-motion helper should exist");

  const theme = read("src/shared/charts/chart-theme.ts");
  assert.match(theme, /withinteractivechartbehavior/);
});

test("line charts draw the line while knots are rendered immediately", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /knot_layer_role/);
  assert.match(helper, /makeknotseries/);
  assert.match(helper, /type:\s*"line"/);
  assert.match(helper, /showSymbol:\s*true/i);
  assert.match(helper, /showAllSymbol:\s*true/i);
  assert.match(helper, /opacity:\s*0/);
  assert.match(helper, /animation:\s*false/);
  assert.match(helper, /showsymbol:\s*false/);
  assert.doesNotMatch(helper, /dataindex\s*\*\s*line_point_stagger/);
});

test("multi-line charts use hollow knots while single-line charts use solid knots", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /businesslinecount/);
  assert.match(helper, /isknoteligiblelineseries/);
  assert.match(helper, /symbol:\s*"circle"/);
  assert.match(helper, /color:\s*hollow\s*\?\s*"transparent"\s*:\s*color/);
  assert.match(helper, /borderwidth:\s*hollow\s*\?\s*2\s*:\s*0/);
  assert.match(helper, /isreferencelineseries/);
});

test("line and knot layers share a stable fallback series color", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /default_chart_colors/);
  assert.match(helper, /fallbackcolor/);
  assert.match(helper, /withlinedrawingmotion\(current,\s*seriesindex,\s*fallbackcolor\)/);
  assert.match(helper, /makeknotseries\(current,\s*seriesindex,\s*businesslinecount\s*>\s*1,\s*fallbackcolor\)/);
});

test("dashed and area line series never receive knot layers", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /isdashedlineseries/);
  assert.match(helper, /isarealineseries/);
  assert.match(helper, /linestyle\?\.\s*type\s*===\s*"dashed"/);
  assert.match(helper, /boolean\(series\.areastyle\)/);
  assert.match(helper, /series\.type\s*===\s*"line"\s*&&\s*!isdashedlineseries\(series\)\s*&&\s*!isarealineseries\(series\)/);
  assert.match(helper, /sourceSeries\.filter[\s\S]*isKnotEligibleLineSeries/i);
  assert.match(helper, /!isKnotEligibleLineSeries\(current\)[\s\S]*return\s+\[line\]/i);
});

test("line and knot layers use separate ids so line drawing animation stays isolated", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /getserieslayerid/);
  assert.match(helper, /id:\s*getserieslayerid\(series,\s*seriesindex,\s*"line"\)/);
  assert.match(helper, /id:\s*getserieslayerid\(series,\s*seriesindex,\s*"knot"\)/);
  assert.match(helper, /animation:\s*true/);
  assert.match(helper, /animation:\s*false/);
});

test("knot layers do not override the default line coordinate system with undefined", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /getknotcoordinatesystem/);
  assert.match(helper, /coordinatesystem\s*===\s*"cartesian2d"\s*\|\|\s*coordinatesystem\s*===\s*"polar"/);
  assert.doesNotMatch(helper, /coordinatesystem:\s*series\.coordinatesystem/);
});

test("bar charts use staggered progress-style animation", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /bar_stagger/);
  assert.match(helper, /animationeasing:\s*"cubicout"/);
  assert.match(helper, /dataindex\s*\*\s*bar_stagger/);
});

test("pie charts use a dedicated appearance animation", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /current\.type\s*===\s*"pie"/);
  assert.match(helper, /animationtype:\s*"expansion"/);
  assert.match(helper, /animationtypeupdate:\s*"expansion"/);
  assert.match(helper, /pie_stagger/);
});

test("entry animation starts from a visible initial chart state", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /withchartentryinitialstate/);
  assert.match(helper, /withentryinitialseries/);
  assert.match(helper, /current\[knot_layer_role\][\s\S]*return\s+\[current\]/);
  assert.match(helper, /current\.type\s*===\s*"line"[\s\S]*return\s+\[\]/);
  assert.doesNotMatch(helper, /current\.type\s*===\s*"line"[\s\S]{0,120}data:\s*\[\]/);
  assert.match(helper, /current\.type\s*===\s*"bar"[\s\S]*zeroedseriesdata/);
  assert.match(helper, /current\.type\s*===\s*"pie"[\s\S]*data:\s*\[\]/);
});

test("non-percent value y axes use dynamic min and max callbacks", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /isdynamicvalueaxis/);
  assert.match(helper, /ispercentaxis/);
  assert.match(helper, /min:\s*dynamicaxismin/);
  assert.match(helper, /max:\s*dynamicaxismax/);
  assert.match(helper, /formatter[\s\S]*includes\("%"\)/);
});

test("dynamic axis extent ignores constant dashed reference lines and respects bar stacks", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /isreferencelineseries/);
  assert.match(helper, /linestyle[\s\S]*type[\s\S]*dashed/);
  assert.match(helper, /every\(\(value\)\s*=>\s*value\s*===\s*values\[0\]\)/);
  assert.match(helper, /collectaxisextent/);
  assert.match(helper, /stackbuckets/);
});

test("dynamic axis extent follows visible legend series without counting threshold lines", () => {
  const helper = read("src/shared/charts/chart-motion.ts");

  assert.match(helper, /type legendselection/);
  assert.match(helper, /isserieslegendselected/);
  assert.match(helper, /selected\?\.\[string\(series\.name\)\]\s*!==\s*false/);
  assert.match(helper, /collectaxisextent\([\s\S]*serieslist:\s*unknown\[\],[\s\S]*axisindex:\s*number,[\s\S]*legendselection/);
  assert.match(helper, /!isserieslegendselected\(current,\s*legendselection\)[\s\S]*continue/);
  assert.match(helper, /isreferencelineseries\(current\)[\s\S]*continue/);
  assert.match(helper, /collectaxisextent\(sourceseries,\s*axisindex,\s*legendselection\)/);
});
