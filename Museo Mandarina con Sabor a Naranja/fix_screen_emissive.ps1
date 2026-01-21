$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Fix screen material emissive using simpler replacement
$oldEmissive = "emissive: 0x222222,"
$newEmissive = "emissive: 0x000000,"

if ($content -match $oldEmissive) {
    $content = $content.Replace($oldEmissive, $newEmissive)
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Fixed screen emissive"
} else {
    Write-Host "Emissive already at 0 or not found"
}
