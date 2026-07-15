[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Get-RelativePathCompat {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseFull = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/')
    $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

    if ($targetFull.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $targetFull.Substring($baseFull.Length).TrimStart('\', '/')
    }

    return $targetFull
}

$allowedExtensions = @(
    '.md',
    '.ps1',
    '.sh',
    '.js',
    '.json',
    '.cs',
    '.gitignore',
    '.gitattributes'
)

$patterns = @(
    @{
        Name = 'Windows absolute user path'
        Pattern = '[A-Za-z]:\\Users\\[^\\\r\n]+\\'
    },
    @{
        Name = 'Linux absolute user path'
        Pattern = '/home/[^/\s]+/'
    },
    @{
        Name = 'Private IPv4 address'
        Pattern = '\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b'
    },
    @{
        Name = 'Private key marker'
        Pattern = 'BEGIN [A-Z ]*PRIVATE KEY'
    },
    @{
        Name = 'Common access token prefix'
        Pattern = '\b(ghp|gho|github_pat|sk|xoxb|xoxp)_[A-Za-z0-9_\-]{12,}'
    }
)

$files = Get-ChildItem -LiteralPath $root -Recurse -File -Force |
    Where-Object {
        $_.FullName -notmatch '\\\.git\\' -and
        $_.FullName -notmatch '\\node_modules\\' -and
        $_.FullName -ne $PSCommandPath -and
        (
            $allowedExtensions -contains $_.Extension -or
            $_.Name -in @('LICENSE', '.gitignore', '.gitattributes')
        )
    }

$findings = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    foreach ($entry in $patterns) {
        if ($text -match $entry.Pattern) {
            $relative = Get-RelativePathCompat -BasePath $root -TargetPath $file.FullName
            $findings.Add([pscustomobject]@{
                File = $relative
                Rule = $entry.Name
            })
        }
    }
}

if ($findings.Count -gt 0) {
    $findings | Format-Table -AutoSize | Out-String | Write-Error
    exit 1
}

Write-Host 'Privacy redaction check passed.'
