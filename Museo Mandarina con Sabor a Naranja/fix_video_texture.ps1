$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# Fix playVHS - change forEach to direct access
$oldPlayVHS = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        world.cinemaScreen.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.material.map = cinemaVideoTexture;
                child.material.needsUpdate = true;
            }
        });
    }"

$newPlayVHS = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        const screenMesh = world.cinemaScreen.mesh.children[0];
        if (screenMesh && screenMesh.isMesh) {
            screenMesh.material.map = cinemaVideoTexture;
            screenMesh.material.emissive.setHex(0x222222);
            screenMesh.material.needsUpdate = true;
        }
    }"

$content = $content.Replace($oldPlayVHS, $newPlayVHS)

# Fix stopCinema - change forEach to direct access
$oldStop = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        world.cinemaScreen.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.material.map = null;
                child.material.color.setHex(0xFFFFFF);
                child.material.needsUpdate = true;
            }
        });
    }"

$newStop = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        const screenMesh = world.cinemaScreen.mesh.children[0];
        if (screenMesh && screenMesh.isMesh) {
            screenMesh.material.map = null;
            screenMesh.material.emissive.setHex(0x111111);
            screenMesh.material.color.setHex(0xFFFFFF);
            screenMesh.material.needsUpdate = true;
        }
    }"

$content = $content.Replace($oldStop, $newStop)

Set-Content -Path $path -Value $content
Write-Host "Fixed video texture application"
