param([Parameter(Mandatory=$true)][string]$TargetPath)
$ErrorActionPreference = 'Stop'
$secureValue = $null
try {
    Import-Module "$PSHOME\Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1"
    $tokenValue = [Console]::In.ReadToEnd().Trim()
    if ($tokenValue -notmatch '^EA[A-Za-z0-9_-]{40,}$') { throw 'Formato de token invalido.' }
    [IO.Directory]::CreateDirectory((Split-Path -Parent $TargetPath)) | Out-Null
    $secureValue = ConvertTo-SecureString -String $tokenValue -AsPlainText -Force
    [IO.File]::WriteAllText($TargetPath, (ConvertFrom-SecureString -SecureString $secureValue))
} catch {
    [Console]::Error.Write('Não foi possível armazenar a credencial com DPAPI.')
    exit 1
} finally {
    $tokenValue = $null
    if ($secureValue) { $secureValue.Dispose() }
}
