# Privacy and local data

The extension does not implement analytics, advertising, user-tracking uploads or automatic star prompts. The optional `npm run metrics` command reads public GitHub aggregate counts for a maintainer; it is excluded from the VSIX and is not run by the extension.

The selected Codex process sends requests to the provider configured in its selected profile. DeepSeek Direct uses `https://api.deepseek.com/`; the normal profile uses its own existing settings. Provider privacy policies and charges apply independently.

DeepSeek API keys are stored as plaintext `experimental_bearer_token` values in the isolated `config.toml`. VS Code's masked input hides typing; it does not encrypt storage and this extension does not use SecretStorage. Linux config and model files are written with `0600`; Windows relies on inherited ACLs. Setup can create temporary configuration files and retain backups. Returning to OpenAI or disabling the extension does not delete them.

The normal `.codex/auth.json` is not copied into the DeepSeek home. The generated configuration may retain unrelated provider and MCP fields, including embedded values. Inspect sensitive source settings privately before switching. The status command selects explicit diagnostic fields; sensitive subprocess output is withheld on failure as well as success. This does not guarantee arbitrary corrupted or user-edited configs contain no sensitive values in other displayed fields.

Do not upload authentication files, full configs, backups, raw logs, private source code, host addresses or unredacted screenshots. Review every diagnostic report before sharing. Revoke exposed keys with the provider before reporting an incident.
