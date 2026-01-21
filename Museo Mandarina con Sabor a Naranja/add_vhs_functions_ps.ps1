$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# Find game loop marker
$marker = "// === GAME LOOP ==="
$idx = $content.IndexOf($marker)

if ($idx -ne -1) {
    $vhsFunctions = @'

// === VHS CINEMA SYSTEM ===
function openVHSSelector() {
    player.unlock();
    const selector = document.getElementById('vhs-selector');
    selector.classList.remove('hidden');
}

function closeVHSSelector() {
    const selector = document.getElementById('vhs-selector');
    selector.classList.add('hidden');
    player.lock();
}

function playVHS(videoNumber) {
    if (!cinemaVideo) {
        cinemaVideo = document.createElement('video');
        cinemaVideo.crossOrigin = 'anonymous';
        cinemaVideo.loop = false;
        cinemaVideo.volume = 0.5;
    }

    cinemaVideo.src = `videos/${videoNumber}.mp4`;
    cinemaVideo.load();
    
    cinemaVideoTexture = new THREE.VideoTexture(cinemaVideo);
    cinemaVideoTexture.minFilter = THREE.LinearFilter;
    cinemaVideoTexture.magFilter = THREE.LinearFilter;
    
    if (world.cinemaScreen && world.cinemaScreen.mesh) {
        world.cinemaScreen.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.material.map = cinemaVideoTexture;
                child.material.needsUpdate = true;
            }
        });
    }
    
    cinemaVideo.play();
    currentlyPlayingVHS = true;
    document.getElementById('cinema-controls').classList.remove('hidden');
    closeVHSSelector();
}

function stopCinema() {
    if (cinemaVideo) {
        cinemaVideo.pause();
        cinemaVideo.currentTime = 0;
    }
    
    if (world.cinemaScreen && world.cinemaScreen.mesh) {
        world.cinemaScreen.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.material.map = null;
                child.material.color.setHex(0xFFFFFF);
                child.material.needsUpdate = true;
            }
        });
    }
    
    currentlyPlayingVHS = false;
    document.getElementById('cinema-controls').classList.add('hidden');
}

document.querySelectorAll('.vhs-item').forEach(item => {
    item.addEventListener('click', () => {
        const videoNum = item.getAttribute('data-video');
        playVHS(videoNum);
    });
});

document.getElementById('close-vhs-selector').addEventListener('click', closeVHSSelector);
document.getElementById('stop-cinema').addEventListener('click', stopCinema);

document.getElementById('cinema-volume').addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    if (cinemaVideo) {
        cinemaVideo.volume = volume;
    }
    document.getElementById('cinema-volume-label').textContent = e.target.value + '%';
});

// === GAME LOOP ===
'@
    
    $content = $content.Insert($idx, $vhsFunctions)
    Set-Content -Path $path -Value $content
    Write-Host "Added VHS functions to main.js"
}
