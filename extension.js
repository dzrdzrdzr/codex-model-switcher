'use strict';

const vscode = require('vscode');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {
  configureDeepSeekConfig,
  inspectDeepSeekConfig,
  parseStatus
} = require('./lib/config');

const output = vscode.window.createOutputChannel('Codex Direct Source Switcher');
const runtimeRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Codex-Direct-Model-Switcher');
const localModeFile = path.join(runtimeRoot, 'mode.txt');
const localLauncher = path.join(runtimeRoot, 'codex-profile-launcher.exe');
const launcherCommand = 'codex-vscode-profile';
const launcherVersionFile = path.join(runtimeRoot, 'launcher-version.txt');
const launcherVersion = '1';
let extensionRoot;
let statusItem;

function configuration() {
  const config = vscode.workspace.getConfiguration('codexDirectModelSwitcher');
  return {
    model: config.get('deepSeekModel', 'deepseek-v4-pro'),
    effort: config.get('reasoningEffort', 'high'),
    remoteOverride: config.get('remoteSshTarget', '').trim()
  };
}

function commandLine(command, args) {
  return [command, ...args].map((part) => {
    const value = String(part);
    return /\s/.test(value) ? JSON.stringify(value) : value;
  }).join(' ');
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: options.env || process.env
    });
    const chunks = [];
    const errorChunks = [];
    let total = 0;
    const maxBuffer = options.maxBuffer || 2 * 1024 * 1024;
    const timeout = setTimeout(() => {
      child.kill();
    }, options.timeout || 60000);

    child.stdout.on('data', (chunk) => {
      total += chunk.length;
      if (total <= maxBuffer) chunks.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      total += chunk.length;
      if (total <= maxBuffer) errorChunks.push(chunk);
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      const stdout = Buffer.concat(chunks).toString('utf8');
      const stderr = Buffer.concat(errorChunks).toString('utf8');
      output.appendLine(`$ ${commandLine(command, args)}`);
      if (options.sensitiveOutput) {
        output.appendLine('[command output redacted]');
      } else {
        if (stdout.trim()) output.appendLine(stdout.trimEnd());
        if (stderr.trim()) output.appendLine(stderr.trimEnd());
      }
      if (total > maxBuffer) {
        reject(new Error(`${path.basename(command)} produced too much output.`));
        return;
      }
      if (code !== 0) {
        const detail = stderr.trim() || `exit code ${code}${signal ? ` (${signal})` : ''}`;
        reject(new Error(`${path.basename(command)} failed: ${detail}`));
        return;
      }
      resolve({ stdout, stderr });
    });

    if (options.input !== undefined) child.stdin.end(options.input);
    else child.stdin.end();
  });
}

function remoteAuthority() {
  const folder = (vscode.workspace.workspaceFolders || []).find((item) => item.uri.scheme === 'vscode-remote');
  if (folder?.uri.authority) return folder.uri.authority;
  if (vscode.workspace.workspaceFile?.authority) return vscode.workspace.workspaceFile.authority;
  return '';
}

function decodeSshTarget(authority) {
  const prefix = 'ssh-remote+';
  if (!authority.toLowerCase().startsWith(prefix)) return '';
  try {
    return decodeURIComponent(authority.slice(prefix.length));
  } catch {
    return authority.slice(prefix.length);
  }
}

function currentTarget() {
  if (!vscode.env.remoteName) return { kind: 'local', label: 'Local VS Code' };
  if (vscode.env.remoteName !== 'ssh-remote') {
    throw new Error(`This version supports local VS Code and Remote SSH; current remote type is ${vscode.env.remoteName}.`);
  }

  const settings = configuration();
  const detected = decodeSshTarget(remoteAuthority());
  const sshTarget = settings.remoteOverride || detected;
  if (process.platform !== 'win32') {
    return {
      kind: 'remote-host',
      sshTarget,
      label: sshTarget ? `Remote SSH: ${sshTarget}` : 'Remote SSH'
    };
  }
  if (!sshTarget) {
    throw new Error('Could not detect the current SSH host. Set codexDirectModelSwitcher.remoteSshTarget for this window.');
  }
  if (/^[\s-]|[\r\n\0]/.test(sshTarget)) throw new Error('The detected SSH target is invalid.');
  return { kind: 'ssh', sshTarget, label: `Remote SSH: ${sshTarget}` };
}

function sshArguments(target, remoteArgs) {
  return [
    '-T',
    '-o', 'BatchMode=yes',
    '-o', 'ClearAllForwardings=yes',
    '-o', 'ConnectTimeout=15',
    '--', target.sshTarget,
    ...remoteArgs
  ];
}

function remoteHelper() {
  return fs.readFileSync(path.join(extensionRoot, 'scripts', 'remote-helper.sh'), 'utf8')
    .replace(/\r\n/g, '\n');
}

function runRemoteHelper(target, helperArgs, options = {}) {
  if (target.kind === 'remote-host') {
    return runProcess('bash', [path.join(extensionRoot, 'scripts', 'remote-helper.sh'), ...helperArgs], options);
  }
  return runProcess('ssh.exe', sshArguments(target, ['bash', '-s', '--', ...helperArgs]), {
    ...options,
    input: remoteHelper()
  });
}

function localPaths() {
  const userHome = os.homedir();
  return {
    gptHome: path.join(userHome, '.codex'),
    deepHome: path.join(userHome, '.codex-vscode-deepseek')
  };
}

function readLocalMode() {
  try {
    return fs.readFileSync(localModeFile, 'utf8').trim().toLowerCase() === 'deepseek' ? 'deepseek' : 'gpt';
  } catch {
    // Read-only migration hint for the previous switcher. The new mode file is
    // written only after the user explicitly switches with this version.
    const legacy = path.join(path.dirname(runtimeRoot), 'Codex-4Mode', 'local-mode.txt');
    try {
      return /deepseek/i.test(fs.readFileSync(legacy, 'utf8')) ? 'deepseek' : 'gpt';
    } catch {
      return 'gpt';
    }
  }
}

function localStatus() {
  const mode = readLocalMode();
  const homes = localPaths();
  const codexHome = mode === 'deepseek' ? homes.deepHome : homes.gptHome;
  const configPath = path.join(codexHome, 'config.toml');
  const text = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
  const directInfo = inspectDeepSeekConfig(text);
  return {
    mode,
    target: 'local',
    model: directInfo.model,
    provider: directInfo.provider,
    baseUrl: directInfo.baseUrl,
    wireApi: directInfo.wireApi,
    codexHome,
    launcher: localLauncher,
    apiKeyConfigured: directInfo.apiKeyConfigured,
    direct: mode === 'deepseek' && directInfo.direct,
    codexVersion: ''
  };
}

async function getStatus(target) {
  if (target.kind === 'local') return localStatus();
  const result = await runRemoteHelper(target, ['status'], { timeout: 20000 });
  return parseStatus(result.stdout);
}

function statusLabel(status) {
  if (status.mode === 'deepseek' && status.direct) return 'DeepSeek Direct';
  if (status.mode === 'deepseek') return 'DeepSeek (needs setup)';
  if (status.mode === 'gpt') return 'GPT';
  return 'Unknown';
}

async function refreshStatus(silent = true) {
  try {
    const target = currentTarget();
    const status = await getStatus(target);
    statusItem.text = `$(sync) Codex: ${statusLabel(status)}`;
    statusItem.tooltip = [
      target.label,
      `Mode: ${status.mode}`,
      status.model ? `Model: ${status.model}` : undefined,
      status.provider ? `Provider: ${status.provider}` : undefined,
      status.baseUrl ? `Base URL: ${status.baseUrl}` : undefined,
      status.wireApi ? `Wire API: ${status.wireApi}` : undefined,
      status.codexHome ? `CODEX_HOME: ${status.codexHome}` : undefined,
      status.codexVersion ? `Codex: ${status.codexVersion}` : undefined,
      status.mode === 'deepseek' ? `API Key configured: ${status.apiKeyConfigured ? 'yes' : 'no'}` : undefined,
      '',
      'Click to switch this VS Code window. No automatic reload or process termination.'
    ].filter(Boolean).join('\n');
    statusItem.backgroundColor = status.mode === 'deepseek' && !status.direct
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined;
    if (!silent) vscode.window.showInformationMessage(`${target.label} Codex is ${statusLabel(status)}.`);
    return status;
  } catch (error) {
    statusItem.text = '$(warning) Codex: switcher error';
    statusItem.tooltip = `${error.message}\nClick to open the switcher.`;
    statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    if (!silent) {
      vscode.window.showErrorMessage(`Codex model status failed: ${error.message}`);
      output.show(true);
    }
    return undefined;
  }
}

function atomicWrite(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.codex-direct-${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, contents, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function officialModelsJson() {
  const assetPath = path.join(extensionRoot, 'assets', 'models.json');
  const text = fs.readFileSync(assetPath, 'utf8');
  const parsed = JSON.parse(text);
  const slugs = new Set((parsed.models || []).map((item) => item.slug));
  if (!slugs.has('deepseek-v4-pro') || !slugs.has('deepseek-v4-flash')) {
    throw new Error('Bundled official models.json is invalid.');
  }
  return text.endsWith('\n') ? text : `${text}\n`;
}

function readLocalSourceConfig() {
  const homes = localPaths();
  const deepConfig = path.join(homes.deepHome, 'config.toml');
  const gptConfig = path.join(homes.gptHome, 'config.toml');
  const sourcePath = fs.existsSync(deepConfig) ? deepConfig : gptConfig;
  if (!fs.existsSync(sourcePath)) throw new Error(`Codex config was not found: ${gptConfig}`);
  return fs.readFileSync(sourcePath, 'utf8');
}

async function readSourceConfig(target) {
  if (target.kind === 'local') return readLocalSourceConfig();
  const result = await runRemoteHelper(target, ['read-config'], {
    timeout: 20000,
    sensitiveOutput: true,
    maxBuffer: 4 * 1024 * 1024
  });
  return result.stdout;
}

async function requestApiKey(existingConfig, target) {
  const existing = inspectDeepSeekConfig(existingConfig).apiKey;
  if (existing) return existing;

  const value = await vscode.window.showInputBox({
    title: `DeepSeek API Key · ${target.label}`,
    prompt: 'The key is stored only in this environment\'s isolated DeepSeek config.toml, following DeepSeek\'s official Codex setup.',
    placeHolder: 'sk-...',
    password: true,
    ignoreFocusOut: true,
    validateInput: (input) => {
      const trimmed = input.trim();
      if (trimmed.length < 8) return 'Enter a valid DeepSeek API Key.';
      if (/[\r\n\0]/.test(trimmed)) return 'The API Key contains invalid characters.';
      return undefined;
    }
  });
  return value?.trim();
}

async function compileLocalLauncher() {
  fs.mkdirSync(runtimeRoot, { recursive: true });
  const script = path.join(extensionRoot, 'scripts', 'compile-launcher.ps1');
  const source = path.join(extensionRoot, 'scripts', 'CodexProfileLauncher.cs');
  await runProcess('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', script,
    '-SourcePath', source,
    '-OutputPath', localLauncher,
    '-VersionFile', launcherVersionFile,
    '-Version', launcherVersion
  ], { timeout: 60000 });
}

function installLocalPathShim() {
  const entries = (process.env.PATH || '')
    .split(path.delimiter)
    .map((entry) => entry.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
  const preferred = [
    process.env.APPDATA ? path.join(process.env.APPDATA, 'npm') : '',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code', 'bin') : ''
  ].filter(Boolean);
  const normalizedEntries = new Map(entries.map((entry) => [path.resolve(entry).toLowerCase(), entry]));
  const candidates = [
    ...preferred.map((entry) => normalizedEntries.get(path.resolve(entry).toLowerCase())).filter(Boolean),
    ...entries.filter((entry) => path.resolve(entry).toLowerCase().startsWith(`${path.resolve(os.homedir()).toLowerCase()}${path.sep}`))
  ];

  for (const directory of [...new Set(candidates)]) {
    try {
      if (!fs.statSync(directory).isDirectory()) continue;
      fs.accessSync(directory, fs.constants.W_OK);
      const shim = path.join(directory, `${launcherCommand}.exe`);
      const temporary = `${shim}.${crypto.randomUUID()}.tmp.exe`;
      try {
        fs.copyFileSync(localLauncher, temporary);
        fs.renameSync(temporary, shim);
      } finally {
        if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
      }
      return shim;
    } catch {
      // Try the next user-owned directory already present in PATH.
    }
  }
  throw new Error(`Could not install ${launcherCommand}.exe into a writable user PATH directory.`);
}

async function configureLauncherCommand() {
  await vscode.workspace.getConfiguration('chatgpt').update(
    'cliExecutable',
    launcherCommand,
    vscode.ConfigurationTarget.Global
  );
}

async function installLocal(mode, apiKey) {
  const homes = localPaths();
  const gptConfig = path.join(homes.gptHome, 'config.toml');
  if (!fs.existsSync(gptConfig)) throw new Error(`Codex config was not found: ${gptConfig}`);

  await compileLocalLauncher();
  if (mode === 'deepseek') {
    const settings = configuration();
    const source = readLocalSourceConfig();
    const configPath = path.join(homes.deepHome, 'config.toml');
    const modelsPath = path.join(homes.deepHome, 'models.json');
    fs.mkdirSync(homes.deepHome, { recursive: true });
    const backup = `${configPath}.before-direct.bak`;
    if (fs.existsSync(configPath) && !fs.existsSync(backup)) fs.copyFileSync(configPath, backup);
    const isolatedAuth = path.join(homes.deepHome, 'auth.json');
    if (fs.existsSync(isolatedAuth)) {
      const authBackup = `${isolatedAuth}.before-direct.${Date.now()}.bak`;
      fs.renameSync(isolatedAuth, authBackup);
    }
    const updated = configureDeepSeekConfig(source, {
      model: settings.model,
      effort: settings.effort,
      modelCatalogPath: modelsPath,
      apiKey
    });
    atomicWrite(configPath, updated);
    atomicWrite(modelsPath, officialModelsJson());
  }

  atomicWrite(localModeFile, `${mode}\n`);
  installLocalPathShim();
  await configureLauncherCommand();
}

async function writeRemoteFile(target, remotePath, contents, sensitiveOutput = false) {
  if (!/^\/tmp\/codex-direct-switcher-[A-Za-z0-9-]+\.(?:config\.toml|models\.json)$/.test(remotePath)) {
    throw new Error('Refusing to write an unexpected remote temporary path.');
  }
  if (target.kind === 'remote-host') {
    atomicWrite(remotePath, contents);
    if (sensitiveOutput) output.appendLine(`[wrote sensitive remote file: ${remotePath}]`);
    return;
  }
  const command = `umask 077; cat > '${remotePath}'`;
  await runProcess('ssh.exe', sshArguments(target, [command]), {
    input: contents,
    timeout: 30000,
    sensitiveOutput,
    maxBuffer: 4 * 1024 * 1024
  });
}

async function cleanupRemote(target, paths) {
  try {
    await runRemoteHelper(target, ['cleanup', ...paths], { timeout: 15000 });
  } catch (error) {
    output.appendLine(`Remote temporary-file cleanup warning: ${error.message}`);
  }
}

async function installRemote(target, mode, apiKey, sourceConfig) {
  const settings = configuration();
  if (mode === 'gpt') {
    await runRemoteHelper(target, ['install', 'gpt', settings.effort, settings.model, '', ''], { timeout: 60000 });
    await configureLauncherCommand();
    return;
  }

  const suffix = crypto.randomUUID();
  const remoteConfig = `/tmp/codex-direct-switcher-${suffix}.config.toml`;
  const remoteModels = `/tmp/codex-direct-switcher-${suffix}.models.json`;
  const updated = configureDeepSeekConfig(sourceConfig, {
    model: settings.model,
    effort: settings.effort,
    modelCatalogPath: '~/.codex-vscode-deepseek/models.json',
    apiKey
  });

  try {
    await writeRemoteFile(target, remoteConfig, updated, true);
    await writeRemoteFile(target, remoteModels, officialModelsJson());
    await runRemoteHelper(target, [
      'install', 'deepseek', settings.effort, settings.model, remoteConfig, remoteModels
    ], { timeout: 60000 });
    await configureLauncherCommand();
  } finally {
    await cleanupRemote(target, [remoteConfig, remoteModels]);
  }
}

async function switchMode(mode, repair = false) {
  const target = currentTarget();
  const label = mode === 'deepseek' ? 'DeepSeek Direct' : 'GPT (OpenAI)';
  const action = repair ? `Reapply ${label}` : `Switch to ${label}`;
  const detail = mode === 'deepseek'
    ? 'DeepSeek will use its native Responses API at https://api.deepseek.com/ with the isolated direct profile.'
    : 'GPT will use the default .codex profile for this environment.';
  const choice = await vscode.window.showWarningMessage(
    `${action} for ${target.label}? ${detail} The window will not reload automatically.`,
    { modal: false },
    action
  );
  if (choice !== action) return;

  let sourceConfig = '';
  let apiKey;
  if (mode === 'deepseek') {
    sourceConfig = await readSourceConfig(target);
    apiKey = await requestApiKey(sourceConfig, target);
    if (!apiKey) return;
  }

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `${action} · ${target.label}`,
    cancellable: false
  }, async () => {
    if (target.kind === 'local') await installLocal(mode, apiKey);
    else await installRemote(target, mode, apiKey, sourceConfig);
  });

  await refreshStatus(true);
  const reload = await vscode.window.showInformationMessage(
    `${target.label} Codex is configured for ${label}. Existing Codex processes were left running; reload this window when ready to apply the change.`,
    'Reload current window'
  );
  if (reload === 'Reload current window') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function showSwitcher() {
  const current = await refreshStatus(true);
  const target = currentTarget();
  const picked = await vscode.window.showQuickPick([
    {
      label: 'DeepSeek Direct',
      description: current?.mode === 'deepseek' && current.direct ? 'current' : 'official Responses API',
      detail: 'https://api.deepseek.com/ · official Responses API · isolated CODEX_HOME',
      mode: 'deepseek'
    },
    {
      label: 'GPT (OpenAI)',
      description: current?.mode === 'gpt' ? 'current' : 'default profile',
      detail: 'Uses this environment\'s default .codex directory',
      mode: 'gpt'
    },
    { label: 'Show Status', description: target.label, command: 'status' },
    { label: 'Reapply Current Setup', description: 'repair launcher/config without automatic reload', command: 'repair' }
  ], {
    title: `Codex Source Switcher · ${target.label}`,
    placeHolder: 'Choose the model source used by this VS Code window'
  });
  if (!picked) return;
  if (picked.mode) return switchMode(picked.mode);
  if (picked.command === 'status') {
    await refreshStatus(false);
    output.show(true);
    return;
  }
  if (picked.command === 'repair') {
    const mode = current?.mode === 'deepseek' ? 'deepseek' : 'gpt';
    return switchMode(mode, true);
  }
}

async function repairLauncherCompatibility() {
  const target = currentTarget();
  if (target.kind === 'local') {
    if (!fs.existsSync(localLauncher)) return;
    installLocalPathShim();
  } else {
    await runRemoteHelper(target, ['ensure-launcher'], { timeout: 30000 });
  }
  await configureLauncherCommand();
}

async function activate(context) {
  extensionRoot = context.extensionPath;
  console.log(`[Codex Direct Source Switcher] activated (${vscode.env.remoteName || 'local'})`);
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusItem.name = 'Codex Direct Source Switcher';
  statusItem.command = 'codexLocalModelSwitcher.switch';
  statusItem.text = '$(sync) Codex: checking';
  statusItem.tooltip = 'Click to switch GPT / DeepSeek Direct for this VS Code window.';
  statusItem.show();

  context.subscriptions.push(
    output,
    statusItem,
    vscode.commands.registerCommand('codexLocalModelSwitcher.switch', showSwitcher),
    vscode.commands.registerCommand('codexLocalModelSwitcher.useGpt', () => switchMode('gpt')),
    vscode.commands.registerCommand('codexLocalModelSwitcher.useDeepSeek', () => switchMode('deepseek')),
    vscode.commands.registerCommand('codexLocalModelSwitcher.status', async () => {
      await refreshStatus(false);
      output.show(true);
    }),
    vscode.commands.registerCommand('codexLocalModelSwitcher.repair', async () => {
      const current = await refreshStatus(true);
      await switchMode(current?.mode === 'deepseek' ? 'deepseek' : 'gpt', true);
    }),
    vscode.commands.registerCommand('codexModelSwitcher.switch', showSwitcher),
    vscode.commands.registerCommand('codexModelSwitcher.useGpt', () => switchMode('gpt')),
    vscode.commands.registerCommand('codexModelSwitcher.useDeepSeek', () => switchMode('deepseek')),
    vscode.commands.registerCommand('codexModelSwitcher.status', async () => {
      await refreshStatus(false);
      output.show(true);
    }),
    vscode.commands.registerCommand('codexModelSwitcher.repair', async () => {
      const current = await refreshStatus(true);
      await switchMode(current?.mode === 'deepseek' ? 'deepseek' : 'gpt', true);
    })
  );

  try {
    await repairLauncherCompatibility();
  } catch (error) {
    output.appendLine(`Launcher compatibility repair warning: ${error.message}`);
  }
  refreshStatus(true);
  if (!vscode.env.remoteName) {
    const timer = setInterval(() => refreshStatus(true), 30000);
    context.subscriptions.push({ dispose: () => clearInterval(timer) });
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
