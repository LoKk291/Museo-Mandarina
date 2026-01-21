$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# Update playVHS to use screenMesh property and turn on camera light
$oldPlayVHS = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        const screenMesh = world.cinemaScreen.mesh.children[0];
        if (screenMesh && screenMesh.isMesh) {
            screenMesh.material.map = cinemaVideoTexture;
            screenMesh.material.emissive.setHex(0x222222);
            screenMesh.material.needsUpdate = true;
        }
    }"

$newPlayVHS = "if (world.cinemaScreen && world.cinemaScreen.screenMesh) {
        world.cinemaScreen.screenMesh.material.map = cinemaVideoTexture;
        world.cinemaScreen.screenMesh.material.emissive.setHex(0x333333);
        world.cinemaScreen.screenMesh.material.needsUpdate = true;
    }
    
    // Turn on camera projector light
    if (world.oldCamera) {
        world.oldCamera.turnOnLight();
    }"

$content = $content.Replace($oldPlayVHS, $newPlayVHS)

# Update stopCinema to use screenMesh property and turn off camera light
$oldStop = "if (world.cinemaScreen && world.cinemaScreen.mesh) {
        const screenMesh = world.cinemaScreen.mesh.children[0];
        if (screenMesh && screenMesh.isMesh) {
            screenMesh.material.map = null;
            screenMesh.material.emissive.setHex(0x111111);
            screenMesh.material.color.setHex(0xFFFFFF);
            screenMesh.material.needsUpdate = true;
        }
    }"

$newStop = "if (world.cinemaScreen && world.cinemaScreen.screenMesh) {
        world.cinemaScreen.screenMesh.material.map = null;
        world.cinemaScreen.screenMesh.material.emissive.setHex(0x222222);
        world.cinemaScreen.screenMesh.material.color.setHex(0xFFFFFF);
        world.cinemaScreen.screenMesh.material.needsUpdate = true;
    }
    
    // Turn off camera projector light
    if (world.oldCamera) {
        world.oldCamera.turnOffLight();
    }"

$content = $content.Replace($oldStop, $newStop)

Set-Content -Path $path -Value $content
Write-Host "Updated playVHS and stopCinema to use new screen structure and camera light"
