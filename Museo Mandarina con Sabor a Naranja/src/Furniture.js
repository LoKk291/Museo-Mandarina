import * as THREE from 'three';

export class GoldenKey {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Gold
            metalness: 1.0,
            roughness: 0.2
        });

        // Head (Ring)
        const headGeo = new THREE.TorusGeometry(0.015, 0.005, 8, 16);
        const head = new THREE.Mesh(headGeo, material);
        head.position.z = 0.04;
        this.mesh.add(head);

        // Shaft
        const shaftGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8);
        const shaft = new THREE.Mesh(shaftGeo, material);
        shaft.rotation.x = Math.PI / 2;
        this.mesh.add(shaft);

        // Teeth
        const toothGeo = new THREE.BoxGeometry(0.005, 0.01, 0.01);
        const tooth1 = new THREE.Mesh(toothGeo, material);
        tooth1.position.set(0, -0.005, -0.015);
        this.mesh.add(tooth1);

        const tooth2 = new THREE.Mesh(toothGeo, material);
        tooth2.position.set(0, -0.005, -0.005);
        this.mesh.add(tooth2);

        this.mesh.castShadow = true;
    }
}

export class Drawer {
    constructor(width, height, depth, color) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.color = color;
        this.mesh = new THREE.Group();
        this.isOpen = false;

        // Animation
        this.currentOffset = 0;
        this.targetOffset = 0;
        this.speed = 2.0;

        // Slide Axis and Direction (Local)
        // Default slide: +Z
        this.slideAxis = new THREE.Vector3(0, 0, 1);

        this.items = new THREE.Group();
        this.mesh.add(this.items);

        this.build();
    }

    build() {
        const thickness = 0.02;
        const woodMat = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.5,
            metalness: 0.1
        });

        // 1. Front Face
        const frontGeo = new THREE.BoxGeometry(this.width, this.height, thickness);
        const front = new THREE.Mesh(frontGeo, woodMat);
        front.position.z = this.depth / 2 - thickness / 2;
        front.castShadow = true;
        front.receiveShadow = true;
        this.mesh.add(front);

        // 2. Bottom
        const bottomGeo = new THREE.BoxGeometry(this.width - thickness * 2, thickness, this.depth - thickness);
        const bottom = new THREE.Mesh(bottomGeo, woodMat);
        bottom.position.y = -this.height / 2 + thickness / 2;
        bottom.position.z = -thickness / 2;
        this.mesh.add(bottom);

        // 3. Back
        const backGeo = new THREE.BoxGeometry(this.width - thickness * 2, this.height - thickness, thickness);
        const back = new THREE.Mesh(backGeo, woodMat);
        back.position.y = thickness / 2; // Offset up cause bottom exists
        back.position.z = -this.depth / 2 + thickness / 2;
        this.mesh.add(back);

        // 4. Sides (Left/Right)
        const sideGeo = new THREE.BoxGeometry(thickness, this.height - thickness, this.depth - thickness);

        const left = new THREE.Mesh(sideGeo, woodMat);
        left.position.set(-this.width / 2 + thickness / 2, thickness / 2, -thickness / 2);
        this.mesh.add(left);

        const right = new THREE.Mesh(sideGeo, woodMat);
        right.position.set(this.width / 2 - thickness / 2, thickness / 2, -thickness / 2);
        this.mesh.add(right);

        // 5. Handle
        const handleGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.4,
            metalness: 0.6
        });
        const handle = new THREE.Mesh(handleGeo, metalMat);
        handle.position.set(0, 0, this.depth / 2 + 0.01);
        this.mesh.add(handle);

        // 6. Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(this.width, this.height, 0.1);
        const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.position.z = this.depth / 2 + 0.02;
        hitBox.userData = { type: 'drawer', parentObj: this };
        this.mesh.add(hitBox);
        this.interactableMesh = hitBox;
    }

    addItem(itemMesh) {
        this.items.add(itemMesh);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.targetOffset = this.isOpen ? this.depth * 0.8 : 0;
    }

    // Must be called by parent Desk
    update(delta) {
        if (Math.abs(this.currentOffset - this.targetOffset) > 0.001) {
            const dir = Math.sign(this.targetOffset - this.currentOffset);
            const move = dir * this.speed * delta;

            // Clamp
            if (dir > 0 && this.currentOffset + move > this.targetOffset) {
                this.currentOffset = this.targetOffset;
            } else if (dir < 0 && this.currentOffset + move < this.targetOffset) {
                this.currentOffset = this.targetOffset;
            } else {
                this.currentOffset += move;
            }

            // Apply to position along slideAxis
            // We assume slideAxis is Z for a drawer usually.
            // But if the drawer is rotated in the desk, we just move Z locally?
            // Yes, standard is move along local Z.
            this.mesh.position.z = this.originalZ + this.currentOffset;
        }
    }

    setOriginalZ(z) {
        this.originalZ = z;
        this.mesh.position.z = z;
    }
}




export class SecretNote {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Geometry: Small paper
        const geo = new THREE.PlaneGeometry(0.15, 0.1);

        // Texture with Text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background (Paper color)
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, 256, 128);

        // Text
        ctx.fillStyle = '#cc0000'; // Red ink
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('3754-406297', 128, 64);

        // Border/Dirt
        ctx.strokeStyle = '#d0c0a0';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, 256, 128);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });

        const note = new THREE.Mesh(geo, mat);
        note.rotation.x = -Math.PI / 2; // Flat
        // note.rotation.z = Math.random() * 0.2 - 0.1; // Slight mess
        note.castShadow = true;
        note.receiveShadow = true;

        // Hitbox
        const hitboxGeo = new THREE.BoxGeometry(0.15, 0.02, 0.1);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = {
            type: 'secret-note',
            parentObj: this
        };
        note.add(hitbox);
        this.interactableMesh = hitbox; // Expose HITBOX

        this.mesh.add(note);
    }
}

export class Statue {
    constructor(type = 'generic') {
        this.type = type; // 'aphrodite' or 'athena'
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Marble Material
        const marbleMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, // White marble
            roughness: 0.3, // Polished but old
            metalness: 0.1
        });

        // Base (Pedestal) - Common
        const baseGeo = new THREE.BoxGeometry(0.8, 1.0, 0.8);
        const base = new THREE.Mesh(baseGeo, marbleMat);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.0; // On top of pedestal
        this.mesh.add(bodyGroup);

        if (this.type === 'aphrodite') {
            this.buildAphrodite(bodyGroup, marbleMat);
        } else if (this.type === 'athena') {
            this.buildAthena(bodyGroup, marbleMat);
        } else {
            // Fallback Generic
            const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8), marbleMat);
            torso.position.y = 0.4;
            bodyGroup.add(torso);
        }
    }

    buildAphrodite(group, mat) {
        // "Venus de Milo" Style - Curvy, draped hips, S-curve

        // Hips (Draped)
        const hipsGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.5, 12);
        const hips = new THREE.Mesh(hipsGeo, mat);
        hips.position.y = 0.25;
        group.add(hips);

        // Drapes (Torus loops around hips)
        const drapeGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
        const drape = new THREE.Mesh(drapeGeo, mat);
        drape.rotation.x = Math.PI / 2;
        drape.rotation.y = 0.2; // Tilt
        drape.position.y = 0.15;
        group.add(drape);

        // Torso (Upper body, tilted)
        const torsoGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.5, 12);
        const torso = new THREE.Mesh(torsoGeo, mat);
        torso.position.set(0.02, 0.7, 0);
        torso.rotation.z = -0.1; // Contrapposto tilt
        group.add(torso);

        // Chest
        const chestGeo = new THREE.SphereGeometry(0.23, 12, 12);
        const chest = new THREE.Mesh(chestGeo, mat);
        chest.position.set(0.03, 0.95, 0);
        group.add(chest);

        // Head
        const headGeo = new THREE.SphereGeometry(0.14, 12, 12);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(0, 1.25, 0.05);
        head.rotation.y = 0.5; // Looking side
        group.add(head);

        // Hair (Bun)
        const bunGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const bun = new THREE.Mesh(bunGeo, mat);
        bun.position.set(0, 1.3, -0.08);
        group.add(bun);

        // Arms (Venus Pudica - One across, one holding cloth? Or Milo - broken?)
        // Let's do Milo (No arms) or just stubs? User asked for Aphrodite.
        // Let's add partial arms.

        // R Arm (Upper)
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), mat);
        armR.position.set(0.28, 0.9, 0);
        armR.rotation.z = -0.5;
        group.add(armR);

        // L Arm (Upper)
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), mat);
        armL.position.set(-0.28, 0.9, 0);
        armL.rotation.z = 0.5;
        group.add(armL);
    }

    buildAthena(group, mat) {
        // "Athena Parthenos" Style - Standing straight, Robes, Helmet, Shield, Spear

        // Robes (Columnar)
        const robeGeo = new THREE.CylinderGeometry(0.25, 0.4, 1.2, 16);
        const robe = new THREE.Mesh(robeGeo, mat);
        robe.position.y = 0.6;
        group.add(robe);

        // Chest/Armor (Aegis)
        const chestGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.5, 12);
        const chest = new THREE.Mesh(chestGeo, mat);
        chest.position.y = 1.3;
        group.add(chest);

        // Head
        const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 1.65;
        group.add(head);

        // Helmet (Corinthian)
        const helmGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12); // Cap
        const helm = new THREE.Mesh(helmGeo, mat);
        helm.position.y = 1.75;
        group.add(helm);

        // Crest via Box
        const crestGeo = new THREE.BoxGeometry(0.05, 0.2, 0.4);
        const crest = new THREE.Mesh(crestGeo, mat);
        crest.position.y = 1.9;
        group.add(crest);

        // Shield (Left Side)
        const shieldGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16); // Disk
        const shield = new THREE.Mesh(shieldGeo, mat);
        shield.rotation.z = Math.PI / 2;
        shield.rotation.y = -0.4;
        shield.position.set(-0.5, 0.6, 0.3); // Leaning against leg
        group.add(shield);

        // Spear (Right Hand)
        // Arm R
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.6), mat);
        armR.position.set(0.35, 1.4, 0.2);
        armR.rotation.x = -1.0; // Reaching forward/up
        group.add(armR);

        // Spear Shaft
        const spearGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.8);
        const spear = new THREE.Mesh(spearGeo, mat);
        spear.position.set(0.35, 1.4, 0.2);
        group.add(spear);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}

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

        // Detalles: Tiradores de cajones MOVIDOS a las extensiones (Wings)
        // Se eliminan de aquÃ­ para no quedar tapados.
        const handleGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);

        this.drawers = []; // Store drawer references

        // --- 3. U-Shape Wings (Extensiones Laterales) ---
        // Extend backwards (Local +Z)
        const wingWidth = 0.8;
        const wingDepth = 1.5;
        const wingGeo = new THREE.BoxGeometry(wingWidth, topThickness, wingDepth);
        // Removed solid cabinet geo, will use Drawers instad.
        // const wingCabinetGeo = new THREE.BoxGeometry(wingWidth, cabinetHeight, wingDepth - 0.2);

        // Common Z position: Starts at half depth of main desk + half depth of wing
        const wingZ = this.depth / 2 + wingDepth / 2 - 0.01; // -0.01 overlap

        // Left Wing (at -X edge)
        const wingX_Left = -this.width / 2 + wingWidth / 2;

        const leftWingTop = new THREE.Mesh(wingGeo, woodMat);
        leftWingTop.position.set(wingX_Left, this.height - topThickness / 2, wingZ);
        leftWingTop.castShadow = true;
        leftWingTop.receiveShadow = true;
        this.mesh.add(leftWingTop);

        // Frame for Left Wing (Since we removed the solid block, we need a frame or just the drawers)
        // Let's create a back panel and side panel to hold drawers visually?
        // Or simplified: Just the drawers stacked.
        // To avoid "floating" look, let's add a thin frame.
        // Re-using cabinetGeo but transparent? No.
        // Let's just place Drawers. The Drawer class has sides/back.

        // Right Wing (at +X edge)
        const wingX_Right = this.width / 2 - wingWidth / 2;

        const rightWingTop = new THREE.Mesh(wingGeo, woodMat);
        rightWingTop.position.set(wingX_Right, this.height - topThickness / 2, wingZ);
        rightWingTop.castShadow = true;
        rightWingTop.receiveShadow = true;
        this.mesh.add(rightWingTop);

        // --- Wing Enclosures (Hollow Cabinets) ---
        // To hide drawer contents, we need panels: Back, Bottom, Outer Side, Inner Side.
        const wCabH = cabinetHeight;
        const wCabD = wingDepth - 0.2; // Same as old solid block
        const wCabW = wingWidth;
        const panelThick = 0.02;

        // Shared Geometries
        // Back Panel (Vertical plane at -Z local relative to wing center)
        const backPanelGeo = new THREE.BoxGeometry(wCabW, wCabH, panelThick);
        // Bottom Panel
        const botPanelGeo = new THREE.BoxGeometry(wCabW, panelThick, wCabD);
        // Side Panels
        const sidePanelGeo = new THREE.BoxGeometry(panelThick, wCabH, wCabD);

        // Helper to build enclosure
        const buildEnclosure = (x, z) => {
            const group = new THREE.Group();
            group.position.set(x, wCabH / 2, z); // Center of cabinet volume

            // Back Panel (At rear) -> Local +Z is "back" of the desk extension? 
            // Desk Extension extends +Z relative to desk.
            // "Back" of the extension is at +Z limit.
            // Drawer slides from Front (near desk) to Back? No, slides out to Side.
            // Wait.
            // Left Wing Drawers: Face Inner (+X). Slide towards center.
            // Right Wing Drawers: Face Inner (-X). Slide towards center.
            // So "Back" of the drawer is at Outer Side.
            // "Front" of the drawer is at Inner Side.

            // So the Enclosure needs:
            // 1. Top (Provided by desk Top)
            // 2. Bottom
            // 3. Back (Away from user, +Z?) No.
            // The "Cabinet" is the volume under the wing.
            // Drawers slide sideways.

            // So the "Back" of the cabinet is the side furthest from center? (Outer Side)
            // Yes.
            // Left Wing Outer Side: -X side of the wing.
            // Left Wing Inner Side: +X side (Where drawers open).

            // Panels needed for Left Wing:
            // 1. Outer Side (Leftmost).
            // 2. Rear Side (Towards Visitor, -Z local? Or +Z?).
            // 3. Front Side (Towards Desk, -Z local?).
            // 4. Bottom.

            // Wing extends from Desk (Z=0 approx) to Z=1.5 approx.
            // Let's cover all except the "Face" where drawers are.

            // Bottom
            const bot = new THREE.Mesh(botPanelGeo, woodMat);
            bot.position.y = -wCabH / 2 + panelThick / 2;
            group.add(bot);

            // Rear (Far Z)
            const rear = new THREE.Mesh(backPanelGeo, woodMat);
            rear.position.z = wCabD / 2 - panelThick / 2;
            group.add(rear);

            // Front (Near Z)
            const front = new THREE.Mesh(backPanelGeo, woodMat);
            front.position.z = -wCabD / 2 + panelThick / 2;
            group.add(front);

            return group;
        };

        // Left Wing Enclosure (REMOVED DRAWERS - SOLID BLOCK)
        const solidCabMat = woodMat;
        const solidWingGeo = new THREE.BoxGeometry(wingWidth, cabinetHeight, wingDepth);
        const leftSolidCabinet = new THREE.Mesh(solidWingGeo, solidCabMat);
        leftSolidCabinet.position.set(wingX_Left, cabinetHeight / 2, wingZ);
        leftSolidCabinet.castShadow = true;
        leftSolidCabinet.receiveShadow = true;
        this.mesh.add(leftSolidCabinet);

        // Right Wing Enclosure
        // Needs Outer Side (Right) closed. Inner (Left) open.
        const rightEnc = buildEnclosure(wingX_Right, wingZ);
        const rightOuter = new THREE.Mesh(sidePanelGeo, woodMat);
        rightOuter.position.x = wCabW / 2 - panelThick / 2; // Right side
        rightEnc.add(rightOuter);
        this.mesh.add(rightEnc);


        // --- Cajones en Wings (Interactive) ---
        // Dimensions Logic:
        // Drawer is rotated 90deg. 
        // Drawer.width (local X) -> Aligns with Global Z (Wing Length).
        // Drawer.depth (local Z) -> Aligns with Global X (Wing Width/Depth).
        // User wants "fill toda la longitud" -> Fill Global Z.

        // Cabinet Enclosure Z-Length = wCabD = 1.3.
        // We want Drawer Width to fill this minus small margin.
        const dW = wCabD - 0.04; // 1.26

        // Height: 3 Drawers to fill cabinetHeight.
        const dH = cabinetHeight / 3; // No gap calculation effectively
        // To visualize separation, we rely on the drawer bezel/thickness or add tiny gap.
        // Let's use exact division but render slightly smaller box? 
        // Or just subtrace 0.005.
        const dH_Real = dH - 0.005;

        // Depth (Global X): User wanted "menos largo", but "no espacios".
        // The "espacios" were likely Z-gaps.
        // Drawer Depth 0.6 is fine for containment.
        // But we must POSITION it flush with the face.
        const dD = 0.6;

        // Colors
        const drawerColor = 0x4a1810;

        for (let i = 0; i < 3; i++) {
            // Y Position:
            // Top of cabinet space = cabinetHeight.
            // i=0 (Top) -> Center at cabinetHeight - dH/2.
            const y = cabinetHeight - (i * dH) - dH / 2;

            // --- Right Wing Drawers (Left removed) ---
            // Face -X.
            // Flush with Inner Face (X = wingX_Right - wingWidth/2).
            // Drawer Local Front at +dD/2.
            // Rotated -90 (Y), Local Front points -X.
            // Global X of Front = CenterX - dD/2.
            // Eq: CenterX - dD/2 = wingX_Right - wingWidth/2.
            // CenterX = wingX_Right - wingWidth/2 + dD/2.

            const xPos_R = wingX_Right - wingWidth / 2 + dD / 2;

            const drawerR = new Drawer(dW, dH_Real, dD, drawerColor);
            const wrapperR = new THREE.Group();
            wrapperR.position.set(xPos_R, y, wingZ);
            wrapperR.rotation.y = -Math.PI / 2;
            this.mesh.add(wrapperR);

            drawerR.mesh.position.set(0, 0, 0);
            wrapperR.add(drawerR.mesh);
            drawerR.setOriginalZ(0);
            this.drawers.push(drawerR);

            // Add Items (Key) - Moved to Right
            if (i === 1) { // Middle
                const key = new GoldenKey();
                key.mesh.position.set(0, -dH_Real / 2 + 0.05, 0);
                key.mesh.rotation.y = Math.PI / 4;
                drawerR.addItem(key.mesh);
            }

            // Secret Note (Top)
            if (i === 0) {
                const note = new SecretNote();
                note.mesh.position.set(0, -dH_Real / 2 + 0.03, 0); // Bottom of drawer
                note.mesh.rotation.y = Math.PI / 2; // Align
                drawerR.addItem(note.mesh);
                this.secretNote = note; // Store ref
            }
        }
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    update(delta) {
        this.drawers.forEach(d => d.update(delta));
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

        // VentilaciÃ³n (Izquierda)
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

        // PosiciÃ³n: Delante del case. 
        // Case llega a Z=0.25. Teclado empieza en Z=0.3
        keyboard.position.set(0, 0.03, 0.45);
        keyboard.rotation.x = 0.1; // InclinaciÃ³n ergonÃ³mica
        keyboard.castShadow = true;
        keyboard.receiveShadow = true;
        this.mesh.add(keyboard);

        // Teclas (Bloques simulados)
        const keysGeo = new THREE.BoxGeometry(kbW - 0.05, 0.01, kbD - 0.05);
        const keys = new THREE.Mesh(keysGeo, darkBeigeMat); // darkBeigeMat is in scope
        keys.position.set(0, 0.03, 0); // Relativo al teclado
        keyboard.add(keys);

        // --- HITBOX DE INTERACCIÃ“N ---
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

// End of FloorLamp class

export class Phone {
    constructor(soundManager) {
        this.soundManager = soundManager;
        this.mesh = new THREE.Group();
        this.interactableMesh = null;

        // State
        this.state = 'IDLE'; // IDLE, RINGING, ACTIVE, COOLDOWN
        this.ringCount = 0;
        this.ringTimer = 0;
        this.dailyRingDone = false; // To prevent multiple rings per day
        this.lastDay = -1;

        this.build();
    }

    build() {
        // Materials
        // User requested: "Cream Light" (Claro).
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xF5E6D3, // Cream/Beige
            roughness: 0.6,
            metalness: 0.1
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x222222, // Dark Grey/Black for handset cord/details
            roughness: 0.8
        });

        const buttonMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5
        });

        // 1. Base Unit (Sloped Trapezoid-ish)
        const baseWidth = 0.25;
        const baseDepth = 0.3;
        const baseHeight = 0.08;

        // Use a group to rotate the shape easily
        const baseGeo = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        // We want a slope. Let's just rotate a box slightly or use custom geometry.
        // Simple way: Rotate box X slightly.
        const base = new THREE.Mesh(baseGeo, bodyMat);
        base.rotation.x = 0.2; // Slope up towards back
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);

        // 2. Handset Area (Left side depression?)
        // Just add the handset on top left.

        // Handset
        const handleGroup = new THREE.Group();
        // Position it on the left side, slightly raised
        handleGroup.position.set(-0.08, baseHeight + 0.05, 0);
        handleGroup.rotation.x = 0.2; // Match slope
        this.mesh.add(handleGroup);

        const handleGeo = new THREE.BoxGeometry(0.08, 0.04, 0.35); // Long rect
        const handle = new THREE.Mesh(handleGeo, bodyMat);
        handle.castShadow = true;
        handleGroup.add(handle);

        // Cord (Spiral? Simple curved tube for now)
        // Curve from Handle to Base
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.08, baseHeight + 0.05, 0.1), // Handle End
            new THREE.Vector3(-0.15, baseHeight, 0.15), // Loop out
            new THREE.Vector3(-0.12, 0.02, -0.1) // Base connection
        ]);
        const cordGeo = new THREE.TubeGeometry(curve, 20, 0.005, 8, false);
        const cord = new THREE.Mesh(cordGeo, darkMat);
        this.mesh.add(cord);


        // 3. Dial Pad (Right Side)
        // 3x4 Grid of buttons
        const btnSize = 0.03;
        const btnGap = 0.01;
        const startX = 0.02; // Right side
        const startZ = 0.05; // Top part

        const keyGroup = new THREE.Group();
        keyGroup.rotation.x = 0.2; // Match slope
        keyGroup.position.y = baseHeight / 2 + 0.045; // On surface
        this.mesh.add(keyGroup);

        const keyGeo = new THREE.BoxGeometry(btnSize, 0.01, btnSize);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const btn = new THREE.Mesh(keyGeo, buttonMat);
                btn.position.set(
                    startX + col * (btnSize + btnGap),
                    0,
                    startZ - row * (btnSize + btnGap)
                );
                keyGroup.add(btn);
            }
        }

        // 4. Lights (Red/Green Bar at bottom)
        const lightGeo = new THREE.BoxGeometry(0.04, 0.01, 0.015);

        // Green Light
        const greenMat = new THREE.MeshStandardMaterial({
            color: 0x00FF00,
            emissive: 0x00FF00,
            emissiveIntensity: 2.0
        });
        const greenLight = new THREE.Mesh(lightGeo, greenMat);
        greenLight.position.set(0.02, 0, 0.12); // Bottom area
        keyGroup.add(greenLight);

        // Orange/Red Light
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xFF4400,
            emissive: 0xFF4400,
            emissiveIntensity: 2.0
        });
        const redLight = new THREE.Mesh(lightGeo, redMat);
        redLight.position.set(0.08, 0, 0.12); // Next to green
        keyGroup.add(redLight);

        // 5. Speaker Slots (Top)
        const slotGeo = new THREE.BoxGeometry(0.1, 0.005, 0.005);
        for (let i = 0; i < 3; i++) {
            const slot = new THREE.Mesh(slotGeo, darkMat);
            slot.position.set(0.05, 0, -0.1 - (i * 0.01));
            keyGroup.add(slot);
        }

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.3, 0.2, 0.35);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.1;
        hitBox.userData = { type: 'phone', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    interact() {
        if (this.state === 'RINGING') {
            console.log("Phone Answered!");
            this.state = 'ACTIVE';
            this.soundManager.stop('phone_ring');
            this.soundManager.play('phone_takeoff');
            setTimeout(() => {
                if (this.state === 'ACTIVE') {
                    this.soundManager.play('phone_guy');
                }
            }, 1000);
        } else if (this.state === 'ACTIVE') {
            this.state = 'IDLE';
            this.soundManager.stop('phone_guy');
        }
    }

    update(delta, gameTime) {
        const cycleDuration = 900;
        const currentCycleTime = gameTime % cycleDuration;

        // Reset Logic: Allow re-test if time is before 3 AM trigger (e.g. < 805)
        // Original was < 600 (Day). This was annoying for testing 3AM.
        if (currentCycleTime < 805) {
            this.dailyRingDone = false;
        }

        if (!this.dailyRingDone && this.state === 'IDLE') {
            // Widen window to cover 3:00 to 4:00 (approx 810 to 840)
            if (currentCycleTime >= 810 && currentCycleTime < 840) {
                this.startRinging();
            }
        }

        if (this.state === 'RINGING') {
            this.ringTimer += delta;

            // Show "RING!" Message
            const msgEl = document.getElementById('interaction-message');
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.innerText = "RING! RING! RING!";
                msgEl.style.color = 'red';
                msgEl.style.fontSize = '2em';

                // Blink effect
                if (Math.floor(Date.now() / 200) % 2 === 0) {
                    msgEl.style.opacity = '1';
                } else {
                    msgEl.style.opacity = '0.5';
                }
            }

            if (this.ringTimer > 3.0) {
                this.ringTimer = 0;
                this.ringCount++;
                if (this.ringCount < 4) {
                    console.log("PLAYING RING SOUND");
                    this.soundManager.play('phone_ring');
                } else {
                    this.stopRinging();
                    this.dailyRingDone = true;
                }
            }
        }
    }

    startRinging() {
        this.state = 'RINGING';
        this.ringCount = 0;
        this.ringTimer = 0;
        this.soundManager.play('phone_ring');
        this.dailyRingDone = true;
    }

    stopRinging() {
        this.state = 'IDLE';
        this.ringCount = 0;
        this.soundManager.stop('phone_ring');

        // Hide/Reset Message
        const msgEl = document.getElementById('interaction-message');
        if (msgEl) {
            msgEl.style.display = 'none';
            msgEl.innerText = "Click para ver"; // Reset default
            msgEl.style.color = '';
            msgEl.style.fontSize = '';
            msgEl.style.opacity = '1';
        }
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

        // Materials
        const petalColor = 0xC71585;

        // Front Face Material
        const petalMatFront = new THREE.MeshStandardMaterial({
            color: petalColor,
            roughness: 0.5,
            side: THREE.FrontSide
        });

        // Back Face Material
        const petalMatBack = new THREE.MeshStandardMaterial({
            color: petalColor,
            roughness: 0.5,
            side: THREE.BackSide
        });

        // White Rim (Middle Layer)
        const rimMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });

        const lipMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.4, side: THREE.DoubleSide });
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 });

        // HELPER: Create Petal Geo (Sandwich Method)
        const createPetal = (w, h, rotZ, posZ, isSepal = false) => {
            const geo = new THREE.CircleGeometry(0.05, 8);
            geo.scale(w, h, 1);

            const wrapper = new THREE.Group();
            wrapper.rotation.z = rotZ;
            wrapper.position.z = posZ;

            // 1. Front Magenta Layer
            const frontMesh = new THREE.Mesh(geo, petalMatFront);
            frontMesh.position.z = 0.002;
            wrapper.add(frontMesh);

            // 2. Middle White Rim Layer
            const rimMesh = new THREE.Mesh(geo, rimMat);
            rimMesh.scale.set(1.1, 1.1, 1);
            rimMesh.position.z = 0;
            wrapper.add(rimMesh);

            // 3. Back Magenta Layer
            const backMesh = new THREE.Mesh(geo, petalMatBack);
            backMesh.position.z = -0.002;
            wrapper.add(backMesh);

            return wrapper;
        };

        // --- 1. Sepals (3 back petals) ---
        // Top Sepal
        const sepalTop = createPetal(1.0, 1.5, 0, 0, true);
        sepalTop.position.y = 0.03;
        group.add(sepalTop);

        // Bottom Left/Right Sepals
        const sepalL = createPetal(1.1, 1.5, 2 * Math.PI / 3, -0.01, true);
        sepalL.position.set(-0.04, -0.04, 0);
        group.add(sepalL);

        const sepalR = createPetal(1.1, 1.5, -2 * Math.PI / 3, -0.01, true);
        sepalR.position.set(0.04, -0.04, 0);
        group.add(sepalR);

        // --- 2. Petals (2 broad side petals) ---
        const petalL = createPetal(1.4, 1.4, 0, 0.01);
        petalL.position.set(-0.06, 0.01, 0.01);
        group.add(petalL);

        const petalR = createPetal(1.4, 1.4, 0, 0.01);
        petalR.position.set(0.06, 0.01, 0.01);
        group.add(petalR);

        // --- 3. Labellum (Lip) ---
        // Distinct shape at bottom
        const lipGeo = new THREE.CircleGeometry(0.04, 8);
        lipGeo.scale(1, 0.8, 1);
        const lip = new THREE.Mesh(lipGeo, lipMat);
        lip.position.set(0, -0.03, 0.02);
        lip.rotation.x = 0.5; // Curled out
        group.add(lip);

        // --- 4. Column (Center) ---
        const centerGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.set(0, 0, 0.03);
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


export class PaperStack {
    constructor(count = 120) {
        this.count = count;
        this.mesh = null;
        this.build();
    }

    build() {
        // A4 Paper Size: 0.21 x 0.297 (meters)
        // Visually thicker for stack effect
        const geo = new THREE.BoxGeometry(0.21, 0.0015, 0.297);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xfdfbf7, // Off-white / Cream paper
            roughness: 0.9,
            metalness: 0.05
        });

        this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Static is fine mostly but good practice

        const dummy = new THREE.Object3D();
        const rand = () => (Math.random() - 0.5); // -0.5 to 0.5

        // Simulating the messy stack
        for (let i = 0; i < this.count; i++) {
            // Position
            // Y: Stack up (offset by half thickness to start at 0 if origin is center, but geometry is centered)
            // If box height is 0.002, center is at 0.001. Stack starts at y=0.
            // i=0 -> y=0.
            const y = i * 0.0015;

            // Jitter increases slightly as we go up? Or just random.
            // Let's make it more messy near the top or just random throughout.
            // Random throughout matches the image.
            const x = rand() * 0.05; // +/- 2.5cm
            const z = rand() * 0.05;

            dummy.position.set(x, y, z);

            // Rotation
            // Y: Random messy rotation
            dummy.rotation.y = rand() * 0.5; // +/- 0.25 rads (~14 deg)

            // X, Z: Very slight tilt for realism (paper isn't perfectly flat)
            dummy.rotation.x = rand() * 0.02;
            dummy.rotation.z = rand() * 0.02;

            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }

        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        // Hitbox for interaction
        const hitBoxGeo = new THREE.BoxGeometry(0.3, 0.2, 0.4); // Slightly larger than stack
        const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.position.y = 0.1; // Center of stack approx
        hitBox.userData = { type: 'paper-stack', parentObj: this };
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


export class WasteBasket {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Simple Wire Mesh Basket or Solid
        // Let's do a solid dark metal bin
        const binGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.6, 16, 1, true); // Open top? Side double?
        // To make it double sided or give thickness, we can use side: DoubleSide
        const binMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        const bin = new THREE.Mesh(binGeo, binMat);
        bin.position.y = 0.3;
        bin.castShadow = true;
        this.mesh.add(bin);

        // Bottom
        const bottomGeo = new THREE.CircleGeometry(0.2, 16);
        const bottom = new THREE.Mesh(bottomGeo, binMat);
        bottom.rotation.x = -Math.PI / 2;
        bottom.position.y = 0; // Base
        this.mesh.add(bottom);

        // Trash (Paper Balls)
        const trashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        for (let i = 0; i < 5; i++) {
            const ballGeo = new THREE.DodecahedronGeometry(0.06); // Low poly ball
            const ball = new THREE.Mesh(ballGeo, trashMat);
            ball.position.set(
                (Math.random() - 0.5) * 0.2,
                0.1 + Math.random() * 0.3,
                (Math.random() - 0.5) * 0.2
            );
            ball.rotation.set(Math.random(), Math.random(), Math.random());
            this.mesh.add(ball);
        }

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 0.3;
        hitBox.userData = { type: 'waste-basket', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export class Globe {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // 1. Legs (Tripod)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 }); // Dark Wood

        for (let i = 0; i < 3; i++) {
            const legGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.2);
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i / 3) * Math.PI * 2;
            const radius = 0.4;

            // Initial pos
            const legGroup = new THREE.Group();
            legGroup.rotation.y = angle;

            leg.position.set(0.3, 0.6, 0); // Out from center
            leg.rotation.z = 0.2; // Tilt outward

            legGroup.add(leg);
            this.mesh.add(legGroup);
        }

        // 2. Central Pillar / Connection (Triangle base)
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 3); // Shape triangle? simpler cylinder disk
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), legMat);
        base.position.y = 0.2;
        this.mesh.add(base);

        // Center Rod
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), legMat);
        rod.position.y = 0.7;
        this.mesh.add(rod);

        // 3. Meridian Ring (Brass)
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.4, metalness: 0.8 });
        const ringGeo = new THREE.TorusGeometry(0.52, 0.03, 8, 32);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 1.2;
        ring.rotation.z = 0.4; // Tilt axis
        this.mesh.add(ring);

        // 4. The Globe (Sphere)
        const globeGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const globeMat = new THREE.MeshStandardMaterial({
            color: 0x2244aa, // Blue Ocean 
            roughness: 0.5
        });
        const globe = new THREE.Mesh(globeGeo, globeMat);
        globe.position.y = 1.2;
        globe.rotation.z = 0.4; // Match ring tilt
        globe.rotation.y = 1.0; // Random spin
        globe.castShadow = true;
        this.mesh.add(globe);

        // Hitbox
        const hitBoxGeo = new THREE.SphereGeometry(0.55);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.y = 1.2;
        hitBox.userData = { type: 'globe', parentObj: this };
        this.interactableMesh = hitBox;
        this.mesh.add(hitBox);

        // Add some GREEN continents (Low poly style)
        const landMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        for (let j = 0; j < 12; j++) {
            const size = 0.1 + Math.random() * 0.25;
            const land = new THREE.Mesh(new THREE.DodecahedronGeometry(size), landMat);
            // Random point on sphere
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            const r = 0.48; // Slightly inside/intersecting
            land.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) + 1.2, // Y offset
                r * Math.cos(phi)
            );
            // Align rotation?
            land.lookAt(0, 1.2, 0);
            this.mesh.add(land);
        }
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export class CornerTable {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        const height = 0.7;
        const radius = 0.6;

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x4a1810,
            roughness: 0.5,
            metalness: 0.1
        });

        // Top
        const topGeo = new THREE.CylinderGeometry(radius, radius, 0.05, 32);
        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.y = height;
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);

        // Pillar
        const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, height, 16);
        const pillar = new THREE.Mesh(pillarGeo, woodMat);
        pillar.position.y = height / 2;
        pillar.castShadow = true;
        this.mesh.add(pillar);

        // Cross Base
        const footW = 1.0;
        const footH = 0.05;
        const footD = 0.1;

        const foot1 = new THREE.Mesh(new THREE.BoxGeometry(footW, footH, footD), woodMat);
        foot1.position.y = footH / 2;
        this.mesh.add(foot1);

        const foot2 = new THREE.Mesh(new THREE.BoxGeometry(footW, footH, footD), woodMat);
        foot2.position.y = footH / 2;
        foot2.rotation.y = Math.PI / 2;
        this.mesh.add(foot2);

        // Ring Detail
        const ringGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
        const ring = new THREE.Mesh(ringGeo, woodMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = height - 0.1;
        this.mesh.add(ring);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export class MuseumBarrier {
    constructor(width = 2) {
        this.width = width;
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        const height = 0.9;
        const postRadius = 0.04;
        const baseRadius = 0.15;

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.2
        });

        const ropeMat = new THREE.MeshStandardMaterial({
            color: 0xCC0000,
            roughness: 0.9,
            metalness: 0.1
        });

        const createPost = (x) => {
            const group = new THREE.Group();
            group.position.set(x, 0, 0);

            // Base
            const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.05, 16);
            const base = new THREE.Mesh(baseGeo, goldMat);
            base.position.y = 0.025;
            base.castShadow = true;
            group.add(base);

            // Pole
            const poleGeo = new THREE.CylinderGeometry(postRadius, postRadius, height, 16);
            const pole = new THREE.Mesh(poleGeo, goldMat);
            pole.position.y = height / 2;
            pole.castShadow = true;
            group.add(pole);

            // Top Sphere
            const topGeo = new THREE.SphereGeometry(postRadius * 1.5, 16, 16);
            const top = new THREE.Mesh(topGeo, goldMat);
            top.position.y = height;
            top.castShadow = true;
            group.add(top);

            return group;
        };

        const leftPost = createPost(-this.width / 2);
        this.mesh.add(leftPost);

        const rightPost = createPost(this.width / 2);
        this.mesh.add(rightPost);

        // Rope (Catenary)
        // Start and end points (attach to rings usually below top)
        const ropeH = height - 0.1;
        const start = new THREE.Vector3(-this.width / 2, ropeH, 0);
        const end = new THREE.Vector3(this.width / 2, ropeH, 0);
        // Midpoint sag
        const mid = new THREE.Vector3(0, ropeH - 0.3, 0);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const ropeGeo = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
        const rope = new THREE.Mesh(ropeGeo, ropeMat);
        rope.castShadow = true;
        this.mesh.add(rope);

        // Hitbox for collision
        const hitGeo = new THREE.BoxGeometry(this.width, height, 0.2);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        this.collidableMesh = new THREE.Mesh(hitGeo, hitMat);
        this.collidableMesh.position.y = height / 2;
        this.mesh.add(this.collidableMesh);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}

export class VinylFrame {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Frame Size 1x1m
        const w = 1.0;
        const h = 1.0;
        const thickness = 0.1; // Border thickness
        const depth = 0.05;

        // Uses 4 bars to make a frame (Empty center)
        const mat = new THREE.MeshStandardMaterial({
            color: 0x5C3317, // Chocolate/Baker's Chocolate (Dark Brown)
            roughness: 0.6
        });

        // Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(w, thickness, depth), mat);
        top.position.y = h / 2 - thickness / 2;
        this.mesh.add(top);

        // Bottom
        const bot = new THREE.Mesh(new THREE.BoxGeometry(w, thickness, depth), mat);
        bot.position.y = -h / 2 + thickness / 2;
        this.mesh.add(bot);

        // Left
        const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, h - 2 * thickness, depth), mat);
        left.position.x = -w / 2 + thickness / 2;
        this.mesh.add(left);

        // Right
        const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, h - 2 * thickness, depth), mat);
        right.position.x = w / 2 - thickness / 2;
        this.mesh.add(right);

        // Backing (Grey matte)
        const backCheck = new THREE.Mesh(new THREE.PlaneGeometry(w - thickness * 2, h - thickness * 2), new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1.0 }));
        backCheck.position.z = 0; // Center plane
        this.mesh.add(backCheck);

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    setVinyl(id, colorHex, title) {
        // Create Vinyl geometry
        const vinylGroup = new THREE.Group();
        // Position slightly in front of backing (z=0) -> z=0.02
        vinylGroup.position.set(0, 0, 0.02);

        // Disc (Black)
        // Frame inner width ~ 0.8. Disc Radius max 0.35.

        const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 32);
        // Change to Standard Material for light reaction
        const discMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.5
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        // Cylinder is vertical (along Y). Rotate to match plane (Z forward).
        disc.rotation.x = Math.PI / 2;
        vinylGroup.add(disc);

        // Label (Center Color)
        const labelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.015, 32);
        const labelMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.1
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.rotation.x = Math.PI / 2;
        label.position.z = 0.005; // Slightly protruding
        vinylGroup.add(label);

        // Store ID for interaction
        // Attach userdata to mesh to ensure raycaster picks it up up the chain
        this.mesh.userData = { vinyl: true, id: id, instance: this, color: colorHex };

        this.mesh.add(vinylGroup);
        this.vinylMesh = vinylGroup;

        // Add Text Label (Plaque) below frame
        if (title) {
            this.addLabel(title);
        }
    }

    addLabel(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128; // Wide rectangle
        const ctx = canvas.getContext('2d');

        // Background (Gold/Brass plaque look or simple white)
        ctx.fillStyle = '#1a1a1a'; // Dark background
        ctx.fillRect(0, 0, 512, 128);

        // Border
        ctx.strokeStyle = '#D4AF37'; // Gold
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 502, 118);

        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial'; // Larger font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const plaqueGeo = new THREE.PlaneGeometry(0.8, 0.2); // Width 0.8 (matches inner frame), Height 0.2
        const plaqueMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });
        const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);

        // Position below frame (Frame height 1.0, y range -0.5 to 0.5)
        // Place at y = -0.65
        plaque.position.set(0, -0.65, 0.05); // Slightly forward
        this.mesh.add(plaque);
    }

    hideVinyl() {
        if (this.vinylMesh) this.vinylMesh.visible = false;
    }

    showVinyl() {
        if (this.vinylMesh) this.vinylMesh.visible = true;
    }
}

export class RecordPlayerTable {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // --- 1. Cabinet (Solid Furniture) ---
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.6 }); // Dark Wood

        // Solid Cabinet Body (Larger)
        // Previous: 0.8 x 0.8 top. New: 1.2 width x 0.6 depth. Height 0.85.
        const cabinetGeo = new THREE.BoxGeometry(1.2, 0.85, 0.6);
        const cabinet = new THREE.Mesh(cabinetGeo, tableMat);
        cabinet.position.y = 0.85 / 2; // Center on Y relative to floor (0) -> Position 0.425
        // Wait, standard height is often bottom-aligned in my code or centered?
        // BoxGeometry is centered. If I want it on floor, pos.y = height/2.
        this.mesh.add(cabinet);

        // --- 2. Record Player ---
        const playerGroup = new THREE.Group();
        playerGroup.position.set(0, 0.85, 0); // Sit on top of cabinet (height 0.85)

        // Base
        const baseGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.2 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        playerGroup.add(base);

        // Platter (Disc Holder)
        const platterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 32);
        const platterMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const platter = new THREE.Mesh(platterGeo, platterMat);
        platter.position.set(-0.1, 0.11, 0);
        playerGroup.add(platter);

        // Vinyl Disc (Black default)
        const vinylGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.01, 32);
        const vinylMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.5 });
        const vinyl = new THREE.Mesh(vinylGeo, vinylMat);
        vinyl.position.set(-0.1, 0.12, 0);
        playerGroup.add(vinyl);

        // Label (Red Center default)
        const labelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 32);
        const labelMat = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            roughness: 0.3,
            metalness: 0.1
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(-0.1, 0.122, 0);
        playerGroup.add(label);

        // Save references
        this.baseVinylMesh = vinyl;
        this.baseLabelMesh = label;
        // Initially hide until selected? Or show generic?
        // User implied "the selected disc is placed". So maybe empty initially?
        // Or default black.
        // Let's keep it visible but changeable.

        // Tonearm Base
        const armBaseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8, roughness: 0.2 });
        const armBase = new THREE.Mesh(armBaseGeo, silverMat);
        armBase.position.set(0.2, 0.12, 0.1);
        playerGroup.add(armBase);

        // Tonearm
        const armGeo = new THREE.BoxGeometry(0.3, 0.01, 0.01);
        const arm = new THREE.Mesh(armGeo, silverMat);
        arm.position.set(0.05, 0.15, 0.1);
        arm.rotation.z = 0.1;
        arm.rotation.y = 0.5; // Angled towards record
        playerGroup.add(arm);

        this.mesh.add(playerGroup);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    setVinyl(colorHex) {
        if (this.baseLabelMesh) {
            this.baseLabelMesh.material.color.setHex(colorHex);
            this.baseLabelMesh.visible = true;
            this.baseVinylMesh.visible = true;
        }
    }

    // --- Particle System ---

    createNoteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent background
        ctx.fillRect(0, 0, 64, 64);

        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Randomize color in spawn? Or just make white and tint sprite?
        // Let's make white note on canvas, then tint the material/sprite.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('♪', 32, 32);

        return new THREE.CanvasTexture(canvas);
    }

    startPlaying() {
        this.isPlaying = true;
        this.noteTexture = this.noteTexture || this.createNoteTexture();
        this.particles = this.particles || [];
    }

    stopPlaying() {
        this.isPlaying = false;
    }

    spawnNote() {
        if (!this.noteTexture) return;

        const material = new THREE.SpriteMaterial({
            map: this.noteTexture,
            color: new THREE.Color().setHSL(Math.random(), 1.0, 0.5), // Random Hue
            transparent: true,
            opacity: 1.0
        });

        const sprite = new THREE.Sprite(material);
        // Start near the vinyl center
        // Vinyl is at 0, 0.85 + 0.12 = 0.97 in Group local space
        // And Group is at 0, 0, 0 relative to Mesh? 
        // Note: The whole RecordPlayerTable mesh is a Group.
        // It has a 'playerGroup' at 0, 0.85, 0 but that is internal variable in build().
        // We need to add sprites to `this.mesh`.
        // Platform is roughly at y=0.97.
        sprite.position.set(
            (Math.random() - 0.5) * 0.3, // Random X scatter
            1.0, // Start height
            (Math.random() - 0.5) * 0.3  // Random Z scatter
        );

        const scale = 0.1 + Math.random() * 0.1;
        sprite.scale.set(scale, scale, 1);

        this.mesh.add(sprite);

        this.particles.push({
            mesh: sprite,
            life: 2.0, // Seconds
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2, // Drift X
                0.2 + Math.random() * 0.3,   // Upward speed
                (Math.random() - 0.5) * 0.2  // Drift Z
            )
        });
    }

    update(delta) {
        // Spawn
        if (this.isPlaying) {
            // Spawn rate: e.g. every 0.5s or random chance per frame?
            // Let's say 5% chance per frame at 60fps -> 3 notes/sec
            if (Math.random() < 0.05) {
                this.spawnNote();
            }
        }

        // Update existings
        if (this.particles && this.particles.length > 0) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= delta;

                // Move
                p.mesh.position.addScaledVector(p.velocity, delta);

                // Fade
                p.mesh.material.opacity = Math.max(0, p.life / 2.0); // Simple linear fade

                if (p.life <= 0) {
                    this.mesh.remove(p.mesh);
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    clearVinyl() {
        if (this.baseVinylMesh) {
            this.baseVinylMesh.visible = false;
            this.baseLabelMesh.visible = false;
        }
        this.stopPlaying(); // Also stop particles
    }
}

export class Piano {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
    }

    build() {
        // Materiales
        // Wood (Polished Brown/Orange)
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // SaddleBrown
            roughness: 0.1, // Shiny / Polished
            metalness: 0.1
        });

        const keyWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const keyBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
        const interiorMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.3 }); // Gold

        // 1. Main Body (Curved Grand Shape)
        // Creating extraction shape
        const shape = new THREE.Shape();
        // Draw the classic kidney/wing shape
        const width = 1.4;
        const length = 2.0;

        shape.moveTo(0, 0);
        shape.lineTo(width, 0); // Front flat
        shape.lineTo(width, length * 0.6); // Straight side right

        // Curve back
        shape.bezierCurveTo(
            width, length,          // Control 1
            0, length,              // Control 2
            0, length * 0.4         // End point (Left side curve)
        );
        shape.lineTo(0, 0); // Close

        const extrudeSettings = {
            steps: 2,
            depth: 0.35, // Thickness of body
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2
        };

        const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const body = new THREE.Mesh(bodyGeo, woodMat);
        // Fix Rotation: +90 deg X so Y extends to +Z (matching legs 0..2.0)
        // Extrusion Z becomes -Y (down).
        body.rotation.x = Math.PI / 2;
        // Position: Top of legs (0.7) + Thickness (0.35) = 1.05
        body.position.y = 1.05;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // 2. Legs (3 Legs)
        const legH = 0.7;
        const legGeo = new THREE.CylinderGeometry(0.06, 0.04, legH);

        // Front Left
        const l1 = new THREE.Mesh(legGeo, woodMat);
        l1.position.set(0.2, legH / 2, 0.2);
        this.mesh.add(l1);

        // Front Right
        const l2 = new THREE.Mesh(legGeo, woodMat);
        l2.position.set(width - 0.2, legH / 2, 0.2);
        this.mesh.add(l2);

        // Back
        const l3 = new THREE.Mesh(legGeo, woodMat);
        l3.position.set(width * 0.4, legH / 2, length * 0.8);
        this.mesh.add(l3);

        // 3. Keyboard Area
        const keysW = width - 0.2;
        const keysH = 0.15;
        const keysD = 0.3;

        // Keybed (Wood holding keys)
        const keybedGeo = new THREE.BoxGeometry(keysW + 0.1, 0.1, keysD);
        const keybed = new THREE.Mesh(keybedGeo, woodMat);
        // Position: X center, Y on top of legs handling thickness logic
        // Body is at 1.05, extrudes down to 0.7.
        // We want keys to be roughly flush or embedded.
        // Top of piano is 1.05.
        // Keybed at 0.7-ish? No, grand piano keybed is usually slightly lower than rim.
        keybed.position.set(width / 2, 0.9, 0.15); // Z pushed slightly in
        this.mesh.add(keybed);

        // White Keys
        const numWhite = 52;
        const keyWidth = keysW / numWhite;
        const whiteGeo = new THREE.BoxGeometry(keyWidth * 0.9, 0.04, 0.2);

        for (let i = 0; i < numWhite; i++) {
            const key = new THREE.Mesh(whiteGeo, keyWhiteMat);
            // Center is width/2. 
            // Start x = width/2 - keysW/2 = 0.1
            const x = 0.1 + i * keyWidth + keyWidth / 2;
            key.position.set(x, 0.96, 0.15); // Higher than keybed
            this.mesh.add(key);
        }

        // Black Keys 
        const blackGeo = new THREE.BoxGeometry(keyWidth * 0.6, 0.05, 0.12);

        for (let i = 0; i < numWhite - 1; i++) {
            const octave = i % 7;
            let hasBlack = true;
            if (octave === 2 || octave === 6) hasBlack = false;

            if (hasBlack) {
                const key = new THREE.Mesh(blackGeo, keyBlackMat);
                const x = 0.1 + i * keyWidth + keyWidth;
                key.position.set(x, 0.99, 0.1); // Higher and set back
                this.mesh.add(key);
            }
        }

        // 4. Lid (Top Cover)
        const lid = new THREE.Mesh(bodyGeo, woodMat);
        lid.scale.set(1, 1, 0.05); // Thin

        // Pivot group needed?
        // Body (Y=0.7 to 1.05). Lid sits at 1.05.
        // Let's just create a simple open lid mesh without complex pivoting for now to avoid bugs.
        // Or fix the pivot.

        // Lid matching body rotation +90 X.
        // If we want to open it, we rotate around Z axis (straight edge).

        const lidOpen = new THREE.Mesh(bodyGeo, woodMat);
        lidOpen.scale.z = 0.05; // Thin extrude
        // Default Rotation matches body: Math.PI/2
        // Then rotate up.
        // Math.PI/2 means Flat.
        // Rotate around straight edge (Right side, X = width).

        // Simple approximation:
        lidOpen.rotation.x = Math.PI / 2 - 0.5; // Angled Up
        lidOpen.rotation.z = 0.1; // Tilted sideways slightly
        lidOpen.position.set(0, 1.05, 0);
        this.mesh.add(lidOpen);

        // Stick prop
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), interiorMat);
        stick.position.set(width * 0.8, 1.3, length * 0.5); // Adjusted Y and Z
        stick.rotation.x = 0.4;
        this.mesh.add(stick);

        // Music Rack
        const rackGeo = new THREE.BoxGeometry(0.8, 0.3, 0.02);
        const rack = new THREE.Mesh(rackGeo, woodMat);
        rack.position.set(width / 2, 0.85, 0.2);
        rack.rotation.x = -0.2;
        this.mesh.add(rack);

        // Hitbox
        const hitBoxGeo = new THREE.BoxGeometry(1.5, 1.5, 2.0);
        const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.position.set(0.7, 0.75, 1.0);
        hitBox.userData = { type: 'piano', parentObj: this };
        this.mesh.add(hitBox);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}
