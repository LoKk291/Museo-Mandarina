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

        // Estado
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
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

        // Desaceleración simple
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

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
                return true;
            }
        }
        return false;
    }

    // Retorna el objeto (cuadro) que el jugador está mirando
    getInteractableObject(interactables) {
        this.raycaster.setFromCamera(this.center, this.camera);
        // Intersección con meshes
        const intersects = this.raycaster.intersectObjects(interactables, false);

        if (intersects.length > 0) {
            // Check distancia. Solo si está cerca (< 3 metros)
            if (intersects[0].distance < 4) {
                return intersects[0].object;
            }
        }
        return null;
    }

    lock() { this.controls.lock(); }
    unlock() { this.controls.unlock(); }
}
