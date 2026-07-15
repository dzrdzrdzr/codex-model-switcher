# Privacy checklist

Before publishing a fork or release, verify that the repository does not contain:

- personal usernames
- local absolute paths
- hostnames or private IP addresses
- API keys, access tokens, cookies, or private keys
- Codex auth files
- generated runtime state
- logs or terminal transcripts
- compiled launchers or other machine-specific binaries

Recommended checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-redaction.ps1
git status --short
```

If you need to document a path, prefer placeholders such as `%USERPROFILE%`, `%LOCALAPPDATA%`, `$HOME`, or `/path/to/repository`.
