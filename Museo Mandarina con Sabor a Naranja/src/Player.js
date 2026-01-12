import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, scene, collidables) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;
        this.collidables = collidables;

        // Configuración
        this.speed = 10.0;
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

        // Controles
        this.controls = new PointerLockControls(camera, domElement);

        // Raycaster para interacción
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);

        this.setupEventListeners();

        // Posición Inicial
        this.camera.position.set(0, this.height, 0);
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
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

        // Check Floor collision (Simple Y plane)
        if (this.camera.position.y < this.height) {
            this.velocity.y = 0;
            this.camera.position.y = this.height;
            if (!this.canJump) this.canJump = true; // Robust reset
        }

        // Apply Vertical Velocity
        this.camera.position.y += this.velocity.y * delta;

        // Ensure floor clamp again
        if (this.camera.position.y < this.height) {
            this.velocity.y = 0;
            this.camera.position.y = this.height;
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
        // Creamos una caja alrededor del jugador
        const playerBox = new THREE.Box3();
        const min = new THREE.Vector3(playerPos.x - this.radius, playerPos.y - 1, playerPos.z - this.radius);
        const max = new THREE.Vector3(playerPos.x + this.radius, playerPos.y + 1, playerPos.z + this.radius);
        playerBox.set(min, max);

        for (const wall of this.collidables) {
            if (!wall.geometry.boundingBox) wall.geometry.computeBoundingBox();

            // Clonamos la BB del objeto y aplicamos su transformación (posición/rotación)
            const wallBox = new THREE.Box3();
            wallBox.copy(wall.geometry.boundingBox).applyMatrix4(wall.matrixWorld);

            if (playerBox.intersectsBox(wallBox)) {
                // FEATURE: Check Door State
                // If it's a door and it's OPEN, ignore collision
                if (wall.userData && wall.userData.type === 'double-door') {
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
                    if (obj.userData && (obj.userData.type || obj.userData.painting)) {
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
