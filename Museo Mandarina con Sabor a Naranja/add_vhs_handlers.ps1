$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# Add VHS system variables at the top (after imports/initial setup)
$varsMarker = "let hasGoldenKey = false;"
$varsIdx = $content.IndexOf($varsMarker)

if ($varsIdx -ne -1) {
    $insertion = "let hasGoldenKey = false;

// VHS Cinema System
let cinemaVideo = null;
let cinemaVideoTexture = null;
let currentlyPlayingVHS = false;"
    
    $content = $content.Replace($varsMarker, $insertion)
}

# Add camera interaction in checkInteraction
$checkMarker = "} else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = `"Click para leer carta`";
            interactionMsg.style.display = 'block';"

$checkInsertion = "} else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = `"Click para leer carta`";
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'vhs-camera') {
            interactionMsg.textContent = `"Click para seleccionar VHS`";
            interactionMsg.style.display = 'block';"

$content = $content.Replace($checkMarker, $checkInsertion)

# Add camera click handler (after minecraft-block handler)
$clickMarker = "} else if (hitObject.userData.type === 'minecraft-block') {
            soundManager.play('click');
            const title = hitObject.userData.blockId === 'furnace' ? 'Horno' : 'Mesa de Trabajo';
            // Placeholder text
            const content = `"Una nota antigua yace aquí, escrita con una vieja máquina de escribir...`"; 
            showLetter(title, content, false, 'special-letter');
        }"

$clickInsertion = "} else if (hitObject.userData.type === 'minecraft-block') {
            soundManager.play('click');
            const title = hitObject.userData.blockId === 'furnace' ? 'Horno' : 'Mesa de Trabajo';
            const content = `"Una nota antigua yace aquí, escrita con una vieja máquina de escribir...`"; 
            showLetter(title, content, false, 'special-letter');
        } else if (hitObject.userData.type === 'vhs-camera') {
            soundManager.play('click');
            openVHSSelector();
        }"

$content = $content.Replace($clickMarker, $clickInsertion)

Set-Content -Path $path -Value $content
Write-Host "Added VHS variables and interaction handlers"
