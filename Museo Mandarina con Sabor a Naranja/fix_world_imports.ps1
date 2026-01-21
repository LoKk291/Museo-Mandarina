$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# We need to find the import from './Furniture.js';
# It's a long line.
# We will replace "BreakableVase } from './Furniture.js';" with "BreakableVase, CinemaScreen, OldCamera } from './Furniture.js';"

if ($content -match "BreakableVase } from '\./Furniture\.js';") {
    $content = $content -replace "BreakableVase } from '\./Furniture\.js';", "BreakableVase, CinemaScreen, OldCamera } from './Furniture.js';"
    Set-Content -Path $path -Value $content
    Write-Host "Imports fixed"
} else {
    Write-Host "Could not find import target string"
}
