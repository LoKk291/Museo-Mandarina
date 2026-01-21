import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, scene, collidables, world) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;
        this.collidables = collidables;
        this.world = world; // Reference to world for height-map

        // Configuración
        this.speed = 8.0; // Reduced by 20% (was 10.0)
        this.height = 1.7;
        this.radius = 0.5; // Radio del cuerpo del jugador

        // Physics
        this.gravity = 30.0;
        this.jumpForce = 8.0;

        // Estado
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true; // Start enabled
        this.isSeated = false; // New sitting state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isLocked = false;

        // Flashlight State
        this.hasFlashlight = false;
        this.flashlightOn = false;
        // Intensity 2.5 is too low for physical lights if legacy is off.
        // Let's bump to 100.
        this.flashlight = new THREE.SpotLight(0xffffff, 0, 40, Math.PI / 6, 0.5, 2);
        this.flashlight.position.set(0.3, -0.3, 0); // Offset to right hand
        // Target needs to be in front
        // We add both to camera.
        this.flashlight.target.position.set(0, 0, -5);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);

        // Battery Logic
        // 3 Bars. Each bar lasts 4 cycles of ON/OFF toggle.
        // Total "Charges" = 3 * 4 = 12 toggles? Or 4 toggles per bar? 
        // Request: "3 barras de bateria, las cuales deben durar cada una 4 encendidos y apagados"
        // Interpretation: Each bar depletes after 4 toggles. Total 12 toggles.
        this.batteryLevel = 3; // Max bars
        this.batteryCycles = 0; // Counts usage within current bar
        this.cyclesPerBar = 4;

        // Controles
        this.controls = new PointerLockControls(camera, domElement);
        // Important: PointerLockControls object (camera) must be in scene!
        // main.js adds 'camera' to scene? No, line 82: `scene.add(camera);` is NOT there in main.js snippet view!
        // Line 11: `const camera = new...`
        // Line 20: `scene.add(amiLight)...`
        // I should ensure camera is added to scene so light children render.
        // I will do it here if not present, but `main.js` governs it.
        // However, `PointerLockControls` adds the camera to `controls.getObject()`.
        // We should double check if `controls.getObject()` is added to scene.

        // Raycaster para interacción
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);

        this.setupEventListeners();

        // Posición Inicial
        this.camera.position.set(0, this.height, 0);

        // Ensure camera is in scene for lights to work if attached
        if (!this.camera.parent) {
            this.scene.add(this.camera);
        }
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    equipFlashlight() {
        this.hasFlashlight = true;
        // Show UI Icon
        const slot = document.getElementById('slot-flashlight');
        const icon = document.querySelector('.flashlight-icon');
        const batt = document.getElementById('battery-indicator');

        // Reveal the slot itself
        if (slot) slot.classList.remove('hidden');

        // Ensure slot contents visible
        if (icon) icon.classList.remove('hidden');
        if (batt) batt.classList.remove('hidden');

        // Force layout update if needed
        if (slot) slot.style.borderColor = '#ffd700'; // Gold border for active item

        this.updateBatteryUI();
    }

    toggleFlashlight() {
        if (!this.hasFlashlight) return;

        // If battery is dead (0), play empty click and return
        if (this.batteryLevel <= 0) {
            if (this.soundManager) this.soundManager.play('click'); // Click sound but no light
            return;
        }

        this.flashlightOn = !this.flashlightOn;
        // Intensity 100 for visibility
        this.flashlight.intensity = this.flashlightOn ? 100 : 0;

        if (this.soundManager) this.soundManager.play('click');

        if (this.flashlightOn) {
            // Count Usage Cycle ONLY on Turn ON
            this.batteryCycles++;
            if (this.batteryCycles >= this.cyclesPerBar) {
                this.batteryLevel--;
                this.batteryCycles = 0; // Reset cycle count for new bar
                this.updateBatteryUI();

                // If battery died just now
                if (this.batteryLevel <= 0) {
                    // Turn off immediately or let it stay until toggled off?
                    // User said "duran X encendidos". 
                    // Let's force off or dim out? 
                    // Typical game logic: Light dies.
                    setTimeout(() => {
                        this.flashlightOn = false;
                        this.flashlight.intensity = 0;
                        if (this.soundManager) this.soundManager.play('click'); // Power down sound
                    }, 500); // 0.5s flicker delay maybe?
                }
            }
        }
    }

    updateBatteryUI() {
        const bars = document.querySelectorAll('.battery-bar');
        // Bars are usually bottom-up or top-down? Flex-direction column -> Top is bar[0].
        // Let's say bar[2] is bottom (1st bar to die?), bar[0] is top (last bar)?
        // Or standard: 3 bars visible. 
        // Level 3: All Green.
        // Level 2: Top (index 0) OFF.
        // Level 1: Mid (index 1) OFF.
        // Level 0: All OFF.

        // Reverse loop to match visual stack (if index 0 is top)
        // If batteryLevel is 2, we want 2 bars active. The bottom 2. (Indices 1, 2).
        // If 3, indices 0, 1, 2 active.

        // Let's assume indices 0,1,2 map to bars 3,2,1 visually?
        // Flex column: Element 0 is top. Element 2 is bottom.
        // Battery fills from bottom. 
        // So indices 2, 1, 0.

        bars.forEach((bar, index) => {
            // Logic: If batteryLevel is 3, indices 0,1,2 active.
            // If 2, indices 1,2 active.
            // If 1, index 2 active.
            // Formula: index >= (3 - batteryLevel) is ACTIVE.
            // Ex: Level 2. 3-2=1. Indices >= 1 (1, 2) active. Correct.

            if (index >= (3 - this.batteryLevel)) {
                bar.classList.remove('off');
            } else {
                bar.classList.add('off');
            }
        });
    }

    onKeyDown(event) {
        // Ignore inputs if typing in a text field
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        switch (event.code) {
            case 'KeyQ':
                this.toggleFlashlight();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    console.log("JUMP!");
                    if (this.soundManager) this.soundManager.play('jump');
                    this.velocity.y += this.jumpForce;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    clearMovementKeys() {
        // Clear all movement states to prevent stuck keys
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
    }

    update(delta) {
        if (!this.isLocked) return;

        // Si está sentado, no procesar movimiento, pero permitir mirar (PointerLock sigue activo)
        if (this.isSeated) {
            // Reset velocity just in case
            this.velocity.set(0, 0, 0);
            return;
        }

        // Desaceleración simple (Exponential Decay for stability)
        // Old: this.velocity.x -= this.velocity.x * 10.0 * delta; (Unstable if delta > 0.1)
        const damping = Math.exp(-10.0 * delta);
        this.velocity.x *= damping;
        this.velocity.z *= damping;

        // Gravity
        this.velocity.y -= this.gravity * delta;

        // Input
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // Asegura velocidad constante en diagonales

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 1200.0 * delta; // Más aceleración
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 1200.0 * delta;

        // Intentar mover
        // Calculamos desplazamiento potencial
        const dX = -this.velocity.x * delta * 0.08; // Más velocidad final
        const dZ = -this.velocity.z * delta * 0.08;

        // Check Floor collision (Dynamic Terrain)
        const groundHeight = this.world ? this.world.getTerrainHeight(this.camera.position.x, this.camera.position.z) : 0;
        const footingY = groundHeight + this.height;

        if (this.camera.position.y < footingY) {
            this.velocity.y = 0;
            this.camera.position.y = footingY;
            if (!this.canJump) this.canJump = true; // Robust reset
        }

        // Apply Vertical Velocity
        this.camera.position.y += this.velocity.y * delta;

        // Ensure floor clamp again
        if (this.camera.position.y < footingY) {
            this.velocity.y = 0;
            this.camera.position.y = footingY;
            if (!this.canJump) this.canJump = true;
        }

        // Colisión X
        this.controls.moveRight(dX);
        if (this.checkCollision()) {
            // Si choca, deshacer
            this.controls.moveRight(-dX);
            this.velocity.x = 0;
        }

        // Colisión Z
        this.controls.moveForward(dZ);
        if (this.checkCollision()) {
            this.controls.moveForward(-dZ);
            this.velocity.z = 0;
        }
    }

    checkCollision() {
        const playerPos = this.camera.position;
        const playerBox = new THREE.Box3();
        const min = new THREE.Vector3(playerPos.x - this.radius, playerPos.y - this.height, playerPos.z - this.radius);
        const max = new THREE.Vector3(playerPos.x + this.radius, playerPos.y + 0.3, playerPos.z + this.radius);
        playerBox.set(min, max);

        for (const wall of this.collidables) {
            if (!wall.geometry.boundingBox) wall.geometry.computeBoundingBox();

            // Clonamos la BB del objeto y aplicamos su transformación (posición/rotación)
            const wallBox = new THREE.Box3();
            wallBox.copy(wall.geometry.boundingBox).applyMatrix4(wall.matrixWorld);

            if (playerBox.intersectsBox(wallBox)) {
                // FEATURE: Check Door State
                // If it's a door and it's OPEN, ignore collision
                if (wall.userData && (wall.userData.type === 'double-door' || wall.userData.type === 'secret-bookshelf-door')) {
                    if (wall.userData.parentObj && wall.userData.parentObj.isOpen) {
                        return false; // Pass through
                    }
                }
                return true;
            }
        }
        return false;
    }

    // Retorna el objeto (cuadro) que el jugador está mirando
    getInteractableObject(interactables) {
        this.raycaster.setFromCamera(this.center, this.camera);
        // Intersección con meshes (RECURSIVE TRUE to hit children of Groups)
        const intersects = this.raycaster.intersectObjects(interactables, true);

        if (intersects.length > 0) {
            // Check distancia. Solo si está cerca (< 4 metros)
            if (intersects[0].distance < 4) {
                let obj = intersects[0].object;
                // Traverse up to find interactable root
                while (obj) {
                    if (obj.userData && (obj.userData.type || obj.userData.painting || obj.userData.vinyl)) {
                        return obj;
                    }
                    // Stop at scene root
                    if (obj.parent === null || obj.parent.type === 'Scene') break;
                    obj = obj.parent;
                }
            }
        }
        return null;
    }

    lock() { this.controls.lock(); }
    lock() { this.controls.lock(); }
    unlock() { this.controls.unlock(); }

    sit(targetPosition) {
        this.isSeated = true;
        this.velocity.set(0, 0, 0);
        this.camera.position.copy(targetPosition);
        // Maybe lower height? targetPosition should include height.
    }

    standUp() {
        if (!this.isSeated) return;
        this.isSeated = false;
        // Move slightly forward or side to avoid clipping/stuck
        this.camera.position.x += 0.5;
        this.camera.position.y = this.height; // Reset height
    }
}
