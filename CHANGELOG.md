# Changelog

## Unreleased

- Rebrand the public-facing extension as **Codex DeepSeek Switcher** while preserving the existing extension ID and command IDs.
- Add GitHub Actions checks for Windows, Linux, Remote SSH helper behavior, and VSIX packaging.
- Add tag-driven GitHub release packaging.
- Rewrite the English and Chinese documentation around installation, profile isolation, verification, and troubleshooting.

## 0.2.7

- Switch DeepSeek mode from MoonBridge compatibility routing to DeepSeek's native Responses API.
- Isolate OpenAI and DeepSeek profiles for local VS Code and Remote SSH environments.
- Add `deepseek-v4-pro` and `deepseek-v4-flash` model catalog support.
- Prefer the real Codex binary when an older relay wrapper is still installed.
- Add redacted status checks and safer API-key handling.
