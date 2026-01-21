$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Store reference to camera for light control
$marker = "this.interactables.push(oldCamera.interactableMesh); // Make camera clickable
        
        // Store reference to cinema screen for video playback
        this.cinemaScreen = cinemaScreen;"

$replacement = "this.interactables.push(oldCamera.interactableMesh); // Make camera clickable
        
        // Store references for video playback
        this.cinemaScreen = cinemaScreen;
        this.oldCamera = oldCamera;"

if ($content -match [regex]::Escape($marker)) {
    $content = $content.Replace($marker, $replacement)
    Set-Content -Path $path -Value $content
    Write-Host "Added camera reference to World"
} else {
    Write-Host "Marker not found"
}
