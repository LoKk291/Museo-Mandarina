$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Move screen from West wall to North wall (where Foxy is)
# West wall: X=-7.4, rotation=π/2
# North wall: Z=-7.4, rotation=0

$oldScreen = "cinemaScreen.setPosition(-7.4, 0, 0); 
        cinemaScreen.setRotation(Math.PI / 2);"

$newScreen = "cinemaScreen.setPosition(0, 0, -7.4); // North wall (where Foxy is)
        cinemaScreen.setRotation(0); // Face South into room"

if ($content -match [regex]::Escape($oldScreen)) {
    $content = $content.Replace($oldScreen, $newScreen)
    Set-Content -Path $path -Value $content
    Write-Host "Moved screen to North wall (Foxy's wall)"
} else {
    Write-Host "Screen position not found"
}
