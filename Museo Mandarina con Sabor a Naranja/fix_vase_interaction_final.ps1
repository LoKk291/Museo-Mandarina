$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# We need to replace the entire BreakableVase class.
# We'll use regex to match from "export class BreakableVase" to the end of its block.
# This is risky if regex fails on large string.
# Alternative: Find start, find next "export class", replace between.

$startMarker = "export class BreakableVase {"
$startIdx = $content.IndexOf($startMarker)

if ($startIdx -ne -1) {
    # Find next class or end of file
    # The next class should be CinemaScreen or whatever we appended.
    # Or just search for the NEXT "export class" after startIdx.
    $nextClassIdx = $content.IndexOf("export class", $startIdx + 10)
    
    if ($nextClassIdx -eq -1) {
        # Maybe it's the last class?
        # But we appended CinemaScreen and OldCamera AFTER it.
        # Wait, if I appended them, they should be after.
        # Check if CinemaScreen is found.
        $cinemaIdx = $content.IndexOf("export class CinemaScreen")
        if ($cinemaIdx -ne -1) {
             $endIdx = $cinemaIdx
        } else {
             $endIdx = $content.Length
        }
    } else {
        $endIdx = $nextClassIdx
    }
    
    # New Implementation
    $newClass = "export class BreakableVase {
    constructor(flowerType = 'orchid') {
        this.mesh = new THREE.Group();
        this.vase = null;
        this.flowerType = flowerType;
        this.shards = [];
        this.interactableMesh = null;
        this.build();
    }

    build() {
        const geometry = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 12);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xE6E6FA, // Lavender ceramic
            roughness: 0.2,
            metalness: 0
        });
        
        this.vase = new THREE.Mesh(geometry, material);
        this.vase.position.y = 0.6;
        this.vase.castShadow = true;
        this.mesh.add(this.vase);

        this.addFlowers();

        // Hitbox for raycasting
        const hitboxGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        this.interactableMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
        this.interactableMesh.position.y = 0.75;
        this.interactableMesh.userData = {
            type: 'breakable-vase',
            parentObj: this
        };
        this.mesh.add(this.interactableMesh);
    }

    addFlowers() {
        // Simple flower logic placeholder
        // ... (Simplified for fix)
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x006400 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 1.2;
        this.vase.add(stem);
        
        // Flower Head
        const headGeo = new THREE.SphereGeometry(0.2);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.4;
        stem.add(head);
    }

    breakVase() {
        if (!this.vase.visible) return;

        // Hide original vase
        this.vase.visible = false;
        
        // Create shards
        const shardGeo = new THREE.TetrahedronGeometry(0.2);
        const shardMat = new THREE.MeshStandardMaterial({ color: 0xE6E6FA });
        
        for (let i = 0; i < 8; i++) {
            const shard = new THREE.Mesh(shardGeo, shardMat);
            shard.position.copy(this.vase.position);
            shard.position.y += Math.random() * 0.5;
            shard.position.x += (Math.random() - 0.5) * 0.5;
            shard.position.z += (Math.random() - 0.5) * 0.5;
            
            shard.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            this.mesh.add(shard);
            this.shards.push(shard);
        }
        
        // Disable interaction
        if (this.interactableMesh) {
             this.mesh.remove(this.interactableMesh);
             this.interactableMesh = null;
        }
    }
    
    // Alias just in case
    break() {
        this.breakVase();
    }
}

"
    # Replace existing block with new Class
    $content = $content.Remove($startIdx, $endIdx - $startIdx)
    $content = $content.Insert($startIdx, $newClass)
    
    Set-Content -Path $path -Value $content
    Write-Host "Replaced BreakableVase class"
} else {
    Write-Host "BreakableVase class not found"
}
