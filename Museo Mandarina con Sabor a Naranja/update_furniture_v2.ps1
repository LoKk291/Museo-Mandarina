$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

function ProcessClass {
    param(
        [string]$text,
        [string]$className,
        [string]$newTexture
    )

    $pattern = "class $className"
    $match = [regex]::Match($text, $pattern)
    if (-not $match.Success) { return $text }
    $classIdx = $match.Index

    $sub = $text.Substring($classIdx + 10)
    $nextMatch = [regex]::Match($sub, "class\s+\w+")
    if ($nextMatch.Success) {
        $endIdx = $classIdx + 10 + $nextMatch.Index
    } else {
        $endIdx = $text.Length
    }
    
    $block = $text.Substring($classIdx, $endIdx - $classIdx)
    
    # 1. Replace Loader
    $loaderPattern = "loader\.load\s*\(\s*['`""].*?['`""]\s*\)"
    if ($block -match $loaderPattern) {
         $block = $block -replace $loaderPattern, "loader.load('textures/minecraft/$newTexture')"
    }
    
    # 2. Replace UVs to 4x3 Grid (Standard Cube Unfold)
    $uvPattern = "(?s)const faceUVs\s*=\s*\{.*?\};"
    
    # Grid: 4 cols, 3 rows. W=1/4, H=1/3.
    # Top: x=1/4, y=2/3 (0.25, 0.666) -> Row 0 (Top)
    # Bottom: x=1/4, y=0 (0.25, 0) -> Row 2 (Bottom)
    # Front: x=1/4, y=1/3 (0.25, 0.333) -> Row 1 (Middle)
    # Left: x=0, y=1/3 (0, 0.333) -> Row 1 Col 0
    # Right: x=2/4, y=1/3 (0.5, 0.333) -> Row 1 Col 2
    # Back: x=3/4, y=1/3 (0.75, 0.333) -> Row 1 Col 3
    
    $newUVs = "const faceUVs = {
            right: { x: 0.5, y: 0.333, w: 0.25, h: 0.333 },
            left: { x: 0.0, y: 0.333, w: 0.25, h: 0.333 },
            top: { x: 0.25, y: 0.666, w: 0.25, h: 0.333 },
            bottom: { x: 0.25, y: 0.0, w: 0.25, h: 0.333 },
            front: { x: 0.25, y: 0.333, w: 0.25, h: 0.333 },
            back: { x: 0.75, y: 0.333, w: 0.25, h: 0.333 }
        };"
    
    $block = [regex]::Replace($block, $uvPattern, $newUVs)

    $newText = $text.Substring(0, $classIdx) + $block + $text.Substring($endIdx)
    return $newText
}

$c = $content
$c = ProcessClass -text $c -className "CraftingTable" -newTexture "crafting_table.png"
$c = ProcessClass -text $c -className "Furnace" -newTexture "furnace.png"

Set-Content -Path $path -Value $c
Write-Host "Done"
