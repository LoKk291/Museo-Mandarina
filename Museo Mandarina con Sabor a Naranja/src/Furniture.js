import * as THREE from 'three';

export class Desk {
    constructor(width = 2, depth = 1, height = 0.8) {
        this.width = width;
        this.depth = depth;
        this.height = height;

        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Materiales
        // Madera oscura para el escritorio
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033, // Dark Wood color
            roughness: 0.6,
            metalness: 0
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.2,
            metalness: 0.8
        });

        // 1. Tablero
        const topThickness = 0.05;
        const topGeo = new THREE.BoxGeometry(this.width, topThickness, this.depth);
        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.y = this.height - topThickness / 2;
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);

        // 2. Patas (4)
        const legSize = 0.08;
        const legHeight = this.height - topThickness;
        const legGeo = new THREE.BoxGeometry(legSize, legHeight, legSize);

        const positions = [
            { x: -this.width / 2 + legSize, z: -this.depth / 2 + legSize }, // Trasera Izq
            { x: this.width / 2 - legSize, z: -this.depth / 2 + legSize },  // Trasera Der
            { x: -this.width / 2 + legSize, z: this.depth / 2 - legSize },  // Delantera Izq
            { x: this.width / 2 - legSize, z: this.depth / 2 - legSize }    // Delantera Der
        ];

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, metalMat);
            leg.position.set(pos.x, legHeight / 2, pos.z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.mesh.add(leg);
        });

        // 3. Detalles extra (Cajonera lateral)
        // Cajonera al lado derecho
        const drawerWidth = 0.5;
        const drawerHeight = 0.4;
        const drawerGeo = new THREE.BoxGeometry(drawerWidth, drawerHeight, this.depth - 0.2);
        const drawer = new THREE.Mesh(drawerGeo, woodMat);
        drawer.position.set(
            this.width / 2 - drawerWidth / 2 - 0.05,
            this.height - topThickness - drawerHeight / 2,
            0
        );
        drawer.castShadow = true;
        drawer.receiveShadow = true;
        this.mesh.add(drawer);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}

export class RetroComputer {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Materiales
        const beigeMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc, roughness: 0.6 });
        const darkBeigeMat = new THREE.MeshStandardMaterial({ color: 0xdcbba0, roughness: 0.6 });
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x001100 }); // Verde muy oscuro (apagado)
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Para detalles (disqueteras)

        // --- 1. CASE (CPU Horizontal) ---
        const caseGeo = new THREE.BoxGeometry(0.6, 0.15, 0.5);
        const pcCase = new THREE.Mesh(caseGeo, beigeMat);
        pcCase.position.y = 0.075; // Mitad de altura 0.15
        pcCase.castShadow = true;
        pcCase.receiveShadow = true;
        this.mesh.add(pcCase);

        // Detalles Case (Disqueteras negras)
        const floppyGeo = new THREE.BoxGeometry(0.15, 0.05, 0.02);
        const floppy1 = new THREE.Mesh(floppyGeo, darkMat);
        floppy1.position.set(0.15, 0.075, 0.251); // Frente derecha
        this.mesh.add(floppy1);

        const floppy2 = floppy1.clone();
        floppy2.position.set(0.15, 0.02, 0.251); // Abajo
        this.mesh.add(floppy2);

        // Ventilación (Izquierda)
        const ventGeo = new THREE.BoxGeometry(0.15, 0.08, 0.02);
        const vent = new THREE.Mesh(ventGeo, darkBeigeMat);
        vent.position.set(-0.15, 0.05, 0.251);
        this.mesh.add(vent);


        // --- 2. MONITOR CRT ---
        // Base del monitor (Cuello)
        const neckGeo = new THREE.BoxGeometry(0.3, 0.05, 0.2);
        const neck = new THREE.Mesh(neckGeo, darkBeigeMat);
        neck.position.set(0, 0.15 + 0.025, 0); // Encima del case
        this.mesh.add(neck);

        // Cuerpo del monitor (Caja principal)
        const monitorW = 0.36;
        const monitorH = 0.3;
        const monitorD = 0.35;

        const monitorBoxGeo = new THREE.BoxGeometry(monitorW, monitorH, monitorD);
        const monitorItm = new THREE.Mesh(monitorBoxGeo, beigeMat);
        // Y = Top Case (0.15) + Neck (0.05) + Half Monitor (0.15)
        monitorItm.position.set(0, 0.15 + 0.05 + 0.15, 0);
        monitorItm.castShadow = true;
        this.mesh.add(monitorItm);

        // Pantalla (Inset)
        const screenGeo = new THREE.PlaneGeometry(0.3, 0.22);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        // Posicionada en la cara frontal del monitor
        screen.position.set(0, monitorItm.position.y, monitorD / 2 + 0.005);
        this.mesh.add(screen);

        // Borde Pantalla (Bezel) - Simulado visualmente por el monitorBox, 
        // pero añadimos una "visera" o marco interno simple si queremos más detalle.
        // Por ahora lo simple funciona bien.


        // --- 3. TECLADO ---
        const kbW = 0.55;
        const kbH = 0.04;
        const kbD = 0.2;
        const kbGeo = new THREE.BoxGeometry(kbW, kbH, kbD);
        const keyboard = new THREE.Mesh(kbGeo, beigeMat);

        // Posición: Delante del case. 
        // Case llega a Z=0.25. Teclado empieza en Z=0.3
        keyboard.position.set(0, 0.03, 0.45);
        keyboard.rotation.x = 0.1; // Inclinación ergonómica
        keyboard.castShadow = true;
        keyboard.receiveShadow = true;
        this.mesh.add(keyboard);

        // Teclas (Bloques simulados)
        const keysGeo = new THREE.BoxGeometry(kbW - 0.05, 0.01, kbD - 0.05);
        const keys = new THREE.Mesh(keysGeo, darkBeigeMat);
        keys.position.set(0, 0.03, 0); // Relativo al teclado
        keyboard.add(keys);


        // --- HITBOX DE INTERACCIÓN ---
        // Cubre Case + Monitor + Teclado
        const hitBoxGeo = new THREE.BoxGeometry(0.7, 0.8, 0.8);
        const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);

        // Centro aproximado de todo el conjunto
        hitBox.position.set(0, 0.3, 0.2);

        hitBox.userData.type = 'computer';
        hitBox.userData.parentObj = this;

        this.mesh.add(hitBox);
        this.interactableMesh = hitBox;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}
