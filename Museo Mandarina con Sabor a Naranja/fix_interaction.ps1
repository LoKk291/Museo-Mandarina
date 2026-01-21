$furniturePath = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$worldPath = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"

# 1. Update Furniture.js (Add userData)
$furnitureContent = Get-Content -Path $furniturePath -Raw

# Helper to add userData logic if not present
function AddUserData {
    param([string]$text, [string]$blockId)
    # Regex to find the line: const cube = new THREE.Mesh(...)
    # inside a block that relates to the $blockId (we assume order/context)
    
    # We'll search for specific context.
    # CraftingTable Context:
    # const material = new THREE.MeshStandardMaterial({ map: texture });
    # const cube = new THREE.Mesh(geometry, material);
    
    # Furnace Context:
    # const geometry = new THREE.BoxGeometry(size, size, size);
    # const cube = new THREE.Mesh(geometry, materials);
    
    if ($blockId -eq "crafting-table") {
        $target = "const material = new THREE.MeshStandardMaterial({ map: texture });`r`n        const cube = new THREE.Mesh(geometry, material);"
        $replacement = "const material = new THREE.MeshStandardMaterial({ map: texture });`r`n        const cube = new THREE.Mesh(geometry, material);`r`n        cube.userData = { type: 'minecraft-block', blockId: 'crafting-table' };"
        
        # Normalize line endings
        $text = $text -replace [regex]::Escape("const material = new THREE.MeshStandardMaterial({ map: texture });`n        const cube = new THREE.Mesh(geometry, material);"), "const material = new THREE.MeshStandardMaterial({ map: texture });`n        const cube = new THREE.Mesh(geometry, material);`n        cube.userData = { type: 'minecraft-block', blockId: 'crafting-table' };"
        
        # Try raw replace if lines differ slightly
        if ($text.IndexOf("blockId: 'crafting-table'") -eq -1) {
             # Simple string replace first (assuming consistent indentation from previous steps)
             $simpleTarget = "const cube = new THREE.Mesh(geometry, material);"
             $simpleRepl = "const cube = new THREE.Mesh(geometry, material);`r`n        cube.userData = { type: 'minecraft-block', blockId: 'crafting-table' };"
             # Since 'const cube = ...' appears in both, we need context.
             # CraftingTable has 'material' (singular). Furnace has 'materials' (plural).
             $text = $text -replace [regex]::Escape($simpleTarget), $simpleRepl
        }
    }
    
    if ($blockId -eq "furnace") {
        # Check explicit context: Furnace uses 'materials' array
        $target = "const cube = new THREE.Mesh(geometry, materials);"
        $repl = "const cube = new THREE.Mesh(geometry, materials);`r`n        cube.userData = { type: 'minecraft-block', blockId: 'furnace' };"
        
        if ($text.IndexOf("blockId: 'furnace'") -eq -1) {
            $text = $text -replace [regex]::Escape($target), $repl
        }
    }
    
    return $text
}

$furnitureContent = AddUserData -text $furnitureContent -blockId "crafting-table"
$furnitureContent = AddUserData -text $furnitureContent -blockId "furnace"
Set-Content -Path $furniturePath -Value $furnitureContent

# 2. Update World.js (Add to interactables)
$worldContent = Get-Content -Path $worldPath -Raw

# Check if already added
# We look for:
# this.isolatedRoom.group.add(furnace.mesh);
# And append: this.interactables.push(furnace.mesh);

if ($worldContent.IndexOf("this.interactables.push(craftingTable.mesh)") -eq -1) {
    # Crafting Table
    $ctTarget = "this.isolatedRoom.group.add(craftingTable.mesh);"
    $ctRepl = "this.isolatedRoom.group.add(craftingTable.mesh);`r`n        this.interactables.push(craftingTable.mesh);"
    
    $worldContent = $worldContent -replace [regex]::Escape($ctTarget), $ctRepl
}

if ($worldContent.IndexOf("this.interactables.push(furnace.mesh)") -eq -1) {
    # Furnace
    $furTarget = "this.isolatedRoom.group.add(furnace.mesh);"
    $furRepl = "this.isolatedRoom.group.add(furnace.mesh);`r`n        this.interactables.push(furnace.mesh);"
    
    $worldContent = $worldContent -replace [regex]::Escape($furTarget), $furRepl
}

Set-Content -Path $worldPath -Value $worldContent
Write-Host "Done"
