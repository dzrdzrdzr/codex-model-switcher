# Codex DeepSeek Switcher

**Switch OpenAI / DeepSeek in VS Code Codex without repeatedly editing provider settings.** Keep the normal Codex profile separate from a DeepSeek profile on Windows or a Linux Remote SSH account.

[Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher) · [Download a released VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) · [中文](docs/README.zh-CN.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)

![CI](https://github.com/dzrdzrdzr/codex-model-switcher/actions/workflows/ci.yml/badge.svg)

## What changes — and what does not

```text
Windows account                     Linux SSH account (separate home)
  OpenAI   → .codex                    OpenAI   → .codex
  DeepSeek → .codex-vscode-deepseek     DeepSeek → .codex-vscode-deepseek
  one saved provider choice           a separate saved provider choice
```

This is a **configuration illustration, not a live API demonstration**. Windows sharing the same OS account/home share the selection. SSH aliases or NFS mounts sharing a home also share state. Reloading applies the selection to new processes; running tasks are not hot-swapped.

## Install

Install **Codex DeepSeek Switcher**, extension ID **`dzr.codex-local-model-switcher`**:

```powershell
code --install-extension dzr.codex-local-model-switcher
```

For Remote SSH, connect first and install under **SSH: your-host**, not only under Local. Install the OpenAI Codex extension (`openai.chatgpt`) on the same extension host. The [Remote SSH guide](docs/guides.md#remote-ssh) explains the distinction.

Prefer Marketplace for published builds. GitHub Releases is the VSIX alternative; use the actual downloaded filename. A development branch version is not proof that the same version is published. Older VSIX builds identify as `hanzaidao.codex-local-model-switcher`: disable that old extension before enabling `dzr.codex-local-model-switcher`, so two switchers do not run together. Neither installing a new ID nor switching back automatically removes old keys or backups. See [distribution notes](docs/PUBLISHING.md).

## Switch in three steps

1. In a disposable folder, confirm your existing OpenAI Codex works. Save work and privately back up your configuration.
2. Run **`Codex Source: Use DeepSeek Direct`**. Enter your own DeepSeek key through the masked prompt when required, then choose **Reload current window** when ready.
3. Run **`Codex Source: Show Current Codex Source Status`** to inspect configuration. A minimal request such as “Reply OK without using tools” separately checks connectivity and may incur provider charges.

To return, run **`Codex Source: Use GPT (OpenAI)`** and reload again. The status-bar entry opens the switcher. **`Codex Source: Reapply Current Codex Source Setup`** repairs the current setup; it is not an uninstall/reset command.

## Requirements and limits

| Environment | Scope |
| --- | --- |
| Windows x64, local VS Code | Implemented; requires Windows PowerShell/C# compilation and a writable user PATH directory |
| VS Code Remote SSH → Linux | Implemented; requires remote Codex, Bash, Python 3 and GNU utilities |
| Local macOS/Linux, WSL, containers, Codespaces, browser VS Code | Not supported by this implementation |
| Configuration | VS Code ≥1.80; existing `.codex/config.toml`; bundled model catalog specifies Codex ≥0.144.0 |

An empty `config.toml` is sufficient only when Codex defaults suit your setup; initialize Codex first. The launchers look for the binary bundled with the Codex extension, not just any `codex` on PATH. Custom `CODEX_HOME` layouts are not preserved by these launchers. See [verification scope](docs/VALIDATION.md): automated fixture tests do **not** establish successful live model calls or every client-version combination.

## Provider and security boundaries

DeepSeek uses `https://api.deepseek.com/` and `wire_api = "responses"`, with the bundled `deepseek-v4-pro` / `deepseek-v4-flash` catalog. No MoonBridge or local relay is required. Provider availability, model entitlement, network access and billing must be checked separately.

The normal `.codex/auth.json` is not copied into the DeepSeek home. However, the generated configuration can preserve unrelated provider/MCP values from the source configuration. The DeepSeek key is **plaintext in the isolated `config.toml`**, not encrypted by the masked input. Remote files use `0600`; Windows protection relies on filesystem ACLs. Switching back does not erase credentials or retained backups.

Setup changes `chatgpt.cliExecutable` to `codex-vscode-profile`; Linux setup also adjusts the VS Code Server setting `extensions.supportNodeGlobalNavigator`. Activation may repair an already installed launcher. Read [Privacy](docs/PRIVACY.md) and [Security](SECURITY.md) before use. Never post authentication files, complete configs, private code, host addresses or raw logs in issues.

## Guides and development

[Use DeepSeek](docs/guides.md#deepseek) · [Return to OpenAI](docs/guides.md#openai) · [Remote SSH](docs/guides.md#remote-ssh) · [Release checks](docs/PUBLISHING.md)

```bash
npm run verify
npm run test:remote    # Linux; Python 3.11+ is needed for the test suite
npm run build:site
npm run check:site
npm run package:list
npm run package:vsix
```

Packaging uses the exact tool version in `package.json`; no runtime dependency is added. CI checks Windows/Linux JavaScript tests, Linux helper integration, static links and VSIX contents. The website is built locally into `_site/`; its deployment workflow is manual and is not proof of a live website.

Source and MIT license are available in this repository. A star is welcome when the tool is useful; there are no star prompts in the extension or star-gated features. Statistics collection is an optional maintainer command, not user telemetry.

Independent community project. Not affiliated with or endorsed by OpenAI, DeepSeek, Microsoft or Visual Studio Code.
