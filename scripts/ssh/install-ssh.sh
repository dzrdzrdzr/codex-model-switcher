#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${script_dir}/codex-vscode-model.sh" install

cat <<'EOF'

Add this setting on the VS Code Remote - SSH side:

{
  "chatgpt.cliExecutable": "~/.local/bin/codex-vscode-switcher"
}

Then reload the remote VS Code window.
EOF
