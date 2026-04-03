#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$Repo    = "yutamago/ado-cli"
$BinName = "ado.exe"
$Binary  = "ado-windows-x64.exe"
$InstallDir = if ($env:ADO_INSTALL_DIR) { $env:ADO_INSTALL_DIR } `
              else { Join-Path $env:LOCALAPPDATA "ado" }

$DownloadUrl = "https://github.com/$Repo/releases/latest/download/$Binary"

Write-Host "Downloading ado CLI (windows/x64)..."

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$Dest = Join-Path $InstallDir $BinName
Invoke-WebRequest -Uri $DownloadUrl -OutFile $Dest -UseBasicParsing

# Add to user PATH if not already present
$UserPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPath -notlike "*$InstallDir*") {
    [System.Environment]::SetEnvironmentVariable(
        "PATH",
        "$InstallDir;$UserPath",
        "User"
    )
    Write-Host "Added $InstallDir to your user PATH."
    Write-Host "Restart your terminal for the PATH change to take effect."
}

Write-Host "Installed to $Dest"
Write-Host "Run 'ado --version' to verify the installation."
