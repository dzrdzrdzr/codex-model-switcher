# Troubleshooting / 故障排查

Save work before reloading. Never paste a key into a shell command or upload whole configuration files.

| Symptom | Check |
| --- | --- |
| Command absent | Verify extension ID `dzr.codex-local-model-switcher` and the correct Local / SSH extension host. Disable the old `hanzaidao` build if both are installed. |
| Codex binary not found | Install `openai.chatgpt` in the same host. A standalone CLI on PATH is not a substitute for the launcher discovery path. |
| Config not found | Initialize normal Codex first; privately inspect `.codex/config.toml`. Do not delete the profile. |
| Unsupported environment | Local Windows x64 and Linux Remote SSH are the implemented targets; local Linux/macOS, WSL and containers are not. |
| Missing remote command | Install/restore the named prerequisite in that remote environment; no provider key can fix a missing Python/Bash/tool installation. |
| Status changed but replies did not | Existing processes retain their environment. Reload when work is saved, then separately test a minimal request. |
| `direct: true`, but request fails | This is a configuration check, not a network, entitlement, quota or billing test. Check the actual provider error privately. |
| Another window changed too | Same OS account/home shares the selection; SSH aliases and NFS-shared homes may also share it. |
| Switching back did not remove a key | Expected: returning selects `.codex` and does not erase DeepSeek config/backups. |

`Codex Source: Show Current Codex Source Status` reports configuration with no deliberate key field. Inspect and redact every line before sharing, especially paths or manually altered URLs. Sensitive subprocess errors deliberately omit original output; reproduce privately rather than disabling redaction.

`Reapply Current Codex Source Setup` regenerates launchers/settings for the current choice. It is not a factory reset, a credential purge or a way to undo user edits. For disabling and restoring the previous executable setting, see [Return to OpenAI](guides.md#openai).
