$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Revert projector target
$newTarget = "this.projectorLight.target.position.set(-10, 1.5, 0); // Point West towards screen"
$oldTarget = "this.projectorLight.target.position.set(0, 1.5, -10);"

if ($content -match [regex]::Escape($newTarget)) {
    $content = $content.Replace($newTarget, $oldTarget)
    Set-Content -Path $path -Value $content
    Write-Host "Reverted projector direction"
} else {
    Write-Host "Already at original direction"
}
