const fs = require('fs');
const path = 'src/main.js';

const content = fs.readFileSync(path, 'utf8');

// Find a good place to add VHS functions (after showLetter function)
const marker = "// === GAME LOOP ===";

const vhsFunctions = `
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
    // Create video element if it doesn't exist
    if (!cinemaVideo) {
        cinemaVideo = document.createElement('video');
        cinemaVideo.crossOrigin = 'anonymous';
        cinemaVideo.loop = false;
        cinemaVideo.volume = 0.5;
    }

    // Load video
    cinemaVideo.src = \`videos/\${videoNumber}.mp4\`;
    cinemaVideo.load();
    
    // Create video texture
    cinemaVideoTexture = new THREE.VideoTexture(cinemaVideo);
    cinemaVideoTexture.minFilter = THREE.LinearFilter;
    cinemaVideoTexture.magFilter = THREE.LinearFilter;
    
    // Apply texture to cinema screen
    if (world.cinemaScreen && world.cinemaScreen.mesh) {
        world.cinemaScreen.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.material.map = cinemaVideoTexture;
                child.material.needsUpdate = true;
            }
        });
    }
    
    // Play video
    cinemaVideo.play();
    currentlyPlayingVHS = true;
    
    // Show controls
    document.getElementById('cinema-controls').classList.remove('hidden');
    
    // Close selector
    closeVHSSelector();
}

function stopCinema() {
    if (cinemaVideo) {
        cinemaVideo.pause();
        cinemaVideo.currentTime = 0;
    }
    
    // Clear screen texture
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

// VHS UI Event Listeners
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

// === GAME LOOP ===`;

const newContent = content.replace(marker, vhsFunctions);
fs.writeFileSync(path, newContent);
console.log("Added VHS functions to main.js");
