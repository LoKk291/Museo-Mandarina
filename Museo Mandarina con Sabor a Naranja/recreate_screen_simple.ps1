$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Find and completely replace CinemaScreen class
$startMarker = "export class CinemaScreen {"
$endMarker = "export class OldCamera {"

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

if ($startIdx -ne -1 -and $endIdx -ne -1) {
    # Simple, guaranteed-visible screen using BoxGeometry
    $newCinemaScreen = @'
export class CinemaScreen {
    constructor() {
        this.mesh = new THREE.Group();
        this.screenMesh = null;
        this.build();
    }

    build() {
        // Simple box screen - guaranteed visible from all angles
        const screenWidth = 6;
        const screenHeight = 3.375;
        const screenDepth = 0.05;
        
        const screenGeo = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x000000,
            roughness: 0.9,
            metalness: 0
        });
        
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.y = 2.5;
        this.screenMesh.castShadow = true;
        this.screenMesh.receiveShadow = true;
        this.mesh.add(this.screenMesh);

        // Black frame
        const frameThickness = 0.2;
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
        
        // Top
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(screenWidth + frameThickness * 2, frameThickness, screenDepth),
            frameMat
        );
        topFrame.position.set(0, 2.5 + screenHeight/2 + frameThickness/2, 0);
        this.mesh.add(topFrame);
        
        // Bottom
        const bottomFrame = topFrame.clone();
        bottomFrame.position.y = 2.5 - screenHeight/2 - frameThickness/2;
        this.mesh.add(bottomFrame);
        
        // Left
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, screenHeight + frameThickness * 2, screenDepth),
            frameMat
        );
        leftFrame.position.set(-screenWidth/2 - frameThickness/2, 2.5, 0);
        this.mesh.add(leftFrame);
        
        // Right
        const rightFrame = leftFrame.clone();
        rightFrame.position.x = screenWidth/2 + frameThickness/2;
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
    
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Recreated CinemaScreen from scratch with BoxGeometry"
}
