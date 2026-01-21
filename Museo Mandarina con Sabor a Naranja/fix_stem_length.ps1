$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find and replace the addFlowers method with longer stems
$startMarker = "addFlowers() {"
$endMarker = "this.vase.add(flowerGroup);"

$startIdx = $content.IndexOf($startMarker)
if ($startIdx -ne -1) {
    $endIdx = $content.IndexOf($endMarker, $startIdx)
    if ($endIdx -ne -1) {
        $endIdx += $endMarker.Length
        
        $newFlowerMethod = @"
addFlowers() {
        const flowerGroup = new THREE.Group();
        flowerGroup.position.y = 0; // Start at bottom of vase
        
        if (this.flowerType === 'orchid') {
            for (let i = 0; i < 3; i++) {
                const stem = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.015, 1.2), // Longer stem
                    new THREE.MeshStandardMaterial({ color: 0x2d5016 })
                );
                stem.position.y = 0.6; // Half of stem length
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
                    petal.position.y = 0.6; // At top of stem
                    petal.scale.set(1, 0.5, 0.7);
                    stem.add(petal);
                }
                
                flowerGroup.add(stem);
            }
        } else if (this.flowerType === 'sunflower') {
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 1.4), // Much longer stem
                new THREE.MeshStandardMaterial({ 
                    color: 0x4a7c2c,
                    roughness: 0.7
                })
            );
            stem.position.y = 0.7; // Half of stem length
            
            // Brown center
            const center = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshStandardMaterial({ 
                    color: 0x5C4033,
                    roughness: 0.9
                })
            );
            center.position.y = 0.7; // At top of stem
            center.scale.set(1, 0.6, 1);
            stem.add(center);
            
            // Yellow petals
            const petalGeo = new THREE.BoxGeometry(0.12, 0.25, 0.03);
            const petalMat = new THREE.MeshStandardMaterial({ 
                color: 0xFFD700,
                roughness: 0.5
            });
            
            for (let i = 0; i < 16; i++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                const angle = (i / 16) * Math.PI * 2;
                const radius = 0.2;
                petal.position.x = Math.cos(angle) * radius;
                petal.position.z = Math.sin(angle) * radius;
                petal.position.y = 0.7;
                petal.rotation.y = angle;
                petal.rotation.x = -0.3;
                stem.add(petal);
            }
            
            // Leaves on stem
            for (let i = 0; i < 2; i++) {
                const leafGeo = new THREE.BoxGeometry(0.15, 0.08, 0.02);
                const leafMat = new THREE.MeshStandardMaterial({ 
                    color: 0x2d5016,
                    roughness: 0.6
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = -0.2 + i * 0.4; // Relative to stem center
                leaf.position.x = i % 2 === 0 ? 0.05 : -0.05;
                leaf.rotation.z = i % 2 === 0 ? -0.5 : 0.5;
                stem.add(leaf);
            }
            
            flowerGroup.add(stem);
        } else if (this.flowerType === 'snake_plant') {
            for (let i = 0; i < 5; i++) {
                const leafGeo = new THREE.BoxGeometry(0.08, 1.1, 0.02); // Longer leaves
                const leafMat = new THREE.MeshStandardMaterial({ 
                    color: 0x2d5016,
                    roughness: 0.6
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = 0.55; // Half of leaf height
                const angle = (i / 5) * Math.PI * 2;
                leaf.position.x = Math.cos(angle) * 0.08;
                leaf.position.z = Math.sin(angle) * 0.08;
                leaf.rotation.y = angle;
                leaf.rotation.z = (Math.random() - 0.5) * 0.2;
                flowerGroup.add(leaf);
            }
        }
        
        this.vase.add(flowerGroup);
"@
        
        $content = $content.Remove($startIdx, $endIdx - $startIdx)
        $content = $content.Insert($startIdx, $newFlowerMethod)
        
        Set-Content -Path $path -Value $content
        Write-Host "Extended stem lengths to connect flowers properly"
    }
}
