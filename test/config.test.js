'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { configureDeepSeekConfig, inspectDeepSeekConfig, parseStatus } = require('../lib/config');
const options = { model: 'deepseek-v4-pro', effort: 'high', modelCatalogPath: '/tmp/test models/models.json', apiKey: 'test-only-not-a-live-key' };

test('rewrites legacy relay configuration and preserves unrelated settings', () => {
  const original = `model = "deepseek-v4-pro"
model_provider = "moonbridge"
model_context_window = 9999999
base_instructions = """
A multiline value with a fake header.
[model_providers.deepseek]
"""
[model_providers.moonbridge]
base_url = "http://127.0.0.1:38440/v1"
[profiles.old]
model_provider = "moonbridge"
[mcp_servers.keep_me]
command = "example"
`;
  const updated = configureDeepSeekConfig(original, options);
  assert.doesNotMatch(updated, /moonbridge|127\.0\.0\.1|38440|model_context_window|base_instructions|\[profiles\./i);
  assert.match(updated, /\[mcp_servers\.keep_me\]\ncommand = "example"/);
  assert.equal(inspectDeepSeekConfig(updated).direct, true);
});

test('escapes quoted keys, backslashes, spaces and Chinese paths', () => {
  const key = 'test-only-"quoted"-\\path';
  const catalog = 'C:\\Users\\测试 A B\\models.json';
  const state = inspectDeepSeekConfig(configureDeepSeekConfig('', {...options, apiKey: key, modelCatalogPath: catalog}));
  assert.equal(state.apiKey, key);
  assert.equal(state.catalog, catalog);
});

test('parses redacted helper status without retaining secret fields', () => {
  const status = parseStatus('mode: deepseek\ndirect: true\napi_key_configured: true\ncodex_version: codex-cli 0.145.0\napi_key: test-only-not-a-live-key\n');
  assert.equal(status.mode, 'deepseek');
  assert.equal(status.direct, true);
  assert.equal(status.apiKeyConfigured, true);
  assert.equal(status.codexVersion, 'codex-cli 0.145.0');
  assert.equal(Object.hasOwn(status, 'api_key'), false);
});

test('bundled catalog includes both configured models and expected minimum client', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/models.json'), 'utf8'));
  const models = new Map(catalog.models.map(m => [m.slug, m]));
  for (const slug of ['deepseek-v4-pro','deepseek-v4-flash']) {
    const m = models.get(slug); assert.ok(m);
    assert.equal(m.context_window, 1048576);
    assert.equal(m.minimal_client_version, '0.144.0');
    assert.equal(m.apply_patch_tool_type, 'freeform');
    assert.equal(m.supports_parallel_tool_calls, true);
  }
});

for (const model of ['deepseek-v4-pro','deepseek-v4-flash']) {
  for (const effort of ['low','high','max']) {
    test(`empty profile and repeated application: ${model}/${effort}`, () => {
      const a = configureDeepSeekConfig('', {...options, model, effort});
      const b = configureDeepSeekConfig(a, {...options, model, effort});
      assert.equal(a, b);
      assert.equal(inspectDeepSeekConfig(a).model, model);
      assert.equal((a.match(/\[model_providers\.deepseek\]/g)||[]).length, 1);
    });
  }
}

test('BOM and CRLF input preserve non-provider settings', () => {
  const source = '\uFEFFmodel = "gpt-test"\r\napproval_policy = "on-request"\r\n[mcp_servers.keep]\r\ncommand = "example"\r\n';
  const out = configureDeepSeekConfig(source, options);
  assert.doesNotMatch(out, /\uFEFF|\r/);
  assert.match(out, /approval_policy = "on-request"/);
  assert.match(out, /command = "example"/);
});

test('input strings are not modified and key rotation replaces the old key', () => {
  const source = 'model = "gpt-test"\n';
  const deep = configureDeepSeekConfig(source, options);
  const rotated = configureDeepSeekConfig(deep, {...options, apiKey: 'test-only-replacement-key'});
  assert.equal(source, 'model = "gpt-test"\n');
  assert.doesNotMatch(rotated, /test-only-not-a-live-key/);
  assert.equal(inspectDeepSeekConfig(rotated).apiKey, 'test-only-replacement-key');
});

for (const [name, override] of [
  ['unknown model',{model:'unknown'}], ['unknown effort',{effort:'ultra'}],
  ['missing catalog',{modelCatalogPath:''}], ['empty key',{apiKey:''}],
  ['key with newline',{apiKey:'test\nvalue'}], ['key with NUL',{apiKey:'test\0value'}]
]) test(`rejects ${name}`, () => assert.throws(() => configureDeepSeekConfig('', {...options,...override})));

for (const endpoint of ['http://127.0.0.1:38440/v1','https://api.deepseek.com.evil.test/','https://other.test/']) {
  test(`does not report direct for ${endpoint}`, () => {
    const text = configureDeepSeekConfig('', options).replace('https://api.deepseek.com/',endpoint);
    assert.equal(inspectDeepSeekConfig(text).direct,false);
  });
}

test('missing configuration is reported as unknown, not connected', () => {
  assert.equal(inspectDeepSeekConfig('').direct, false);
  assert.equal(parseStatus('').mode, 'unknown');
});
