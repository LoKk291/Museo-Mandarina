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
    
    # 2. Replace UVs
    $uvPattern = "(?s)const faceUVs\s*=\s*\{.*?\};"
    $newUVs = "const faceUVs = { right: { x:0, y:0, w:1, h:1 }, left: { x:0, y:0, w:1, h:1 }, top: { x:0, y:0, w:1, h:1 }, bottom: { x:0, y:0, w:1, h:1 }, front: { x:0, y:0, w:1, h:1 }, back: { x:0, y:0, w:1, h:1 } };"
    
    $block = [regex]::Replace($block, $uvPattern, $newUVs)

    $newText = $text.Substring(0, $classIdx) + $block + $text.Substring($endIdx)
    return $newText
}

$c = $content
$c = ProcessClass -text $c -className "CraftingTable" -newTexture "crafting_table.png"
$c = ProcessClass -text $c -className "Furnace" -newTexture "furnace.png"

Set-Content -Path $path -Value $c
Write-Host "Done"
