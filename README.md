# Codex Model Switcher

Codex Model Switcher is a small set of scripts and VS Code commands for switching the Codex CLI used by the ChatGPT/Codex VS Code extension between:

- the default GPT-backed Codex profile
- a DeepSeek profile served through a MoonBridge-compatible local OpenAI API proxy

It includes two independent paths:

- `extensions/local` and `scripts/local` for a local Windows VS Code installation
- `extensions/ssh` and `scripts/ssh` for VS Code Remote - SSH / remote Linux environments

The local and SSH switchers use separate runtime directories and do not share state.

## What this solves

The ChatGPT/Codex VS Code extension starts a Codex executable. In some setups, changing VS Code settings alone is not enough because the spawned process keeps using the same profile or executable path. This project adds a small launcher/wrapper layer that reads a selected mode, sets the right `CODEX_HOME`, and then starts the real Codex executable.

After switching, the VS Code window is reloaded so the extension starts a fresh Codex process with the new mode.

## Privacy-first defaults

This repository intentionally avoids machine-specific paths, usernames, tokens, API keys, logs, process IDs, and generated state.

Runtime files are written outside the repository by default:

- Windows local runtime: `%LOCALAPPDATA%\CodexModelSwitcher`
- SSH/Linux runtime: `$HOME/.cache/codex-model-switcher`

Run the redaction check before publishing:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-redaction.ps1
```

## Local Windows setup

The local setup is for a normal Windows VS Code window. It deliberately skips remote windows.

1. Build and install the local Codex launcher:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local\install-local.ps1
   ```

2. Install or run the VS Code extension in `extensions/local`.

3. Use the command palette:

   - `Codex Local: Switch to GPT`
   - `Codex Local: Switch to DeepSeek`
   - `Codex Local: Show Current Mode`

### Local configuration

Optional environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `CODEX_SWITCHER_RUNTIME_ROOT` | Runtime state directory | `%LOCALAPPDATA%\CodexModelSwitcher` |
| `CODEX_SWITCHER_GPT_HOME` | Codex home for GPT mode | `%USERPROFILE%\.codex` |
| `CODEX_SWITCHER_DEEPSEEK_HOME` | Codex home for DeepSeek mode | `%USERPROFILE%\.codex-deepseek` |
| `CODEX_SWITCHER_DEEPSEEK_MODEL` | DeepSeek model name | `deepseek-v4-pro` |
| `CODEX_SWITCHER_DEEPSEEK_PROVIDER` | Codex provider name | `moonbridge` |
| `CODEX_SWITCHER_MOONBRIDGE_BASE_URL` | MoonBridge OpenAI-compatible endpoint | `http://127.0.0.1:17898/v1` |

## SSH / Remote setup

The SSH setup is for the remote side of VS Code Remote - SSH. Install it inside the remote environment, not on the local desktop.

1. Copy this repository to the remote host.

2. Install the remote wrapper:

   ```bash
   bash scripts/ssh/install-ssh.sh
   ```

3. In the remote VS Code settings, set:

   ```json
   {
     "chatgpt.cliExecutable": "~/.local/bin/codex-vscode-switcher"
   }
   ```

4. Install or run the VS Code extension in `extensions/ssh`.

5. Use the command palette:

   - `Codex SSH: Switch to GPT`
   - `Codex SSH: Switch to DeepSeek`
   - `Codex SSH: Show Current Mode`

### SSH configuration

Optional environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `CODEX_SWITCHER_RUNTIME_ROOT` | Runtime state directory | `$HOME/.cache/codex-model-switcher` |
| `CODEX_SWITCHER_GPT_HOME` | Codex home for GPT mode | `$HOME/.codex` |
| `CODEX_SWITCHER_DEEPSEEK_HOME` | Codex home for DeepSeek mode | `$HOME/.codex-deepseek` |
| `CODEX_SWITCHER_DEEPSEEK_MODEL` | DeepSeek model name | `deepseek-v4-pro` |
| `CODEX_SWITCHER_DEEPSEEK_PROVIDER` | Codex provider name | `moonbridge` |
| `CODEX_SWITCHER_MOONBRIDGE_BASE_URL` | MoonBridge OpenAI-compatible endpoint | `http://127.0.0.1:17898/v1` |
| `CODEX_SWITCHER_REAL_CODEX` | Path to the real Codex executable | auto-detected |

## Development checks

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\test-syntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-redaction.ps1
```

## Notes

- This project is community-maintained and is not an official OpenAI project.
- The scripts assume the Codex CLI and the ChatGPT/Codex VS Code extension are already installed.
- MoonBridge must already be running when DeepSeek mode is used.
