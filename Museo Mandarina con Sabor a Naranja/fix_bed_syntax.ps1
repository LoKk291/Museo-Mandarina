$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

function FixBed {
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
    
    # We will just rewrite the whole class cleanly to be sure.
    
    $cleanClass = "class MinecraftBed {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Load bed texture
        const loader = new THREE.TextureLoader();
        const bedTexture = loader.load('textures/minecraft/bed.png');
        bedTexture.magFilter = THREE.NearestFilter;
        bedTexture.minFilter = THREE.NearestFilter;

        // Create bed model matching the reference image
        const bedWidth = 1;
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
            materials.push(mat);
        });

        const bedGeo = new THREE.BoxGeometry(bedWidth, bedHeight, bedLength);
        const bed = new THREE.Mesh(bedGeo, materials);
        bed.position.y = bedHeight / 2;
        bed.castShadow = true;
        bed.receiveShadow = true;
        this.mesh.add(bed);

        // Legs (4 corners) - brown wood
        const legGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const legMat = new THREE.MeshStandardMaterial({ color: '#8B6914' });

        const positions = [
            [-bedWidth / 2 + 0.1, 0.15, -bedLength / 2 + 0.1],
            [bedWidth / 2 - 0.1, 0.15, -bedLength / 2 + 0.1],
            [-bedWidth / 2 + 0.1, 0.15, bedLength / 2 - 0.1],
            [bedWidth / 2 - 0.1, 0.15, bedLength / 2 - 0.1]
        ];

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(...pos);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.mesh.add(leg);
        });
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}
"
    
    $newText = $text.Substring(0, $classIdx) + $cleanClass + $text.Substring($endIdx)
    return $newText
}

$c = $content
$c = FixBed -text $c

Set-Content -Path $path -Value $c
Write-Host "Done"
