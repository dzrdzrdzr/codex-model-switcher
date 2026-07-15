[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('gpt', 'deepseek', 'status')]
    [string]$Mode = 'status'
)

$ErrorActionPreference = 'Stop'

function Get-RuntimeRoot {
    if ($env:CODEX_SWITCHER_RUNTIME_ROOT) {
        return [Environment]::ExpandEnvironmentVariables($env:CODEX_SWITCHER_RUNTIME_ROOT)
    }

    return (Join-Path $env:LOCALAPPDATA 'CodexModelSwitcher')
}

function Get-CodexHome {
    param([string]$SelectedMode)

    if ($SelectedMode -eq 'deepseek') {
        if ($env:CODEX_SWITCHER_DEEPSEEK_HOME) {
            return [Environment]::ExpandEnvironmentVariables($env:CODEX_SWITCHER_DEEPSEEK_HOME)
        }

        return (Join-Path $env:USERPROFILE '.codex-deepseek')
    }

    if ($env:CODEX_SWITCHER_GPT_HOME) {
        return [Environment]::ExpandEnvironmentVariables($env:CODEX_SWITCHER_GPT_HOME)
    }

    return (Join-Path $env:USERPROFILE '.codex')
}

function Write-DeepSeekConfig {
    param([string]$CodexHome)

    $model = if ($env:CODEX_SWITCHER_DEEPSEEK_MODEL) { $env:CODEX_SWITCHER_DEEPSEEK_MODEL } else { 'deepseek-v4-pro' }
    $provider = if ($env:CODEX_SWITCHER_DEEPSEEK_PROVIDER) { $env:CODEX_SWITCHER_DEEPSEEK_PROVIDER } else { 'moonbridge' }
    $baseUrl = if ($env:CODEX_SWITCHER_MOONBRIDGE_BASE_URL) { $env:CODEX_SWITCHER_MOONBRIDGE_BASE_URL } else { 'http://127.0.0.1:17898/v1' }

    New-Item -ItemType Directory -Force -Path $CodexHome | Out-Null
    $config = @"
model = "$model"
model_provider = "$provider"

[model_providers.$provider]
name = "MoonBridge"
base_url = "$baseUrl"
env_key = "MOONBRIDGE_API_KEY"
wire_api = "chat"
"@

    Set-Content -LiteralPath (Join-Path $CodexHome 'config.toml') -Value $config -Encoding UTF8
}

$runtimeRoot = Get-RuntimeRoot
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
$modeFile = Join-Path $runtimeRoot 'local-mode.txt'

if ($Mode -ne 'status') {
    Set-Content -LiteralPath $modeFile -Value $Mode -NoNewline
}

$selectedMode = if (Test-Path -LiteralPath $modeFile) {
    (Get-Content -LiteralPath $modeFile -Raw).Trim().ToLowerInvariant()
} else {
    'gpt'
}

if ($selectedMode -notin @('gpt', 'deepseek')) {
    $selectedMode = 'gpt'
}

$codexHome = Get-CodexHome -SelectedMode $selectedMode
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null

if ($selectedMode -eq 'deepseek') {
    Write-DeepSeekConfig -CodexHome $codexHome
}

$result = [ordered]@{
    mode = $selectedMode
    CODEX_HOME = $codexHome
    runtimeRoot = $runtimeRoot
}

if ($selectedMode -eq 'deepseek') {
    $result.model = if ($env:CODEX_SWITCHER_DEEPSEEK_MODEL) { $env:CODEX_SWITCHER_DEEPSEEK_MODEL } else { 'deepseek-v4-pro' }
    $result.provider = if ($env:CODEX_SWITCHER_DEEPSEEK_PROVIDER) { $env:CODEX_SWITCHER_DEEPSEEK_PROVIDER } else { 'moonbridge' }
}

$result | ConvertTo-Json -Compress
