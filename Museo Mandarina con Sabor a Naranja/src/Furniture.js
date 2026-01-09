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
        // Start Dark
        this.screenMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
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
        const screen = new THREE.Mesh(screenGeo, this.screenMat); // Use member mat
        // Posicionada en la cara frontal del monitor
        screen.position.set(0, monitorItm.position.y, monitorD / 2 + 0.005);
        this.mesh.add(screen);

        // Borde Pantalla (Bezel) - Simulado visualmente por el monitorBox, 
        // pero añadimos una "visera" o marco interno simple si queremos más detalle.
        // Por ahora lo simple funciona bien.

        // LIGHTING (Monitor Glow)
        this.monitorLight = new THREE.PointLight(0x88ccff, 0, 5); // Start 0 Intensity
        this.monitorLight.position.set(0, monitorItm.position.y, 0.5);
        this.monitorLight.castShadow = false;
        this.mesh.add(this.monitorLight);


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

    turnOn() {
        if (this.screenMat) this.screenMat.color.setHex(0x88ccff);
        if (this.monitorLight) this.monitorLight.intensity = 1.5;
    }

    turnOff() {
        if (this.screenMat) this.screenMat.color.setHex(0x111111);
        if (this.monitorLight) this.monitorLight.intensity = 0;
    }
}

export class DeskLamp {
    constructor() {
        this.mesh = new THREE.Group();
        this.isOn = false;
        this.light = null;
        this.bulbMat = null;
        this.build();
    }

    build() {
        // Simple Modern Desk Lamp
        const matC = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 }); // Dark Metal

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 32);
        const base = new THREE.Mesh(baseGeo, matC);
        this.mesh.add(base);

        // Arm (Angled)
        const armGeo = new THREE.CapsuleGeometry(0.015, 0.4, 4);
        const arm = new THREE.Mesh(armGeo, matC);
        arm.position.y = 0.2;
        arm.rotation.z = Math.PI / 8; // Tilt slightly
        this.mesh.add(arm);

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.set(-0.1, 0.4, 0);
        headGroup.rotation.z = Math.PI / 3; // Look down
        this.mesh.add(headGroup);

        const shadeGeo = new THREE.ConeGeometry(0.08, 0.15, 32, 1, true);
        const shade = new THREE.Mesh(shadeGeo, matC);
        shade.position.y = 0.05;
        headGroup.add(shade);

        // Bulb
        const bulbGeo = new THREE.SphereGeometry(0.03);
        this.bulbMat = new THREE.MeshBasicMaterial({ color: 0x333333 }); // Off
        const bulb = new THREE.Mesh(bulbGeo, this.bulbMat);
        bulb.position.y = 0;
        headGroup.add(bulb);

        // Light
        this.light = new THREE.SpotLight(0xffffee, 0);
        this.light.position.set(0, 0, 0);
        this.light.target.position.set(0, -1, 0);
        this.light.angle = Math.PI / 4;
        this.light.penumbra = 0.5;
        this.light.castShadow = true;
        headGroup.add(this.light);
        headGroup.add(this.light.target);

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.3;
        hitBox.userData = { type: 'desk-lamp', parentObj: this };
        this.mesh.add(hitBox);
        this.interactableMesh = hitBox; // Expose for World
    }

    setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
    setRotation(y) { this.mesh.rotation.y = y; }

    toggle() {
        this.isOn = !this.isOn;
        if (this.isOn) {
            this.light.intensity = 2.0;
            this.bulbMat.color.setHex(0xffffee);
        } else {
            this.light.intensity = 0;
            this.bulbMat.color.setHex(0x333333);
        }
    }
}

export class Clock {
    constructor() {
        this.mesh = new THREE.Group();
        this.hourHand = null;
        this.minuteHand = null;
        this.init();
    }

    init() {
        // Case (Dark Wood - Reddish Brown)
        // Outer ring
        const caseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 32);
        const caseMat = new THREE.MeshLambertMaterial({ color: 0x3f1d0b }); // Dark Wood Color
        const clockCase = new THREE.Mesh(caseGeo, caseMat);
        clockCase.rotation.x = Math.PI / 2;
        this.mesh.add(clockCase);

        // Face (Texture)
        const textureLoader = new THREE.TextureLoader();
        const faceTexture = textureLoader.load('textures/clock_face.png');
        faceTexture.colorSpace = THREE.SRGBColorSpace;

        const faceGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.21, 32);
        const faceMat = new THREE.MeshBasicMaterial({
            map: faceTexture,
            color: 0xffffff
        });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.rotation.x = Math.PI / 2;
        face.position.z = 0.01;
        // Rotate texture if needed? Cylinder UVs usually wrap around side.
        // For top cap (which we are seeing?), standard cylinder UVs might be radial or distorted.
        // Better use a CircleGeometry for the face to ensure flat UV mapping.
        this.mesh.add(face);

        // RE-DO Face as Circle for better UVs
        this.mesh.remove(face);
        const circleGeo = new THREE.CircleGeometry(1.4, 32);
        const circleMat = new THREE.MeshBasicMaterial({ map: faceTexture });
        const circleFace = new THREE.Mesh(circleGeo, circleMat);
        circleFace.position.z = 0.11; // Slightly in front of case
        this.mesh.add(circleFace);

        // Center Cap (Gold/Brass)
        const dotGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xB5A642 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = Math.PI / 2;
        dot.position.z = 0.15;
        this.mesh.add(dot);

        // Hands (Black, Fancy style simplified to thin tapering boxes)
        const handMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // Hour Hand
        // Tapered shape? Use simplified Box for now, maybe with scale
        this.hourHand = new THREE.Group();
        const hMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.02), handMat);
        hMesh.position.y = 0.3; // Center alignment
        this.hourHand.add(hMesh);
        this.hourHand.position.z = 0.12;
        this.mesh.add(this.hourHand);

        // Minute Hand
        this.minuteHand = new THREE.Group();
        const mMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.02), handMat);
        mMesh.position.y = 0.45;
        this.minuteHand.add(mMesh);
        this.minuteHand.position.z = 0.13;
        this.mesh.add(this.minuteHand);

        // Second Hand (Red, thin)
        this.secondHand = new THREE.Group();
        const sMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.2, 0.01), new THREE.MeshBasicMaterial({ color: 0xaa0000 }));
        sMesh.position.y = 0.4;
        this.secondHand.add(sMesh);
        this.secondHand.position.z = 0.14;
        this.mesh.add(this.secondHand);
    }

    setTime(hours, minutes) {
        // Hours: 0-24 -> 0-12
        const hours12 = hours % 12;
        const hourAngle = -(hours12 + minutes / 60) / 12 * Math.PI * 2;
        const minuteAngle = -(minutes / 60) * Math.PI * 2;

        // Second hand? We don't have seconds from Sky.
        // Maybe just animate it continuously based on Date.now?
        const seconds = (Date.now() / 1000) % 60;
        const secondAngle = -(seconds / 60) * Math.PI * 2;

        if (this.hourHand) this.hourHand.rotation.z = hourAngle;
        if (this.minuteHand) this.minuteHand.rotation.z = minuteAngle;
        if (this.secondHand) this.secondHand.rotation.z = secondAngle;
    }
}

export class FloorLamp {
    constructor() {
        this.mesh = new THREE.Group();
        this.light = null;
        this.init();
    }

    init() {
        // Materials
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3c31 }); // Dark Wood

        const textureLoader = new THREE.TextureLoader();
        const fabricTex = textureLoader.load('textures/lamp_shade.png');
        fabricTex.colorSpace = THREE.SRGBColorSpace;
        const shadeMat = new THREE.MeshLambertMaterial({
            map: fabricTex,
            color: 0xffffee, // Tint slight warm
            side: THREE.DoubleSide
        });

        // Tripod Legs
        const legHeight = 1.4;
        const legspread = 0.4;
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, legHeight);

        // Leg 1
        const leg1 = new THREE.Mesh(legGeo, woodMat);
        leg1.position.set(0, legHeight / 2, legspread / 2);
        leg1.rotation.x = -0.15; // Tilt out
        // Rotation logic for tripod is tricky manually. 
        // Let's create a container for each leg and rotate container Y

        for (let i = 0; i < 3; i++) {
            const pivot = new THREE.Group();
            pivot.rotation.y = (i / 3) * Math.PI * 2;

            const leg = new THREE.Mesh(legGeo, woodMat);
            leg.position.y = legHeight / 2;
            leg.position.z = legspread; // Offset from center
            leg.rotation.x = -0.15; // Slant inward/outward? 
            // If z is positive, and we want bottom to be further out...
            // Top is at ~0. Bottom is at +Z.
            // Wait, standard tripod: tops meet at center, feet are spread.
            // So if pivot is center Y=height... no.
            // Let's model leg vertical at origin, then top at 0, bottom out.

            // Simpler: Just position tops near 1.3 height, bottoms spread.
            pivot.add(leg);
            this.mesh.add(pivot);
        }

        // Doing proper tripod manually:
        // Tops meet at height 1.3
        // Bottoms at height 0, radius 0.4
        // Leg geometry is centered.
        // Let's reset mesh and do cleaner construction
        this.mesh.children = [];

        const legLength = 1.45;
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, legLength);
        legGeometry.translate(0, -legLength / 2, 0); // Pivot at top

        const centerHeight = 1.4;
        const radiusBottom = 0.5;
        // Angle calc: Atan(radius / height)
        const tiltAngle = Math.atan(radiusBottom / centerHeight);

        for (let i = 0; i < 3; i++) {
            const leg = new THREE.Mesh(legGeometry, woodMat);
            leg.position.y = centerHeight;

            // Rotate Y for radial position
            const yAngle = (i / 3) * Math.PI * 2;

            // We want to tilt OUTWARD.
            // First rotate Z by tiltAngle 
            leg.rotation.z = tiltAngle;

            // Then rotate whole thing by Y? No transforms order matters.
            // Create a Parent for Y rotation
            const legGroup = new THREE.Group();
            legGroup.rotation.y = yAngle;
            legGroup.add(leg);
            this.mesh.add(legGroup);
        }

        // Central Hardware (where legs meet)
        const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1);
        const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
        hub.position.y = centerHeight;
        this.mesh.add(hub);

        // Pole going up to shade
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3);
        const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
        stem.position.y = centerHeight + 0.15;
        this.mesh.add(stem);

        // Shade
        const shadeHeight = 0.45; // Match image proportions approx
        const shadeRadius = 0.4;
        const shadeGeo = new THREE.CylinderGeometry(shadeRadius, shadeRadius, shadeHeight, 32, 1, true);
        const shade = new THREE.Mesh(shadeGeo, shadeMat);
        shade.position.y = centerHeight + 0.3 + (shadeHeight / 2); // Top of stem
        this.mesh.add(shade);

        // Emissive bulb inside
        const bulbGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFF0DD });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.y = centerHeight + 0.3 + (shadeHeight / 2);
        this.mesh.add(bulb);

        // Point Light (Warm)
        this.light = new THREE.PointLight(0xFFDDAA, 0.8, 8);
        this.light.position.y = centerHeight + 0.3 + (shadeHeight / 2);
        this.light.castShadow = true;
        this.mesh.add(this.light);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}
