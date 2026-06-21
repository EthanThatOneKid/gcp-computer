# PowerShell script to provision GCP Infrastructure for gcp-computer
# Uses the local gcloud SDK path

$gcloud = "$env:USERPROFILE\google-cloud-sdk\bin\gcloud.cmd"
$project = "gcp-computer-500100"
$zone = "us-west1-a"
$region = "us-west1"
$vmName = "gcp-computer"
$ipName = "gcp-computer-ip"

Write-Host "Configuring active project to $project..."
& $gcloud config set project $project

Write-Host "Creating firewall rules for HTTP/HTTPS (ports 80 and 443)..."
# Check if firewall rule already exists, if not create it
$fwExists = & $gcloud compute firewall-rules list --filter="name=allow-http-https" --format="value(name)"
if (-not $fwExists) {
    & $gcloud compute firewall-rules create allow-http-https `
      --allow=tcp:80,tcp:443 `
      --target-tags=http-server,https-server `
      --description="Allow HTTP and HTTPS traffic" `
      --direction=INGRESS `
      --priority=1000 `
      --network=default
} else {
    Write-Host "Firewall rule 'allow-http-https' already exists."
}

Write-Host "Reserving static external IP address ($ipName) in region $region..."
$ipExists = & $gcloud compute addresses list --filter="name=$ipName AND region:$region" --format="value(name)"
if (-not $ipExists) {
    & $gcloud compute addresses create $ipName --region=$region
} else {
    Write-Host "Static IP '$ipName' already reserved."
}

# Fetch the reserved IP address
$ipAddress = & $gcloud compute addresses describe $ipName --region=$region --format="value(address)"
Write-Host "Static External IP reserved: $ipAddress"

Write-Host "Provisioning Compute Engine VM instance '$vmName' ($zone)..."
$vmExists = & $gcloud compute instances list --filter="name=$vmName AND zone:$zone" --format="value(name)"
if (-not $vmExists) {
    & $gcloud compute instances create $vmName `
      --machine-type=e2-micro `
      --image-family=ubuntu-2404-lts-amd64 `
      --image-project=ubuntu-os-cloud `
      --zone=$zone `
      --boot-disk-size=30GB `
      --boot-disk-type=pd-standard `
      --address=$ipAddress `
      --tags=http-server,https-server `
      --scopes=cloud-platform `
      --metadata="enable-oslogin=TRUE"
} else {
    Write-Host "VM instance '$vmName' already exists."
}

Write-Host "GCP Infrastructure Setup Complete!"
Write-Host "Public IP Address: $ipAddress"
