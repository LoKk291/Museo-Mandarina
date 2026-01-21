$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# 1. Remove the appended duplicate (starting with identifying marker)
# The marker is "// ===== BREAKABLE VASE ====="
# We'll remove from there to the end? 
# Or just finding that block.
# Since I appended it to the very end, removing from that marker to the end is likely safe.
# Let's verify position.

$marker = "// ===== BREAKABLE VASE ====="
$markerIdx = $content.LastIndexOf($marker)

if ($markerIdx -ne -1) {
    # Is this the one at 5606? Yes, confirmed by Select-String.
    # We truncate the file at this index.
    # But checking if there's anything important after? 
    # I appended it, so it should be the last thing.
    
    # We will simply take the substring UP TO the marker.
    # But wait, maybe I need to leave a closing brace for the previous class if I messed up boundaries?
    # In Step 987, the file ended with `}` (likely closing MinecraftBed).
    # Then I appended.
    # So removing from marker onwards should be fine.
    
    $content = $content.Substring(0, $markerIdx)
}

# 2. Add 'export' to the original class
# We look for "class BreakableVase" that doesn't have export.
$classPattern = "class BreakableVase"
$exportPattern = "export class BreakableVase"

# If it already has export (unlikely based on error), we don't touch.
if ($content.IndexOf($exportPattern) -eq -1) {
    # Replace "class BreakableVase" with "export class BreakableVase"
    # We only want to replace the FIRST occurrence (which is the original one).
    
    $regex = [regex]"class BreakableVase"
    $content = $regex.Replace($content, "export class BreakableVase", 1)
}

Set-Content -Path $path -Value $content
Write-Host "Done"
