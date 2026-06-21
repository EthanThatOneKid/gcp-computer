$ProgressPreference = 'SilentlyContinue'
$url = "https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-windows-x86_64.zip"
$zipPath = "$env:TEMP\google-cloud-cli.zip"
$targetDir = "$env:USERPROFILE"

if (Test-Path "$targetDir\google-cloud-sdk") {
    Write-Host "Cleaning up existing installation folder..."
    Remove-Item -Path "$targetDir\google-cloud-sdk" -Recurse -Force
}

Write-Host "Downloading Google Cloud CLI..."
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting archive to $targetDir..."
Expand-Archive -Path $zipPath -DestinationPath $targetDir -Force

Write-Host "Cleaning up zip..."
Remove-Item -Path $zipPath -Force

Write-Host "Running gcloud installer..."
Start-Process -FilePath "$targetDir\google-cloud-sdk\install.bat" -ArgumentList "--path-update=false", "--command-completion=false", "--quiet" -Wait -NoNewWindow

Write-Host "Installation Complete!"
