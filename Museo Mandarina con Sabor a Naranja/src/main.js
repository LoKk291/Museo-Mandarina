import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';

// --- CONFIGURACIÓN E INICIALIZACIÓN ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x111111, 0, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// Luces (Cálidas)
const amiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.6); // Cielo cálido / Suelo oscuro
scene.add(amiLight);

const dirLight = new THREE.DirectionalLight(0xffaa33, 1.0); // Sol atardecer/cálido
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
scene.add(dirLight);

// --- MUNDO ---
const world = new World(scene);

// --- JUGADOR ---
// Pasamos las paredes para colisiones
const player = new Player(camera, document.body, scene, world.collidables);

// --- UI / INTERACCIÓN ---
const interactionMsg = document.getElementById('interaction-message');
const paintingModal = document.getElementById('painting-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const closeModalBtn = document.getElementById('close-modal');
// Instructions Ref
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

// UI Logic moved from Player.js to here for better control
player.controls.addEventListener('lock', () => {
    player.isLocked = true;
    instructions.style.display = 'none';
    crosshair.style.display = 'block';
});

player.controls.addEventListener('unlock', () => {
    player.isLocked = false;
    // Solo mostrar instrucciones si NO hay un modal abierto
    if (!isModalOpen) {
        instructions.style.display = 'flex';
        crosshair.style.display = 'none';
    }
});

// Click para lock manual (si se cerró por ESC sin abrir modal)
instructions.addEventListener('click', () => {
    player.lock();
});

// PC References
const pcInterface = document.getElementById('pc-interface');
const closePcBtn = document.getElementById('close-pc');
// Terminal Refs
const iconCmd = document.getElementById('icon-cmd');
const pcTerminal = document.getElementById('pc-terminal');
const cmdInput = document.getElementById('cmd-input');
const termOutput = document.getElementById('terminal-output');

let isModalOpen = false;

// Loop de Raycast para mostrar mensaje "Click para ver"
function checkInteraction() {
    if (isModalOpen) return;

    const hitObject = player.getInteractableObject(world.interactables);
    if (hitObject) {
        // Personalizar mensaje según objeto
        if (hitObject.userData.type === 'computer') {
            interactionMsg.textContent = "Click para usar PC";
        } else {
            interactionMsg.textContent = "Click para ver";
        }
        interactionMsg.style.display = 'block';
        return hitObject;
    } else {
        interactionMsg.style.display = 'none';
        return null;
    }
}

// Manejo de Click para abrir cuadro
document.addEventListener('click', () => {
    // Si el modal está abierto, no hacer nada aquí (el modal tiene su propia lógica)
    if (isModalOpen) return;

    // Solo interactuar si estamos controlando al jugador (Locked)
    if (player.isLocked) {
        const hitObject = checkInteraction();
        if (hitObject) {
            console.log("Interactuando con:", hitObject.userData);

            if (hitObject.userData.type === 'computer') {
                openPc();
            } else if (hitObject.userData.painting) {
                openModal(hitObject.userData.painting);
            } else {
                console.error("Objeto interactuable sin tipo o datos definidos:", hitObject);
                // Intento de fallback o debug en pantalla
                if (document.getElementById('error-console')) {
                    document.getElementById('error-console').style.display = 'block';
                    document.getElementById('error-console').innerHTML += `<p>Warning: Clicked object with no data. Type: ${hitObject.type}</p>`;
                }
            }
        }
    }
});

function openPc() {
    isModalOpen = true;
    player.unlock();
    document.getElementById('instructions').style.display = 'none';
    pcInterface.classList.remove('hidden');
    // Reset terminal state
    pcTerminal.classList.add('hidden');
    // Ensure browser is closed by default when opening PC, or maybe keep state?
    // Let's reset for now
    document.getElementById('pc-browser').classList.add('hidden');
}

function closePc() {
    isModalOpen = false;
    pcInterface.classList.add('hidden');
    player.lock();
}

closePcBtn.onclick = closePc;

// Browser Refs
const iconInternet = document.getElementById('icon-internet');
const pcBrowser = document.getElementById('pc-browser');
const browserInput = document.getElementById('browser-input');
const browserGo = document.getElementById('browser-go');
const browserClose = document.getElementById('browser-close');

// Terminal Logic
iconCmd.onclick = () => {
    pcTerminal.classList.remove('hidden');
    pcBrowser.classList.add('hidden'); // Ensure browser is closed
    cmdInput.value = "";
    cmdInput.focus();
};

// Browser Logic
iconInternet.onclick = () => {
    pcBrowser.classList.remove('hidden');
    pcTerminal.classList.add('hidden'); // Ensure terminal is closed
    browserInput.value = "";
    browserInput.focus();
};

browserClose.onclick = () => {
    pcBrowser.classList.add('hidden');
};

function performSearch() {
    const query = browserInput.value.trim();
    if (query) {
        // Open Google search in a new tab
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        browserInput.value = "";
    }
}

browserGo.onclick = performSearch;

browserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Mantener foco en input si se hace click en terminal
pcTerminal.onclick = () => {
    cmdInput.focus();
};

cmdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = cmdInput.value.trim().toUpperCase();
        processCommand(cmd);
        cmdInput.value = "";
        // Scroll al fondo
        pcTerminal.scrollTop = pcTerminal.scrollHeight;
    }
});

function processCommand(cmd) {
    // Escribir linea del usuario
    termOutput.innerHTML += `<p>> ${cmd}</p>`;

    // Lógica básica (comandos dummy por ahora)
    switch (cmd) {
        case 'HELP':
            termOutput.innerHTML += `<p>COMANDOS DISPONIBLES:</p><p> - HELP</p><p> - CLS</p><p> - EXIT</p>`;
            break;
        case 'CLS':
        case 'CLEAR':
            termOutput.innerHTML = "";
            break;
        case 'EXIT':
            pcTerminal.classList.add('hidden');
            break;
        case '':
            break;
        default:
            termOutput.innerHTML += `<p>'${cmd}' NO SE RECONOCE COMO UN COMANDO.</p>`;
    }
}

function openModal(paintingData) {
    isModalOpen = true;
    player.unlock(); // Soltar el mouse

    // Ocultar instrucciones que aparecen al desbloquear
    document.getElementById('instructions').style.display = 'none';

    // Llenar datos
    modalTitle.textContent = paintingData.title;
    modalText.textContent = paintingData.description;

    // Si tuviera imagen real:
    // modalImage.src = paintingData.imagePath;
    // Como es placeholder, generamos un color o placeholder visual
    modalImage.style.backgroundColor = '#' + paintingData.material.color.getHexString();
    modalImage.src = ''; // Limpiar src anterior o poner un placeholder transparente

    paintingModal.classList.remove('hidden');
}

function closeModal() {
    isModalOpen = false;
    paintingModal.classList.add('hidden');
    // Volver a capturar mouse
    player.lock();
}

closeModalBtn.onclick = closeModal;

// Tecla ESC o Click fuera (opcional, aunque con pointerlock es tricky)
window.addEventListener('keydown', (e) => {
    if (isModalOpen && e.key === 'Escape') {
        closeModal();
        closePc();
    }
});


// --- GAME LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (!isModalOpen) {
        player.update(delta);
        checkInteraction(); // Actualizar UI de "Click para ver"
    }

    renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iniciar
animate();
