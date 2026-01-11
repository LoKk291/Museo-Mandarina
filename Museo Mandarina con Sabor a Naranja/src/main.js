import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Sky } from './Sky.js';
import { SoundManager } from './SoundManager.js';

// --- CONFIGURACIÓN E INICIALIZACIÓN ---
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x111111, 0, 600); // Increased fog distance (was 200)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Far plane increased (was 500)

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
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
scene.add(dirLight);

// --- CLIMA / CIELO ---
const sky = new Sky(scene, { dirLight, amiLight });

// --- MUNDO ---
const world = new World(scene);

// --- SONIDO ---
const soundManager = new SoundManager();
// Load default sounds from placeholders if not present user can replace
// Ideally we would load real files. For now we assume they might exist or browser will just warn.
// Let's rely on standard formats.
soundManager.load('jump', 'sounds/jump.mp3');
soundManager.load('click', 'sounds/click.mp3');
soundManager.load('click_mouse', 'sounds/computadora/click_mouse.mp3');
soundManager.load('pc_start', 'sounds/pc_startup.mp3');
soundManager.load('pc_start', 'sounds/pc_startup.mp3');
soundManager.load('switch', 'sounds/interruptor.mp3'); // Fixed: switch.mp3 did not exist
soundManager.load('interruptor', 'sounds/interruptor.mp3');
soundManager.load('interruptor', 'sounds/interruptor.mp3');
soundManager.load('door_open', 'sounds/abrir.mp3');
soundManager.load('door_close', 'sounds/cerrar.mp3');
// Tunning Door Sounds

// Tunning Door Sounds
soundManager.setVolume('door_open', 0.5);
soundManager.setPlaybackRate('door_open', 1.5);
soundManager.setVolume('door_close', 0.5);
soundManager.setPlaybackRate('door_close', 1.5);

// PC Ambient Setup
soundManager.setLoop('pc_ambient', true);
soundManager.setVolume('pc_ambient', 0.5); // Louder volume

// Chair Sound
soundManager.load('chair_action', 'sounds/sentarseopararse.mp3');
soundManager.setPlaybackRate('chair_action', 2.5); // Much faster

// Keyboard sounds are now PROCEDURAL (Standard Office)

// --- JUGADOR ---
// Pasamos las paredes para colisiones
const player = new Player(camera, document.body, scene, world.collidables);
player.soundManager = soundManager; // Inject Sound Manager

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

// --- EASTER EGG: ORQUIDEA ---
let eggBuffer = "";
const eggCode = "orquidea";
document.addEventListener('keydown', (e) => {
    // Only works if NOT playing (Controls Unlocked / Menu Visible)
    if (!player.isLocked) {
        // Simple buffer check
        if (e.key.length === 1) { // Ignore modifiers
            eggBuffer += e.key.toLowerCase();
            if (eggBuffer.length > eggCode.length) {
                eggBuffer = eggBuffer.slice(-eggCode.length);
            }
            if (eggBuffer === eggCode) {
                window.open("https://upload.wikimedia.org/wikipedia/commons/d/df/Orchid_high_resolution.jpg", "_blank");
                eggBuffer = ""; // Reset
            }
        }
    }
});

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

// GLOBAL CLICK SOUND FOR PC
document.addEventListener('mousedown', (e) => {
    // Check if PC Interface is visible
    if (!pcInterface.classList.contains('hidden')) {
        // Only if interaction is within the PC interface (optional, but good practice)
        // For now, just play it.
        soundManager.play('click_mouse');
    }
});

let isModalOpen = false;
let lastHoveredSparrow = null;

// Loop de Raycast para mostrar mensaje "Click para ver"
function checkInteraction() {
    if (isModalOpen) return;

    const hitObject = player.getInteractableObject(world.interactables);

    // Clear previous sparrow hover if changed
    if (lastHoveredSparrow && (!hitObject || hitObject.userData.type !== 'sparrow')) {
        lastHoveredSparrow.onHover(false);
        lastHoveredSparrow = null;
    }

    if (hitObject) {
        // Personalizar mensaje según objeto
        if (hitObject.userData.type === 'computer') {
            interactionMsg.textContent = "Click para usar PC";
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'desk-lamp') {
            interactionMsg.textContent = "Click para " + (hitObject.userData.parentObj.isOn ? "apagar" : "encender");
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'lever') {
            interactionMsg.textContent = "Click para " + (hitObject.userData.parentObj.isOpen ? "Cerrar Techo" : "Abrir Techo");
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'double-door') {
            interactionMsg.textContent = "Click para " + (hitObject.userData.parentObj.isOpen ? "Cerrar Puerta" : "Abrir Puerta");
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'chair') {
            interactionMsg.textContent = "Click para Sentarse";
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'light-switch') {
            interactionMsg.textContent = "Click para Luz";
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'sparrow') {
            // Sparrow logic: Show label, hide standard message
            hitObject.userData.parentObj.onHover(true);
            lastHoveredSparrow = hitObject.userData.parentObj;
            interactionMsg.style.display = 'none'; // Label is enough
            return hitObject;
        } else {
            interactionMsg.textContent = "Click para ver";
            interactionMsg.style.display = 'block';
        }
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
                soundManager.play('click_mouse'); // Specific mouse click sound
                openPc();
            } else if (hitObject.userData.type === 'desk-lamp') {
                soundManager.play('interruptor'); // New sound
                hitObject.userData.parentObj.toggle();
            } else if (hitObject.userData.type === 'lever') {
                soundManager.play('interruptor'); // Changed to light switch sound
                const isOpen = hitObject.userData.parentObj.toggle();
                world.toggleCeiling(isOpen);
            } else if (hitObject.userData.type === 'double-door') {
                const isOpen = hitObject.userData.parentObj.toggle();
                if (isOpen) {
                    soundManager.play('door_open');
                } else {
                    soundManager.play('door_close');
                }
            } else if (hitObject.userData.type === 'chair') {
                // Sit Logic
                soundManager.play('chair_action');
                const chairMesh = hitObject.userData.parentObj.mesh;
                // Use built-in offset property
                const offset = hitObject.userData.parentObj.sitHeightOffset || 1.2;

                const sitPos = chairMesh.position.clone();
                sitPos.y += offset; // Local offset (Seat Height + Body) (0.5 + 0.7)

                player.sit(sitPos);
                interactionMsg.textContent = ""; // Hide text
                // Show hint to stand up?
                const hint = document.getElementById('interaction-msg');
                if (hint) {
                    hint.textContent = "SHIFT para levantarse";
                    hint.style.display = "block";
                }
            } else if (hitObject.userData.type === 'light-switch') {
                soundManager.play('switch'); // Click sound
                const sw = hitObject.userData.parentObj;
                // Toggle Switch -> Logic
                // Switch updates its visual, but we need to trigger World/Room logic
                const roomName = sw.roomName;
                if (roomName) {
                    const newState = world.toggleRoomLights(roomName);
                    // Sync UI Button
                    const btn = document.querySelector(`.room-toggle[data-room="${roomName}"]`);
                    if (btn) {
                        if (newState) btn.classList.add('active');
                        else btn.classList.remove('active');
                    }
                } else {
                    // Fallback if no room assigned (shouldn't happen)
                    sw.toggle();
                }
            } else if (hitObject.userData.type === 'floor-lamp') {
                soundManager.play('switch');
                hitObject.userData.parentObj.toggle();
            } else if (hitObject.userData.type === 'desk-lamp') {
                soundManager.play('switch');
                hitObject.userData.parentObj.toggle();
            } else if (hitObject.userData.painting) {
                soundManager.play('click');
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
    player.unlock();
    document.getElementById('instructions').style.display = 'none';
    player.unlock();
    document.getElementById('instructions').style.display = 'none';
    if (world.pc) world.pc.turnOn(); // Turn ON screen
    soundManager.play('pc_start');
    pcInterface.classList.remove('hidden');

    // Start Ambient Sound (loop)
    soundManager.play('pc_ambient', false);

    // Reset terminal state
    pcTerminal.classList.add('hidden');
    document.getElementById('pc-browser').classList.add('hidden');
    document.getElementById('pc-pony').classList.add('hidden');
    document.getElementById('pc-snake').classList.add('hidden');
    pcCalc.classList.add('hidden');
    if (typeof stopSnake === 'function') stopSnake();
    if (document.getElementById('pony-iframe')) document.getElementById('pony-iframe').src = "";
}

// Stand Up Logic
document.addEventListener('keydown', (e) => {
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && player.isSeated) {
        soundManager.play('chair_action');
        player.standUp();
        // Clear message
        const msgEl = document.getElementById('interaction-message');
        if (msgEl) msgEl.style.display = 'none';
    }

    // Keyboard Sound Logic (When PC is open)
    const pcInterface = document.getElementById('pc-interface');
    if (pcInterface && !pcInterface.classList.contains('hidden')) {
        // Play procedural sound (Office style)
        soundManager.playMechanicalClick();
    }
});

function closePc() {
    isModalOpen = false;
    if (world.pc) world.pc.turnOff(); // Turn OFF screen
    pcInterface.classList.add('hidden');

    // Stop Ambient Sound
    soundManager.stop('pc_ambient');

    // Stop any playing video
    if (document.getElementById('pony-iframe')) document.getElementById('pony-iframe').src = "";
    if (typeof stopSnake === 'function') stopSnake();
    pcCalc.classList.add('hidden');
    player.lock();
}

closePcBtn.onclick = closePc;

// Browser Refs
const iconInternet = document.getElementById('icon-internet');
const pcBrowser = document.getElementById('pc-browser');
const browserInput = document.getElementById('browser-input');
const browserGo = document.getElementById('browser-go');
const browserClose = document.getElementById('browser-close');

// Pony Refs
const iconPony = document.getElementById('icon-pony');
const pcPony = document.getElementById('pc-pony');
const ponyClose = document.getElementById('pony-close');
const ponyRandom = document.getElementById('pony-random');
const ponyIframe = document.getElementById('pony-iframe');
const ponyPlaceholder = document.getElementById('pony-placeholder');

// Setup Refs
const iconSetup = document.getElementById('icon-setup');
const pcSettings = document.getElementById('pc-settings');

// Calc Refs
const iconCalc = document.getElementById('icon-calc');
const pcCalc = document.getElementById('pc-calc');
const calcClose = document.getElementById('calc-close');
const calcDisplay = document.getElementById('calc-display');
const calcButtons = document.querySelectorAll('.calc-btn');

// Terminal Logic
iconCmd.onclick = () => {
    pcTerminal.classList.remove('hidden');
    pcBrowser.classList.add('hidden');
    pcPony.classList.add('hidden'); // Close Pony
    pcSnake.classList.add('hidden');
    pcCalc.classList.add('hidden');
    stopSnake();
    if (document.getElementById('pony-iframe')) document.getElementById('pony-iframe').src = ""; // Stop video if playing
    cmdInput.value = "";
    cmdInput.focus();
};

// Browser Logic
iconInternet.onclick = () => {
    pcBrowser.classList.remove('hidden');
    pcTerminal.classList.add('hidden');
    pcPony.classList.add('hidden'); // Close Pony
    pcSnake.classList.add('hidden');
    pcCalc.classList.add('hidden');
    stopSnake();
    if (document.getElementById('pony-iframe')) document.getElementById('pony-iframe').src = ""; // Stop video if playing
    browserInput.value = "";
    browserInput.focus();
};

browserClose.onclick = () => {
    pcBrowser.classList.add('hidden');
};

function performSearch() {
    const query = browserInput.value.trim();
    if (query) {
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

// Pony Logic
iconPony.onclick = () => {
    pcPony.classList.remove('hidden');
    pcTerminal.classList.add('hidden');
    pcBrowser.classList.add('hidden');
    pcSnake.classList.add('hidden'); // Close Snake
    pcCalc.classList.add('hidden');
    stopSnake();
    loadRandomEpisode();
};

ponyClose.onclick = () => {
    pcPony.classList.add('hidden');
    if (document.getElementById('pony-iframe')) document.getElementById('pony-iframe').src = ""; // Stop video
};

function loadRandomEpisode() {
    ponyPlaceholder.style.display = 'block';
    // Playlist ID for MLP FiM
    const playlistId = 'PLKw8kqfW5YzKkIvaKHKqrW1Uzm0TQZWeH';
    // Random index between 1 and 200 (Approx episodes available in playlist)
    const index = Math.floor(Math.random() * 200) + 1;

    // Embed URL
    const url = `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&index=${index}&autoplay=1`;
    ponyIframe.src = url;

    setTimeout(() => {
        ponyPlaceholder.style.display = 'none';
    }, 2000);
}

ponyRandom.onclick = loadRandomEpisode;

// --- SNAKE GAME LOGIC ---
// --- SNAKE GAME LOGIC ---
const iconSnake = document.getElementById('icon-snake');
const pcSnake = document.getElementById('pc-snake');
const snakeClose = document.getElementById('snake-close');
const snakeCanvas = document.getElementById('snake-canvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeScoreEl = document.getElementById('snake-score');
const snakeOverlay = document.getElementById('snake-overlay');
const snakeMsg = document.getElementById('snake-msg');

let snakeGameInterval;
let snake = [];
let food = {};
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let score = 0;
let gameSpeed = 150;
let isSnakeGameRunning = false;
let isSnakeGameOver = false;

const gridSize = 20;
let tileCountX = snakeCanvas.width / gridSize;
let tileCountY = snakeCanvas.height / gridSize;

// ... (Rest of Snake Logic)

// --- SETUP / SETTINGS LOGIC ---
iconSetup.onclick = () => {
    // Hide Desktop
    document.querySelector('.pc-desktop').classList.add('hidden');

    // Hide others (just in case)
    pcTerminal.classList.add('hidden');
    pcBrowser.classList.add('hidden');
    pcPony.classList.add('hidden');
    pcSnake.classList.add('hidden');
    pcCalc.classList.add('hidden');
    stopSnake();
    if (ponyIframe) ponyIframe.src = "";

    // Show Settings
    pcSettings.classList.remove('hidden');

    // Sync slider
    const gt = sky.getGameTime();
    const currentH = gt.continuousHour;

    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');

    if (slider) slider.value = currentH;
    if (display) {
        const h = Math.floor(currentH);
        const m = Math.floor((currentH - h) * 60);
        display.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
};

document.getElementById('settings-close').addEventListener('click', () => {
    pcSettings.classList.add('hidden');
    // Show Desktop again
    document.querySelector('.pc-desktop').classList.remove('hidden');
});

// --- SETTINGS TABS LOGIC ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.onclick = () => {
        // Deactivate all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate clicked
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
    };
});

const timeSlider = document.getElementById('time-slider');
if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        sky.setTime(val);

        const h = Math.floor(val);
        const m = Math.floor((val - h) * 60);
        document.getElementById('time-display').textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    });
}

// --- LIGHT CONTROL SCHEMATIC ---
const roomToggles = document.querySelectorAll('.room-toggle');
roomToggles.forEach(btn => {
    btn.onclick = () => {
        const roomName = btn.getAttribute('data-room');
        soundManager.play('switch'); // Use existing switch sound
        // Toggle in World
        const newState = world.toggleRoomLights(roomName);

        // Update UI
        if (newState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    };
});

// --- CEILING CONTROL ---
const btnCeiling = document.getElementById('btn-ceiling-toggle');
if (btnCeiling) {
    btnCeiling.onclick = () => {
        soundManager.play('switch');
        // Toggle based on current state
        if (world.animState === 'CLOSED' || world.animState === 'CLOSING_CEILING' || world.animState === 'CLOSING_CHANDELIER') {
            world.toggleCeiling(true); // Open it
        } else {
            world.toggleCeiling(false); // Close it
        }
        updateCeilingUI();
    };
}

const btnLightsOff = document.getElementById('btn-lights-off');
if (btnLightsOff) {
    btnLightsOff.onclick = () => {
        soundManager.play('switch');
        world.toggleGlobalLights();

        // Update Button Text
        if (world.globalLightState) {
            btnLightsOff.textContent = "APAGAR TODO";
            btnLightsOff.style.background = "#5a3333"; // Redish
        } else {
            btnLightsOff.textContent = "ENCENDER TODO";
            btnLightsOff.style.background = "#335a33"; // Greenish
        }
    };
}

function updateCeilingUI() {
    if (!btnCeiling) return;

    // Check if Opening or Open
    const isOpeningOrOpen = (world.animState === 'OPEN' || world.animState === 'OPENING_CHANDELIER' || world.animState === 'OPENING_CEILING');

    if (isOpeningOrOpen) {
        btnCeiling.textContent = "CERRAR TECHO CORREDIZO";
        btnCeiling.classList.add('active');
    } else {
        btnCeiling.textContent = "ABRIR TECHO CORREDIZO";
        btnCeiling.classList.remove('active');
    }
}

// Ensure UI stays synced (in case Lever is used)
setInterval(updateCeilingUI, 500); // Check every 500ms

// --- CALCULATOR LOGIC ---
let calcExpression = "";

iconCalc.onclick = () => {
    pcCalc.classList.remove('hidden');
    pcTerminal.classList.add('hidden');
    pcBrowser.classList.add('hidden');
    pcPony.classList.add('hidden');
    pcSnake.classList.add('hidden');
    stopSnake();
    if (ponyIframe) ponyIframe.src = "";
    calcExpression = "0";
    updateCalcDisplay();
};

calcClose.onclick = () => {
    pcCalc.classList.add('hidden');
};

function updateCalcDisplay() {
    calcDisplay.textContent = calcExpression || "0";
}

calcButtons.forEach(btn => {
    btn.onclick = () => {
        const val = btn.getAttribute('data-val');
        soundManager.play('click');

        if (val === 'C') {
            calcExpression = "0";
        } else if (val === 'DEL') {
            calcExpression = calcExpression.slice(0, -1);
            if (calcExpression === "") calcExpression = "0";
        } else if (val === '=') {
            try {
                // Safety check: only allow digits and operators
                if (/^[0-9+\-*/.]+$/.test(calcExpression)) {
                    calcExpression = eval(calcExpression).toString();
                }
            } catch (e) {
                calcExpression = "ERROR";
            }
        } else {
            if (calcExpression === "0" || calcExpression === "ERROR") {
                calcExpression = val;
            } else {
                calcExpression += val;
            }
        }
        updateCalcDisplay();
    };
});

function initSnakeGame() {
    // Recalculate based on current canvas size
    tileCountX = snakeCanvas.width / gridSize;
    tileCountY = snakeCanvas.height / gridSize;

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    score = 0;
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    isSnakeGameOver = false;
    snakeScoreEl.innerText = score;
    snakeOverlay.classList.add('hidden');
    placeFood();
    isSnakeGameRunning = true;
    if (snakeGameInterval) clearInterval(snakeGameInterval);
    snakeGameInterval = setInterval(gameLoop, gameSpeed);
}

function stopSnake() {
    isSnakeGameRunning = false;
    clearInterval(snakeGameInterval);
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    // Ensure food doesn't spawn on snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            placeFood();
            break;
        }
    }
}

function gameLoop() {
    direction = nextDirection;

    const head = { x: snake[0].x, y: snake[0].y };
    switch (direction) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
    }

    // Collision with walls
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }

    // Collision with self
    for (let part of snake) {
        if (part.x === head.x && part.y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Collision with food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        snakeScoreEl.innerText = score;
        placeFood();
        // Speed up slightly
        if (gameSpeed > 50) gameSpeed -= 1;
        clearInterval(snakeGameInterval);
        snakeGameInterval = setInterval(gameLoop, gameSpeed);
    } else {
        snake.pop();
    }

    drawSnakeGame();
}

function drawSnakeGame() {
    // Clear
    snakeCtx.fillStyle = 'black';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Draw Snake
    snakeCtx.fillStyle = '#00ff00';
    for (let i = 0; i < snake.length; i++) {
        // Head is slightly different color or shape? Nah, retro style simple
        if (i === 0) snakeCtx.fillStyle = '#ccffcc';
        else snakeCtx.fillStyle = '#00cc00';

        snakeCtx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
    }

    // Draw Food
    snakeCtx.fillStyle = 'red';
    snakeCtx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function gameOver() {
    isSnakeGameOver = true;
    stopSnake();
    snakeOverlay.classList.remove('hidden');
}

// Controls
window.addEventListener('keydown', (e) => {
    if (!isModalOpen || pcSnake.classList.contains('hidden')) return;

    // Prevent scrolling
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (isSnakeGameOver && e.code === 'Space') {
        initSnakeGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') nextDirection = 'UP'; break;
        case 'ArrowDown': if (direction !== 'UP') nextDirection = 'DOWN'; break;
        case 'ArrowLeft': if (direction !== 'RIGHT') nextDirection = 'LEFT'; break;
        case 'ArrowRight': if (direction !== 'LEFT') nextDirection = 'RIGHT'; break;
    }
});

iconSnake.onclick = () => {
    pcSnake.classList.remove('hidden');
    pcTerminal.classList.add('hidden');
    pcBrowser.classList.add('hidden');
    pcPony.classList.add('hidden');
    pcCalc.classList.add('hidden');
    // Close others logic is getting duplicated, should refactor but fine for now
    if (ponyIframe) ponyIframe.src = "";

    initSnakeGame();
};

snakeClose.onclick = () => {
    pcSnake.classList.add('hidden');
    stopSnake();
};

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
    // Toggle Stats
    if (e.key === 'Tab') {
        e.preventDefault();
        const panel = document.getElementById('stats-panel');
        if (panel) panel.classList.toggle('hidden');
    }
});


// --- GAME LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Clamp delta to prevent physics explosions on lag
    let delta = clock.getDelta();
    delta = Math.min(delta, 0.05); // Max 0.05s (20 FPS minimum physics step)

    // Update Weather/Cycle
    sky.update(delta);

    // Update Clock
    if (world.clock) {
        const time = sky.getGameTime();
        world.clock.setTime(time.hours, time.minutes);
    }

    // World Animations (Ceiling, etc)
    world.update(delta, camera);

    // --- FIX: Progressive Interior Lighting ---
    // REMOVED: Interior/Exterior blending logic.
    // Reason: User requested total independence.
    // Sky.js controls Global Ambient/Sun (Time based).
    // World.js controls PointLights (Source based).
    // No "Position Based" magic.

    if (!isModalOpen) {
        player.update(delta);
        checkInteraction(); // Actualizar UI de "Click para ver"

        // Update Stats if visible
        const statsPanel = document.getElementById('stats-panel');
        if (statsPanel && !statsPanel.classList.contains('hidden')) {
            const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const distEl = document.getElementById('dist-center');
            if (distEl) distEl.textContent = dist.toFixed(2);
        }
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
