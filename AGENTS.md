# Repository instructions for OpenAI Codex and other coding agents

## Project identity

This repository contains **Codex DeepSeek Switcher**, an independent VS Code extension for OpenAI Codex / Codex CLI. It switches the current local or Remote SSH VS Code environment between the normal OpenAI or ChatGPT-authenticated Codex profile and an isolated DeepSeek Responses API profile.

Canonical repository: https://github.com/dzrdzrdzr/codex-model-switcher

## Compatibility constraints

- Do not rename the package identifier `codex-local-model-switcher`.
- Do not remove legacy `codexLocalModelSwitcher.*` or `codexModelSwitcher.*` command IDs.
- Keep local Windows and Remote SSH profile handling independent.
- Never print, upload, or place API keys on a process command line.
- DeepSeek direct mode must use `https://api.deepseek.com/` and `wire_api = "responses"`.
- Do not reintroduce MoonBridge, localhost relay, or protocol-disguise dependencies.

## Key files

- `extension.js`: VS Code commands and environment switching.
- `lib/config.js`: isolated Codex profile generation and status parsing.
- `scripts/remote-helper.sh`: Linux Remote SSH installation and launcher logic.
- `scripts/CodexProfileLauncher.cs`: local Windows launcher.
- `assets/models.json`: DeepSeek model catalog.
- `test/`: unit and Remote SSH helper tests.

## Required validation

```bash
npm run check
npm test
```

On Linux also run:

```bash
npm run test:remote
```

Packaging smoke test:

```bash
npm run package:vsix
```

Keep documentation accurate for these search contexts: OpenAI Codex, Codex CLI, ChatGPT-authenticated Codex, DeepSeek, VS Code, and Remote SSH.
