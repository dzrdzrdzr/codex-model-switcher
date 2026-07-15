#!/usr/bin/env bash
set -euo pipefail

default_runtime_root="${HOME}/.cache/codex-model-switcher"
runtime_root="${CODEX_SWITCHER_RUNTIME_ROOT:-$default_runtime_root}"
mode_file="${runtime_root}/ssh-mode.txt"

mkdir -p "$runtime_root"

if [[ -f "$mode_file" ]]; then
  mode="$(tr -d '\r\n[:space:]' < "$mode_file" | tr '[:upper:]' '[:lower:]')"
else
  mode="gpt"
fi

if [[ "$mode" != "deepseek" ]]; then
  mode="gpt"
fi

if [[ "$mode" == "deepseek" ]]; then
  export CODEX_HOME="${CODEX_SWITCHER_DEEPSEEK_HOME:-$HOME/.codex-deepseek}"
  model="${CODEX_SWITCHER_DEEPSEEK_MODEL:-deepseek-v4-pro}"
  provider="${CODEX_SWITCHER_DEEPSEEK_PROVIDER:-moonbridge}"
  base_url="${CODEX_SWITCHER_MOONBRIDGE_BASE_URL:-http://127.0.0.1:17898/v1}"
  export MOONBRIDGE_API_KEY="${MOONBRIDGE_API_KEY:-codex-model-switcher-local}"

  mkdir -p "$CODEX_HOME"
  cat > "${CODEX_HOME}/config.toml" <<EOF
model = "$model"
model_provider = "$provider"

[model_providers.$provider]
name = "MoonBridge"
base_url = "$base_url"
env_key = "MOONBRIDGE_API_KEY"
wire_api = "chat"
EOF
else
  export CODEX_HOME="${CODEX_SWITCHER_GPT_HOME:-$HOME/.codex}"
  mkdir -p "$CODEX_HOME"
fi

export CODEX_SWITCHER_MODE="$mode"

if [[ -n "${CODEX_SWITCHER_REAL_CODEX:-}" ]]; then
  real_codex="$CODEX_SWITCHER_REAL_CODEX"
elif [[ -x "$HOME/.local/bin/codex-real" ]]; then
  real_codex="$HOME/.local/bin/codex-real"
else
  self_path="$(readlink -f "$0" 2>/dev/null || printf '%s\n' "$0")"
  real_codex=""
  while IFS= read -r candidate; do
    candidate_path="$(readlink -f "$candidate" 2>/dev/null || printf '%s\n' "$candidate")"
    if [[ "$candidate_path" != "$self_path" ]]; then
      real_codex="$candidate"
      break
    fi
  done < <(type -a -P codex 2>/dev/null || true)
fi

if [[ -z "${real_codex:-}" || ! -x "$real_codex" ]]; then
  echo "Codex Model Switcher could not find the real codex executable." >&2
  echo "Set CODEX_SWITCHER_REAL_CODEX to the original codex path." >&2
  exit 127
fi

exec "$real_codex" "$@"
