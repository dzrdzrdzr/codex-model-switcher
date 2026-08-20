# Contributing

Thanks for helping improve Codex Direct Source Switcher.

Please keep changes small and easy to review:

1. Avoid committing local runtime files, logs, generated VSIX files, credentials, or machine-specific paths.
2. Keep local Windows and Remote SSH behavior isolated unless a change intentionally affects both.
3. Preserve the existing extension id unless you are intentionally making a breaking install change.
4. Never put API keys on a command line, in test fixtures that look real, or in repository files.

Useful checks:

```powershell
npm test
npm run check
rg -n -i 'sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|DEEPSEEK_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY' .
```
