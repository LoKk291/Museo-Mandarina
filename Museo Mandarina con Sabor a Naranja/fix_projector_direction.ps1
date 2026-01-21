$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Fix projector light target direction
# Current: target at (0, 1.5, -10) which is South
# Need: target at (-10, 1.5, 0) which is West (towards screen)

$oldTarget = "this.projectorLight.target.position.set(0, 1.5, -10);"
$newTarget = "this.projectorLight.target.position.set(-10, 1.5, 0); // Point West towards screen"

if ($content -match [regex]::Escape($oldTarget)) {
    $content = $content.Replace($oldTarget, $newTarget)
    Set-Content -Path $path -Value $content
    Write-Host "Fixed projector light direction"
} else {
    Write-Host "Projector target line not found"
}
