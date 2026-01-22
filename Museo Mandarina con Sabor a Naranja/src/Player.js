import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, scene, collidables, world) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;
        this.collidables = collidables;
        this.world = world;

        // Configuración
        this.speed = 8.0;
        this.height = 1.7;
        this.radius = 0.5;

        // Physics
        this.gravity = 30.0;
        this.jumpForce = 8.0;

        // Estado
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        this.isSeated = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isLocked = false;

        // Flashlight
        this.hasFlashlight = false;
        this.flashlightOn = false;
        this.flashlightTimer = null;
        this.flashlight = new THREE.SpotLight(0xffffff, 0, 40, Math.PI / 6, 0.5, 2);
        this.flashlight.position.set(0.3, -0.3, 0);
        this.flashlight.target.position.set(0, 0, -5);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);

        // Battery
        this.batteryLevel = 3;
        this.batteryCycles = 0;
        this.cyclesPerBar = 4;

        // Controles
        this.controls = new PointerLockControls(camera, domElement);

        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);

        this.setupEventListeners();

        // Posición Inicial
        this.camera.position.set(0, this.height, 0);

        if (!this.camera.parent) {
            this.scene.add(this.camera);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    equipFlashlight() {
        this.hasFlashlight = true;
        const slot = document.getElementById('slot-flashlight');
        const icon = document.querySelector('.flashlight-icon');
        const batt = document.getElementById('battery-indicator');
        if (slot) slot.classList.remove('hidden');
        if (icon) icon.classList.remove('hidden');
        if (batt) batt.classList.remove('hidden');
        if (slot) slot.style.borderColor = '#ffd700';
        this.updateBatteryUI();
    }

    toggleFlashlight() {
        if (!this.hasFlashlight) return;
        if (this.batteryLevel <= 0) {
            if (this.soundManager) this.soundManager.play('click');
            return;
        }
        if (this.flashlightOn) {
            this.flashlightOn = false;
            this.flashlight.intensity = 0;
            if (this.soundManager) this.soundManager.play('click');
            if (this.flashlightTimer) {
                clearTimeout(this.flashlightTimer);
                this.flashlightTimer = null;
            }
            return;
        }
        this.flashlightOn = true;
        this.flashlight.intensity = 100;
        if (this.soundManager) this.soundManager.play('click');
        this.batteryCycles++;
        if (this.batteryCycles >= this.cyclesPerBar) {
            this.batteryLevel--;
            this.batteryCycles = 0;
            this.updateBatteryUI();
            if (this.batteryLevel <= 0) {
                setTimeout(() => {
                    this.flashlightOn = false;
                    this.flashlight.intensity = 0;
                    if (this.soundManager) this.soundManager.play('click');
                }, 500);
                return;
            }
        }
        if (this.flashlightTimer) clearTimeout(this.flashlightTimer);
        this.flashlightTimer = setTimeout(() => {
            this.flashlightOn = false;
            this.flashlight.intensity = 0;
            if (this.soundManager) this.soundManager.play('click');
            this.flashlightTimer = null;
        }, 3000);
    }

    updateBatteryUI() {
        const bars = document.querySelectorAll('.battery-bar');
        bars.forEach((bar, index) => {
            if (index >= (3 - this.batteryLevel)) {
                bar.classList.remove('off');
            } else {
                bar.classList.add('off');
            }
        });
    }

    onKeyDown(event) {
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        switch (event.code) {
            case 'KeyQ': this.toggleFlashlight(); break;
            case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
            case 'Space':
                if (this.canJump) {
                    if (this.soundManager) this.soundManager.play('jump');
                    this.velocity.y += this.jumpForce;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
        }
    }

    clearMovementKeys() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
    }

    update(delta) {
        if (!this.isLocked) return;
        if (this.isSeated) {
            this.velocity.set(0, 0, 0);
            return;
        }
        const damping = Math.exp(-10.0 * delta);
        this.velocity.x *= damping;
        this.velocity.z *= damping;
        this.velocity.y -= this.gravity * delta;
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 1200.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 1200.0 * delta;
        const dX = -this.velocity.x * delta * 0.08;
        const dZ = -this.velocity.z * delta * 0.08;
        const groundHeight = this.world ? this.world.getTerrainHeight(this.camera.position.x, this.camera.position.z) : 0;
        const footingY = groundHeight + this.height;
        if (this.camera.position.y < footingY) {
            this.velocity.y = 0;
            this.camera.position.y = footingY;
            if (!this.canJump) this.canJump = true;
        }
        this.camera.position.y += this.velocity.y * delta;
        if (this.camera.position.y < footingY) {
            this.velocity.y = 0;
            this.camera.position.y = footingY;
            if (!this.canJump) this.canJump = true;
        }
        this.controls.moveRight(dX);
        if (this.checkCollision()) {
            this.controls.moveRight(-dX);
            this.velocity.x = 0;
        }
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
            const wallBox = new THREE.Box3();
            wallBox.copy(wall.geometry.boundingBox).applyMatrix4(wall.matrixWorld);
            if (playerBox.intersectsBox(wallBox)) {
                if (wall.userData && (wall.userData.type === 'double-door' || wall.userData.type === 'secret-bookshelf-door')) {
                    if (wall.userData.parentObj && wall.userData.parentObj.isOpen) return false;
                }
                return true;
            }
        }
        return false;
    }

    getInteractableObject(interactables) {
        this.raycaster.setFromCamera(this.center, this.camera);
        const intersects = this.raycaster.intersectObjects(interactables, true);
        if (intersects.length > 0) {
            if (intersects[0].distance < 4) {
                let obj = intersects[0].object;
                while (obj) {
                    if (obj.userData && (obj.userData.type || obj.userData.painting || obj.userData.vinyl)) return obj;
                    if (obj.parent === null || obj.parent.type === 'Scene') break;
                    obj = obj.parent;
                }
            }
        }
        return null;
    }

    lock() { this.controls.lock(); }
    unlock() { this.controls.unlock(); }

    sit(targetPosition) {
        this.isSeated = true;
        this.velocity.set(0, 0, 0);
        this.camera.position.copy(targetPosition);
    }

    standUp() {
        if (!this.isSeated) return;
        this.isSeated = false;

        // Return height immediately
        this.camera.position.y = this.height;

        // Exit Direction: Backup relative to where the player is looking
        const backDir = new THREE.Vector3();
        this.camera.getWorldDirection(backDir);
        backDir.y = 0;
        backDir.normalize();
        backDir.negate(); // Backward

        // Robust offset to clear the chair's collision box (0.7m)
        this.camera.position.addScaledVector(backDir, 1.2);

        // Grounding sanity check
        const groundHeight = this.world ? this.world.getTerrainHeight(this.camera.position.x, this.camera.position.z) : 0;
        if (this.camera.position.y < groundHeight + this.height) {
            this.camera.position.y = groundHeight + this.height;
        }
    }
}
