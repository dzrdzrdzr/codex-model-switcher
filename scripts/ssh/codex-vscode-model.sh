#!/usr/bin/env bash
set -euo pipefail

command="${1:-status}"
default_runtime_root="${HOME}/.cache/codex-model-switcher"
runtime_root="${CODEX_SWITCHER_RUNTIME_ROOT:-$default_runtime_root}"
mode_file="${runtime_root}/ssh-mode.txt"

mkdir -p "$runtime_root"

case "$command" in
  gpt|deepseek)
    printf '%s' "$command" > "$mode_file"
    ;;
  status)
    ;;
  install)
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"
    cp "${script_dir}/codex-remote-wrapper.sh" "${install_dir}/codex-vscode-switcher"
    chmod +x "${install_dir}/codex-vscode-switcher"
    if [[ ! -f "$mode_file" ]]; then
      printf 'gpt' > "$mode_file"
    fi
    printf '{"installed":true,"cliExecutable":"%s"}\n' "${install_dir}/codex-vscode-switcher"
    exit 0
    ;;
  *)
    echo "Usage: $0 [gpt|deepseek|status|install]" >&2
    exit 2
    ;;
esac

if [[ -f "$mode_file" ]]; then
  mode="$(tr -d '\r\n[:space:]' < "$mode_file" | tr '[:upper:]' '[:lower:]')"
else
  mode="gpt"
fi

if [[ "$mode" != "deepseek" ]]; then
  mode="gpt"
fi

if [[ "$mode" == "deepseek" ]]; then
  codex_home="${CODEX_SWITCHER_DEEPSEEK_HOME:-$HOME/.codex-deepseek}"
  model="${CODEX_SWITCHER_DEEPSEEK_MODEL:-deepseek-v4-pro}"
  provider="${CODEX_SWITCHER_DEEPSEEK_PROVIDER:-moonbridge}"
else
  codex_home="${CODEX_SWITCHER_GPT_HOME:-$HOME/.codex}"
  model=""
  provider=""
fi

printf '{"mode":"%s","CODEX_HOME":"%s","runtimeRoot":"%s"' "$mode" "$codex_home" "$runtime_root"
if [[ -n "$model" ]]; then
  printf ',"model":"%s","provider":"%s"' "$model" "$provider"
fi
printf '}\n'
