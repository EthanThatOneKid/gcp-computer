# Helper script to prepare and compress standalone Next.js deployment package

if (Test-Path .next\standalone\public) {
    Remove-Item -Path .next\standalone\public -Recurse -Force
}
if (Test-Path .next\standalone\.next\static) {
    Remove-Item -Path .next\standalone\.next\static -Recurse -Force
}
if (Test-Path .next\standalone\src\db\migrations) {
    Remove-Item -Path .next\standalone\src\db\migrations -Recurse -Force
}

Write-Host "Copying public assets..."
Copy-Item -Path public -Destination .next\standalone\public -Recurse

Write-Host "Copying static Next.js assets..."
Copy-Item -Path .next\static -Destination .next\standalone\.next\static -Recurse

Write-Host "Copying database migrations..."
New-Item -ItemType Directory -Path .next\standalone\src\db\migrations -Force
Copy-Item -Path src\db\migrations\* -Destination .next\standalone\src\db\migrations\

Write-Host "Creating deployment archive build.tar.gz..."
if (Test-Path build.tar.gz) {
    Remove-Item -Path build.tar.gz -Force
}

# Run tar to compress the standalone directory into a single file
tar -czf build.tar.gz -C .next/standalone .

Write-Host "Standalone deployment archive ready: build.tar.gz"
