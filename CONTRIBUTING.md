# Contributing

Thanks for helping improve Codex Model Switcher.

Please keep changes small and easy to review:

1. Avoid committing local runtime files, logs, generated binaries, credentials, or machine-specific paths.
2. Run the syntax and privacy checks before opening a pull request.
3. Keep local Windows behavior and SSH/Remote behavior separate unless a change intentionally affects both.
4. Prefer configuration through environment variables instead of hardcoded paths.

Useful checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\test-syntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-redaction.ps1
```
