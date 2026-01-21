$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find CinemaScreen class
$startMarker = "export class CinemaScreen {"
$endMarker = "export class OldCamera {"

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

if ($startIdx -ne -1 -and $endIdx -ne -1) {
    $newCinemaScreen = @'
export class CinemaScreen {
    constructor() {
        this.mesh = new THREE.Group();
        this.screenMesh = null;
        this.build();
    }

    build() {
        // Wall-mounted cinema screen (16:9 aspect ratio)
        const screenWidth = 6;
        const screenHeight = 3.375; // 16:9 ratio
        
        // White screen surface
        const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x222222,
            roughness: 0.8,
            metalness: 0
        });
        
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.y = 2.5;
        this.screenMesh.castShadow = false;
        this.screenMesh.receiveShadow = true;
        this.mesh.add(this.screenMesh);

        // Black frame around screen
        const frameThickness = 0.15;
        const frameDepth = 0.1;
        
        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(screenWidth + frameThickness * 2, frameThickness, frameDepth),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        topFrame.position.set(0, 2.5 + screenHeight/2 + frameThickness/2, -0.06);
        this.mesh.add(topFrame);
        
        // Bottom frame
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(screenWidth + frameThickness * 2, frameThickness, frameDepth),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        bottomFrame.position.set(0, 2.5 - screenHeight/2 - frameThickness/2, -0.06);
        this.mesh.add(bottomFrame);
        
        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, screenHeight, frameDepth),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        leftFrame.position.set(-screenWidth/2 - frameThickness/2, 2.5, -0.06);
        this.mesh.add(leftFrame);
        
        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, screenHeight, frameDepth),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        rightFrame.position.set(screenWidth/2 + frameThickness/2, 2.5, -0.06);
        this.mesh.add(rightFrame);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}


'@
    
    $content = $content.Remove($startIdx, $endIdx - $startIdx)
    $content = $content.Insert($startIdx, $newCinemaScreen)
    
    Set-Content -Path $path -Value $content
    Write-Host "Redesigned CinemaScreen class"
}
