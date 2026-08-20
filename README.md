# Codex Direct Source Switcher

![Codex Direct Source Switcher](https://raw.githubusercontent.com/dzrdzrdzr/codex-model-switcher/main/assets/social-preview.jpg)

[![Version](https://img.shields.io/badge/version-0.2.7-18b6d9?style=flat-square)](https://github.com/dzrdzrdzr/codex-model-switcher/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-74c7a2?style=flat-square)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-local-4aa3ff?style=flat-square)](#quick-start)
[![Remote SSH](https://img.shields.io/badge/Remote%20SSH-supported-4aa3ff?style=flat-square)](#remote-ssh)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-Responses%20API-00d4ff?style=flat-square)](#verify-deepseek-direct)

**Switch VS Code Codex between OpenAI and DeepSeek's official Responses API — directly, with isolated local and Remote SSH profiles.**

[Download the latest VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) · [中文说明](https://github.com/dzrdzrdzr/codex-model-switcher/blob/main/docs/README.zh-CN.md) · [Report a bug](https://github.com/dzrdzrdzr/codex-model-switcher/issues/new?template=bug_report.yml)

> If this saves you from maintaining a relay or breaking your ChatGPT login, consider starring the repo. It helps other Codex users find it.

Codex Direct Source Switcher gives each VS Code environment its own clean model source switch:

- GPT/OpenAI keeps using the normal Codex profile.
- DeepSeek uses DeepSeek's native Responses API directly.
- Local VS Code and Remote SSH can be switched independently.
- No MoonBridge, no localhost proxy, no protocol disguise.

The extension is built for the setup many power users actually want:

```text
Codex Desktop  -> OpenAI
Local VS Code  -> OpenAI or DeepSeek Direct
Remote SSH     -> OpenAI or DeepSeek Direct, per host
```

## Why this exists

DeepSeek's official Codex support is great, but the official one-shot setup changes the shared Codex home. That is awkward when your desktop Codex, local VS Code, and SSH VS Code windows need different providers.

This extension keeps the switching local to the current VS Code environment:

```text
OpenAI mode   -> .codex
DeepSeek mode -> .codex-vscode-deepseek
```

That means switching a Remote SSH window to DeepSeek does not steal your desktop ChatGPT login, and switching local VS Code does not rewrite the remote host.

## Highlights

- One command palette switch between `GPT (OpenAI)` and `DeepSeek Direct`.
- DeepSeek direct config uses `https://api.deepseek.com/` and `wire_api = "responses"`.
- Bundles the official DeepSeek model catalog for `deepseek-v4-pro` and `deepseek-v4-flash`.
- Keeps API key auth isolated in the DeepSeek profile.
- Works in local VS Code and Linux Remote SSH extension hosts.
- Preserves old command ids for smoother upgrades from earlier local switcher builds.
- Avoids passing API keys on the process command line or printing them to the output channel.

## Quick start

1. Download `codex-direct-model-switcher-0.2.7.vsix` from the [latest release](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest).
2. Install it in the VS Code environment you want to control.

Local VS Code:

```powershell
code --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

Remote SSH:

```powershell
code --remote ssh-remote+your-host --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

3. Open the command palette and run `Codex Source: Switch GPT / DeepSeek Direct`.
4. Reload that VS Code window when prompted.

The first DeepSeek setup asks for a DeepSeek API key using VS Code's password input. The key stays in that environment's isolated Codex profile.

## How it works

| Environment | OpenAI mode | DeepSeek mode |
| --- | --- | --- |
| Local VS Code | `%USERPROFILE%\.codex` | `%USERPROFILE%\.codex-vscode-deepseek` |
| Remote SSH | `~/.codex` | `~/.codex-vscode-deepseek` |
| API path | OpenAI / ChatGPT auth | `https://api.deepseek.com/` with `wire_api = "responses"` |

Each VS Code extension host owns its mode. A Remote SSH window can use DeepSeek while local VS Code and Codex Desktop continue using OpenAI.

## What it changes

Local VS Code:

```text
%USERPROFILE%\.codex
%USERPROFILE%\.codex-vscode-deepseek
```

Remote SSH:

```text
~/.codex
~/.codex-vscode-deepseek
~/.local/bin/codex-vscode-profile
```

The extension sets VS Code Codex's `chatgpt.cliExecutable` to `codex-vscode-profile`, a tiny launcher that selects the right profile before Codex starts.

## Verify DeepSeek Direct

DeepSeek mode should contain:

```toml
model = "deepseek-v4-pro"
model_provider = "deepseek"
model_catalog_json = "/home/you/.codex-vscode-deepseek/models.json"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
```

It should not contain or depend on:

```text
127.0.0.1:38440
localhost
moonbridge
```

## Remote SSH

- Install the VSIX on the remote side, not only in local VS Code.
- The remote helper requires Linux, `bash`, and `python3`.
- The generated launcher is `~/.local/bin/codex-vscode-profile`.
- If an old relay wrapper is present, the launcher prefers `codex.real` so traffic does not fall back through MoonBridge.

Run `Codex Source: Show Current Codex Source Status` to confirm the active mode, model, provider, Responses wire API, and Codex version without printing the API key.

## Compatibility

| Component | Support |
| --- | --- |
| Local VS Code on Windows | Supported |
| VS Code Remote SSH to Linux | Supported |
| Codex CLI | `0.144.0` or newer recommended |
| DeepSeek models | `deepseek-v4-pro`, `deepseek-v4-flash` |
| MoonBridge / localhost proxy | Not used |

## Security

On first DeepSeek setup in each environment, the extension asks for a DeepSeek API key with VS Code's password input. The key is stored only in that environment's isolated DeepSeek `config.toml` as DeepSeek's official Codex setup expects.

The extension does not print the key, put it on a command line, copy it into the OpenAI profile, or upload any local config to GitHub.

## Development

```powershell
npm test
npm run check
```

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and keep provider credentials out of issues, logs, and test fixtures.
