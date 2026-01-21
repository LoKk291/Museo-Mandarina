$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

function UpdateBed {
    param(
        [string]$text
    )

    $className = "MinecraftBed"
    $pattern = "class $className"
    $match = [regex]::Match($text, $pattern)
    if (-not $match.Success) { Write-Host "Class $className NOT FOUND"; return $text }
    $classIdx = $match.Index

    $sub = $text.Substring($classIdx + 10)
    $nextMatch = [regex]::Match($sub, "class\s+\w+")
    if ($nextMatch.Success) {
        $endIdx = $classIdx + 10 + $nextMatch.Index
    } else {
        $endIdx = $text.Length
    }
    
    $block = $text.Substring($classIdx, $endIdx - $classIdx)
    
    # 1. Update build() method to use Atlas Mapping
    # We will completely replace the body of build() mostly to ensure clean logic.
    # Identifying the part inside build().
    
    # Finding "build() {"
    $buildIdx = $block.IndexOf("build() {")
    if ($buildIdx -eq -1) { return $text }
    
    # We want to replace from "build() {" down to the closing brace of build.
    # Simpler: Replace the specific texture loading and material creation block.
    
    # Regex for Texture Loading
    $loaderRegex = "const bedTexture = loader\.load\('.*?'\);"
    if ($block -match $loaderRegex) {
        $block = $block -replace $loaderRegex, "const bedTexture = loader.load('textures/minecraft/bed.png');"
    }

    # Regex for Bed Material/Mesh creation
    # "const bedMat = new THREE.MeshStandardMaterial({ map: bedTexture });"
    # "const bed = new THREE.Mesh(bedGeo, bedMat);"
    
    # We need to change simple Mesh to Multi-Material Mesh with UVs.
    
    $oldLogic = "(?s)const bedGeo = new THREE\.BoxGeometry.*?this\.mesh\.add\(bed\);"
    
    $newLogic = "const bedWidth = 1;
        const bedLength = 2;
        const bedHeight = 0.5;

        // UV Mapping for Bed Atlas (Cross Layout)
        // Image Ratio assumed 2:3 (W=2, H=3)
        // Flaps: 0.5 unit. Center: 1x2 units.
        const uvs = {
            right: { x: 0.75, y: 0.166, w: 0.25, h: 0.666 },  // Right
            left: { x: 0.0, y: 0.166, w: 0.25, h: 0.666 },    // Left
            top: { x: 0.25, y: 0.166, w: 0.5, h: 0.666 },     // Top (Center)
            bottom: { x: 0.25, y: 0.166, w: 0.5, h: 0.666 },  // Bottom (Copy Top)
            front: { x: 0.25, y: 0.0, w: 0.5, h: 0.166 },     // Foot (Bottom Flap) ?? Verify logic
            back: { x: 0.25, y: 0.833, w: 0.5, h: 0.166 }     // Head (Top Flap)
        };

        const materials = [];
        ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach(face => {
            const mat = new THREE.MeshStandardMaterial({ map: bedTexture.clone() });
            mat.map.repeat.set(uvs[face].w, uvs[face].h);
            mat.map.offset.set(uvs[face].x, uvs[face].y);
            // Rotate Top texture if needed? Bed usually aligned. 
            // If Textures are rotated in Atlas, might need rotation here.
            // Assuming standard align.
            materials.push(mat);
        });

        const bedGeo = new THREE.BoxGeometry(bedWidth, bedHeight, bedLength);
        const bed = new THREE.Mesh(bedGeo, materials);
        bed.position.y = bedHeight / 2;
        bed.castShadow = true;
        bed.receiveShadow = true;
        this.mesh.add(bed);"
        
    $block = [regex]::Replace($block, $oldLogic, $newLogic)

    $newText = $text.Substring(0, $classIdx) + $block + $text.Substring($endIdx)
    return $newText
}

$c = $content
$c = UpdateBed -text $c

Set-Content -Path $path -Value $c
Write-Host "Done"
