const vscode = require('vscode');
const childProcess = require('child_process');
const path = require('path');

function scriptPath(context) {
  const configured = vscode.workspace.getConfiguration().get('codexModelSwitcher.sshScript');
  if (configured && String(configured).trim()) {
    return String(configured).trim();
  }

  return path.resolve(context.extensionPath, '..', '..', 'scripts', 'ssh', 'codex-vscode-model.sh');
}

function runScript(script, args) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(script, args, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\n${stderr || stdout}`;
        reject(error);
        return;
      }

      resolve((stdout || '').trim());
    });
  });
}

async function ensureRemote() {
  if (!vscode.env.remoteName) {
    vscode.window.showWarningMessage('Codex SSH Model Switcher is intended for VS Code Remote windows.');
    return false;
  }

  return true;
}

async function switchMode(context, mode) {
  if (!(await ensureRemote())) {
    return;
  }

  const output = await runScript(scriptPath(context), [mode]);
  vscode.window.showInformationMessage(`Codex SSH mode switched to ${mode}. Reloading window...`);
  console.log(output);
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}

async function showStatus(context) {
  const output = await runScript(scriptPath(context), ['status']);
  vscode.window.showInformationMessage(`Codex SSH status: ${output}`);
}

async function installWrapper(context) {
  if (!(await ensureRemote())) {
    return;
  }

  const output = await runScript(scriptPath(context), ['install']);
  vscode.window.showInformationMessage('Codex SSH wrapper installed. Reloading window...');
  console.log(output);
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codexModelSwitcher.ssh.install', () => installWrapper(context)),
    vscode.commands.registerCommand('codexModelSwitcher.ssh.gpt', () => switchMode(context, 'gpt')),
    vscode.commands.registerCommand('codexModelSwitcher.ssh.deepseek', () => switchMode(context, 'deepseek')),
    vscode.commands.registerCommand('codexModelSwitcher.ssh.status', () => showStatus(context))
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
