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
npm test
npm run check
rg -n -i 'sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|DEEPSEEK_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY' .
git status --short
```

If you need to document a path, prefer placeholders such as `%USERPROFILE%`, `%LOCALAPPDATA%`, `$HOME`, or `/path/to/repository`.
