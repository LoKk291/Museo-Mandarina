$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Make screen material double-sided and ensure it's visible
$oldMaterial = "const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x222222,
            roughness: 0.8,
            metalness: 0
        });"

$newMaterial = "const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x222222,
            roughness: 0.8,
            metalness: 0,
            side: THREE.DoubleSide // Visible from both sides
        });"

if ($content -match [regex]::Escape($oldMaterial)) {
    $content = $content.Replace($oldMaterial, $newMaterial)
    Set-Content -Path $path -Value $content
    Write-Host "Made screen double-sided"
} else {
    Write-Host "Screen material not found or already double-sided"
}
