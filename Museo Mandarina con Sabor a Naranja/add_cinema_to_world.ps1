$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# We need to find "Room L2" block and append the items inside it.
# Identifying line: this.addRoom(roomL2, 'L2');
# We can insert before this line.

$marker = "this.addRoom(roomL2, 'L2');"
$idx = $content.IndexOf($marker)

if ($idx -ne -1) {
    # Check if already added
    if ($content -notmatch "new CinemaScreen") {
        $insertion = "
        // --- CINEMA SETUP ---
        const cinemaScreen = new CinemaScreen();
        // Room L2 Size 15x15. Center relative to room group is 0,0.
        // North Wall is at Z = -7.5.
        // Place screen close to North Wall.
        cinemaScreen.setPosition(0, 0, -7.4); 
        roomL2.group.add(cinemaScreen.mesh);

        const oldCamera = new OldCamera();
        // Camera near South Wall (Z = 7.5), facing North (Screen).
        // Rotate PI to face North? Default often faces +Z. 
        // If Default faces +Z (South), rotate PI to face -Z (North).
        // Let's assume Camera lens faces +Z by default?
        // In my build(): lens.position.set(0, 1.3, 0.4); -> +Z.
        // So to face North (-Z), rotate PI.
        oldCamera.setPosition(0, 0, 5); // 5 units back
        oldCamera.setRotation(Math.PI); 
        roomL2.group.add(oldCamera.mesh);
        
        // Add Camera to interactables? User didn't ask, but good practice.
        // Since OldCamera is just a visual prop for now, we leave it.
        // Unless user wants to look through it? User said 'una camara estilo antiguo'.
        // Let's just place it.
"
        $content = $content.Insert($idx, $insertion)
        Set-Content -Path $path -Value $content
        Write-Host "Added Cinema items to L2"
    } else {
        Write-Host "Cinema items already present"
    }
} else {
    Write-Host "Could not find Room L2 marker"
}
