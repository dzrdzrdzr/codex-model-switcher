'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  configureDeepSeekConfig,
  inspectDeepSeekConfig,
  parseStatus
} = require('../lib/config');

test('rewrites a legacy relay profile to DeepSeek native Responses without losing unrelated settings', () => {
  const original = `model = "deepseek-v4-pro"
model_provider = "moonbridge"
model_context_window = 9999999
base_instructions = """
This multiline value even contains a fake header.
[model_providers.deepseek]
"""

[model_providers.moonbridge]
name = "MoonBridge"
base_url = "http://127.0.0.1:38440/v1"
wire_api = "responses"

[profiles.old]
model_provider = "moonbridge"

[mcp_servers.keep_me]
command = "example"
`;

  const updated = configureDeepSeekConfig(original, {
    model: 'deepseek-v4-pro',
    effort: 'max',
    modelCatalogPath: 'C:\\Users\\Example\\.codex-vscode-deepseek\\models.json',
    apiKey: 'test-api-key-value'
  });

  assert.doesNotMatch(updated, /moonbridge/i);
  assert.doesNotMatch(updated, /127\.0\.0\.1|38440|model_context_window|base_instructions/);
  assert.doesNotMatch(updated, /\[profiles\./);
  assert.match(updated, /\[mcp_servers\.keep_me\]\ncommand = "example"/);
  assert.match(updated, /model_provider = "deepseek"/);
  assert.match(updated, /base_url = "https:\/\/api\.deepseek\.com\/"/);
  assert.match(updated, /wire_api = "responses"/);
  assert.match(updated, /model_reasoning_effort = "max"/);

  const state = inspectDeepSeekConfig(updated);
  assert.equal(state.direct, true);
  assert.equal(state.apiKeyConfigured, true);
  assert.equal(state.apiKey, 'test-api-key-value');
  assert.equal(state.model, 'deepseek-v4-pro');
});

test('escapes API keys and Windows paths as TOML basic strings', () => {
  const apiKey = 'test-api-key-"quoted"-\\path';
  const catalog = 'C:\\Users\\A B\\models.json';
  const updated = configureDeepSeekConfig('', {
    model: 'deepseek-v4-flash',
    effort: 'low',
    modelCatalogPath: catalog,
    apiKey
  });
  const state = inspectDeepSeekConfig(updated);
  assert.equal(state.apiKey, apiKey);
  assert.equal(state.catalog, catalog);
  assert.equal(state.model, 'deepseek-v4-flash');
});

test('parses redacted helper status', () => {
  const status = parseStatus(`target: remote
mode: deepseek
model: deepseek-v4-pro
provider: deepseek
base_url: https://api.deepseek.com/
wire_api: responses
api_key_configured: true
direct: true
codex_version: codex-cli 0.145.0
`);
  assert.equal(status.mode, 'deepseek');
  assert.equal(status.direct, true);
  assert.equal(status.apiKeyConfigured, true);
  assert.equal(status.codexVersion, 'codex-cli 0.145.0');
});

test('bundles the official catalog for both DeepSeek V4 models', () => {
  const catalogPath = path.join(__dirname, '..', 'assets', 'models.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const models = new Map(catalog.models.map((model) => [model.slug, model]));
  for (const slug of ['deepseek-v4-pro', 'deepseek-v4-flash']) {
    const model = models.get(slug);
    assert.ok(model, `missing ${slug}`);
    assert.equal(model.context_window, 1048576);
    assert.equal(model.minimal_client_version, '0.144.0');
    assert.equal(model.apply_patch_tool_type, 'freeform');
    assert.equal(model.supports_parallel_tool_calls, true);
  }
});
