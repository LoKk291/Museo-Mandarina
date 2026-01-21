$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Fix camera rotation - it should face West (-X direction) towards the screen
# Current: -Math.PI / 2 (faces East)
# Need: Math.PI / 2 (faces West)

$oldRotation = "oldCamera.setRotation(-Math.PI / 2);"
$newRotation = "oldCamera.setRotation(Math.PI / 2); // Face West towards screen"

if ($content -match [regex]::Escape($oldRotation)) {
    $content = $content.Replace($oldRotation, $newRotation)
    Set-Content -Path $path -Value $content
    Write-Host "Fixed camera rotation to face screen"
} else {
    Write-Host "Camera rotation line not found"
}
