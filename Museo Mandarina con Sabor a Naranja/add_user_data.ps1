$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

function AddUserData {
    param(
        [string]$text,
        [string]$className,
        [string]$blockId
    )

    $pattern = "class $className"
    $match = [regex]::Match($text, $pattern)
    if (-not $match.Success) { return $text }
    $classIdx = $match.Index
    
    # We find class block.
    # We want to find "cube = new THREE.Mesh(geometry, materials);"
    # And add "cube.userData = { type: 'minecraft-block', blockId: '$blockId' };" after it.
    
    # Let's search inside the class block.
    $sub = $text.Substring($classIdx + 10)
    $nextMatch = [regex]::Match($sub, "class\s+\w+")
    if ($nextMatch.Success) {
        $endIdx = $classIdx + 10 + $nextMatch.Index
    } else {
        $endIdx = $text.Length
    }
    $block = $text.Substring($classIdx, $endIdx - $classIdx)

    $meshPattern = "const cube = new THREE\.Mesh\(geometry, materials\);"
    $userDataCode = "const cube = new THREE.Mesh(geometry, materials);
        cube.userData = { type: 'minecraft-block', blockId: '$blockId' };"
    
    if ($block -match $meshPattern) {
        $block = $block -replace $meshPattern, $userDataCode
    } else {
        Write-Host "Mesh creation not found in $className"
    }

    $newText = $text.Substring(0, $classIdx) + $block + $text.Substring($endIdx)
    return $newText
}

$c = $content
$c = AddUserData -text $c -className "CraftingTable" -blockId "crafting-table"
$c = AddUserData -text $c -className "Furnace" -blockId "furnace"

Set-Content -Path $path -Value $c
Write-Host "Done"
