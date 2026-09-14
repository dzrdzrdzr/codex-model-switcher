'use strict';
const {describe, test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

// Only touch actual special-folder paths on disposable GitHub-hosted Windows runners.
// No real Codex binary, credential, login or network request is used.
describe('Compiled Windows launcher on disposable runner', {
  skip: process.platform !== 'win32' || process.env.GITHUB_ACTIONS !== 'true'
}, () => {
  let temp, launcher, probe, modePath, gptHome, deepHome, runtime;
  const created = [];
  function compile(source, output, versionFile, version) {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', path.resolve('scripts/compile-launcher.ps1'), '-SourcePath', source,
      '-OutputPath', output, '-VersionFile', versionFile, '-Version', version],
      {encoding: 'utf8', timeout: 60000});
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  function run(args = [], overrides = {}, input) {
    const result = spawnSync(launcher, args, {cwd: temp, input, encoding: 'utf8', timeout: 15000,
      env: {...process.env, CODEX_REAL_CLI: probe, SWITCHER_TEST_EXIT_CODE: '0', ...overrides}});
    assert.ifError(result.error);
    const fields = {args: []};
    for (const line of result.stdout.split(/\r?\n/)) {
      const match = /^(HOME|CWD|ARG|INPUT)=(.*)$/.exec(line);
      if (!match) continue;
      const value = Buffer.from(match[2], 'base64').toString('utf8');
      if (match[1] === 'ARG') fields.args.push(value); else fields[match[1]] = value;
    }
    return {...result, fields};
  }
  before(() => {
    assert.equal(process.env.RUNNER_ENVIRONMENT, 'github-hosted', 'Refuse real/self-hosted user-profile changes.');
    gptHome = path.join(os.homedir(), '.codex');
    deepHome = path.join(os.homedir(), '.codex-vscode-deepseek');
    runtime = path.join(process.env.LOCALAPPDATA, 'Codex-Direct-Model-Switcher');
    for (const directory of [gptHome, deepHome, runtime]) {
      assert.ok(!fs.existsSync(directory), `Refuse to change pre-existing profile: ${directory}`);
    }
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'switcher 编译 space-')); created.push(temp);
    for (const directory of [gptHome, deepHome, runtime]) { fs.mkdirSync(directory); created.push(directory); }
    modePath = path.join(runtime, 'mode.txt');
    fs.writeFileSync(path.join(gptHome, 'config.toml'), 'model = "gpt-fixture"\n');
    fs.writeFileSync(path.join(gptHome, 'auth.json'), '{"fixture_only":true}\n');
    fs.writeFileSync(path.join(deepHome, 'config.toml'), 'model = "deepseek-v4-pro"\nmodel_reasoning_effort = "high"\n\n[model_providers.deepseek]\nexperimental_bearer_token = "FAKE_WINDOWS_TEST_CREDENTIAL"\n');
    launcher = path.join(temp, 'actual launcher.exe');
    probe = path.join(temp, 'probe 中文.exe');
    compile(path.resolve('scripts/CodexProfileLauncher.cs'), launcher, path.join(temp, 'version.txt'), 'test-1');
    compile(path.resolve('test/LauncherProbe.cs'), probe, path.join(temp, 'probe-version.txt'), 'test-1');
    // Production ignores small relay wrappers. A PE overlay makes this harmless test
    // executable meet the same size threshold without changing production discovery.
    const descriptor = fs.openSync(probe, 'r+');
    try { fs.ftruncateSync(descriptor, 1024 * 1024 + 128); } finally { fs.closeSync(descriptor); }
  });
  beforeEach(() => { if (modePath) fs.rmSync(modePath, {force: true}); });
  after(() => { for (const directory of created.reverse()) fs.rmSync(directory, {recursive: true, force: true}); });
  test('compilation cache preserves an existing matching launcher', () => {
    const hash = require('node:crypto').createHash('sha256').update(fs.readFileSync(launcher)).digest('hex');
    compile(path.resolve('scripts/CodexProfileLauncher.cs'), launcher, path.join(temp, 'version.txt'), 'test-1');
    assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(launcher)).digest('hex'), hash);
  });
  test('default OpenAI home, current directory and inherited stdin are correct', () => {
    const r = run(['--echo-stdin'], {}, 'fixture input 中文\n');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.fields.HOME, gptHome); assert.equal(r.fields.CWD, temp);
    assert.equal(r.fields.INPUT, 'fixture input 中文\n');
  });
  test('spaces, Unicode, empty values, quotes and trailing backslashes round-trip', () => {
    const args = ['', 'two words', '中文参数', 'C:\\a b\\', 'a"b', '\\"', 'line1\nline2'];
    const r = run(args); assert.equal(r.status, 0, r.stderr); assert.deepEqual(r.fields.args, args);
  });
  test('DeepSeek overrides model and effort but never puts the credential in argv', () => {
    fs.writeFileSync(modePath, 'deepseek\n');
    const r = run(['app-server']); assert.equal(r.status, 0, r.stderr);
    assert.equal(r.fields.HOME, deepHome);
    assert.deepEqual(r.fields.args, ['-c', 'model=deepseek-v4-pro', '-c', 'model_reasoning_effort=high', 'app-server']);
    assert.ok(!(r.stdout + r.stderr).includes('FAKE_WINDOWS_TEST_CREDENTIAL'));
  });
  test('switching back to OpenAI preserves the existing configuration and auth file', () => {
    fs.writeFileSync(modePath, 'deepseek\n'); assert.equal(run().status, 0);
    fs.writeFileSync(modePath, 'gpt\n'); const r = run(['app-server']);
    assert.equal(r.status, 0, r.stderr); assert.equal(r.fields.HOME, gptHome);
    assert.deepEqual(r.fields.args, ['app-server']);
    assert.equal(fs.readFileSync(path.join(gptHome, 'config.toml'), 'utf8'), 'model = "gpt-fixture"\n');
    assert.equal(fs.readFileSync(path.join(gptHome, 'auth.json'), 'utf8'), '{"fixture_only":true}\n');
  });
  test('child exit status is preserved', () => { assert.equal(run([], {SWITCHER_TEST_EXIT_CODE: '23'}).status, 23); });
  test('unknown mode falls back to OpenAI', () => {
    fs.writeFileSync(modePath, 'invalid-mode\n'); const r = run();
    assert.equal(r.status, 0, r.stderr); assert.equal(r.fields.HOME, gptHome);
  });
});
