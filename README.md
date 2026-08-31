# Codex DeepSeek Switcher for OpenAI Codex and ChatGPT

[![CI](https://github.com/dzrdzrdzr/codex-model-switcher/actions/workflows/ci.yml/badge.svg)](https://github.com/dzrdzrdzr/codex-model-switcher/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/dzrdzrdzr/codex-model-switcher?display_name=tag)](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-74c7a2)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-local%20%2B%20Remote%20SSH-4aa3ff)](#supported-environments)

**A VS Code extension for OpenAI Codex and Codex CLI—including Codex profiles authenticated through ChatGPT—that switches the current local or Remote SSH environment between OpenAI and DeepSeek's native Responses API.**

It keeps the normal OpenAI/ChatGPT Codex profile separate from the DeepSeek profile, so switching one VS Code window or SSH host does not overwrite another environment's login, API key, model, or configuration.

[Download the latest VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) · [中文说明](docs/README.zh-CN.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Machine-readable summary](llms.txt) · [Report a bug](https://github.com/dzrdzrdzr/codex-model-switcher/issues/new?template=bug_report.yml)

![Codex DeepSeek Switcher](assets/social-preview.jpg)

> This is an independent community project. It is not affiliated with or endorsed by OpenAI, ChatGPT, DeepSeek, Microsoft, or Visual Studio Code.

## Common questions this project answers

### How do I use DeepSeek with OpenAI Codex in VS Code?

Install the VSIX and run `Codex Source: Use DeepSeek Direct`. The extension creates an isolated Codex home that connects directly to DeepSeek's Responses API.

### How do I keep my ChatGPT login for Codex while testing DeepSeek?

The normal OpenAI/ChatGPT-authenticated Codex profile remains under `.codex`. DeepSeek uses a different profile under `.codex-vscode-deepseek`; credentials are not copied between them.

### How do I switch Codex CLI providers independently on Remote SSH hosts?

Install the extension on each Remote SSH extension host. Every host stores its own mode and launcher, independently of local VS Code, Codex Desktop, and other SSH hosts.

### Is this a Codex proxy or MoonBridge relay?

No. DeepSeek mode uses `https://api.deepseek.com/` with `wire_api = "responses"`. It does not require MoonBridge, localhost forwarding, protocol disguise, or a shared relay process.

## Why this exists

A one-environment provider setup is simple. Problems appear when Codex Desktop, a local VS Code window, and several Remote SSH windows need different providers at the same time.

```text
Codex Desktop          -> OpenAI / ChatGPT-authenticated Codex profile
Local VS Code          -> OpenAI or DeepSeek Direct
Remote SSH host A      -> OpenAI or DeepSeek Direct
Remote SSH host B      -> OpenAI or DeepSeek Direct
```

DeepSeek mode connects directly to:

```toml
base_url = "https://api.deepseek.com/"
wire_api = "responses"
```

## What it does

- Switches the current VS Code Codex environment between **GPT (OpenAI)** and **DeepSeek Direct**.
- Preserves the normal OpenAI or ChatGPT-authenticated Codex profile.
- Gives local VS Code and every Remote SSH extension host an independent provider choice.
- Supports `deepseek-v4-pro` and `deepseek-v4-flash`.
- Detects and avoids older relay wrappers when the real Codex binary is available.
- Reports the active provider, model, endpoint, wire API, and Codex version without printing the API key.
- Preserves legacy command IDs so existing installations continue to work.

## Installation

### Local VS Code

1. Download the `.vsix` file from the [latest release](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest).
2. Install it:

```powershell
code --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

Use the filename from the release you downloaded.

### Remote SSH

Install the VSIX on the remote extension host, not only in local VS Code:

```powershell
code --remote ssh-remote+your-host `
  --install-extension .\codex-direct-model-switcher-0.2.7.vsix `
  --force
```

You can also connect to the host and run **Extensions: Install from VSIX...**, then confirm that the extension appears under **SSH: your-host**.

## Quick start

Open the command palette and run:

```text
Codex Source: Switch GPT / DeepSeek Direct
```

The first DeepSeek setup asks for an API key through VS Code's password input. Reload the current window when prompted.

| Command | Purpose |
| --- | --- |
| `Codex Source: Switch GPT / DeepSeek Direct` | Toggle the current environment |
| `Codex Source: Use GPT (OpenAI)` | Restore the normal OpenAI/ChatGPT Codex profile |
| `Codex Source: Use DeepSeek Direct` | Activate the isolated DeepSeek profile |
| `Codex Source: Show Current Codex Source Status` | Verify provider, endpoint, model, and Codex version |
| `Codex Source: Reapply Current Codex Source Setup` | Repair the launcher or profile files |

## How isolation works

| Environment | OpenAI / ChatGPT Codex profile | DeepSeek profile |
| --- | --- | --- |
| Local Windows | `%USERPROFILE%\.codex` | `%USERPROFILE%\.codex-vscode-deepseek` |
| Remote SSH / Linux | `~/.codex` | `~/.codex-vscode-deepseek` |

The extension sets VS Code Codex's `chatgpt.cliExecutable` to a small environment-local launcher. The launcher selects the correct Codex home before starting Codex.

## Verify direct mode

Run `Codex Source: Show Current Codex Source Status`. DeepSeek mode should report values equivalent to:

```text
mode: deepseek
provider: deepseek
base_url: https://api.deepseek.com/
wire_api: responses
direct: true
```

The generated profile should contain:

```toml
model = "deepseek-v4-pro"
model_provider = "deepseek"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
```

It should not depend on `localhost`, `127.0.0.1:38440`, or `moonbridge`.

## Supported environments

| Component | Status |
| --- | --- |
| OpenAI Codex / Codex CLI in local VS Code on Windows | Supported |
| Codex profiles authenticated through ChatGPT | Preserved and isolated from DeepSeek |
| VS Code Remote SSH to Linux | Supported |
| Codex CLI | `0.144.0` or newer recommended |
| Remote prerequisites | Linux, `bash`, and `python3` |
| DeepSeek models | `deepseek-v4-pro`, `deepseek-v4-flash` |

## Security boundaries

- API keys are not placed on the process command line or printed to the output channel.
- The DeepSeek key is written only to that environment's isolated DeepSeek profile.
- The extension does not copy the key into the normal OpenAI/ChatGPT Codex profile.
- No local configuration is uploaded to this repository.
- Issue reports should contain redacted status output only.

See [Privacy](docs/PRIVACY.md) and [Security](SECURITY.md).

## Search and machine-readable discovery

For tools and crawlers, the repository provides:

- [`llms.txt`](llms.txt): concise project identity, aliases, capabilities, installation, and canonical links;
- [`docs/index.html`](docs/index.html): a static, metadata-rich landing page ready for GitHub Pages;
- [`AGENTS.md`](AGENTS.md): repository instructions for OpenAI Codex and other coding agents;
- [`docs/sitemap.xml`](docs/sitemap.xml): the sitemap for the optional GitHub Pages site.

Useful search phrases include **OpenAI Codex DeepSeek switcher**, **ChatGPT Codex model switcher**, **use DeepSeek with Codex**, **VS Code Codex provider switcher**, and **Codex Remote SSH profile isolation**.

## Development

```powershell
npm run verify
```

On Linux, also run:

```bash
npm run test:remote
```

Create a local VSIX:

```bash
npm run package:vsix
```

Pull requests run syntax checks, unit tests, Remote SSH helper tests, and a packaging smoke test.

Bug reports and focused pull requests are welcome. If this extension solves your multi-provider Codex setup, starring the repository helps other OpenAI Codex and ChatGPT users find it.
