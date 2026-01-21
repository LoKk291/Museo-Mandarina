$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# Fix video loading to prevent AbortError
# Add proper cleanup before loading new video

$oldPlayVHS = "cinemaVideo.src = ``videos/vhs`${videoNumber}.mp4``;
    cinemaVideo.load();"

$newPlayVHS = "// Stop any current playback
    if (currentlyPlayingVHS) {
        cinemaVideo.pause();
        cinemaVideo.currentTime = 0;
    }
    
    cinemaVideo.src = ``videos/vhs`${videoNumber}.mp4``;
    cinemaVideo.load();"

if ($content -match [regex]::Escape($oldPlayVHS)) {
    $content = $content.Replace($oldPlayVHS, $newPlayVHS)
    Set-Content -Path $path -Value $content
    Write-Host "Fixed video loading to prevent AbortError"
} else {
    Write-Host "Video loading pattern not found"
}
