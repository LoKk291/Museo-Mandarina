$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Find where oldCamera is added and add to interactables
$marker = "roomL2.group.add(oldCamera.mesh);"
$idx = $content.IndexOf($marker)

if ($idx -ne -1) {
    if ($content.IndexOf("this.interactables.push(oldCamera.interactableMesh)") -eq -1) {
        $insertion = "roomL2.group.add(oldCamera.mesh);
        this.interactables.push(oldCamera.interactableMesh); // Make camera clickable
        
        // Store reference to cinema screen for video playback
        this.cinemaScreen = cinemaScreen;"
        
        $content = $content.Replace($marker, $insertion)
        Set-Content -Path $path -Value $content
        Write-Host "Added camera to interactables and stored screen reference"
    }
}
