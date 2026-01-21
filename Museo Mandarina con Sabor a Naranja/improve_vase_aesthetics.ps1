$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find BreakableVase class and replace with improved version
$startMarker = "export class BreakableVase {"
$startIdx = $content.IndexOf($startMarker)

if ($startIdx -ne -1) {
    # Find next class
    $cinemaIdx = $content.IndexOf("export class CinemaScreen")
    if ($cinemaIdx -ne -1) {
        $endIdx = $cinemaIdx
    } else {
        $endIdx = $content.Length
    }
    
    # New improved implementation
    $newClass = @"
export class BreakableVase {
    constructor(flowerType = 'orchid') {
        this.mesh = new THREE.Group();
        this.vase = null;
        this.flowerType = flowerType;
        this.shards = [];
        this.interactableMesh = null;
        this.build();
    }

    build() {
        // Create elegant vase shape using LatheGeometry
        const points = [];
        points.push(new THREE.Vector2(0, 0));
        points.push(new THREE.Vector2(0.2, 0));
        points.push(new THREE.Vector2(0.25, 0.1));
        points.push(new THREE.Vector2(0.3, 0.3));
        points.push(new THREE.Vector2(0.28, 0.5));
        points.push(new THREE.Vector2(0.3, 0.7));
        points.push(new THREE.Vector2(0.25, 0.9));
        points.push(new THREE.Vector2(0.2, 1.0));
        points.push(new THREE.Vector2(0.22, 1.1));
        
        const geometry = new THREE.LatheGeometry(points, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xD4A574, // Terracotta/ceramic
            roughness: 0.3,
            metalness: 0.1
        });
        
        this.vase = new THREE.Mesh(geometry, material);
        this.vase.position.y = 0;
        this.vase.castShadow = true;
        this.vase.receiveShadow = true;
        this.mesh.add(this.vase);

        this.addFlowers();

        // Hitbox for raycasting
        const hitboxGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
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
        const flowerGroup = new THREE.Group();
        flowerGroup.position.y = 1.1;
        
        if (this.flowerType === 'orchid') {
            // Orchid - elegant purple flowers
            for (let i = 0; i < 3; i++) {
                const stem = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.015, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0x2d5016 })
                );
                stem.position.y = 0.3;
                stem.position.x = (Math.random() - 0.5) * 0.1;
                stem.position.z = (Math.random() - 0.5) * 0.1;
                stem.rotation.z = (Math.random() - 0.5) * 0.3;
                
                // Orchid petals
                const petalGeo = new THREE.SphereGeometry(0.08, 8, 8);
                const petalMat = new THREE.MeshStandardMaterial({ 
                    color: 0x9370DB,
                    roughness: 0.4
                });
                
                for (let j = 0; j < 5; j++) {
                    const petal = new THREE.Mesh(petalGeo, petalMat);
                    const angle = (j / 5) * Math.PI * 2;
                    petal.position.x = Math.cos(angle) * 0.06;
                    petal.position.z = Math.sin(angle) * 0.06;
                    petal.position.y = 0.6;
                    petal.scale.set(1, 0.5, 0.7);
                    stem.add(petal);
                }
                
                flowerGroup.add(stem);
            }
        } else if (this.flowerType === 'sunflower') {
            // Sunflower - bright yellow
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x4a7c2c })
            );
            stem.position.y = 0.4;
            
            // Sunflower head
            const center = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            center.position.y = 0.8;
            center.rotation.x = Math.PI / 2;
            stem.add(center);
            
            // Petals
            const petalGeo = new THREE.BoxGeometry(0.08, 0.15, 0.02);
            const petalMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
            
            for (let i = 0; i < 12; i++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                const angle = (i / 12) * Math.PI * 2;
                petal.position.x = Math.cos(angle) * 0.15;
                petal.position.z = Math.sin(angle) * 0.15;
                petal.position.y = 0.8;
                petal.rotation.y = angle;
                stem.add(petal);
            }
            
            flowerGroup.add(stem);
        } else if (this.flowerType === 'snake_plant') {
            // Snake plant - tall green leaves
            for (let i = 0; i < 5; i++) {
                const leafGeo = new THREE.BoxGeometry(0.08, 0.7, 0.02);
                const leafMat = new THREE.MeshStandardMaterial({ 
                    color: 0x2d5016,
                    roughness: 0.6
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = 0.35;
                const angle = (i / 5) * Math.PI * 2;
                leaf.position.x = Math.cos(angle) * 0.08;
                leaf.position.z = Math.sin(angle) * 0.08;
                leaf.rotation.y = angle;
                leaf.rotation.z = (Math.random() - 0.5) * 0.2;
                flowerGroup.add(leaf);
            }
        }
        
        this.vase.add(flowerGroup);
    }

    breakVase() {
        if (!this.vase.visible) return;

        // Hide original vase
        this.vase.visible = false;
        
        // Create realistic shards
        const shardGeo = new THREE.TetrahedronGeometry(0.15);
        const shardMat = new THREE.MeshStandardMaterial({ 
            color: 0xD4A574,
            roughness: 0.3
        });
        
        for (let i = 0; i < 12; i++) {
            const shard = new THREE.Mesh(shardGeo, shardMat);
            shard.position.copy(this.vase.position);
            shard.position.y += 0.5;
            
            const angle = (i / 12) * Math.PI * 2;
            shard.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * 2,
                Math.random() * 2 + 1,
                Math.sin(angle) * 2
            );
            
            shard.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
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
    
    break() {
        this.breakVase();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}

"@
    
    # Replace
    $content = $content.Remove($startIdx, $endIdx - $startIdx)
    $content = $content.Insert($startIdx, $newClass)
    
    Set-Content -Path $path -Value $content
    Write-Host "Improved BreakableVase aesthetics"
} else {
    Write-Host "BreakableVase class not found"
}
