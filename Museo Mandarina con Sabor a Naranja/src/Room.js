import * as THREE from 'three';
import { Painting } from './Painting.js';

export class Room {
    constructor(scene, x, z, width, depth, color = 0x888888) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, 0, z); // Centro de la habitación
        this.width = width;
        this.depth = depth;
        this.height = 4; // Altura estándar
        this.wallThickness = 0.5;
        this.wallColor = color;

        this.walls = []; // Array para guardar las meshes de paredes (para colisiones)
        this.paintings = [];
        this.lights = [];
        this.lightPanels = [];
        this.lightsOn = true; // Default state

        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);
        this.scene.add(this.group);

        this.buildStructure();
    }

    buildStructure() {
        // Materiales
        // Suelo: Cargar Textura
        const textureLoader = new THREE.TextureLoader();
        const floorTexture = textureLoader.load('textures/wood_tile.png');
        // Configurar repetición para que no se estire
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        // Ajustar repetición. La baldosa es detallada.
        // Room width 15-20. 
        // Si repetimos width/2, en 20m son 10 baldosas. 2m por baldosa.
        // Si repetimos width/4, en 20m son 5 baldosas. 4m por baldosa. Muy grande.
        // La imagen tiene bastante detalle. El usuario quiere "un poco mas chicas".
        // Antes era width/2 (2m). Probemos width (1m).
        floorTexture.repeat.set(this.width, this.depth);
        // Ajustar color espacio sRGB
        floorTexture.colorSpace = THREE.SRGBColorSpace;

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.1, // Shiny Ceramic
            metalness: 0.1, // Slight reflectivity
            envMapIntensity: 1.0,
            color: 0xffffff
        });

        // Load Exterior Wall Texture (Procedural)
        const stoneTexture = this.generateStoneTexture();

        stoneTexture.wrapS = THREE.RepeatWrapping;
        stoneTexture.wrapT = THREE.RepeatWrapping;
        stoneTexture.repeat.set(this.width / 4, this.height / 4);
        stoneTexture.colorSpace = THREE.SRGBColorSpace;

        const exteriorMat = new THREE.MeshStandardMaterial({
            map: stoneTexture,
            bumpMap: stoneTexture, // Use same texture for relief
            bumpScale: 0.3, // Depth of relief
            roughness: 0.9,
            metalness: 0.1
        });

        // Store for reuse in createWall
        this.exteriorMat = exteriorMat;

        // Techo color cielo (Azul claro) para simular estar abierto/soleado
        const ceilingMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
        const wallMat = new THREE.MeshStandardMaterial({ color: this.wallColor });
        this.wallMat = wallMat; // Store for reuse

        // Suelo
        const floorGeo = new THREE.PlaneGeometry(this.width, this.depth);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Techo (Animado - Acordeon)
        // Usaremos scale.y (Local Y) para abrir/cerrar.
        // Rotamos X 90 grados, así que Local Y se alinea con Global Z.
        // Queremos anclar en el Norte (Z negativo).
        // En Geometry local, desplazamos para que el origen (0,0) sea el borde "inferior" (que será Norte).
        const ceilingGeo = new THREE.PlaneGeometry(this.width, this.depth);
        // Translate Y by +depth/2.
        // Original range Y: [-depth/2, depth/2]
        // New range Y: [0, depth]
        // Local Origin (0,0) is now at the start of the plane.
        ceilingGeo.translate(0, this.depth / 2, 0);

        const ceiling = new THREE.Mesh(ceilingGeo, wallMat);
        ceiling.rotation.x = Math.PI / 2; // Local Y+ points to Global Z+
        // Position at North Wall (Z = -depth/2)
        ceiling.position.set(0, this.height, -this.depth / 2);

        // Initial State: Closed (Scale 1)
        ceiling.scale.set(1, 1, 1);

        // Shadow propertires
        ceiling.castShadow = true;
        ceiling.receiveShadow = true;

        this.group.add(ceiling);
        this.ceiling = ceiling;
        this.ceilingOpen = false; // Estado lógico
        this.ceilingScale = 1.0;  // Estado visual actual
        this.ceilingTargetScale = 1.0; // Objetivo

        // Create Ceiling Lights (Panels + PointLights)
        this.createCeilingLights();

        // Construir 4 paredes base
        // Nota: Las puertas son huecos. Por simplicidad inicial, construiremos paredes completas
        // y luego consideraremos "puertas" como ausencia de pared o segmentos.
        // Para este entregable, usaremos segmentos de pared.

        // Pared Norte (Z-)
        this.createWall(0, this.height / 2, -this.depth / 2, this.width, this.height, wallMat, 'North');

        // Pared Sur (Z+)
        this.createWall(0, this.height / 2, this.depth / 2, this.width, this.height, wallMat, 'South');

        // Pared Este (X+)
        this.createWall(this.width / 2, this.height / 2, 0, this.depth, this.height, wallMat, 'East', true);

        // Pared Oeste (X-)
        this.createWall(-this.width / 2, this.height / 2, 0, this.depth, this.height, wallMat, 'West', true);
    }

    createWall(x, y, z, width, height, material, name, rotated = false) {
        // material param is acting as the "interior" material.
        // We will construct a multi-material array for exterior walls.

        const thickness = this.wallThickness;
        // Si está rotada (Este/Oeste), el ancho geométrico es thickness, y la profundidad es 'width' (que es depth de habitación)
        let geo;

        // Multi-material setup
        // Indices: 0:Right(X+), 1:Left(X-), 2:Top(Y+), 3:Bottom(Y-), 4:Front(Z+), 5:Back(Z-)
        // We need to determine which face is the "Exterior".

        let materials = [
            material, // 0 Right
            material, // 1 Left
            material, // 2 Top
            material, // 3 Bottom
            material, // 4 Front
            material // 5 Back
        ];

        // Clone/Use Exterior Mat for outside faces
        // const extMat = this.exteriorMat ? this.exteriorMat : material; // Old simple assignment

        // Helper to Create Smart Textured Material
        const getSmartMaterial = (faceWidth, faceHeight, axisOffset) => {
            if (!this.exteriorMat) return material;

            const newMat = this.exteriorMat.clone();
            const newMap = this.exteriorMat.map.clone();

            // Base Scale: 1 unit = 2.5 meters approx? Scale = Size / 4.
            // If we want 1 tile per 4 units.
            const scaleX = faceWidth / 4;
            const scaleY = faceHeight / 4;

            newMap.repeat.set(scaleX, scaleY);

            // Officet to align world space
            // We use axisOffset (x or z position of the wall center)
            // We need to shift texture so it aligns with 0.
            // Texture start is at 0. Wall starts at axisOffset - faceWidth/2.
            // We want texture coordinate 0 to match World 0.
            // UV 0 maps to (axisOffset - faceWidth/2).
            // We want UV at "World 0" to be... 0.

            // If we do offset.x. Texture is shifted.
            // newMap.offset.x = (axisOffset - faceWidth/2) / 4;
            // Let's try this.
            newMap.offset.x = (axisOffset - faceWidth / 2) / 4;

            newMat.map = newMap;
            // If bumpMap is same texture
            newMat.bumpMap = newMap;

            return newMat;
        }


        // Logic based on Wall Name/Orientation
        // We match strictly by name base to avoid issues with segments (North_L, North_R etc start with North)
        const threshold = 0.1; // Tolerance for position check

        if (name.startsWith('North')) {
            // North Wall is at -Z. Exterior is pointing -Z (Back face). Index 5.
            materials[5] = getSmartMaterial(width, height, x);

            // Check Ends (Left/Right along X)
            // Left End: x - width/2 approx -roomWidth/2. Face 1 (Left).
            if (Math.abs((x - width / 2) - (-this.width / 2)) < threshold) {
                materials[1] = getSmartMaterial(thickness, height, z); // Use Z for offset alignment? Or just X pos? Side face is in Z plane? No.
                // Side face is in Y-Z plane. Its normal is X-.
                // Texture mapping: U along Z, V along Y.
                // Width of face is thickness (Z size of wall... wait. thickness is Z size).
                materials[1] = getSmartMaterial(thickness, height, z);
            }
            // Right End: x + width/2 approx roomWidth/2. Face 0 (Right).
            if (Math.abs((x + width / 2) - (this.width / 2)) < threshold) {
                materials[0] = getSmartMaterial(thickness, height, z);
            }

        } else if (name.startsWith('South')) {
            // South Wall is at +Z. Exterior is +Z (Front face). Index 4.
            materials[4] = getSmartMaterial(width, height, x);

            // Check Ends
            // Left End (relative to camera facing North... wait. Global Left is -X).
            // Wall Left (x-) is Index 1.
            if (Math.abs((x - width / 2) - (-this.width / 2)) < threshold) {
                materials[1] = getSmartMaterial(thickness, height, z);
            }
            // Right End (x+) is Index 0.
            if (Math.abs((x + width / 2) - (this.width / 2)) < threshold) {
                materials[0] = getSmartMaterial(thickness, height, z);
            }

        } else if (name.startsWith('East')) {
            // East Wall is at +X. Rotated Box.
            // Rotated: X size=thickness, Z size=width.
            // Exterior +X. Index 0.
            materials[0] = getSmartMaterial(width, height, z);

            // Ends are at Z+ and Z-.
            // North End (Z-) is Face 5 (Back).
            if (Math.abs((z - width / 2) - (-this.depth / 2)) < threshold) {
                materials[5] = getSmartMaterial(thickness, height, x);
            }
            // South End (Z+) is Face 4 (Front).
            if (Math.abs((z + width / 2) - (this.depth / 2)) < threshold) {
                materials[4] = getSmartMaterial(thickness, height, x);
            }

        } else if (name.startsWith('West')) {
            // West Wall at -X. Exterior -X. Index 1.
            materials[1] = getSmartMaterial(width, height, z);

            // Ends
            // North End (Z-) is Face 5.
            if (Math.abs((z - width / 2) - (-this.depth / 2)) < threshold) {
                materials[5] = getSmartMaterial(thickness, height, x);
            }
            // South End (Z+) is Face 4.
            if (Math.abs((z + width / 2) - (this.depth / 2)) < threshold) {
                materials[4] = getSmartMaterial(thickness, height, x);
            }
        }

        if (rotated) {
            geo = new THREE.BoxGeometry(thickness, height, width);
        } else {
            geo = new THREE.BoxGeometry(width, height, thickness);
        }

        const wall = new THREE.Mesh(geo, materials);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.userData.isWall = true; // Flag para colisiones
        wall.userData.wallName = name; // Para identificar

        this.group.add(wall);
        this.walls.push(wall);
        return wall;
    }

    // Función avanzada para crear una pared con hueco para puerta
    // Esta función reemplaza/elimina una pared existente y pone 2 segmentos dejando un hueco
    addDoor(wallSide, doorWidth = 2, doorHeight = 3) {
        // wallSide: 'North', 'South', 'East', 'West'
        // Buscar la pared existente y eliminarla
        const wallIndex = this.walls.findIndex(w => w.userData.wallName === wallSide);
        if (wallIndex === -1) return;

        const oldWall = this.walls[wallIndex];
        this.group.remove(oldWall);
        this.walls.splice(wallIndex, 1);

        // Crear 2 nuevos segmentos
        // Ejemplo simple: Puerta siempre centrada

        // We use this.wallMat stored earlier so we pass the correct base material
        // createWall will handle the exterior logic again based on name.
        const mat = this.wallMat;

        const fullLength = (wallSide === 'North' || wallSide === 'South') ? this.width : this.depth;
        const segmentLength = (fullLength - doorWidth) / 2;

        const y = this.height / 2;
        const thickness = this.wallThickness;

        // Offsets calculados desde el centro (0)
        // Segmento 1: desde -fullLength/2 hasta -doorWidth/2
        // Centro Seg1: (-fullLength/2 - doorWidth/2) / 2 = -(fullLength + doorWidth)/4
        const offset1 = -(fullLength + doorWidth) / 4;
        const offset2 = (fullLength + doorWidth) / 4;

        if (wallSide === 'North' || wallSide === 'South') {
            const zPos = (wallSide === 'North') ? -this.depth / 2 : this.depth / 2;

            // Izquierda
            this.createWall(offset1, y, zPos, segmentLength, this.height, mat, wallSide + '_L');
            // Derecha
            this.createWall(offset2, y, zPos, segmentLength, this.height, mat, wallSide + '_R');

            // Dintel (parte de arriba de la puerta)
            const lintelHeight = this.height - doorHeight;
            if (lintelHeight > 0) {
                this.createWall(0, this.height - lintelHeight / 2, zPos, doorWidth, lintelHeight, mat, wallSide + '_Top');
            }

        } else {
            // East / West
            const xPos = (wallSide === 'East') ? this.width / 2 : -this.width / 2;

            this.createWall(xPos, y, offset1, segmentLength, this.height, mat, wallSide + '_L', true);
            this.createWall(xPos, y, offset2, segmentLength, this.height, mat, wallSide + '_R', true);

            // Dintel
            const lintelHeight = this.height - doorHeight;
            if (lintelHeight > 0) {
                this.createWall(xPos, this.height - lintelHeight / 2, 0, doorWidth, lintelHeight, mat, wallSide + '_Top', true);
            }
        }
    }


    addCenteredWindow(wallName, winW, winH, winY) {
        // Find Wall
        const wallIndex = this.walls.findIndex(w => w.userData.wallName === wallName);
        if (wallIndex === -1) {
            console.warn(`Wall ${wallName} not found for window.`);
            return;
        }
        const oldWall = this.walls[wallIndex];
        // Reuse base material logic
        const mat = this.wallMat;

        // Dimensions
        // BoxGeometry params: width, height, depth
        // If rotated (East/West side segments), 'width' param is thickness, 'depth' param is width.
        // But createWall uses helper logic.
        // Let's inspect oldWall geometry to be sure.
        const geoParams = oldWall.geometry.parameters;

        // Determine orientation based on Thickness
        // If width is approx thickness (0.5), it is rotated? No.
        // createWall logic: 
        // rotated=true -> Box(thickness, height, width).
        // rotated=false -> Box(width, height, thickness).

        const isRotated = (Math.abs(geoParams.width - this.wallThickness) < 0.01);

        const fullW = isRotated ? geoParams.depth : geoParams.width;
        const fullH = geoParams.height;
        const thickness = this.wallThickness;

        const px = oldWall.position.x;
        const py = oldWall.position.y;
        const pz = oldWall.position.z;

        // Remove old wall
        this.group.remove(oldWall);
        this.walls.splice(wallIndex, 1);

        // Calculate Segments
        // Left/Right Width
        const sideW = (fullW - winW) / 2;
        // Top/Bottom Height
        // winY is center of window.
        // Floor is 0. Wall center is py.
        // Coordinates logic:
        // Window Top edge Y: winY + winH/2
        // Window Bottom edge Y: winY - winH/2
        // Wall Top edge Y: py + fullH/2
        // Wall Bottom edge Y: py - fullH/2

        const topH = (py + fullH / 2) - (winY + winH / 2);
        const botH = (winY - winH / 2) - (py - fullH / 2);

        // Segments relative to Wall Center (px, py, pz)
        // If Rotated (Along Z): X is constant (thickness). Z varies.
        // If Not Rotated (Along X): Z is constant. X varies.

        if (!isRotated) {
            // ALONG X (North/South Segments)
            // Left (Negative X relative to center): Center is px - winW/2 - sideW/2
            this.createWall(px - winW / 2 - sideW / 2, py, pz, sideW, fullH, mat, wallName + '_L');
            // Right
            this.createWall(px + winW / 2 + sideW / 2, py, pz, sideW, fullH, mat, wallName + '_R');
            // Top (Above Window): Center X px. Center Y: (winY + winH/2) + topH/2
            this.createWall(px, (winY + winH / 2) + topH / 2, pz, winW, topH, mat, wallName + '_Top');
            // Bottom
            this.createWall(px, (winY - winH / 2) - botH / 2, pz, winW, botH, mat, wallName + '_Bot');

            // WINDOW GLASS
            const glassGeo = new THREE.BoxGeometry(winW, winH, 0.05);
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0x88CCFF,
                metalness: 0,
                roughness: 0,
                transmission: 0.9, // Glass
                transparent: true,
                opacity: 0.6 // INCREASED FROM 0.3
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.set(px, winY, pz);
            this.group.add(glass);

        } else {
            // ALONG Z (East/West Segments)
            // Left (Negative Z ... wait. 'Left' depends on perspective. Let's say MINUS Z)
            this.createWall(px, py, pz - winW / 2 - sideW / 2, sideW, fullH, mat, wallName + '_L', true);
            this.createWall(px, py, pz + winW / 2 + sideW / 2, sideW, fullH, mat, wallName + '_R', true);
            // Top
            this.createWall(px, (winY + winH / 2) + topH / 2, pz, winW, topH, mat, wallName + '_Top', true);
            // Bottom
            this.createWall(px, (winY - winH / 2) - botH / 2, pz, winW, botH, mat, wallName + '_Bot', true);

            // WINDOW GLASS
            const glassGeo = new THREE.BoxGeometry(0.05, winH, winW);
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0x88CCFF,
                metalness: 0,
                roughness: 0,
                transmission: 0.9,
                transparent: true,
                opacity: 0.6 // INCREASED FROM 0.3
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.set(px, winY, pz);
            this.group.add(glass);
        }
    }

    addPaintingToWall(wallSide, sizeW, sizeH, imagePath, title, desc, id, shiftH = 0, shiftV = 0) {
        // wallSide: 'North', 'South', etc.
        // id: Numero/ID para mostrar
        // shiftH: Desplazamiento horizontal desde el centro de la pared
        // shiftV: Desplazamiento vertical desde el centro (y=2 aprox)

        const p = new Painting(sizeW, sizeH, imagePath, title, desc, id);
        const dist = 0.1; // Distancia para que no haga z-fighting con la pared

        let x = 0, z = 0, rotY = 0;
        const y = (this.height / 2) + shiftV; // Centrado en altura por defecto

        if (wallSide === 'North') {
            z = -this.depth / 2 + dist + this.wallThickness / 2; // Un poco hacia adentro
            x = shiftH;
            rotY = 0;
        } else if (wallSide === 'South') {
            z = this.depth / 2 - dist - this.wallThickness / 2;
            x = -shiftH; // Invertimos para que positivo sea derecha mirando la pared
            rotY = Math.PI;
        } else if (wallSide === 'East') {
            x = this.width / 2 - dist - this.wallThickness / 2;
            z = shiftH;
            rotY = -Math.PI / 2;
        } else if (wallSide === 'West') {
            x = -this.width / 2 + dist + this.wallThickness / 2;
            z = -shiftH;
            rotY = Math.PI / 2;
        }

        p.setPosition(x, y, z);
        p.setRotation(0, rotY, 0);

        this.group.add(p.mesh);
        this.paintings.push(p);
    }

    getCollidables() {
        return this.walls;
    }

    setCeiling(isOpen) {
        this.ceilingOpen = isOpen;
        // isOpen = true -> Queremos ver el cielo -> Escala 0
        // isOpen = false -> Queremos techo cerrado -> Escala 1
        this.ceilingTargetScale = isOpen ? 0.0 : 1.0;
    }

    updateCeiling(delta) {
        if (!this.ceiling) return;

        // Animar scale.y hacia targetScale
        const speed = 2.0; // Unidades de escala por segundo
        if (this.ceilingScale !== this.ceilingTargetScale) {
            const diff = this.ceilingTargetScale - this.ceilingScale;
            const step = speed * delta;

            if (Math.abs(diff) < step) {
                this.ceilingScale = this.ceilingTargetScale;
            } else {
                this.ceilingScale += Math.sign(diff) * step;
            }

            this.ceiling.scale.y = Math.max(0.001, this.ceilingScale); // Evitar 0 absoluto por warnings de matriz

            // Opcional: Ajustar visibilidad si está muy pequeño para ahorrar draw calls?
            // Pero scale 0 ya es invisible practicamente.
            this.ceiling.visible = this.ceilingScale > 0.01;
        }
    }
    createCeilingLights() {
        if (!this.ceiling) return;

        // 4 Light Panels
        // Use a shared material for panels? Or unique if we want individual control? 
        // Shared is fine if all go on/off together.
        // But we want to change emissive/color.
        // Let's create distinct materials so we don't affect other rooms if we share checks (though new Material() creates unique).

        // Positions relative to ceiling center (0, depth/2) 
        // Ceiling Origin is at "bottom" edge (0,0). Center is (0, depth/2).
        const cx = 0;
        const cy = this.depth / 2;

        const offsets = [
            { x: -this.width / 4, y: -this.depth / 4 },
            { x: this.width / 4, y: -this.depth / 4 },
            { x: -this.width / 4, y: this.depth / 4 },
            { x: this.width / 4, y: this.depth / 4 }
        ];

        offsets.forEach(off => {
            const panelMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // Emissive look (White)
            // Fix: Use correct dimensions relative to Local Space.
            // Local X = Global Width.
            // Local Y = Global Depth (Scales with ceiling).
            // Local Z = Global Vertical (Thickness).
            const panelGeo = new THREE.BoxGeometry(0.8, 0.8, 0.05); // Flat panel (0.05 thick)

            const panel = new THREE.Mesh(panelGeo, panelMat);
            // Position on the surface
            // Z = 0.025 (Half thickness) to sit on surface (Global Down) without sticking up (Global Up)
            panel.position.set(off.x, cy + off.y, 0.025);
            this.ceiling.add(panel);

            // Add Powerful PointLight
            const light = new THREE.PointLight(0xFFCC66, 0.8, 15); // Golden Sun-like (slightly cooler than FFAA33)
            light.position.set(0, 0, 0.5); // Slightly below panel

            panel.add(light);

            // Store refs
            this.lights.push(light);
            this.lightPanels.push(panelMat);
        });
    }

    setLightSwitch(switchObj) {
        this.lightSwitch = switchObj;
        // Sync initial state
        this.lightSwitch.setState(this.lightsOn);
    }

    toggleLights(forceState = null) {
        if (forceState !== null) {
            this.lightsOn = forceState;
        } else {
            this.lightsOn = !this.lightsOn;
        }

        const intensity = this.lightsOn ? 0.8 : 0;
        const color = this.lightsOn ? 0xFFFFFF : 0x333333;

        this.lights.forEach(light => {
            light.intensity = intensity;
        });
        this.lightPanels.forEach(mat => {
            mat.color.setHex(color);
        });

        // Sync Switch if exists
        if (this.lightSwitch) {
            this.lightSwitch.setState(this.lightsOn);
        }

        return this.lightsOn;
    }

    generateStoneTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Background (Mortar)
        ctx.fillStyle = '#8f887e'; // Greyish brown
        ctx.fillRect(0, 0, size, size);

        // Stone params
        const rows = 10;
        const cols = 10;
        const cellW = size / cols;
        const cellH = size / rows;

        // Colors for stones (Earth tones)
        const colors = [
            '#a69c90', '#b8aea2', '#c7c0b5', '#8c8276', '#a3998d'
        ];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Randomize stone size and position slightly
                const w = cellW * 0.9;
                const h = cellH * 0.85;
                const x = j * cellW + (cellW - w) / 2 + (Math.random() - 0.5) * 5;
                const y = i * cellH + (cellH - h) / 2 + (Math.random() - 0.5) * 5;

                // Pick random color
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;

                // Draw Rounded Rect (Stone)
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, [10]);
                ctx.fill();

                // Add some noise/detail to stone
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let k = 0; k < 20; k++) {
                    ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2);
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}
