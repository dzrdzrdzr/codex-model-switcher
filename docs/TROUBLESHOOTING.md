# Troubleshooting

## The command exists locally but not in Remote SSH

VS Code runs separate extension hosts for the local window and the remote workspace. Install the VSIX on the remote side:

```powershell
code --remote ssh-remote+your-host `
  --install-extension .\codex-direct-model-switcher-0.2.7.vsix `
  --force
```

After connecting, check the Extensions panel and confirm the extension appears under `SSH: your-host`.

## DeepSeek mode still uses localhost or MoonBridge

Run:

```text
Codex Source: Reapply Current Codex Source Setup
```

Then run:

```text
Codex Source: Show Current Codex Source Status
```

The status should show `https://api.deepseek.com/`, `wire_api = responses`, and `direct = true`.

If an old wrapper remains on `PATH`, remove or rename it only after confirming the real Codex binary is installed. The status command is designed to expose which executable is active.

## Switching one window changes another window

Confirm each environment has the extension installed in the correct extension host. Local VS Code and Remote SSH maintain separate settings, but two windows attached to the same remote host intentionally share that remote host's profile.

## Codex cannot start after switching

1. Run `Codex Source: Show Current Codex Source Status`.
2. Confirm Codex CLI is installed and preferably version `0.144.0` or newer.
3. Run `Codex Source: Reapply Current Codex Source Setup`.
4. Reload the current VS Code window.
5. If the problem remains, switch back with `Codex Source: Use GPT (OpenAI)` and attach redacted status output to a bug report.

## The DeepSeek API key is rejected

The extension cannot validate account status or billing. Confirm the key directly with DeepSeek and enter it again through `Codex Source: Use DeepSeek Direct`.

Do not paste the key into an issue, screenshot, terminal transcript, or status output.

## Remote helper requirements

Remote SSH mode requires:

- Linux
- `bash`
- `python3`
- a working Codex CLI installation

Run these on the remote host:

```bash
command -v bash
command -v python3
command -v codex
codex --version
```

## Reporting a bug

Include:

- operating system;
- local VS Code or Remote SSH;
- extension version;
- Codex version;
- selected model;
- redacted output from `Codex Source: Show Current Codex Source Status`;
- exact command that failed.

Never include API keys, access tokens, full `config.toml` files, or private hostnames.
