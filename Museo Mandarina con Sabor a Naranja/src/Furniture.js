import * as THREE from 'three';

export class Desk {
    constructor(width = 3.5, depth = 1.2, height = 0.8) {
        this.width = width;
        this.depth = depth;
        this.height = height;

        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Materiales
        // Madera oscura (Mahogany)
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x4a1810, // Rich Dark Mahogany
            roughness: 0.5,
            metalness: 0.1
        });

        // Metal Oscuro para tiradores
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.4,
            metalness: 0.6
        });

        // Writing Pad (Leather)
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x112211, // Dark Green Leather
            roughness: 0.8,
            metalness: 0
        });

        // 1. Tablero Principal (Thick Slab)
        const topThickness = 0.08;
        const topGeo = new THREE.BoxGeometry(this.width, topThickness, this.depth);
        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.y = this.height - topThickness / 2;
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);

        // Writing Pad (Inset on top)
        const padW = 1.2;
        const padD = 0.8;
        const padGeo = new THREE.BoxGeometry(padW, 0.01, padD);
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, this.height, 0.1); // Slightly forward
        pad.receiveShadow = true;
        this.mesh.add(pad);

        // 2. Estructura Inferior (Tres bloques: Izq, Der, Panel Modestia)
        const cabinetWidth = 0.8;
        const cabinetHeight = this.height - topThickness;
        const cabinetDepth = this.depth - 0.2; // Slightly recessed

        const cabinetGeo = new THREE.BoxGeometry(cabinetWidth, cabinetHeight, cabinetDepth);

        // Gabinete Izquierdo
        const leftCab = new THREE.Mesh(cabinetGeo, woodMat);
        leftCab.position.set(
            -this.width / 2 + cabinetWidth / 2 + 0.1, // Offset from edge
            cabinetHeight / 2,
            0
        );
        leftCab.castShadow = true;
        leftCab.receiveShadow = true;
        this.mesh.add(leftCab);

        // Gabinete Derecho
        const rightCab = new THREE.Mesh(cabinetGeo, woodMat);
        rightCab.position.set(
            this.width / 2 - cabinetWidth / 2 - 0.1,
            cabinetHeight / 2,
            0
        );
        rightCab.castShadow = true;
        rightCab.receiveShadow = true;
        this.mesh.add(rightCab);

        // Panel de Modestia (Fondo) - Recedido
        const modestyThickness = 0.05;
        // Width = space between cabinets? Na, let's make it almost full width behind cabinets or between.
        // Between cabinets:
        const innerSpace = this.width - (2 * (cabinetWidth + 0.1));
        const modestyGeo = new THREE.BoxGeometry(innerSpace + 0.2, cabinetHeight, modestyThickness); // +0.2 overlap
        const modestyPanel = new THREE.Mesh(modestyGeo, woodMat);
        // Position: Z recessed to front (visitor side)
        // Desk Center Z=0. Visitor side is -depth/2?
        // Let's put it at Z = -cabinetDepth/2 + thickness
        modestyPanel.position.set(0, cabinetHeight / 2, -cabinetDepth / 2 + modestyThickness / 2);
        modestyPanel.castShadow = true;
        modestyPanel.receiveShadow = true;
        this.mesh.add(modestyPanel);

        // Detalles: Tiradores de cajones en gabinetes (Simulados)
        // 3 Cajones por lado
        const handleGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);

        for (let i = 0; i < 3; i++) {
            // Y positions
            const y = cabinetHeight * 0.8 - (i * 0.2);

            // Left Handles
            const hL = new THREE.Mesh(handleGeo, metalMat);
            // Position on Front Face of Cabinet (Z+)
            hL.position.set(leftCab.position.x, y, cabinetDepth / 2 + 0.01);
            this.mesh.add(hL);

            // Right Handles
            const hR = new THREE.Mesh(handleGeo, metalMat);
            hR.position.set(rightCab.position.x, y, cabinetDepth / 2 + 0.01);
            this.mesh.add(hR);
        }

        // --- 3. U-Shape Wings (Extensiones Laterales) ---
        // Extend backwards (Local +Z)
        const wingWidth = 0.8;
        const wingDepth = 1.5;
        const wingGeo = new THREE.BoxGeometry(wingWidth, topThickness, wingDepth);
        const wingCabinetGeo = new THREE.BoxGeometry(wingWidth, cabinetHeight, wingDepth - 0.2);

        // Common Z position: Starts at half depth of main desk + half depth of wing
        // Main Desk Z range: [-depth/2, depth/2]
        // We want to attach at +depth/2 and go +Z.
        // Center Z = depth/2 + wingDepth/2.
        const wingZ = this.depth / 2 + wingDepth / 2 - 0.01; // -0.01 overlap

        // Left Wing (at -X edge)
        // Center X = -this.width/2 + wingWidth/2
        const wingX_Left = -this.width / 2 + wingWidth / 2;

        const leftWingTop = new THREE.Mesh(wingGeo, woodMat);
        leftWingTop.position.set(wingX_Left, this.height - topThickness / 2, wingZ);
        leftWingTop.castShadow = true;
        leftWingTop.receiveShadow = true;
        this.mesh.add(leftWingTop);

        const leftWingCab = new THREE.Mesh(wingCabinetGeo, woodMat);
        leftWingCab.position.set(wingX_Left, cabinetHeight / 2, wingZ);
        leftWingCab.castShadow = true;
        leftWingCab.receiveShadow = true;
        this.mesh.add(leftWingCab);

        // Right Wing (at +X edge)
        const wingX_Right = this.width / 2 - wingWidth / 2;

        const rightWingTop = new THREE.Mesh(wingGeo, woodMat);
        rightWingTop.position.set(wingX_Right, this.height - topThickness / 2, wingZ);
        rightWingTop.castShadow = true;
        rightWingTop.receiveShadow = true;
        this.mesh.add(rightWingTop);

        const rightWingCab = new THREE.Mesh(wingCabinetGeo, woodMat);
        rightWingCab.position.set(wingX_Right, cabinetHeight / 2, wingZ);
        rightWingCab.castShadow = true;
        rightWingCab.receiveShadow = true;
        this.mesh.add(rightWingCab);
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
        // Start with Faint Blue Glow (Always On)
        this.screenMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: 0x004488, // Deep faint blue
            emissiveIntensity: 0.8, // Visible but not blinding
            roughness: 0.2,
            metalness: 0.5
        });
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

        // --- STATUS LEDS (Red & Green) ---
        // Power LED (Green)
        const ledGeo = new THREE.BoxGeometry(0.015, 0.015, 0.01);
        const greenLedMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 2.0
        });
        const greenLed = new THREE.Mesh(ledGeo, greenLedMat);
        greenLed.position.set(-0.02, 0.08, 0.251); // Center-Left
        this.mesh.add(greenLed);

        // HDD LED (Red)
        const redLedMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.5
        });
        const redLed = new THREE.Mesh(ledGeo, redLedMat);
        redLed.position.set(0.02, 0.08, 0.251); // Center-Right
        this.mesh.add(redLed);


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

        // Dynamic Texture (ASCII Pony)
        const screenTexture = this.createAsciiTexture();
        this.screenMat = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: 0xffffff, // White so the texture colors show through? Or control color via map
            emissiveMap: screenTexture,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.5
        });

        const screen = new THREE.Mesh(screenGeo, this.screenMat);
        // Posicionada en la cara frontal del monitor
        screen.position.set(0, monitorItm.position.y, monitorD / 2 + 0.005);
        this.mesh.add(screen);

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
        const keyboard = new THREE.Mesh(kbGeo, beigeMat); // beigeMat is in scope from start of build()

        // Posición: Delante del case. 
        // Case llega a Z=0.25. Teclado empieza en Z=0.3
        keyboard.position.set(0, 0.03, 0.45);
        keyboard.rotation.x = 0.1; // Inclinación ergonómica
        keyboard.castShadow = true;
        keyboard.receiveShadow = true;
        this.mesh.add(keyboard);

        // Teclas (Bloques simulados)
        const keysGeo = new THREE.BoxGeometry(kbW - 0.05, 0.01, kbD - 0.05);
        const keys = new THREE.Mesh(keysGeo, darkBeigeMat); // darkBeigeMat is in scope
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

    createAsciiTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#000044'; // Slightly brighter Dark Blue for "blue glow" base
        ctx.fillRect(0, 0, 512, 512);

        // Text (Bright Neon Blue)
        ctx.fillStyle = '#00FFFF'; // Cyan/Neon Blue
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ASCII Pony (Simple)
        const ascii = [
            "  \\^___/^/  ",
            " /       \\  ",
            "|   o   o | ",
            "|   \\_Y_/ | ",
            " \\       /  ",
            "  \\_____/   ",
            "   |   |    ",
            "  /     \\   "
        ];

        let startY = 150;
        const lineHeight = 35;

        // Draw "MANDARINA OS" header
        ctx.font = 'bold 40px monospace';
        ctx.fillText("MANDARINA OS", 256, 80);

        // Draw Art
        ctx.font = 'bold 30px monospace';
        ascii.forEach((line, i) => {
            ctx.fillText(line, 256, startY + (i * lineHeight));
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }




    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    turnOn() {
        // Active State (Bright)
        if (this.screenMat) {
            this.screenMat.color.setHex(0xffffff); // Full white base
            this.screenMat.emissive.setHex(0xffffff); // Let texture colors shine full
            this.screenMat.emissiveIntensity = 1.2; // Bright
        }
        if (this.monitorLight) {
            this.monitorLight.color.setHex(0x88ccff); // Light Blue Light
            this.monitorLight.intensity = 3.0;
            this.monitorLight.distance = 8;
        }
    }

    turnOff() {
        // "Off" State = Idle/Screensaver (Blue Glow + Visible Art)
        if (this.screenMat) {
            this.screenMat.color.setHex(0xaaaaaa); // Slightly dimmed base
            this.screenMat.emissive.setHex(0xffffff); // White emissive to keep colors correct
            this.screenMat.emissiveIntensity = 0.8; // Moderate glow
        }
        // Keep a small glow light
        if (this.monitorLight) {
            this.monitorLight.color.setHex(0x0033aa); // Deep Blue Light
            this.monitorLight.intensity = 2.0;
            this.monitorLight.distance = 5;
        }
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
        // Nordic Style Lamp (White + Light Wood)
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.8 }); // Light wood
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });

        // 1. Base (White Cylinder)
        const baseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 32);
        const base = new THREE.Mesh(baseGeo, whiteMat);
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);

        // 2. Vertical Stand (Two wooden poles)
        const poleH = 0.35;
        const poleW = 0.025;
        const poleD = 0.025;
        const gap = 0.04;

        const poleGeo = new THREE.BoxGeometry(poleW, poleH, poleD);

        const pole1 = new THREE.Mesh(poleGeo, woodMat);
        pole1.position.set(-gap / 2, poleH / 2 + 0.015, 0);
        pole1.castShadow = true;
        this.mesh.add(pole1);

        const pole2 = new THREE.Mesh(poleGeo, woodMat);
        pole2.position.set(gap / 2, poleH / 2 + 0.015, 0);
        pole2.castShadow = true;
        this.mesh.add(pole2);

        // 3. Hardware (Pivot Bolt)
        const pivotH = 0.3; // Height of pivot
        const boltGeo = new THREE.CylinderGeometry(0.008, 0.008, gap + 0.04, 16);
        const bolt = new THREE.Mesh(boltGeo, metalMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(0, pivotH, 0);
        this.mesh.add(bolt);

        // Wingnut (Decoration)
        const nutGeo = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const nut = new THREE.Mesh(nutGeo, metalMat);
        nut.position.set(gap / 2 + 0.02, pivotH, 0);
        this.mesh.add(nut);

        // 4. Arm (Wooden Bar) passing between poles
        const armL = 0.4;
        const armW = 0.025;
        const armD = 0.035;

        const armGroup = new THREE.Group();
        armGroup.position.set(0, pivotH, 0);
        // Tilt forward
        armGroup.rotation.x = Math.PI / 4;
        this.mesh.add(armGroup);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(armW, armL, armD), woodMat);
        // Pivot is at proportional position Y.
        // If arm is 0.4 long, and pivot is at 0.1 from bottom.
        // Center of geometry is 0. So we shift geometry up by (0.4/2 - 0.1) = 0.1
        arm.position.y = 0.1;
        arm.castShadow = true;
        armGroup.add(arm);

        // 5. Shade (White Cup)
        const shadeGroup = new THREE.Group();
        // Top of arm is at: y = 0.1 + 0.4/2 = 0.3 inside the armGroup
        shadeGroup.position.set(0, 0.3, 0);
        shadeGroup.rotation.x = Math.PI / 2 + 0.2; // Point down/forward
        armGroup.add(shadeGroup);

        // Connector (small wood or metal piece)
        const conn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), woodMat);
        conn.rotation.z = Math.PI / 2;
        shadeGroup.add(conn);

        // Actual Shade (Cylinder for cup shape)
        const hoodGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.25, 32, 1, true);
        const hood = new THREE.Mesh(hoodGeo, whiteMat);
        hood.rotation.x = Math.PI; // Flip so wide part is down
        hood.position.y = 0.125; // Shift so top (narrow) connects to pivot
        shadeGroup.add(hood);

        // Cap for closed narrow end
        const capGeo = new THREE.CircleGeometry(0.06, 32);
        const cap = new THREE.Mesh(capGeo, whiteMat);
        cap.rotation.x = -Math.PI / 2;
        cap.position.y = 0; // At pivot point (narrow end)
        shadeGroup.add(cap);

        // Bulb
        const bulbGeo = new THREE.SphereGeometry(0.04);
        this.bulbMat = new THREE.MeshBasicMaterial({ color: 0x333333 }); // Off
        const bulb = new THREE.Mesh(bulbGeo, this.bulbMat);
        bulb.position.y = 0.15; // Inside shade
        shadeGroup.add(bulb);

        // Light (Spotlight)
        this.light = new THREE.SpotLight(0xffffee, 0);
        this.light.position.set(0, 0.1, 0);
        this.light.target.position.set(0, 1, 0); // Local direction +Y (which is "down" relative to shade rotation)
        this.light.angle = Math.PI / 3;
        this.light.penumbra = 0.2;
        this.light.castShadow = true;
        // SpotLight target needs to be in scene or added to hierarchy
        shadeGroup.add(this.light);
        shadeGroup.add(this.light.target);


        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.4, 0.7, 0.4);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.35;
        hitBox.userData = { type: 'desk-lamp', parentObj: this };
        this.mesh.add(hitBox);
        this.interactableMesh = hitBox;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    toggle() {
        this.setState(!this.isOn);
    }

    turnOff() {
        this.setState(false);
    }

    setState(isOn) {
        this.isOn = isOn;
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
        const faceMat = new THREE.MeshStandardMaterial({
            map: faceTexture,
            color: 0xffffff,
            roughness: 0.8
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
        const circleMat = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.8 });
        const circleFace = new THREE.Mesh(circleGeo, circleMat);
        circleFace.position.z = 0.11; // Slightly in front of case
        this.mesh.add(circleFace);

        // Center Cap (Gold/Brass)
        const dotGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xB5A642, metalness: 0.6, roughness: 0.3 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = Math.PI / 2;
        dot.position.z = 0.15;
        this.mesh.add(dot);

        // Hands (Black, Fancy style simplified to thin tapering boxes)
        const handMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5 });

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
        const sMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.2, 0.01), new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5 }));
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

        // State
        this.isOn = true; // Default ON?
        this.shadeMat = shadeMat; // Store ref for color change

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.9;
        hitBox.userData = { type: 'floor-lamp', parentObj: this };
        this.mesh.add(hitBox);
        this.interactableMesh = hitBox;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    turnOff() {
        this.setState(false);
    }

    toggle() {
        this.setState(!this.isOn);
    }

    setState(isOn) {
        this.isOn = isOn;
        if (this.isOn) {
            this.light.intensity = 0.8;
            this.shadeMat.color.setHex(0xffffee);
            this.shadeMat.emissive.setHex(0x554433);
        } else {
            this.light.intensity = 0;
            this.shadeMat.color.setHex(0x888888); // Dimmed look
            this.shadeMat.emissive.setHex(0x000000);
        }
    }
}

export class Lever {
    constructor() {
        this.mesh = new THREE.Group();
        this.isOpen = false;
        this.handle = null;
        this.interactableMesh = null;
        this.build();
    }

    build() {
        // Base
        const baseGeo = new THREE.BoxGeometry(0.1, 0.02, 0.2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.castShadow = true;
        this.mesh.add(base);

        // Fulcrum
        const fulcrumGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08); // Horizontal rod
        const fulcrum = new THREE.Mesh(fulcrumGeo, baseMat);
        fulcrum.rotation.x = Math.PI / 2;
        fulcrum.position.y = 0.02;
        this.mesh.add(fulcrum);

        // Handle (The moving part)
        this.handle = new THREE.Group();
        this.handle.position.y = 0.02; // Pivot at fulcrum
        this.mesh.add(this.handle);

        const stickGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15);
        const stickMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
        const stick = new THREE.Mesh(stickGeo, stickMat);
        stick.position.y = 0.075; // Move up so pivot is at bottom
        this.handle.add(stick);

        const knobGeo = new THREE.SphereGeometry(0.025);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.y = 0.15;
        this.handle.add(knob);

        // Initial rotation (Closed state = Back)
        this.handle.rotation.x = -Math.PI / 4;

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.2, 0.3, 0.3);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.1;
        hitBox.userData = { type: 'lever', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
    setRotation(y) { this.mesh.rotation.y = y; }

    toggle() {
        this.isOpen = !this.isOpen;
        // Animation (Instant for now, or use tweening lib if available, but simple rotation is fine)
        if (this.isOpen) {
            this.handle.rotation.x = Math.PI / 4; // Forward
        } else {
            this.handle.rotation.x = -Math.PI / 4; // Back
        }
        return this.isOpen;
    }
}

export class Chandelier {
    constructor() {
        this.mesh = new THREE.Group();
        this.baseY = 3.0; // Normal height
        this.retractedY = 6.0; // Height when hidden (above ceiling)
        this.currentY = this.baseY;
        this.targetY = this.baseY;
        this.moveSpeed = 2.0;
        this.lights = [];

        this.build();
    }

    build() {
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });

        const candleMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFF0,
            roughness: 0.9
        });

        const flameMat = new THREE.MeshBasicMaterial({ color: 0xFFAA00 });

        // Central Stem
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 16);
        const stem = new THREE.Mesh(stemGeo, goldMat);
        stem.castShadow = true;
        this.mesh.add(stem);

        // Top Cone (decorative)
        const topConeGeo = new THREE.ConeGeometry(0.1, 0.2, 16);
        const topCone = new THREE.Mesh(topConeGeo, goldMat);
        topCone.position.y = 0.4;
        this.mesh.add(topCone);

        // Main Body (Sphere)
        const bodyGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const body = new THREE.Mesh(bodyGeo, goldMat);
        body.position.y = -0.3;
        this.mesh.add(body);

        // Arms (8 arms)
        const armCount = 8;
        const radius = 0.8;

        for (let i = 0; i < armCount; i++) {
            const angle = (i / armCount) * Math.PI * 2;
            const armGroup = new THREE.Group();

            // Arm geometry (simple curved torus segment or cylinders)
            // Simplified: Horizontal rod
            const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, radius - 0.15);
            const rod = new THREE.Mesh(rodGeo, goldMat);
            rod.rotation.z = Math.PI / 2;
            rod.position.x = (radius - 0.15) / 2 + 0.15;
            armGroup.add(rod);

            // Cup at end
            const cupGeo = new THREE.CylinderGeometry(0.06, 0.02, 0.1);
            const cup = new THREE.Mesh(cupGeo, goldMat);
            cup.position.x = radius;
            cup.position.y = 0.05;
            armGroup.add(cup);

            // Candle
            const candleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3);
            const candle = new THREE.Mesh(candleGeo, candleMat);
            candle.position.x = radius;
            candle.position.y = 0.25;
            armGroup.add(candle);

            // Flame (Visual)
            const flameGeo = new THREE.SphereGeometry(0.04);
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.x = radius;
            flame.position.y = 0.45;
            armGroup.add(flame);

            // Light
            const light = new THREE.PointLight(0xFFDDAA, 0.5, 10);
            light.position.set(radius, 0.5, 0);
            // Shadows for all lights might be expensive. Enable for one or two or none?
            // Let's enable for every other one or just rely on main ambient + point.
            // For performance, let's enable shadows on 0 and 4.
            if (i % 4 === 0) {
                light.castShadow = true;
                light.shadow.bias = -0.001;
            }
            armGroup.add(light);
            this.lights.push(light); // Store ref

            armGroup.rotation.y = angle;
            // Lower the arms from the body
            armGroup.position.y = -0.3;

            this.mesh.add(armGroup);
        }

        // Chain (Simple cylinder going up)
        const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0);
        const chain = new THREE.Mesh(chainGeo, goldMat);
        chain.position.y = 1.0;
        this.mesh.add(chain);
    }

    turnOff() {
        this.isOn = false;
        this.lights.forEach(l => l.intensity = 0);
    }

    turnOn() {
        this.isOn = true;
        this.lights.forEach(l => l.intensity = 0.5);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
        this.currentY = y;
        this.baseY = y;
        this.targetY = y;
    }

    retract() {
        this.targetY = this.retractedY;
    }

    extend() {
        this.targetY = this.baseY;
    }

    isHidden() {
        return Math.abs(this.currentY - this.retractedY) < 0.1;
    }

    isFullyExtended() {
        return Math.abs(this.currentY - this.baseY) < 0.1;
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(delta) {
        if (Math.abs(this.currentY - this.targetY) > 0.01) {
            const diff = this.targetY - this.currentY;
            const step = this.moveSpeed * delta * Math.sign(diff);

            if (Math.abs(diff) < Math.abs(step)) {
                this.currentY = this.targetY;
            } else {
                this.currentY += step;
            }

            this.mesh.position.y = this.currentY;
        }
    }
}

export class DoubleDoor {
    constructor(width = 4, height = 3.5) {
        this.width = width;
        this.height = height;
        this.mesh = new THREE.Group();
        this.isOpen = false;
        this.leftDoor = null;
        this.rightDoor = null;
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.interactableMesh = null;
        this.build();
    }

    build() {
        const oakColor = 0x3D2B1F; // Darker Wood (Mahogany/Dark Oak) - Was 0xA07040
        const frameColor = 0x302010; // Darker frame
        const goldColor = 0xFFD700;

        // Create Procedural Wood Texture
        const woodTexture = this.createWoodTexture();
        woodTexture.wrapS = THREE.RepeatWrapping;
        woodTexture.wrapT = THREE.RepeatWrapping;
        woodTexture.repeat.set(1, 2); // Stretch grain vertically

        const woodMat = new THREE.MeshStandardMaterial({
            map: woodTexture,
            color: 0xAAAAAA, // Was 0x888888 (Darker) -> Now Lighter to show texture
            roughness: 0.6,
            metalness: 0.1
        });

        const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.8 });
        const goldMat = new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.8, roughness: 0.2 });

        // 1. Frame (Architrave)
        const frameThickness = 0.2;
        const frameDepth = 0.3;

        // Top Frame
        const topFrameGeo = new THREE.BoxGeometry(this.width + frameThickness * 2, frameThickness, frameDepth);
        const topFrame = new THREE.Mesh(topFrameGeo, frameMat);
        topFrame.position.y = this.height + frameThickness / 2;
        topFrame.castShadow = true;
        this.mesh.add(topFrame);

        // Side Frames
        const sideFrameGeo = new THREE.BoxGeometry(frameThickness, this.height, frameDepth);

        const leftFrame = new THREE.Mesh(sideFrameGeo, frameMat);
        leftFrame.position.set(-this.width / 2 - frameThickness / 2, this.height / 2, 0);
        leftFrame.castShadow = true;
        this.mesh.add(leftFrame);

        const rightFrame = leftFrame.clone();
        rightFrame.position.set(this.width / 2 + frameThickness / 2, this.height / 2, 0);
        rightFrame.castShadow = true;
        this.mesh.add(rightFrame);

        // 2. Decor Arch (Semi-circle on top)
        // Reference image shows a fancy arch window above.
        // Let's add a simple Arch Frame and Glass.
        const archHeight = 1.0;
        const archGeo = new THREE.CylinderGeometry(this.width / 2 + frameThickness, this.width / 2 + frameThickness, frameDepth, 32, 1, false, 0, Math.PI);
        const arch = new THREE.Mesh(archGeo, frameMat);
        // Cylinder is vertical. Rotate X.
        arch.rotation.x = -Math.PI / 2; // Flat side down. Wait.
        // Cylinder default created along Y. 
        // We want circular face on Z plane. Rotate X = 90.
        // And we want half cylinder (Top).
        // Cylinder theta start 0 length PI makes half cylinder.
        // We need to rotate Z -90 to make it an arch?
        // Let's use Circle for glass and Box for frame segments if complex.
        // Simplified: Just a block for now or skip arch to keep hitbox simple?
        // Let's skip heavy geometry for arch to save time/risk, focus on door panels.

        // 3. Doors
        // Two panels. Pivot at outer edges.
        const doorW = this.width / 2;
        const doorH = this.height;
        const doorD = 0.1;

        // Container Groups for Pivot
        this.leftDoor = new THREE.Group();
        this.leftDoor.position.set(-this.width / 2, 0, 0); // Pivot at left edge
        this.mesh.add(this.leftDoor);

        this.rightDoor = new THREE.Group();
        this.rightDoor.position.set(this.width / 2, 0, 0); // Pivot at right edge
        this.mesh.add(this.rightDoor);

        // Door Meshes (Offset so they fill the gap from pivot)
        const doorGeo = new THREE.BoxGeometry(doorW, doorH, doorD);

        // Left Mesh: shifts RIGHT from pivot
        const leftMesh = new THREE.Mesh(doorGeo, woodMat);
        leftMesh.position.set(doorW / 2, doorH / 2, 0);
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        this.leftDoor.add(leftMesh);

        // Right Mesh: shifts LEFT from pivot
        const rightMesh = new THREE.Mesh(doorGeo, woodMat);
        rightMesh.position.set(-doorW / 2, doorH / 2, 0);
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        this.rightDoor.add(rightMesh);

        // Panels/Decor on doors (Inset Boxes)
        const panelGeo = new THREE.BoxGeometry(doorW * 0.6, doorH * 0.35, doorD + 0.04);

        // Top Panels
        const lTop = new THREE.Mesh(panelGeo, woodMat);
        lTop.position.set(doorW / 2, doorH * 0.7, 0);
        this.leftDoor.add(lTop);

        const rTop = new THREE.Mesh(panelGeo, woodMat);
        rTop.position.set(-doorW / 2, doorH * 0.7, 0);
        this.rightDoor.add(rTop);

        // Bottom Panels
        const lBot = new THREE.Mesh(panelGeo, woodMat);
        lBot.position.set(doorW / 2, doorH * 0.3, 0);
        this.leftDoor.add(lBot);

        const rBot = new THREE.Mesh(panelGeo, woodMat);
        rBot.position.set(-doorW / 2, doorH * 0.3, 0);
        this.rightDoor.add(rBot);


        // Handles (Gold Rings)
        const handleR = 0.15;
        const ringGeo = new THREE.TorusGeometry(handleR, 0.02, 16, 32);
        const holderGeo = new THREE.SphereGeometry(0.04);

        // Left Handle
        const lRing = new THREE.Mesh(ringGeo, goldMat);
        lRing.position.set(doorW - 0.2, doorH / 2, doorD / 2 + 0.02);
        this.leftDoor.add(lRing);
        const lHolder = new THREE.Mesh(holderGeo, goldMat);
        lHolder.position.set(doorW - 0.2, doorH / 2 + 0.15, doorD / 2 + 0.02);
        this.leftDoor.add(lHolder);

        // Right Handle
        const rRing = new THREE.Mesh(ringGeo, goldMat);
        rRing.position.set(-doorW + 0.2, doorH / 2, doorD / 2 + 0.02);
        this.rightDoor.add(rRing);
        const rHolder = new THREE.Mesh(holderGeo, goldMat);
        rHolder.position.set(-doorW + 0.2, doorH / 2 + 0.15, doorD / 2 + 0.02);
        this.rightDoor.add(rHolder);


        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(this.width, this.height, 0.5);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.set(0, this.height / 2, 0);
        hitBox.userData = { type: 'double-door', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    toggle() {
        this.isOpen = !this.isOpen;
        // Animation handled in update
        // Target: 90 degrees (PI/2) roughly
        this.targetRotation = this.isOpen ? Math.PI / 2 : 0;
        return this.isOpen;
    }

    update(delta) {
        if (Math.abs(this.currentRotation - this.targetRotation) > 0.001) {
            const speed = 2.0;
            const diff = this.targetRotation - this.currentRotation;
            const step = speed * delta * Math.sign(diff);

            if (Math.abs(diff) < Math.abs(step)) {
                this.currentRotation = this.targetRotation;
            } else {
                this.currentRotation += step;
            }

            // Apply rotation
            // Left door rotates -Y (Clockwise looking from top?) -> Outward?
            // Depends on which way is "Out".
            // Let's rotate Left -90, Right +90 to open "In/Out" symmetrically.
            this.leftDoor.rotation.y = -this.currentRotation;
            this.rightDoor.rotation.y = this.currentRotation;
        }
    }

    createWoodTexture() {

        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base color (Lighter Mahogany)
        ctx.fillStyle = '#5D4037'; // Was #3D2B1F
        ctx.fillRect(0, 0, size, size);

        // Grain
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const length = Math.random() * 20 + 5;
            const width = Math.random() * 2 + 0.5;
            const alpha = Math.random() * 0.3 + 0.1;

            // Darker streaks (Less intense contrast)
            ctx.fillStyle = `rgba(60, 40, 30, ${alpha})`; // Was 40,30,20
            ctx.fill();
        }

        // Noise / knots
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 10 + 5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(60, 40, 10, 0.3)';
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}

export class RedCarpet {
    constructor(width, length) {
        this.width = width;
        this.length = length;
        this.mesh = new THREE.Group(); // Use Group to hold carpet + borders
        this.build();
    }

    build() {
        // Create Canvas Texture (Seamless Pattern)
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512; // Square tiling texture
        const ctx = canvas.getContext('2d');

        // 1. Background (Deep Red)
        ctx.fillStyle = '#8B0000'; // Dark Red
        ctx.fillRect(0, 0, 512, 512);

        // 2. Pattern (Gold Lattice)
        ctx.strokeStyle = '#DAA520'; // GoldenRod
        ctx.lineWidth = 4;

        // Draw Diagonal Grid
        const step = 64;

        // Diagonals /
        for (let y = -512; y < 1024; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y + 512); // Slope 1
            ctx.stroke();
        }

        // Diagonals \
        for (let y = -512; y < 1024; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y - 512); // Slope -1
            ctx.stroke();
        }

        // 3. Ornaments
        ctx.fillStyle = '#FFD700'; // Gold
        for (let x = step / 2; x < 512; x += step) {
            for (let y = step / 2; y < 512; y += step) {
                this.drawMotif(ctx, x, y, 8);
            }
        }

        // REMOVED: Borders from texture (to avoid repeat issues)

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const repeatX = this.width / 2; // Density
        const repeatY = this.length / 2;
        texture.repeat.set(repeatX, repeatY);
        texture.colorSpace = THREE.SRGBColorSpace;

        // --- Main Carpet Mesh ---
        const geo = new THREE.PlaneGeometry(this.width, this.length);
        const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });

        const carpetMesh = new THREE.Mesh(geo, mat);
        carpetMesh.rotation.x = -Math.PI / 2; // Flat on floor
        carpetMesh.receiveShadow = true;
        this.mesh.add(carpetMesh);

        // --- 3D Gold Borders ---
        const borderW = 0.2;
        const borderH = 0.02; // Thickness
        const borderMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            roughness: 0.3,
            metalness: 0.8
        });

        const borderGeo = new THREE.BoxGeometry(borderW, borderH, this.length);

        // Left Border
        const leftBorder = new THREE.Mesh(borderGeo, borderMat);
        // Position: X = -width/2 + borderW/2 (Inside edge) ? Or centered on edge?
        // Let's center it on the edge.
        leftBorder.position.set(-this.width / 2 + borderW / 2, borderH / 2, 0);
        leftBorder.castShadow = true;
        leftBorder.receiveShadow = true;
        this.mesh.add(leftBorder);

        // Right Border
        const rightBorder = new THREE.Mesh(borderGeo, borderMat);
        rightBorder.position.set(this.width / 2 - borderW / 2, borderH / 2, 0);
        rightBorder.castShadow = true;
        rightBorder.receiveShadow = true;
        this.mesh.add(rightBorder);
    }

    drawMotif(ctx, x, y, size) {
        ctx.beginPath();
        // Cross / Flower shape
        ctx.fillRect(x - size, y - size / 2, size * 2, size);
        ctx.fillRect(x - size / 2, y - size, size, size * 2);
        // Diamond Center
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.fill();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export class Chair {
    constructor() {
        this.mesh = new THREE.Group();
        this.interactableMesh = null;
        this.seatHeight = 0.5; // Seat height from floor
        this.sitHeightOffset = 1.2; // Camera height when sitting (Seat + Body)
        this.build();
    }

    build() {
        const darkGrey = 0x222222;
        const chrome = 0xAAAAAA;

        const fabricMat = new THREE.MeshStandardMaterial({ color: darkGrey, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: chrome, metalness: 0.8, roughness: 0.2 });

        // Seat (0.5m x 0.5m)
        const seatW = 0.5;
        const seatD = 0.5;
        const seatThickness = 0.1;
        const seatGeo = new THREE.BoxGeometry(seatW, seatThickness, seatD);
        const seat = new THREE.Mesh(seatGeo, fabricMat);
        seat.position.y = this.seatHeight;
        seat.castShadow = true;
        seat.receiveShadow = true;
        this.mesh.add(seat);

        // Backrest
        const backH = 0.6;
        const backW = 0.5;
        const backD = 0.05;
        const backGeo = new THREE.BoxGeometry(backW, backH, backD);
        const back = new THREE.Mesh(backGeo, fabricMat);
        // Back position: centered X, up half backH plus seat height, back edge of seat
        back.position.set(0, this.seatHeight + backH / 2 + 0.05, seatD / 2 - backD / 2);
        back.castShadow = true;
        back.receiveShadow = true;
        this.mesh.add(back);

        // Legs (Stem)
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, this.seatHeight, 8);
        const stem = new THREE.Mesh(stemGeo, metalMat);
        stem.position.y = this.seatHeight / 2;
        this.mesh.add(stem);

        // Base (Star/Disc)
        const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 8);
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.position.y = 0.025;
        this.mesh.add(base);

        // Hitbox
        const hitboxGeo = new THREE.BoxGeometry(0.7, 1.5, 0.7);
        const hitbox = new THREE.Mesh(hitboxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitbox.position.y = 0.75;
        hitbox.userData = { type: 'chair', parentObj: this };
        this.interactableMesh = hitbox;
        this.mesh.add(hitbox);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}

export class OrchidPot {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // 1. The Pot (White Ceramic) - Elegant flared shape
        const potMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.1 });
        // Cylinder: radiusTop, radiusBottom, height, segments
        const potGeo = new THREE.CylinderGeometry(0.25, 0.15, 0.4, 16);
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 0.2; // Sit on floor
        pot.castShadow = true;
        this.mesh.add(pot);

        // 2. Soil
        const soilGeo = new THREE.CircleGeometry(0.23, 16);
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0 }); // Dark Soil
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.rotation.x = -Math.PI / 2;
        soil.position.y = 0.38; // Just below rim
        this.mesh.add(soil);

        // 3. Leaves (Broad, fleshy green leaves at base)
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.6, side: THREE.DoubleSide });
        for (let i = 0; i < 4; i++) {
            const leafGeo = new THREE.PlaneGeometry(0.15, 0.4);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.y = 0.4;
            // Fan them out
            leaf.rotation.y = (i / 4) * Math.PI * 2;
            leaf.rotation.x = 0.5; // Tilt out
            leaf.position.x = Math.cos(leaf.rotation.y) * 0.1;
            leaf.position.z = Math.sin(leaf.rotation.y) * 0.1;
            this.mesh.add(leaf);
        }

        // 4. Stem (Curved Tube)
        // High quality curve
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.4, 0),
            new THREE.Vector3(0.05, 0.8, 0),
            new THREE.Vector3(-0.05, 1.2, 0.1),
            new THREE.Vector3(0.1, 1.5, 0.2) // Drooping top
        ]);
        const stemGeo = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a6e3a, roughness: 0.7 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        this.mesh.add(stem);

        // 5. Flowers (Orchids) - Add 3 flowers along the stem
        const flowerPositions = [0.6, 0.8, 1.0]; // Along curve path (0-1)
        const flowerColor = 0xDA70D6; // Orchid Purple

        flowerPositions.forEach(t => {
            const point = curve.getPoint(t);
            const flowerGroup = this.createFlower(flowerColor);
            flowerGroup.position.copy(point);
            // Randomize rotation slightly
            flowerGroup.rotation.set(Math.random(), Math.random(), Math.random());
            this.mesh.add(flowerGroup);
        });
    }

    createFlower(color) {
        const group = new THREE.Group();
        const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, side: THREE.DoubleSide });
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 }); // Yellow center

        // 3 Petals
        for (let i = 0; i < 3; i++) {
            const petalGeo = new THREE.CircleGeometry(0.08, 5);
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.rotation.z = (i / 3) * Math.PI * 2;
            group.add(petal);
        }

        // Center
        const centerGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.z = 0.02;
        group.add(center);

        return group;
    }
}

export class WindowFlowerBox {
    constructor(width = 2) {
        this.width = width;
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // 1. Box (Wood)
        // Dimensions: width x 0.3 x 0.3
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
        const boxGeo = new THREE.BoxGeometry(this.width, 0.3, 0.3);
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 0.15; // Half height
        box.castShadow = true;
        this.mesh.add(box);

        // 2. Soil
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e, roughness: 1.0 });
        const soilGeo = new THREE.BoxGeometry(this.width - 0.1, 0.05, 0.25);
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.position.y = 0.28; // Just below top
        this.mesh.add(soil);

        // 3. Flowers & Foliage
        const colors = [0xFF0000, 0xFFA500, 0xFFFF00, 0x4169E1, 0xEE82EE]; // Red, Orange, Yellow, RoyalBlue, Violet

        for (let i = 0; i < 15; i++) {
            // Random Pos relative to center
            const x = (Math.random() - 0.5) * (this.width - 0.2);
            const z = (Math.random() - 0.5) * 0.2;

            const group = new THREE.Group();
            group.position.set(x, 0.3, z);

            // Stem/Leaves
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
            const leafGeo = new THREE.PlaneGeometry(0.1, 0.2);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.y = 0.1;
            leaf.rotation.y = Math.random() * Math.PI;
            group.add(leaf);

            // Flower Head
            const color = colors[Math.floor(Math.random() * colors.length)];
            const flowerMat = new THREE.MeshStandardMaterial({ color: color });
            const flowerGeo = new THREE.DodecahedronGeometry(0.05);
            const flower = new THREE.Mesh(flowerGeo, flowerMat);
            flower.position.y = 0.2;
            flower.rotation.set(Math.random(), Math.random(), Math.random());
            group.add(flower);

            this.mesh.add(group);
        }
    }
}

export class LightSwitch {
    constructor() {
        this.mesh = new THREE.Group();
        this.isOn = true; // Default ON
        this.rocker = null;
        this.interactableMesh = null;
        this.roomName = null; // To know which room to trigger
        this.build();
    }

    build() {
        // Base Plate (White Rectangle)
        const plateGeo = new THREE.BoxGeometry(0.12, 0.16, 0.01);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        this.mesh.add(plate);

        // Rocker (The moving part)
        this.rocker = new THREE.Group();
        this.rocker.position.z = 0.005; // Slightly protruding
        this.mesh.add(this.rocker);

        const switchGeo = new THREE.BoxGeometry(0.04, 0.06, 0.015);
        const switchMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const rockerMesh = new THREE.Mesh(switchGeo, switchMat);
        this.rocker.add(rockerMesh);

        // Hitbox usually larger
        const hitBoxGeo = new THREE.BoxGeometry(0.2, 0.25, 0.05);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.userData = { type: 'light-switch', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
    setRotation(y) { this.mesh.rotation.y = y; }

    // Set Room Name for Logic
    setRoomName(name) { this.roomName = name; }

    toggle() {
        this.isOn = !this.isOn;
        this.updateVisuals();
        return this.isOn;
    }

    setState(isOn) {
        this.isOn = isOn;
        this.updateVisuals();
    }

    updateVisuals() {
        // Simple rotation to indicate state
        const angle = Math.PI / 10;
        if (this.isOn) {
            this.rocker.rotation.x = -angle;
        } else {
            this.rocker.rotation.x = angle;
        }
    }
}
