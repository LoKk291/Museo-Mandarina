$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Revert camera rotation back to original
$newRotation = "oldCamera.setRotation(Math.PI / 2); // Face West towards screen"
$oldRotation = "oldCamera.setRotation(-Math.PI / 2);"

if ($content -match [regex]::Escape($newRotation)) {
    $content = $content.Replace($newRotation, $oldRotation)
    Set-Content -Path $path -Value $content
    Write-Host "Reverted camera rotation"
} else {
    Write-Host "Already at original rotation"
}
