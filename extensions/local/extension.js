const vscode = require('vscode');
const childProcess = require('child_process');
const path = require('path');

function scriptPath(context, settingName, fallbackParts) {
  const configured = vscode.workspace.getConfiguration().get(settingName);
  if (configured && String(configured).trim()) {
    return String(configured).trim();
  }

  return path.resolve(context.extensionPath, ...fallbackParts);
}

function runPowerShell(script, args) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...args],
      { windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          error.message = `${error.message}\n${stderr || stdout}`;
          reject(error);
          return;
        }

        resolve((stdout || '').trim());
      }
    );
  });
}

async function switchMode(context, mode) {
  if (vscode.env.remoteName) {
    vscode.window.showWarningMessage('Codex Local Model Switcher only runs in local Windows VS Code windows.');
    return;
  }

  const script = scriptPath(context, 'codexModelSwitcher.localScript', ['..', '..', 'scripts', 'local', 'codex-local-model.ps1']);
  const output = await runPowerShell(script, [mode]);
  vscode.window.showInformationMessage(`Codex local mode switched to ${mode}. Reloading window...`);
  console.log(output);
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}

async function showStatus(context) {
  const script = scriptPath(context, 'codexModelSwitcher.localScript', ['..', '..', 'scripts', 'local', 'codex-local-model.ps1']);
  const output = await runPowerShell(script, ['status']);
  vscode.window.showInformationMessage(`Codex local status: ${output}`);
}

async function installLauncher(context) {
  if (vscode.env.remoteName) {
    vscode.window.showWarningMessage('Codex Local Model Switcher only installs into local Windows VS Code.');
    return;
  }

  const script = scriptPath(context, 'codexModelSwitcher.localInstallScript', ['..', '..', 'scripts', 'local', 'install-local.ps1']);
  const output = await runPowerShell(script, []);
  vscode.window.showInformationMessage('Codex local launcher installed. Reloading window...');
  console.log(output);
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codexModelSwitcher.local.install', () => installLauncher(context)),
    vscode.commands.registerCommand('codexModelSwitcher.local.gpt', () => switchMode(context, 'gpt')),
    vscode.commands.registerCommand('codexModelSwitcher.local.deepseek', () => switchMode(context, 'deepseek')),
    vscode.commands.registerCommand('codexModelSwitcher.local.status', () => showStatus(context))
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
