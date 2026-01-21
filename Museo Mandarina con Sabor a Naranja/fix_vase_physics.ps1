$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find and replace BreakableVase
$startMarker = "export class BreakableVase {"
$startIdx = $content.IndexOf($startMarker)

if ($startIdx -ne -1) {
    $cinemaIdx = $content.IndexOf("export class CinemaScreen")
    if ($cinemaIdx -ne -1) {
        $endIdx = $cinemaIdx
    } else {
        $endIdx = $content.Length
    }
    
    $newClass = @"
export class BreakableVase {
    constructor(flowerType = 'orchid') {
        this.mesh = new THREE.Group();
        this.vase = null;
        this.flowerType = flowerType;
        this.shards = [];
        this.interactableMesh = null;
        this.animating = false;
        this.build();
    }

    build() {
        // Create vase container group
        this.vase = new THREE.Group();
        
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
            color: 0xD4A574,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide // Render both sides to avoid transparency
        });
        
        const vaseMesh = new THREE.Mesh(geometry, material);
        vaseMesh.castShadow = true;
        vaseMesh.receiveShadow = true;
        this.vase.add(vaseMesh);

        this.addFlowers();
        
        this.vase.position.y = 0;
        this.mesh.add(this.vase);

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
        flowerGroup.position.y = 1.1; // Position inside vase opening
        
        if (this.flowerType === 'orchid') {
            for (let i = 0; i < 3; i++) {
                const stem = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.015, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0x2d5016 })
                );
                stem.position.y = 0.3;
                stem.position.x = (Math.random() - 0.5) * 0.1;
                stem.position.z = (Math.random() - 0.5) * 0.1;
                stem.rotation.z = (Math.random() - 0.5) * 0.3;
                
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
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x4a7c2c })
            );
            stem.position.y = 0.4;
            
            const center = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            center.position.y = 0.8;
            center.rotation.x = Math.PI / 2;
            stem.add(center);
            
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
        if (!this.vase.visible || this.animating) return;

        this.vase.visible = false;
        this.animating = true;
        
        // Create shards with physics
        const shardGeo = new THREE.TetrahedronGeometry(0.15);
        const shardMat = new THREE.MeshStandardMaterial({ 
            color: 0xD4A574,
            roughness: 0.3
        });
        
        // Get world position of vase
        const worldPos = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPos);
        
        for (let i = 0; i < 12; i++) {
            const shard = new THREE.Mesh(shardGeo, shardMat);
            shard.position.set(worldPos.x, worldPos.y + 0.5, worldPos.z);
            
            const angle = (i / 12) * Math.PI * 2;
            shard.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * 0.15,
                Math.random() * 0.15 + 0.1,
                Math.sin(angle) * 0.15
            );
            
            shard.userData.angularVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            shard.castShadow = true;
            this.mesh.add(shard);
            this.shards.push(shard);
        }
        
        // Disable interaction
        if (this.interactableMesh) {
            this.mesh.remove(this.interactableMesh);
            this.interactableMesh = null;
        }
        
        // Start animation
        this.animateShards();
    }
    
    animateShards() {
        if (this.shards.length === 0) {
            this.animating = false;
            return;
        }
        
        let allStopped = true;
        const gravity = 0.008;
        
        this.shards.forEach(shard => {
            if (shard.position.y > 0.1) {
                // Apply physics
                shard.userData.velocity.y -= gravity;
                shard.position.add(shard.userData.velocity);
                
                // Apply rotation
                shard.rotation.x += shard.userData.angularVelocity.x;
                shard.rotation.y += shard.userData.angularVelocity.y;
                shard.rotation.z += shard.userData.angularVelocity.z;
                
                allStopped = false;
            } else {
                // Stop at ground
                shard.position.y = 0.1;
                shard.userData.velocity.set(0, 0, 0);
            }
        });
        
        if (allStopped) {
            // Fade out and remove shards
            setTimeout(() => {
                this.shards.forEach(shard => {
                    this.mesh.remove(shard);
                });
                this.shards = [];
                this.animating = false;
            }, 2000);
        } else {
            requestAnimationFrame(() => this.animateShards());
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
    
    $content = $content.Remove($startIdx, $endIdx - $startIdx)
    $content = $content.Insert($startIdx, $newClass)
    
    Set-Content -Path $path -Value $content
    Write-Host "Updated BreakableVase with physics and solid interior"
} else {
    Write-Host "BreakableVase not found"
}
