#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_ROOT="$(mktemp -d "$PROJECT_ROOT/../remote-helper-test.XXXXXX")"
export HOME="$TEST_ROOT/home"

mkdir -p "$HOME/.codex" \
  "$HOME/.codex-vscode-deepseek" \
  "$HOME/.vscode-server/cli/servers/Stable-test/server/bin/remote-cli" \
  "$HOME/.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64"
printf 'model = "gpt-test"\n' > "$HOME/.codex/config.toml"
printf '{"auth_mode":"chatgpt"}\n' > "$HOME/.codex-vscode-deepseek/auth.json"

cat > "$HOME/.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64/codex.real" <<'MOCK'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  echo "codex-cli 0.145.0"
  exit 0
fi
printf 'CODEX_HOME=%s\n' "${CODEX_HOME:-}"
printf 'ARGS=%s\n' "$*"
MOCK
chmod 700 "$HOME/.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64/codex.real"

cat > "$HOME/.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64/codex" <<'MOCK'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  echo "moonbridge-wrapper 0.1.0"
  exit 0
fi
export CODEX_HOME="$HOME/.codex"
exec "$(dirname "$0")/codex.real" "$@"
MOCK
chmod 700 "$HOME/.vscode-server/extensions/openai.chatgpt-99.0.0/bin/linux-x86_64/codex"

bash "$PROJECT_ROOT/scripts/remote-helper.sh" install gpt high deepseek-v4-pro
grep -q '^gpt$' "$HOME/.codex-vscode-mode"
grep -q '"chatgpt.cliExecutable": "codex-vscode-profile"' "$HOME/.vscode-server/data/Machine/settings.json"
! grep -Eq 'codex-profile-launcher\.exe|[A-Za-z]:\\\\' "$HOME/.vscode-server/data/Machine/settings.json"
grep -q '"extensions.supportNodeGlobalNavigator": true' "$HOME/.vscode-server/data/Machine/settings.json"
GPT_RESULT="$("$HOME/.vscode-server/cli/servers/Stable-test/server/bin/remote-cli/codex-vscode-profile" gpt-check)"
grep -Fq "CODEX_HOME=$HOME/.codex" <<< "$GPT_RESULT"
grep -Fq 'ARGS=gpt-check' <<< "$GPT_RESULT"

CONFIG_SOURCE="$TEST_ROOT/codex-direct-switcher-test.config.toml"
MODELS_SOURCE="$TEST_ROOT/codex-direct-switcher-test.models.json"
cat > "$CONFIG_SOURCE" <<'CONFIG'
model = "deepseek-v4-pro"
model_provider = "deepseek"
model_reasoning_effort = "high"
model_catalog_json = "~/.codex-vscode-deepseek/models.json"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
experimental_bearer_token = "test-only-api-key"
CONFIG
cp "$PROJECT_ROOT/assets/models.json" "$MODELS_SOURCE"

bash "$PROJECT_ROOT/scripts/remote-helper.sh" install deepseek high deepseek-v4-pro "$CONFIG_SOURCE" "$MODELS_SOURCE"
STATUS="$(bash "$PROJECT_ROOT/scripts/remote-helper.sh" status)"
grep -q '^deepseek$' "$HOME/.codex-vscode-mode"
grep -q '^mode: deepseek$' <<< "$STATUS"
grep -q '^base_url: https://api.deepseek.com/$' <<< "$STATUS"
grep -q '^wire_api: responses$' <<< "$STATUS"
grep -q '^direct: true$' <<< "$STATUS"
grep -q '^codex_version: codex-cli 0.145.0$' <<< "$STATUS"
test -f "$HOME/.codex-vscode-deepseek/models.json"
EXPECTED_MODELS="$(cd "$HOME/.codex-vscode-deepseek" && pwd -P)/models.json"
grep -Fq "model_catalog_json = \"$EXPECTED_MODELS\"" "$HOME/.codex-vscode-deepseek/config.toml"
test ! -e "$HOME/.codex-vscode-deepseek/auth.json"
test -n "$(find "$HOME/.codex-vscode-deepseek" -maxdepth 1 -name 'auth.json.before-direct.*.bak' -print -quit)"
test ! -e "$HOME/.codex/config.toml.before-direct.bak"
DEEPSEEK_RESULT="$("$HOME/.vscode-server/cli/servers/Stable-test/server/bin/remote-cli/codex-vscode-profile" deepseek-check)"
grep -Fq "CODEX_HOME=$HOME/.codex-vscode-deepseek" <<< "$DEEPSEEK_RESULT"
grep -Fq 'model=deepseek-v4-pro' <<< "$DEEPSEEK_RESULT"
grep -Fq 'model_reasoning_effort=high' <<< "$DEEPSEEK_RESULT"
grep -Fq 'deepseek-check' <<< "$DEEPSEEK_RESULT"

printf 'remote_helper_test_root: %s\n' "$TEST_ROOT"
