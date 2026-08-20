# Codex Direct Source Switcher

Use OpenAI and DeepSeek in VS Code Codex without mixing profiles, rewriting your main `~/.codex`, or keeping a local relay alive.

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

## Why This Exists

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

## What It Changes

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

## Install

Build or download the VSIX, then install it in every VS Code environment where you want switching:

```powershell
code --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
code --remote ssh-remote+your-host --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

Open the command palette and run:

```text
Codex Source: Switch GPT / DeepSeek Direct
```

After switching, reload the current VS Code window so the Codex app-server starts with the selected profile.

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

## Security

On first DeepSeek setup in each environment, the extension asks for a DeepSeek API key with VS Code's password input. The key is stored only in that environment's isolated DeepSeek `config.toml` as DeepSeek's official Codex setup expects.

The extension does not print the key, put it on a command line, copy it into the OpenAI profile, or upload any local config to GitHub.

## Remote SSH Notes

The remote helper targets Linux Remote SSH hosts with `bash` and `python3`. It writes only the remote host's isolated profile and launcher.

If an older relay-based Codex wrapper exists in the OpenAI extension directory, the launcher prefers `codex.real` when present, so DeepSeek Direct is not accidentally routed through a stale compatibility wrapper.
