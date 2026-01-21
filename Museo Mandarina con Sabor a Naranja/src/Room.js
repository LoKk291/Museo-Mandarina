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
        this.windowLights = []; // Lights attached to windows
        this.lightsOn = true; // Default state

        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);
        this.scene.add(this.group);

        this.buildStructure();
    }

    updateWindowLights(isNight) {
        const intensity = isNight ? 5.0 : 0.0;
        this.windowLights.forEach(light => {
            light.intensity = intensity;
        });
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
        // Techo Solido (Blanco/Gris) para bloquear luz y ser visible desde abajo
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x8b5a2b, // Brownish
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });
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
        // Techo (Mesh)
        // Reverting to PlaneGeometry to avoid "Black Bar" artifact when scaled.
        // Plane casts shadows fine.
        // Pivot Logic:
        // Rot X -90 maps Local Y to Global -Z.
        // We want pivot at North (-Z edge).
        // Room Z range: [-depth/2, depth/2].
        // Pivot at -depth/2.
        // Geometry needs to extend from 0 to +Z relative to pivot? No.
        // If Pivot is at -depth/2. We want to extend to +depth/2 (South). Distance 'depth'.
        // Direction is +Z.
        // Local Y maps to -Z. So we need Local Y to be NEGATIVE to map to +Z?
        // Wait. Map Y -> -Z. 
        // We want Global Z increase (North to South).
        // So we need Local Y decrease (0 to -d).
        // Plane centered at 0. Y range [-d/2, d/2].
        // Translate(0, -d/2, 0) -> Range [-d, 0].
        // Rot X -90 -> Maps range [-d, 0] to -[-d, 0] = [0, d]. in Z?
        // Let's verify: Vector(0, -10, 0) rotated -90 around X.
        // y' = y*cos(-90) - z*sin(-90) = 0 - 0 = 0? No.
        // y' = y*0 - z*-1 = z.
        // z' = y*sin(-90) + z*cos(-90) = y*-1 + 0 = -y.
        // So Local Y(-10) -> Global Z(10). Positive Z!
        // Yes! Range [-d, 0] in Y becomes [0, d] in Z.
        // Mesh Pos Z = -depth/2.
        // Final Z Range = [-depth/2 + 0, -depth/2 + d] = [-depth/2, depth/2]. PERFECT.

        ceilingGeo.translate(0, -this.depth / 2, 0);

        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);

        ceiling.rotation.x = -Math.PI / 2;
        ceiling.position.set(0, this.height, -this.depth / 2); // Pivot at North Wall

        // Shadow Fix: Ceiling MUST block light
        ceiling.castShadow = true;
        ceiling.receiveShadow = true;

        ceiling.scale.set(1, 1, 1); // Start Closed (Scale 1)
        // Actually init sets scale based on anim state, but let's default to visible for shadows if closed.

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

    createWall(x, y, z, width, height, mat, wallName = '', rotated = false) {
        // Prepare Multi-Material for edges if needed
        let materials;
        if (Array.isArray(mat)) {
            materials = mat.slice(); // Clone array
        } else {
            // [Right, Left, Top, Bottom, Front, Back]
            materials = [mat, mat, mat, mat, mat, mat];
        }

        // Logic based on Wall Orientation for exterior texturing
        // We need to apply the texture to the specific faces that are on the outside.
        // BoxGeometry Faces: 0:Right(X+), 1:Left(X-), 2:Top(Y+), 3:Bottom(Y-), 4:Front(Z+), 5:Back(Z-)

        const threshold = 0.1;
        const name = wallName || '';

        // Helper to fix texture mapping (Smart UVs)
        const getSmartMaterial = (faceWidth, faceHeight, axisOffset) => {
            if (!this.exteriorMat || !this.exteriorMat.map) return this.exteriorMat || mat;

            const newMat = this.exteriorMat.clone();
            const newMap = this.exteriorMat.map.clone();

            // Scale: 1 unit = 2.5 meters approx. We want tiles to be uniform.
            // Let's divide dimension by 4 to get repeat count (adjustable).
            const scaleX = faceWidth / 4;
            const scaleY = faceHeight / 4;

            newMap.repeat.set(scaleX, scaleY);

            // Offset to align texture in world space
            // Offset logic: (position - size/2) / 4
            newMap.offset.x = (axisOffset - faceWidth / 2) / 4;

            newMat.map = newMap;
            // Stone texture doesn't usually use bumpMap in this simple setup, but if we added it:
            if (newMat.bumpMap) {
                newMat.bumpMap = newMap; // Reuse scaled texture
            }

            return newMat;
        };

        if (name.startsWith('North')) {
            // North Wall is at -Z. Exterior is Back (-Z) -> Face 5.
            materials[5] = getSmartMaterial(width, height, x);
            // Exposed Edges
            if (Math.abs((x - width / 2) - (-this.width / 2)) < threshold) materials[1] = getSmartMaterial(this.wallThickness, height, z); // Left
            if (Math.abs((x + width / 2) - (this.width / 2)) < threshold) materials[0] = getSmartMaterial(this.wallThickness, height, z); // Right

        } else if (name.startsWith('South')) {
            // South Wall is at +Z. Exterior is Front (+Z) -> Face 4.
            materials[4] = getSmartMaterial(width, height, x);
            if (Math.abs((x - width / 2) - (-this.width / 2)) < threshold) materials[1] = getSmartMaterial(this.wallThickness, height, z);
            if (Math.abs((x + width / 2) - (this.width / 2)) < threshold) materials[0] = getSmartMaterial(this.wallThickness, height, z);

        } else if (name.startsWith('East')) {
            // East Wall is at +X. Rotated. Exterior is Right (+X) -> Face 0.
            materials[0] = getSmartMaterial(width, height, z); // Width param is Depth here
            if (Math.abs((z - width / 2) - (-this.depth / 2)) < threshold) materials[5] = getSmartMaterial(this.wallThickness, height, x);
            if (Math.abs((z + width / 2) - (this.depth / 2)) < threshold) materials[4] = getSmartMaterial(this.wallThickness, height, x);

        } else if (name.startsWith('West')) {
            materials[1] = getSmartMaterial(width, height, z);
            if (Math.abs((z - width / 2) - (-this.depth / 2)) < threshold) materials[5] = getSmartMaterial(this.wallThickness, height, x);
            if (Math.abs((z + width / 2) - (this.depth / 2)) < threshold) materials[4] = getSmartMaterial(this.wallThickness, height, x);
        }

        // Geometry Logic
        let geo;
        if (rotated) {
            geo = new THREE.BoxGeometry(this.wallThickness, height, width);
        } else {
            geo = new THREE.BoxGeometry(width, height, this.wallThickness);
        }

        const wall = new THREE.Mesh(geo, materials);
        wall.position.set(x, y, z);

        // SHADOW LOGIC
        wall.castShadow = true;
        wall.receiveShadow = true;

        if (wallName) {
            wall.name = wallName;
            wall.userData = { wallName: wallName };
        }

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

            // --- LIGHT LOGIC ---
            // Determine Direction using wallName or pz relative to room center
            // Room Center (Local) = 0,0,0
            // If pz > 0 -> South (Front) -> Light should be at pz + offset
            // If pz < 0 -> North (Back) -> Light should be at pz - offset
            const isSouth = (pz > 0);
            const lightOffset = 0.5; // Just outside the glass
            const lightZ = isSouth ? pz + lightOffset : pz - lightOffset;

            // Create PointLight
            const wLight = new THREE.PointLight(0xffaa33, 0.0, 15); // Start OFF (0 intensity), warm color
            wLight.position.set(px, winY, lightZ);
            wLight.decay = 2;
            this.group.add(wLight);
            this.windowLights.push(wLight);

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

            // --- LIGHT LOGIC ---
            // Local 0,0,0 is center.
            // If px > 0 -> East -> Light at px + offset
            // If px < 0 -> West -> Light at px - offset
            const isEast = (px > 0);
            const lightOffset = 0.5;
            const lightX = isEast ? px + lightOffset : px - lightOffset;

            const wLight = new THREE.PointLight(0xffaa33, 0.0, 15);
            wLight.position.set(lightX, winY, pz);
            wLight.decay = 2;
            this.group.add(wLight);
            this.windowLights.push(wLight);
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

            this.ceiling.scale.y = Math.max(0.001, this.ceilingScale);

            // Visibility Threshold
            const visible = this.ceilingScale > 0.1;
            this.ceiling.visible = visible;
            this.ceiling.castShadow = visible;
            this.ceiling.receiveShadow = visible;
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
        // Ceiling Origin is at "bottom" edge (0,0) in Local Space.
        // Local Y goes from 0 to -depth (as per new geometry logic).
        // Center is -depth/2.
        const cx = 0;
        const cy = -this.depth / 2;

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
            // Z = -0.05 to appear on the underside (Interior)
            panel.position.set(off.x, cy + off.y, -0.05);
            this.ceiling.add(panel);

            // Add Powerful PointLight
            const light = new THREE.PointLight(0xFFCC66, 3.5, 50); // Increased Intensity 2.0 -> 3.5
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

        const intensity = this.lightsOn ? 3.5 : 0; // Increased switch intensity 2.0 -> 3.5
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

    setFloorTexture(texture) {
        if (this.group.children[0] && this.group.children[0].material) {
            this.group.children[0].material.map = texture;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(this.width, this.depth);
            this.group.children[0].material.needsUpdate = true;
        }
    }

    generateCrackedRockTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base Rock Color (Dark Grey)
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, size, size);

        // Add Noise/Grit
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const shade = 20 + Math.random() * 30;
            ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // Cracked Lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        const numCracks = 15;
        for (let i = 0; i < numCracks; i++) {
            let cx = Math.random() * size;
            let cy = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(cx, cy);

            const segments = 10 + Math.random() * 10;
            for (let j = 0; j < segments; j++) {
                cx += (Math.random() - 0.5) * 50;
                cy += (Math.random() - 0.5) * 50;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }

        // Add some highlights
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 10; i++) {
            let cx = Math.random() * size;
            let cy = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            cx += (Math.random() - 0.5) * 100;
            cy += (Math.random() - 0.5) * 100;
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
}
