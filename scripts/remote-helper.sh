#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-status}"
MODE_FILE="$HOME/.codex-vscode-mode"
GPT_HOME="$HOME/.codex"
DEEP_HOME="$HOME/.codex-vscode-deepseek"
BIN_HOME="$HOME/.local/bin"
LAUNCHER="$BIN_HOME/codex-vscode-profile"
LAUNCHER_COMMAND="codex-vscode-profile"

find_real_codex() {
  local candidate
  local executable
  for executable in codex.real codex; do
    candidate="$(find "$HOME/.vscode-server/extensions" "$HOME/.vscode-server-insiders/extensions" \
      -type f -path "*/openai.chatgpt-*/bin/*/$executable" -perm -u+x -printf '%T@ %p\n' 2>/dev/null \
      | sort -nr | head -n 1 | cut -d' ' -f2- || true)"
    if [[ -n "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
}

show_status() {
  local mode="gpt"
  if [[ -f "$MODE_FILE" ]] && grep -qi '^deepseek$' "$MODE_FILE"; then mode="deepseek"; fi
  local config="$GPT_HOME/config.toml"
  local codex_home="$GPT_HOME"
  if [[ "$mode" == "deepseek" ]]; then
    config="$DEEP_HOME/config.toml"
    codex_home="$DEEP_HOME"
  fi

  printf 'target: remote\n'
  printf 'mode: %s\n' "$mode"
  printf 'codex_home: %s\n' "$codex_home"
  printf 'launcher: %s\n' "$LAUNCHER"

  python3 - "$config" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8") if path.exists() else ""

def clean(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value.split("#", 1)[0].strip()

def top(key: str) -> str:
    leading = text.split("\n[", 1)[0]
    match = re.search(rf"(?m)^\s*{re.escape(key)}\s*=\s*(.*?)\s*$", leading)
    return clean(match.group(1)) if match else ""

def provider(key: str) -> str:
    match = re.search(r"(?ms)^\s*\[model_providers\.deepseek\]\s*$\n(.*?)(?=^\s*\[|\Z)", text)
    if not match:
        return ""
    value = re.search(rf"(?m)^\s*{re.escape(key)}\s*=\s*(.*?)\s*$", match.group(1))
    return clean(value.group(1)) if value else ""

model = top("model")
provider_id = top("model_provider")
base_url = provider("base_url")
wire_api = provider("wire_api")
api_key = provider("experimental_bearer_token")
direct = (
    provider_id == "deepseek"
    and base_url.rstrip("/") == "https://api.deepseek.com"
    and wire_api == "responses"
    and not re.search(r"127\.0\.0\.1|localhost|moonbridge|:38440|:17899", base_url, re.I)
)

print(f"model: {model}")
print(f"provider: {provider_id}")
print(f"base_url: {base_url}")
print(f"wire_api: {wire_api}")
print(f"api_key_configured: {'true' if api_key else 'false'}")
print(f"direct: {'true' if direct else 'false'}")
PY

  local real
  real="$(find_real_codex)"
  if [[ -n "$real" ]]; then
    local version
    version="$("$real" --version 2>/dev/null | head -n 1 || true)"
    printf 'codex_version: %s\n' "$version"
  fi
}

write_launcher() {
  mkdir -p "$BIN_HOME"
  cat > "$LAUNCHER" <<'WRAPPER'
#!/usr/bin/env bash
set -euo pipefail

MODE="gpt"
if [[ -f "$HOME/.codex-vscode-mode" ]] && grep -qi '^deepseek$' "$HOME/.codex-vscode-mode"; then
  MODE="deepseek"
fi
if [[ "$MODE" == "deepseek" ]]; then
  export CODEX_HOME="$HOME/.codex-vscode-deepseek"
else
  export CODEX_HOME="$HOME/.codex"
fi

EXTRA_ARGS=()
if [[ "$MODE" == "deepseek" ]]; then
  MODEL="$(sed -n 's/^model = "\(.*\)"$/\1/p' "$CODEX_HOME/config.toml" | head -n 1)"
  EFFORT="$(sed -n 's/^model_reasoning_effort = "\(.*\)"$/\1/p' "$CODEX_HOME/config.toml" | head -n 1)"
  [[ -n "$MODEL" ]] && EXTRA_ARGS+=(-c "model=$MODEL")
  [[ -n "$EFFORT" ]] && EXTRA_ARGS+=(-c "model_reasoning_effort=$EFFORT")
fi

REAL=""
for EXECUTABLE in codex.real codex; do
  REAL="$({ find "$HOME/.vscode-server/extensions" "$HOME/.vscode-server-insiders/extensions" \
    -type f -path "*/openai.chatgpt-*/bin/*/$EXECUTABLE" -perm -u+x -printf '%T@ %p\n' 2>/dev/null || true; } \
    | sort -nr | head -n 1 | cut -d' ' -f2-)"
  [[ -n "$REAL" ]] && break
done
if [[ -z "$REAL" || ! -x "$REAL" ]]; then
  echo "Cannot find Codex in the Remote SSH VS Code extension." >&2
  exit 127
fi
exec "$REAL" "${EXTRA_ARGS[@]}" "$@"
WRAPPER
  chmod 700 "$LAUNCHER"
}

write_path_shims() {
  local installed="false"
  local root
  local directory
  for root in \
    "$HOME/.vscode-server/cli/servers" \
    "$HOME/.vscode-server-insiders/cli/servers"; do
    [[ -d "$root" ]] || continue
    while IFS= read -r directory; do
      [[ -d "$directory" && -w "$directory" ]] || continue
      ln -sfn "$LAUNCHER" "$directory/$LAUNCHER_COMMAND"
      installed="true"
    done < <(find "$root" -type d -path '*/server/bin/remote-cli' -print 2>/dev/null)
  done
  if [[ "$installed" != "true" ]]; then
    echo "Cannot find a writable VS Code Server remote-cli PATH directory." >&2
    exit 4
  fi
}

write_machine_setting() {
  local server_root="$HOME/.vscode-server"
  if [[ ! -d "$server_root" && -d "$HOME/.vscode-server-insiders" ]]; then
    server_root="$HOME/.vscode-server-insiders"
  fi
  local settings="$server_root/data/Machine/settings.json"
  mkdir -p "$(dirname "$settings")"

  python3 - "$settings" "$LAUNCHER_COMMAND" <<'PY'
from pathlib import Path
import json
import re
import shutil
import sys

path = Path(sys.argv[1])
launcher_command = sys.argv[2]
path.parent.mkdir(parents=True, exist_ok=True)
text = path.read_text(encoding="utf-8") if path.exists() else "{}\n"
backup = path.with_name(path.name + ".before-codex-direct-switcher.bak")
if path.exists() and not backup.exists():
    shutil.copy2(path, backup)

def set_jsonc_property(source, key, encoded):
    pattern = re.compile(r'("' + re.escape(key) + r'"\s*:\s*)("(?:\\.|[^"\\])*"|true|false|null)')
    if pattern.search(source):
        return pattern.sub(lambda match: match.group(1) + encoded, source, count=1)

    text = source
    close = text.rfind("}")
    if close < 0:
        raise SystemExit(f"Invalid VS Code machine settings: {path}")
    prefix = text[:close].rstrip()
    suffix = text[close:]
    empty = re.sub(r"(?m)//.*$|/\*.*?\*/|\s", "", prefix, flags=re.S) == "{"
    comma = "" if empty or prefix.endswith(",") else ","
    return f'{prefix}{comma}\n  {json.dumps(key)}: {encoded}\n{suffix.lstrip()}'

updated = set_jsonc_property(text, "chatgpt.cliExecutable", json.dumps(launcher_command))
updated = set_jsonc_property(updated, "extensions.supportNodeGlobalNavigator", "true")

temporary = path.with_name(path.name + ".codex-direct-tmp")
temporary.write_text(updated.rstrip() + "\n", encoding="utf-8")
temporary.replace(path)
PY
}

install_mode() {
  local mode="${2:-}"
  local effort="${3:-high}"
  local model="${4:-deepseek-v4-pro}"
  local config_source="${5:-}"
  local models_source="${6:-}"

  case "$mode" in gpt|deepseek) ;; *) echo "Invalid mode: $mode" >&2; exit 2 ;; esac
  case "$effort" in low|high|max) ;; *) echo "Invalid effort: $effort" >&2; exit 2 ;; esac
  case "$model" in deepseek-v4-pro|deepseek-v4-flash) ;; *) echo "Invalid model: $model" >&2; exit 2 ;; esac

  if [[ "$mode" == "deepseek" ]]; then
    if [[ ! -f "$config_source" || ! -f "$models_source" ]]; then
      echo "Missing uploaded DeepSeek configuration assets." >&2
      exit 3
    fi
    python3 - "$models_source" "$model" <<'PY'
import json
import sys
with open(sys.argv[1], encoding="utf-8") as handle:
    catalog = json.load(handle)
slugs = {item.get("slug") for item in catalog.get("models", [])}
if sys.argv[2] not in slugs:
    raise SystemExit(f"models.json does not contain {sys.argv[2]}")
PY
    mkdir -p "$DEEP_HOME"
    if [[ -f "$DEEP_HOME/config.toml" && ! -f "$DEEP_HOME/config.toml.before-direct.bak" ]]; then
      cp -p "$DEEP_HOME/config.toml" "$DEEP_HOME/config.toml.before-direct.bak"
    fi
    if [[ -f "$DEEP_HOME/auth.json" ]]; then
      auth_backup="$DEEP_HOME/auth.json.before-direct.$(date +%s).$$.bak"
      mv -- "$DEEP_HOME/auth.json" "$auth_backup"
      chmod 600 "$auth_backup"
    fi
    install -m 600 "$config_source" "$DEEP_HOME/config.toml"
    install -m 600 "$models_source" "$DEEP_HOME/models.json"
    python3 - "$DEEP_HOME/config.toml" "$DEEP_HOME/models.json" <<'PY'
from pathlib import Path
import json
import re
import sys

path = Path(sys.argv[1])
models = str(Path(sys.argv[2]).resolve())
text = path.read_text(encoding="utf-8")
leading, separator, rest = text.partition("\n[")
pattern = re.compile(r'(?m)^(\s*model_catalog_json\s*=\s*)(?:"(?:\\.|[^"\\])*"|\'[^\']*\')\s*$')
replacement = lambda match: match.group(1) + json.dumps(models)
if pattern.search(leading):
    leading = pattern.sub(replacement, leading, count=1)
else:
    leading = leading.rstrip() + f"\nmodel_catalog_json = {json.dumps(models)}\n"
path.write_text(leading + (separator + rest if separator else ""), encoding="utf-8")
PY
  fi

  write_launcher
  write_path_shims
  write_machine_setting
  printf '%s\n' "$mode" > "$MODE_FILE"
  chmod 600 "$MODE_FILE"
  show_status
}

cleanup_inputs() {
  shift
  local item
  for item in "$@"; do
    case "$item" in
      /tmp/codex-direct-switcher-[A-Za-z0-9-]*.config.toml|/tmp/codex-direct-switcher-[A-Za-z0-9-]*.models.json)
        rm -f -- "$item"
        ;;
    esac
  done
}

set_api_key() {
  mkdir -p "$DEEP_HOME"
  if [[ ! -f "$DEEP_HOME/config.toml" ]]; then
    echo "DeepSeek config was not found: $DEEP_HOME/config.toml" >&2
    exit 3
  fi

  python3 - "$DEEP_HOME/config.toml" 3<&0 <<'PY'
from pathlib import Path
import json
import os
import re
import sys

path = Path(sys.argv[1])
api_key = os.fdopen(3).read().strip()
if len(api_key) < 8 or any(char in api_key for char in "\r\n\0"):
    raise SystemExit("Invalid DeepSeek API key received on standard input.")

text = path.read_text(encoding="utf-8")
leading, separator, rest = text.partition("\n[")
catalog = str(path.with_name("models.json").resolve())
catalog_line = re.compile(r'(?m)^(\s*model_catalog_json\s*=\s*).*$')
if catalog_line.search(leading):
    leading = catalog_line.sub(lambda match: match.group(1) + json.dumps(catalog), leading, count=1)
else:
    leading = leading.rstrip() + "\nmodel_catalog_json = " + json.dumps(catalog) + "\n"
text = leading + (separator + rest if separator else "")
section = re.search(
    r"(?ms)^(\s*\[model_providers\.deepseek\]\s*$\n)(.*?)(?=^\s*\[|\Z)",
    text,
)
if not section:
    raise SystemExit("DeepSeek provider section was not found in config.toml.")

body = section.group(2)
key_line = re.compile(r"(?m)^\s*experimental_bearer_token\s*=.*$")
replacement = f"experimental_bearer_token = {json.dumps(api_key)}"
if key_line.search(body):
    body = key_line.sub(replacement, body, count=1)
else:
    body = body.rstrip() + "\n" + replacement + "\n"

updated = text[:section.start(2)] + body + text[section.end(2):]
temporary = path.with_name(path.name + ".codex-direct-tmp")
temporary.write_text(updated.rstrip() + "\n", encoding="utf-8")
temporary.chmod(0o600)
temporary.replace(path)
PY
  chmod 600 "$DEEP_HOME/config.toml"
  printf 'api_key_configured: true\n'
}

case "$COMMAND" in
  status)
    show_status
    ;;
  ensure-launcher)
    write_launcher
    write_path_shims
    write_machine_setting
    ;;
  read-config)
    if [[ -f "$DEEP_HOME/config.toml" ]]; then
      cat "$DEEP_HOME/config.toml"
    elif [[ -f "$GPT_HOME/config.toml" ]]; then
      cat "$GPT_HOME/config.toml"
    else
      echo "Remote Codex config was not found." >&2
      exit 3
    fi
    ;;
  install)
    install_mode "$@"
    ;;
  cleanup)
    cleanup_inputs "$@"
    ;;
  set-api-key)
    set_api_key
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    exit 2
    ;;
esac
