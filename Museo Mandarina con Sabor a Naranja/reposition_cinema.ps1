$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\World.js"
$content = Get-Content -Path $path -Raw

# Update CinemaScreen Position
# Was: cinemaScreen.setPosition(0, 0, -7.4);
# New: cinemaScreen.setPosition(-7.4, 0, 0); cinemaScreen.setRotation(Math.PI / 2);

$screenTarget = "cinemaScreen.setPosition(0, 0, -7.4);"
$screenRepl = "cinemaScreen.setPosition(-7.4, 0, 0);`r`n        cinemaScreen.setRotation(Math.PI / 2);"

if ($content -match [regex]::Escape($screenTarget)) {
    $content = $content -replace [regex]::Escape($screenTarget), $screenRepl
    Write-Host "Updated Screen Position"
} else {
    Write-Host "Screen target not found (check values)"
}

# Update OldCamera Position
# Was: oldCamera.setPosition(0, 0, 5);
# And: oldCamera.setRotation(Math.PI);
# New: oldCamera.setPosition(6, 0, 0);
# New: oldCamera.setRotation(-Math.PI / 2);

$camPosTarget = "oldCamera.setPosition(0, 0, 5);"
$camRotTarget = "oldCamera.setRotation(Math.PI);"

if ($content -match [regex]::Escape($camPosTarget)) {
    $content = $content -replace [regex]::Escape($camPosTarget), "oldCamera.setPosition(6, 0, 0);"
}

if ($content -match [regex]::Escape($camRotTarget)) {
    $content = $content -replace [regex]::Escape($camRotTarget), "oldCamera.setRotation(-Math.PI / 2);"
    Write-Host "Updated Camera Position"
}

Set-Content -Path $path -Value $content
