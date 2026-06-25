import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

test("errors page receives the global date range from the app shell", () => {
  const routes = read("src/dashboard/routes.tsx");
  const shell = read("src/dashboard/AppShell.tsx");
  const errors = read("src/features/errors/ErrorsPage.tsx");

  assert.ok(routes.includes("dateRange: [string, string] | null"), "Page props should expose the global date range");
  assert.ok(shell.includes("dateRange={dateRange}"), "AppShell should pass dateRange into the active page");
  assert.ok(errors.includes("dateRange?: DateRange"), "ErrorsPage tab props should accept dateRange");
  assert.ok(errors.includes('params.set("start_date"'), "Errors requests should include start_date");
  assert.ok(errors.includes('params.set("end_date"'), "Errors requests should include end_date");
});

test("errors page uses multi-select error type filters in both tabs", () => {
  const source = read("src/features/errors/ErrorsPage.tsx");

  assert.ok(source.includes("MultiSelectFilter"), "Errors page should include a shared multi-select filter");
  assert.ok(source.includes("selectedErrorTypes"), "Errors filters should store selected error types as an array");
  assert.ok(source.includes('params.set("error_types"'), "Errors requests should send selected error_types");
  assert.ok(!source.includes("<select value={errorType}"), "Single-select error type filters should be removed");
});

test("errors page uses multi-value textareas for rate plan and booking filters", () => {
  const source = read("src/features/errors/ErrorsPage.tsx");
  const css = read("src/features/errors/ErrorsPage.css");

  assert.ok(source.includes("parseMultiValueInput"), "Errors page should parse comma, whitespace, and newline-separated values");
  assert.ok(source.includes("<textarea"), "ID filters should use textarea controls");
  assert.ok(source.includes("errors-multi-value-input"), "ID textarea should have module-specific sizing styles");
  assert.ok(!source.includes('className="filter-control errors-multi-value-control"'), "Textarea must own the visible border so resize changes the whole field");
  assert.ok(css.includes("border: 1px solid var(--line)"), "Textarea should render the visible border itself");
  assert.ok(css.includes("border-radius: 7px"), "Textarea should use the same radius as filter controls");
  assert.ok(css.includes("box-sizing: border-box"), "Textarea sizing should keep text inside its visible border");
  assert.ok(css.includes("min-height: 34px"), "ID textarea default height should match the type filter height");
  assert.ok(css.includes("height: 34px"), "ID textarea should render at the compact default height");
  assert.ok(css.includes("resize: vertical"), "ID textarea should still resize vertically");
  assert.ok(source.includes('params.set("rate_plan_ids"'), "Prebook requests should send multiple rate plan ids");
  assert.ok(source.includes('params.set("booking_numbers"'), "Book requests should send multiple booking numbers");
});

test("errors page applies filters automatically without a search button", () => {
  const source = read("src/features/errors/ErrorsPage.tsx");

  assert.ok(source.includes("applyPrebookFilters"), "Prebook filters should auto-apply from input changes");
  assert.ok(source.includes("applyBookFilters"), "Book filters should auto-apply from input changes");
  assert.ok(source.includes("applyPrebookFilters(selectedErrorTypes, e.target.value)"), "Rate plan input changes should trigger filtering");
  assert.ok(source.includes("applyBookFilters(selectedErrorTypes, e.target.value)"), "Booking input changes should trigger filtering");
  assert.ok(!source.includes("> 搜索"), "Visible search button text should be removed");
});

test("static and backend error APIs support multi-value and date filters", () => {
  const staticFetch = read("src/lib/static-fetch.ts");
  const backend = read("backend/main.py");

  for (const marker of ["splitFilterValues", "error_types", "rate_plan_ids", "booking_numbers", "start_date", "end_date"]) {
    assert.ok(staticFetch.includes(marker), `Static fetch missing ${marker}`);
    assert.ok(backend.includes(marker), `Backend API missing ${marker}`);
  }
});
