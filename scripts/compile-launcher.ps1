[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [Parameter(Mandatory = $true)]
    [string]$VersionFile,

    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "Missing launcher source: $SourcePath"
}

$currentVersion = ''
if (Test-Path -LiteralPath $VersionFile -PathType Leaf) {
    $currentVersion = (Get-Content -LiteralPath $VersionFile -Raw).Trim()
}
if ((Test-Path -LiteralPath $OutputPath -PathType Leaf) -and $currentVersion -eq $Version) {
    Write-Output "launcher: $OutputPath"
    exit 0
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$temporaryPath = Join-Path $outputDirectory ("codex-profile-launcher.{0}.tmp.exe" -f [Guid]::NewGuid().ToString('N'))

try {
    Add-Type -Path $SourcePath -OutputAssembly $temporaryPath -OutputType ConsoleApplication
    if (Test-Path -LiteralPath $OutputPath -PathType Leaf) {
        Remove-Item -LiteralPath $OutputPath -Force
    }
    Move-Item -LiteralPath $temporaryPath -Destination $OutputPath
    [System.IO.File]::WriteAllText($VersionFile, $Version + [Environment]::NewLine, $utf8NoBom)
}
finally {
    if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
        Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Output "launcher: $OutputPath"
