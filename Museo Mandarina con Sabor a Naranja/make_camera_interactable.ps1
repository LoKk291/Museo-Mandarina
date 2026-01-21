$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find OldCamera class and add interactable mesh
$marker = "export class OldCamera {"
$idx = $content.IndexOf($marker)

if ($idx -ne -1) {
    # Find the build() method closing brace
    $buildEnd = $content.IndexOf("this.mesh.castShadow = true;", $idx)
    
    if ($buildEnd -ne -1) {
        $insertion = "
        // Add interactable hitbox
        const hitboxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        this.interactableMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
        this.interactableMesh.position.y = 0.9;
        this.interactableMesh.userData = {
            type: 'vhs-camera',
            parentObj: this
        };
        this.mesh.add(this.interactableMesh);

        this.mesh.castShadow = true;"
        
        $target = "this.mesh.castShadow = true;"
        $content = $content.Replace($target, $insertion)
        
        Set-Content -Path $path -Value $content
        Write-Host "Made OldCamera interactable"
    }
}
