import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

test("channel configuration page uses the approved A-style module structure", () => {
  const source = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.tsx");

  [
    'className="channel-config-page"',
    'className="channel-config-card"',
    "channel-config-summary",
    "QPS 查价",
    "PPS 酒店",
    "最后更新",
    "MarketplaceConfigurationPage.css"
  ].forEach((expected) => assert.ok(source.includes(expected), `Missing channel configuration marker: ${expected}`));
});

test("channel configuration card header keeps only the client id title", () => {
  const source = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.tsx");
  const css = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.css");

  assert.ok(!source.includes("channel-config-logo"), "Header must not render a generated avatar box");
  assert.ok(!source.includes("clientCode("), "Header must not derive a two-letter avatar code");
  assert.ok(!source.includes("渠道账号参数配置"), "Header must not render helper copy under the client id");
  assert.ok(!css.includes(".channel-config-card-header::before"), "Header must not render the left accent rail");
  assert.ok(!css.includes(".channel-config-logo"), "Header CSS must not include avatar styling");
});

test("boolean values use muted read-only switches", () => {
  const source = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.tsx");
  const css = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.css");

  assert.ok(source.includes("channel-config-readonly-switch"), "Boolean values should use switch markup");
  assert.ok(source.includes("disabled"), "Read-only switches should be disabled");
  assert.ok(source.includes("只读不可修改"), "Read-only switches should expose non-editable intent");
  assert.ok(!source.includes("channel-config-switch-value"), "Switches should not render visible yes/no text");
  assert.ok(!source.includes("channel-config-switch-note"), "Switches should not render a visible read-only label");
  assert.ok(css.includes(".channel-config-readonly-switch"), "Missing read-only switch styles");
  assert.ok(css.includes("cursor: not-allowed"), "Read-only switch should visually communicate non-editability");
  assert.ok(!source.includes("channel-config-status"), "Old yes/no status pills should be removed");
});

test("currency tags share the same neutral token style as IP values", () => {
  const source = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.tsx");
  const css = read("src/features/marketplace-configuration/MarketplaceConfigurationPage.css");

  assert.ok(source.includes("channel-config-token-list"), "Currency and IP values should use the shared token list");
  assert.ok(source.includes("channel-config-token"), "Currency and IP values should use shared token styling");
  assert.ok(!css.includes("currency-usd"), "Currency tags should not use per-currency colors");
  assert.ok(!css.includes("currency-eur"), "Currency tags should not use per-currency colors");
  assert.ok(!css.includes("currency-thb"), "Currency tags should not use per-currency colors");
});

test("channel configuration styling stays scoped to the module", () => {
  const cssPath = "src/features/marketplace-configuration/MarketplaceConfigurationPage.css";
  assert.ok(existsSync(join(root, cssPath)), "Missing channel configuration module CSS");

  const css = read(cssPath);
  assert.ok(css.includes(".channel-config-page"), "Missing scoped page root");
  assert.ok(css.includes(".channel-config-summary"), "Missing summary metric styles");
  assert.ok(!css.includes(".topbar"), "Module CSS must not style the global topbar");
  assert.ok(!css.includes(".sidebar"), "Module CSS must not style the global sidebar");
});
