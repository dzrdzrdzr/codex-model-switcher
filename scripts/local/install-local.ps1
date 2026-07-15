[CmdletBinding()]
param(
    [string]$ExtensionRoot,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Get-ProjectRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Get-RuntimeRoot {
    if ($env:CODEX_SWITCHER_RUNTIME_ROOT) {
        return [Environment]::ExpandEnvironmentVariables($env:CODEX_SWITCHER_RUNTIME_ROOT)
    }

    return (Join-Path $env:LOCALAPPDATA 'CodexModelSwitcher')
}

function Find-CSharpCompiler {
    $command = Get-Command 'csc.exe' -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $frameworkCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
    if (Test-Path -LiteralPath $frameworkCompiler) {
        return $frameworkCompiler
    }

    $frameworkCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
    if (Test-Path -LiteralPath $frameworkCompiler) {
        return $frameworkCompiler
    }

    throw 'No C# compiler was found. Install Visual Studio Build Tools or a .NET SDK, then run this script again.'
}

function Find-ChatGptExtension {
    param([string]$Root)

    if ($Root) {
        $resolved = Resolve-Path -LiteralPath $Root -ErrorAction Stop
        return $resolved.Path
    }

    $extensionsRoot = Join-Path $env:USERPROFILE '.vscode\extensions'
    if (-not (Test-Path -LiteralPath $extensionsRoot)) {
        throw 'VS Code extensions directory was not found.'
    }

    $candidate = Get-ChildItem -LiteralPath $extensionsRoot -Directory -Filter 'openai.chatgpt-*' |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if (-not $candidate) {
        throw 'ChatGPT/Codex VS Code extension was not found.'
    }

    return $candidate.FullName
}

function Install-Launcher {
    param(
        [string]$LauncherExe,
        [string]$ExtensionDir
    )

    $codexDir = Join-Path $ExtensionDir 'bin\windows-x86_64'
    $codex = Join-Path $codexDir 'codex.exe'
    $realCodex = Join-Path $codexDir 'codex-real.exe'

    if (-not (Test-Path -LiteralPath $codex)) {
        throw "Codex executable was not found under: $codexDir"
    }

    if (-not (Test-Path -LiteralPath $realCodex)) {
        Copy-Item -LiteralPath $codex -Destination $realCodex -Force
    }

    $alreadyInstalled = $false
    if (Test-Path -LiteralPath $codex) {
        try {
            $currentHash = (Get-FileHash -LiteralPath $codex -Algorithm SHA256).Hash
            $launcherHash = (Get-FileHash -LiteralPath $LauncherExe -Algorithm SHA256).Hash
            $alreadyInstalled = $currentHash -eq $launcherHash
        } catch {
            $alreadyInstalled = $false
        }
    }

    if ($alreadyInstalled -and -not $Force) {
        return [pscustomobject]@{
            installed = $true
            changed = $false
            codex = $codex
            realCodex = $realCodex
        }
    }

    try {
        Copy-Item -LiteralPath $LauncherExe -Destination $codex -Force
    } catch {
        if ($alreadyInstalled) {
            return [pscustomobject]@{
                installed = $true
                changed = $false
                codex = $codex
                realCodex = $realCodex
                note = 'codex.exe is currently locked, but the launcher is already installed.'
            }
        }

        throw 'codex.exe is currently locked. Close VS Code windows that use the extension, then run this script again.'
    }

    return [pscustomobject]@{
        installed = $true
        changed = $true
        codex = $codex
        realCodex = $realCodex
    }
}

$projectRoot = Get-ProjectRoot
$runtimeRoot = Get-RuntimeRoot
$buildDir = Join-Path $runtimeRoot 'bin'
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

$source = Join-Path $projectRoot 'src\local\CodexLocalModelLauncher.cs'
$launcher = Join-Path $buildDir 'codex-local-launcher.exe'
$compiler = Find-CSharpCompiler

& $compiler /nologo /optimize+ /target:exe /out:$launcher $source
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to compile the local launcher.'
}

$extensionDir = Find-ChatGptExtension -Root $ExtensionRoot
$result = Install-Launcher -LauncherExe $launcher -ExtensionDir $extensionDir

$modeFile = Join-Path $runtimeRoot 'local-mode.txt'
if (-not (Test-Path -LiteralPath $modeFile)) {
    Set-Content -LiteralPath $modeFile -Value 'gpt' -NoNewline
}

$result | ConvertTo-Json -Compress
