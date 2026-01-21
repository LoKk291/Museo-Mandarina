$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Fix flower positioning - change from 1.1 to 0.8 or lower
$target = "flowerGroup.position.y = 1.1;"
$replacement = "flowerGroup.position.y = 0.85; // Lower to connect with vase opening"

if ($content -match [regex]::Escape($target)) {
    $content = $content -replace [regex]::Escape($target), $replacement
    Set-Content -Path $path -Value $content
    Write-Host "Fixed flower positioning"
} else {
    Write-Host "Target not found - checking current value"
}
