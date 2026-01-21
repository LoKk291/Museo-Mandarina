$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"

# Append CinemaScreen Class
$cinemaScreenClass = "
// ===== CINEMA SCREEN =====
export class CinemaScreen {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Simple white screen
        const geo = new THREE.PlaneGeometry(8, 4.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            roughness: 0.9, 
            emisive: 0x111111 
        });
        const screen = new THREE.Mesh(geo, mat);
        screen.position.y = 2.5; // Height
        screen.castShadow = true;
        screen.receiveShadow = true;
        this.mesh.add(screen);

        // Frame
        const frameGeo = new THREE.BoxGeometry(8.2, 4.7, 0.1);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(0, 2.5, -0.06);
        this.mesh.add(frame);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}
"

# Append OldCamera Class
$oldCameraClass = "
// ===== OLD CAMERA =====
export class OldCamera {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Tripod Legs
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x5C3A21 }); // Wood

        const leg1 = new THREE.Mesh(legGeo, legMat);
        leg1.rotation.z = 0.3;
        leg1.rotation.y = 0;
        leg1.position.set(0.3, 0.6, 0);

        const leg2 = new THREE.Mesh(legGeo, legMat);
        leg2.rotation.z = 0.3;
        leg2.rotation.y = 2.09; // 120 deg
        leg2.position.set(-0.15, 0.6, 0.25);

        const leg3 = new THREE.Mesh(legGeo, legMat);
        leg3.rotation.z = 0.3;
        leg3.rotation.y = -2.09; // -120 deg
        leg3.position.set(-0.15, 0.6, -0.25);

        this.mesh.add(leg1);
        this.mesh.add(leg2);
        this.mesh.add(leg3);

        // Camera Body (Box)
        const bodyGeo = new THREE.BoxGeometry(0.4, 0.4, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.3;
        this.mesh.add(body);

        // Lens (Cylinder)
        const lensGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 1.3, 0.4); // Front
        this.mesh.add(lens);

        // Flash (Bulb)
        const flashStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        flashStem.position.set(0.2, 1.5, 0);
        this.mesh.add(flashStem);

        const flashBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.08),
            new THREE.MeshStandardMaterial({ color: 0xFFFFE0, emissive: 0x555555 })
        );
        flashBulb.position.set(0.2, 1.65, 0);
        this.mesh.add(flashBulb);

        // Reels (Two circles on top)
        const reelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05);
        const reelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const reel1 = new THREE.Mesh(reelGeo, reelMat);
        reel1.rotation.z = Math.PI / 2;
        reel1.position.set(-0.25, 1.55, -0.1);
        this.mesh.add(reel1);

        const reel2 = new THREE.Mesh(reelGeo, reelMat);
        reel2.rotation.z = Math.PI / 2;
        reel2.position.set(-0.25, 1.55, 0.1);
        this.mesh.add(reel2);

        this.mesh.castShadow = true;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}
"

Add-Content -Path $path -Value $cinemaScreenClass
Add-Content -Path $path -Value $oldCameraClass
Write-Host "Classes appended to Furniture.js"
