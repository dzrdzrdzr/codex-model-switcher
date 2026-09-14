# Changelog

## 0.2.8 (release candidate; not published by this change)

- Align the package publisher with the existing `dzr.codex-local-model-switcher` listing; keep the package name and legacy commands.
- Put installation, round-trip switching and same-home limits before implementation details in English and Chinese.
- Withhold sensitive subprocess error detail; show allowlisted local diagnostic fields and distinguish configuration from connectivity.
- Reject unsupported local environments with a useful message; preflight remote dependencies; preserve literal backslashes in helper key replacement.
- Add configuration, extension, disposable-home, packaging and static-site checks.
- Prepare a bilingual, tracking-free website, manual Pages deployment, draft-only release workflow and opt-in public metrics snapshot.


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
