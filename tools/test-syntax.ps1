[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$psFiles = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.ps1' |
    Where-Object { $_.FullName -notmatch '\\.git\\' }

foreach ($file in $psFiles) {
    $tokens = $null
    $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors) | Out-Null
    if ($errors.Count -gt 0) {
        $message = ($errors | ForEach-Object { "$($_.Extent.Text): $($_.Message)" }) -join [Environment]::NewLine
        throw "PowerShell syntax error in $($file.FullName): $message"
    }
}

$node = Get-Command 'node' -ErrorAction SilentlyContinue
if ($node) {
    $jsFiles = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.js' |
        Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' }

    foreach ($file in $jsFiles) {
        & $node.Source --check $file.FullName
        if ($LASTEXITCODE -ne 0) {
            throw "Node syntax check failed for $($file.FullName)"
        }
    }
} else {
    Write-Warning 'node was not found; skipping JavaScript syntax checks.'
}

function Find-UsableBash {
    $candidates = New-Object System.Collections.Generic.List[string]
    $pathBash = Get-Command 'bash' -ErrorAction SilentlyContinue
    if ($pathBash) {
        $candidates.Add($pathBash.Source)
    }

    foreach ($candidate in @(
        'C:\Program Files\Git\bin\bash.exe',
        'C:\Program Files\Git\usr\bin\bash.exe',
        'C:\Program Files (x86)\Git\bin\bash.exe'
    )) {
        if (Test-Path -LiteralPath $candidate) {
            $candidates.Add($candidate)
        }
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        try {
            & $candidate -lc 'true' *> $null
        } catch {
            continue
        }

        if ($LASTEXITCODE -eq 0) {
            return $candidate
        }
    }

    return $null
}

$bashPath = Find-UsableBash
if ($bashPath) {
    $shFiles = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.sh' |
        Where-Object { $_.FullName -notmatch '\\.git\\' }

    $cygpath = Get-Command 'cygpath' -ErrorAction SilentlyContinue
    foreach ($file in $shFiles) {
        $scriptPath = $file.FullName
        if ($cygpath) {
            $scriptPath = (& $cygpath.Source -u $file.FullName).Trim()
        }

        try {
            & $bashPath -n $scriptPath *> $null
        } catch {
            throw "Bash syntax check failed for $($file.FullName)"
        }

        if ($LASTEXITCODE -ne 0) {
            throw "Bash syntax check failed for $($file.FullName)"
        }
    }
} else {
    Write-Warning 'No usable bash was found; skipping shell syntax checks.'
}

$compiler = Get-Command 'csc.exe' -ErrorAction SilentlyContinue
if (-not $compiler) {
    $frameworkCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
    if (Test-Path -LiteralPath $frameworkCompiler) {
        $compiler = [pscustomobject]@{ Source = $frameworkCompiler }
    }
}

if ($compiler) {
    $outputDir = Join-Path ([System.IO.Path]::GetTempPath()) ('codex-model-switcher-build-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    $outputExe = Join-Path $outputDir 'codex-local-launcher.exe'
    $source = Join-Path $root 'src\local\CodexLocalModelLauncher.cs'
    & $compiler.Source /nologo /optimize+ /target:exe /out:$outputExe $source
    if ($LASTEXITCODE -ne 0) {
        throw 'C# launcher compilation failed.'
    }
    Remove-Item -LiteralPath $outputDir -Recurse -Force
} else {
    Write-Warning 'csc.exe was not found; skipping C# launcher compilation.'
}

Write-Host 'Syntax checks passed.'
