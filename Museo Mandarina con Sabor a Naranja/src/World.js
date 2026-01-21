import * as THREE from 'three';
import { Room } from './Room.js';
import { Desk, RetroComputer, Clock, FloorLamp, DeskLamp, Lever, Chandelier, DoubleDoor, RedCarpet, Chair, OrchidPot, WindowFlowerBox, LightSwitch, Phone, PaperStack, WasteBasket, Statue, Globe, CornerTable, MuseumBarrier, VinylFrame, RecordPlayerTable, Piano, MadHatterHat, Bookshelf, SecretBookshelfDoor, MinecraftPortal, HorseSkeleton, ArcadeMachine, WallInstrument, CentralRug, StreetLight, SecretRug, FlashlightItem, Foxy, Mangle, CraftingTable, Furnace, MinecraftBed, BreakableVase, CinemaScreen, OldCamera, WallDecoration } from './Furniture.js';
import { Sparrow } from './Sparrow.js';

export class World {
    constructor(scene, soundManager) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.rooms = [];
        this.roomsMap = new Map();
        this.collidables = []; // Walls for collision
        this.interactables = []; // Paintings for clicking
        this.floorLamps = []; // Track floor lamps
        this.clock = null;
        this.globalLightState = true;
        this.lever = null;
        this.chandelier = null; // Store ref
        this.mainDoor = null; // Store main door ref

        // Animation State
        // 'CLOSED' (Default)
        // 'OPENING_CHANDELIER' (Chandelier going up)
        // 'OPENING_CEILING' (Ceiling opening)
        // 'OPEN' (Fully Open)
        // 'CLOSING_CEILING' (Ceiling closing)
        // 'CLOSING_CHANDELIER' (Chandelier coming down)
        this.animState = 'CLOSED';

        this.isCeilingOpen = false; // Logical state for main.js lighting check

        this.init();
        this.createGarden(); // Add external environment

        // Create Sparrow
        this.sparrow = new Sparrow(this.scene, this.interactables);
        this.scene.add(this.sparrow.mesh);
        this.sparrow.mesh.position.set(0, 3, 0); // Start high
        if (this.sparrow.interactableMesh) {
            this.interactables.push(this.sparrow.interactableMesh);
        }

    }

    createGarden() {
        // --- 0. Geometry ---
        // Huge plane
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);

        // --- 1. Procedural Texture (Canvas) ---
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // A. Base Grass (Noise)
        ctx.fillStyle = '#2d4c1e'; // Dark green base
        ctx.fillRect(0, 0, size, size);

        // Add 50000 blades of grass (noise)
        for (let i = 0; i < 50000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 2 + 1;
            const h = Math.random() * 4 + 2;
            // Mix of lighter greens
            const hue = 80 + Math.random() * 40; // 80-120 (Yellow-Green)
            const light = 20 + Math.random() * 30; // 20-50% Lightness
            ctx.fillStyle = `hsl(${hue}, 60%, ${light}%)`;
            ctx.fillRect(x, y, w, h);
        }

        // B. Flowers
        const flowerColors = ['#FF0000', '#FFFF00', '#FFFFFF', '#9932CC']; // Red, Yellow, White, Purple
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 4 + 2; // Radius
            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Flower center
            ctx.beginPath();
            ctx.arc(x, y, r / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#4B3621'; // Brown center
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Tile it heavily so it looks detailed up close
        texture.repeat.set(100, 100);

        // --- 2. Material ---
        const groundMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1.0,
            metalness: 0.0
        });

        // --- 3. Mesh ---
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05; // Slightly below floor
        ground.receiveShadow = true;

        this.scene.add(ground);

        // --- MUSEUM BOUNDARY (15m buffer around perimeter) ---
        // Museum extends approximately from X: -35 to +35, Z: -55 to +15
        // Add 15m buffer on each side
        const bufferSize = 15;
        const museumMinX = -35;
        const museumMaxX = 35;
        const museumMinZ = -60;
        const museumMaxZ = 15;

        const boundaryMinX = museumMinX - bufferSize;
        const boundaryMaxX = museumMaxX + bufferSize;
        const boundaryMinZ = museumMinZ - bufferSize;
        const boundaryMaxZ = museumMaxZ + bufferSize;

        const wallHeight = 10;
        const wallThickness = 1;

        // Create semi-transparent material for boundaries (initially invisible)
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        // Store boundary walls for toggling visibility
        this.boundaryWalls = [];

        // North boundary wall
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(boundaryMaxX - boundaryMinX, wallHeight, wallThickness),
            boundaryMaterial
        );
        northWall.position.set((boundaryMinX + boundaryMaxX) / 2, wallHeight / 2, boundaryMinZ);
        // NOT added to collidables - passable boundary
        this.boundaryWalls.push(northWall);
        this.scene.add(northWall);

        // South boundary wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(boundaryMaxX - boundaryMinX, wallHeight, wallThickness),
            boundaryMaterial.clone()
        );
        southWall.position.set((boundaryMinX + boundaryMaxX) / 2, wallHeight / 2, boundaryMaxZ);
        // NOT added to collidables - passable boundary
        this.boundaryWalls.push(southWall);
        this.scene.add(southWall);

        // West boundary wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, boundaryMaxZ - boundaryMinZ),
            boundaryMaterial.clone()
        );
        westWall.position.set(boundaryMinX, wallHeight / 2, (boundaryMinZ + boundaryMaxZ) / 2);
        // NOT added to collidables - passable boundary
        this.boundaryWalls.push(westWall);
        this.scene.add(westWall);

        // East boundary wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, boundaryMaxZ - boundaryMinZ),
            boundaryMaterial.clone()
        );
        eastWall.position.set(boundaryMaxX, wallHeight / 2, (boundaryMinZ + boundaryMaxZ) / 2);
        // NOT added to collidables - passable boundary
        this.boundaryWalls.push(eastWall);
        this.scene.add(eastWall);

        // --- IRREGULAR TERRAIN BEYOND BOUNDARY ---
        // Create bumpy terrain outside the boundary zone
        const irregularSize = 200;
        const irregularSegments = 100;
        const irregularGeo = new THREE.PlaneGeometry(irregularSize, irregularSize, irregularSegments, irregularSegments);

        // Modify vertices to create hills and valleys ONLY beyond boundary
        const vertices = irregularGeo.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];

            // Calculate distance from center
            const distFromCenter = Math.sqrt(x * x + z * z);
            const boundaryRadius = Math.sqrt(
                Math.pow((boundaryMaxX - boundaryMinX) / 2, 2) +
                Math.pow((boundaryMaxZ - boundaryMinZ) / 2, 2)
            );

            // Only apply irregularity OUTSIDE the actual boundary zone
            // Visible Boundary is: X: ±50, Z: -75 to 30
            // Expanded buffer: X: ±60, Z: -90 to 40
            const isOutsideBoundary = (
                Math.abs(x) > 60 ||
                z < -90 || z > 40
            );

            if (isOutsideBoundary) {
                // Determine heights using a mix of frequencies (Fully Deterministic)
                // Base hills
                const baseHills = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 +
                    Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;
                // High-frequency detail (pseudo-random but deterministic)
                const detail = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5;

                vertices[i + 2] = baseHills + detail;
            }
        }

        irregularGeo.attributes.position.needsUpdate = true;
        irregularGeo.computeVertexNormals();

        // Create grass-like texture (reuse from ground)
        const grassTexture = this.createGrassTexture();
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(50, 50);

        const irregularMat = new THREE.MeshStandardMaterial({
            map: grassTexture,
            color: 0x4a7c3a,
            roughness: 1.0,
            metalness: 0.0,
            wireframe: false
        });

        this.irregularTerrain = new THREE.Mesh(irregularGeo, irregularMat);
        this.irregularTerrain.rotation.x = -Math.PI / 2;
        this.irregularTerrain.position.y = -0.1;
        this.irregularTerrain.receiveShadow = true;
        this.irregularTerrain.castShadow = false;

        // Don't add to collidables - terrain should be walkable, not a collision wall
        // The bumpy surface is visual only, players walk on the flat ground plane
        this.scene.add(this.irregularTerrain);

        // --- TREES (Only beyond boundary) ---
        this.createTrees(boundaryMinX, boundaryMaxX, boundaryMinZ, boundaryMaxZ);

        // --- FLOWERS (Can be inside boundary area) ---
        this.createFlowers(boundaryMinX, boundaryMaxX, boundaryMinZ, boundaryMaxZ);

        // --- STREET LIGHTS ---
        this.streetLights = []; // Initialize array
        this.createStreetLights();

        // --- WATERFALL AND LAKE ---
        this.createWaterFeatures();
    }

    createStreetLights() {
        // PERIMETER LIGHTS (Outside the Museum Walls)
        // Museum Bounds approx: X[-35, 35], Z[-60, 15]

        const corners = [
            { x: -40, z: 20, rot: -Math.PI / 4 }, // Front Left (South-West)
            { x: 40, z: 20, rot: Math.PI / 4 },   // Front Right (South-East)
            { x: 40, z: -70, rot: 3 * Math.PI / 4 }, // Back Right (North-East) - Behind secret room
            { x: -40, z: -70, rot: -3 * Math.PI / 4 } // Back Left (North-West)
        ];

        // Adding mid-points for better lighting
        const midPoints = [
            // { x: 0, z: 20, rot: 0 }, // Front Center REMOVED (User Request)
            { x: 0, z: -70, rot: Math.PI }, // Back Center
            { x: -40, z: -25, rot: -Math.PI / 2 }, // Left Center
            { x: 40, z: -25, rot: Math.PI / 2 } // Right Center
        ];

        const placements = [...corners, ...midPoints];

        placements.forEach(p => {
            const l = new StreetLight();
            l.setPosition(p.x, 0, p.z);
            l.setRotation(p.rot);
            this.scene.add(l.mesh);
            this.streetLights.push(l);
        });
    }

    updateStreetLights(isNight) {
        if (this.isPartyMode) {
            // Force OFF in Party Mode
            if (this.streetLights) {
                this.streetLights.forEach(light => {
                    light.turnOn(false);
                });
            }
            return;
        }

        if (this.streetLights) {
            this.streetLights.forEach(sl => {
                sl.turnOn(isNight);
            });
        }

        // Update Window Lights
        this.rooms.forEach(room => {
            if (room.updateWindowLights) {
                room.updateWindowLights(isNight);
            }
        });
    }

    createGrassTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base grass color
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(0, 0, size, size);

        // Add grass blades (noise)
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 2 + 0.5;
            const h = Math.random() * 4 + 1;
            const hue = 80 + Math.random() * 40;
            const light = 25 + Math.random() * 20;
            ctx.fillStyle = `hsl(${hue}, 60%, ${light}%)`;
            ctx.fillRect(x, y, w, h);
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createTrees(boundaryMinX, boundaryMaxX, boundaryMinZ, boundaryMaxZ) {
        const treeCount = 40; // Reduced for performance
        const boundaryRadius = Math.sqrt(
            Math.pow((boundaryMaxX - boundaryMinX) / 2, 2) +
            Math.pow((boundaryMaxZ - boundaryMinZ) / 2, 2)
        );
        const minDistance = boundaryRadius * 0.85; // Trees start beyond boundary

        const treeTypes = ['pine', 'oak', 'poplar'];

        for (let i = 0; i < treeCount; i++) {
            // Random position in a large area
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            // Check if position is outside boundary (matches terrain irregularities)
            const isOutsideBoundary = (
                Math.abs(x) > 60 ||
                z < -90 || z > 40
            );

            if (!isOutsideBoundary) {
                // Skip - this is inside the boundary
                continue;
            }

            // Random tree type
            const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];

            // Create tree
            const tree = this.createTree(type);
            tree.position.set(x, 0, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(tree);
        }
    }

    createTree(type) {
        const group = new THREE.Group();

        // Trunk with variation
        const trunkHeight = 3 + Math.random() * 3;
        const trunkRadius = 0.15 + Math.random() * 0.15;
        const trunkColor = Math.random() > 0.5 ? 0x4a3520 : 0x3d2b1f; // Vary trunk color
        const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage based on type with more variation
        if (type === 'pine') {
            // Conical shape with varied colors - simplified
            const layers = 3; // Reduced from random 3-6
            const greenShade = Math.random() > 0.5 ? 0x1a4d2e : 0x0f3d1f;
            for (let i = 0; i < layers; i++) {
                const radius = (1.2 + Math.random() * 0.4) - (i * 0.25);
                const coneGeo = new THREE.ConeGeometry(radius, 1.5, 6); // Reduced segments from 8
                const coneMat = new THREE.MeshStandardMaterial({ color: greenShade, roughness: 0.8 });
                const cone = new THREE.Mesh(coneGeo, coneMat);
                cone.position.y = trunkHeight - 0.5 + (i * 1.3);
                cone.castShadow = true;
                group.add(cone);
            }
        } else if (type === 'oak') {
            // Rounded canopy with variation - simplified
            const canopySize = 1.5 + Math.random() * 1.0;
            const greenShade = [0x2d5a1e, 0x3a6b2e, 0x1f4d1a][Math.floor(Math.random() * 3)];
            const canopyGeo = new THREE.SphereGeometry(canopySize, 6, 6); // Reduced from 8,8
            const canopyMat = new THREE.MeshStandardMaterial({ color: greenShade, roughness: 0.8 });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.y = trunkHeight + canopySize * 0.5;
            canopy.scale.set(1 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 1 + Math.random() * 0.3);
            canopy.castShadow = true;
            group.add(canopy);
            // Removed second canopy layer for performance
        } else if (type === 'poplar') {
            // Tall, narrow with variation - simplified
            const canopyHeight = 3 + Math.random() * 1.5;
            const canopyRadius = 0.6 + Math.random() * 0.3;
            const greenShade = Math.random() > 0.5 ? 0x3a6b2e : 0x2d5a1e;
            const canopyGeo = new THREE.CylinderGeometry(canopyRadius * 0.7, canopyRadius * 1.2, canopyHeight, 6); // Reduced from 8
            const canopyMat = new THREE.MeshStandardMaterial({ color: greenShade, roughness: 0.8 });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.y = trunkHeight + canopyHeight / 2;
            canopy.castShadow = true;
            group.add(canopy);
        }

        // Random slight tilt for more natural look
        group.rotation.z = (Math.random() - 0.5) * 0.1;

        return group;
    }

    createFlowers(boundaryMinX, boundaryMaxX, boundaryMinZ, boundaryMaxZ) {
        const flowerCount = 150; // Reduced for performance
        const boundaryRadius = Math.sqrt(
            Math.pow((boundaryMaxX - boundaryMinX) / 2, 2) +
            Math.pow((boundaryMaxZ - boundaryMinZ) / 2, 2)
        );
        const minDistance = boundaryRadius * 0.85; // Flowers start OUTSIDE boundary

        const flowerTypes = [
            { type: 'simple', color: 0xff0000 },    // Red simple
            { type: 'simple', color: 0xffff00 },    // Yellow simple
            { type: 'simple', color: 0xffffff },    // White simple
            { type: 'simple', color: 0x9932cc },    // Purple simple
            { type: 'simple', color: 0xff69b4 },    // Pink simple
            { type: 'simple', color: 0xffa500 },    // Orange simple
            { type: 'tulip', color: 0xff0000 },     // Red tulip
            { type: 'tulip', color: 0xff69b4 },     // Pink tulip
            { type: 'tulip', color: 0xffff00 },     // Yellow tulip
            { type: 'daisy', color: 0xffffff },     // White daisy
            { type: 'rose', color: 0xff0000 },      // Red rose
            { type: 'rose', color: 0xff69b4 },      // Pink rose
            { type: 'sunflower', color: 0xffff00 }  // Sunflower
        ];

        for (let i = 0; i < flowerCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * 60;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            // Check if position is outside boundary (matches terrain irregularities)
            const isOutsideBoundary = (
                Math.abs(x) > 60 ||
                z < -90 || z > 40
            );

            if (!isOutsideBoundary) {
                // Skip - this is inside the boundary
                continue;
            }

            // Random flower type
            const flowerData = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];

            // Create flower
            const flower = this.createFlower(flowerData.type, flowerData.color);
            flower.position.set(x, 0.1, z);
            flower.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(flower);
        }
    }

    createFlower(type, color) {
        const group = new THREE.Group();

        // Stem
        const stemHeight = 0.2 + Math.random() * 0.2;
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, stemHeight, 4);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = stemHeight / 2;
        group.add(stem);

        const flowerY = stemHeight;

        if (type === 'tulip') {
            // Tulip - elongated cup shape
            const cupGeo = new THREE.ConeGeometry(0.08, 0.15, 6);
            const cupMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
            const cup = new THREE.Mesh(cupGeo, cupMat);
            cup.position.y = flowerY + 0.075;
            group.add(cup);
        } else if (type === 'daisy') {
            // Daisy - many thin petals
            const petalCount = 12;
            const petalGeo = new THREE.BoxGeometry(0.05, 0.01, 0.12);
            const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.set(Math.cos(angle) * 0.08, flowerY, Math.sin(angle) * 0.08);
                petal.rotation.y = angle;
                group.add(petal);
            }
            // Yellow center
            const centerGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
            const centerMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 });
            const center = new THREE.Mesh(centerGeo, centerMat);
            center.position.y = flowerY;
            center.rotation.x = Math.PI / 2;
            group.add(center);
        } else if (type === 'rose') {
            // Rose - layered petals
            const layers = 3;
            for (let layer = 0; layer < layers; layer++) {
                const petalCount = 5 + layer;
                const radius = 0.06 + layer * 0.02;
                const petalGeo = new THREE.SphereGeometry(0.05, 6, 6);
                const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
                for (let i = 0; i < petalCount; i++) {
                    const angle = (i / petalCount) * Math.PI * 2;
                    const petal = new THREE.Mesh(petalGeo, petalMat);
                    petal.position.set(
                        Math.cos(angle) * radius,
                        flowerY + 0.05 - layer * 0.02,
                        Math.sin(angle) * radius
                    );
                    petal.scale.set(1, 0.6, 0.8);
                    group.add(petal);
                }
            }
        } else if (type === 'sunflower') {
            // Sunflower - large with brown center
            const petalCount = 16;
            const petalGeo = new THREE.BoxGeometry(0.08, 0.02, 0.15);
            const petalMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.6 });
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.set(Math.cos(angle) * 0.12, flowerY, Math.sin(angle) * 0.12);
                petal.rotation.y = angle;
                group.add(petal);
            }
            // Brown center
            const centerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12);
            const centerMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.8 });
            const center = new THREE.Mesh(centerGeo, centerMat);
            center.position.y = flowerY;
            center.rotation.x = Math.PI / 2;
            group.add(center);
        } else {
            // Simple flower - 5 petals
            const petalCount = 5;
            const petalGeo = new THREE.SphereGeometry(0.08, 6, 6);
            const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.set(Math.cos(angle) * 0.1, flowerY, Math.sin(angle) * 0.1);
                petal.scale.set(1, 0.5, 1);
                group.add(petal);
            }
            // Yellow center
            const centerGeo = new THREE.SphereGeometry(0.05, 6, 6);
            const centerMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5 });
            const center = new THREE.Mesh(centerGeo, centerMat);
            center.position.y = flowerY;
            group.add(center);
        }

        return group;
    }

    createWaterFeatures() {
        // --- LAKE WITH DEPTH (ROUNDED SHAPE) ---
        const lakeRadius = 60; // Circular lake, wider
        const lakeDepth = 70;
        const waterDepth = 3; // Visual depth

        // Lake surface with animated waves - circular shape
        const lakeSurfaceGeo = new THREE.CircleGeometry(lakeRadius, 64);
        const vertices = lakeSurfaceGeo.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            vertices[i + 2] = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.15;
        }
        lakeSurfaceGeo.attributes.position.needsUpdate = true;
        lakeSurfaceGeo.computeVertexNormals();

        // Enhanced water material with better appearance
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: 0.75,
            roughness: 0.05,
            metalness: 0.6,
            side: THREE.DoubleSide,
            envMapIntensity: 1.5
        });

        this.lake = new THREE.Mesh(lakeSurfaceGeo, waterMat);
        this.lake.rotation.x = -Math.PI / 2;
        this.lake.position.set(0, 0.1, 100); // Positioned beyond boundary (boundary at ~Z=15)
        this.lake.receiveShadow = true;
        this.scene.add(this.lake);

        // Lake bottom (darker, gives depth perception) - circular
        const lakeBottomGeo = new THREE.CircleGeometry(lakeRadius, 64);
        const bottomMat = new THREE.MeshStandardMaterial({
            color: 0x003366,
            roughness: 0.9
        });
        const lakeBottom = new THREE.Mesh(lakeBottomGeo, bottomMat);
        lakeBottom.rotation.x = -Math.PI / 2;
        lakeBottom.position.set(0, -waterDepth, 100);
        lakeBottom.receiveShadow = true;
        this.scene.add(lakeBottom);

        // Lake sides for depth - circular ring
        const ringGeo = new THREE.CylinderGeometry(lakeRadius, lakeRadius, waterDepth, 64, 1, true);
        const sideMat = new THREE.MeshStandardMaterial({ color: 0x004488, side: THREE.DoubleSide });
        const lakeSides = new THREE.Mesh(ringGeo, sideMat);
        lakeSides.position.set(0, -waterDepth / 2, 100);
        this.scene.add(lakeSides);

        // Add dirt/sand area under the lake (no grass texture)
        const dirtRadius = lakeRadius + 5; // Slightly larger than lake
        const dirtGeo = new THREE.CircleGeometry(dirtRadius, 64);
        const dirtMat = new THREE.MeshStandardMaterial({
            color: 0x8b7355, // Brown dirt/sand color
            roughness: 0.95,
            metalness: 0.0
        });
        const dirtArea = new THREE.Mesh(dirtGeo, dirtMat);
        dirtArea.rotation.x = -Math.PI / 2;
        dirtArea.position.set(0, 0.01, 100); // Below water surface
        dirtArea.receiveShadow = true;
        this.scene.add(dirtArea);

        // --- MOUNTAIN RANGE IN DISTANCE (MOUNTAINOUS LANDSCAPE) ---

        // Main central mountain (tallest, with waterfall) - darker gray with rocks
        const mountainHeight = 80;
        const mountainWidth = 60;
        const mountainGeo = new THREE.ConeGeometry(mountainWidth, mountainHeight, 8);
        const mainMountainMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a, // Darker gray
            roughness: 0.95,
            metalness: 0.05
        });
        const mountain = new THREE.Mesh(mountainGeo, mainMountainMat);
        mountain.position.set(0, mountainHeight / 2, 200);
        mountain.castShadow = true;
        this.scene.add(mountain);

        // Add rocky outcrops to main mountain
        for (let i = 0; i < 12; i++) {
            const rockSize = 3 + Math.random() * 5;
            const rockGeo = new THREE.BoxGeometry(rockSize, rockSize, rockSize);
            const rockMat = new THREE.MeshStandardMaterial({
                color: 0x3a3a3a,
                roughness: 1.0
            });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const angle = (i / 12) * Math.PI * 2;
            const dist = mountainWidth * 0.4 + Math.random() * 15;
            rock.position.set(
                Math.cos(angle) * dist,
                10 + Math.random() * 40,
                200 + Math.sin(angle) * dist
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        // Add cracks/crevices to main mountain (dark lines)
        for (let i = 0; i < 6; i++) {
            const crackGeo = new THREE.PlaneGeometry(1, 10 + Math.random() * 15);
            const crackMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                roughness: 1.0,
                side: THREE.DoubleSide
            });
            const crack = new THREE.Mesh(crackGeo, crackMat);
            const angle = (i / 6) * Math.PI * 2;
            crack.position.set(
                Math.cos(angle) * (mountainWidth * 0.3),
                20 + Math.random() * 20,
                200 + Math.sin(angle) * (mountainWidth * 0.3)
            );
            crack.rotation.y = angle;
            crack.rotation.z = Math.random() * 0.3 - 0.15;
            this.scene.add(crack);
        }

        // Snow cap on main mountain
        const snowCapGeo = new THREE.ConeGeometry(mountainWidth * 0.5, mountainHeight * 0.35, 8);
        const snowMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7
        });
        const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
        snowCap.position.set(0, mountainHeight * 0.825, 200);
        this.scene.add(snowCap);

        // Left side mountains (smaller, varied colors)
        const leftMountainMat1 = new THREE.MeshStandardMaterial({
            color: 0x5a5050, // Reddish-brown tint
            roughness: 0.9,
            metalness: 0.1
        });
        const leftMountain1 = new THREE.Mesh(
            new THREE.ConeGeometry(25, 40, 7),
            leftMountainMat1
        );
        leftMountain1.position.set(-70, 20, 190);
        leftMountain1.castShadow = true;
        this.scene.add(leftMountain1);

        // Rocks on left mountain 1
        for (let i = 0; i < 4; i++) {
            const rockSize = 2 + Math.random() * 2;
            const rock = new THREE.Mesh(
                new THREE.BoxGeometry(rockSize, rockSize, rockSize),
                new THREE.MeshStandardMaterial({ color: 0x4a4040, roughness: 1.0 })
            );
            const angle = (i / 4) * Math.PI * 2;
            rock.position.set(
                -70 + Math.cos(angle) * 12,
                8 + Math.random() * 15,
                190 + Math.sin(angle) * 12
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        const leftSnow1 = new THREE.Mesh(
            new THREE.ConeGeometry(12, 14, 7),
            snowMat
        );
        leftSnow1.position.set(-70, 34, 190);
        this.scene.add(leftSnow1);

        const leftMountainMat2 = new THREE.MeshStandardMaterial({
            color: 0x505a5a, // Bluish-gray tint
            roughness: 0.92,
            metalness: 0.08
        });
        const leftMountain2 = new THREE.Mesh(
            new THREE.ConeGeometry(22, 35, 6),
            leftMountainMat2
        );
        leftMountain2.position.set(-120, 17.5, 210);
        leftMountain2.castShadow = true;
        this.scene.add(leftMountain2);

        // Rocks on left mountain 2
        for (let i = 0; i < 3; i++) {
            const rockSize = 1.5 + Math.random() * 2;
            const rock = new THREE.Mesh(
                new THREE.BoxGeometry(rockSize, rockSize, rockSize),
                new THREE.MeshStandardMaterial({ color: 0x404a4a, roughness: 1.0 })
            );
            const angle = (i / 3) * Math.PI * 2;
            rock.position.set(
                -120 + Math.cos(angle) * 10,
                6 + Math.random() * 12,
                210 + Math.sin(angle) * 10
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        const leftSnow2 = new THREE.Mesh(
            new THREE.ConeGeometry(11, 12, 6),
            snowMat
        );
        leftSnow2.position.set(-120, 29, 210);
        this.scene.add(leftSnow2);

        // Right side mountains (smaller, varied colors)
        const rightMountainMat1 = new THREE.MeshStandardMaterial({
            color: 0x5a5a50, // Greenish-gray tint
            roughness: 0.91,
            metalness: 0.09
        });
        const rightMountain1 = new THREE.Mesh(
            new THREE.ConeGeometry(24, 38, 7),
            rightMountainMat1
        );
        rightMountain1.position.set(75, 19, 195);
        rightMountain1.castShadow = true;
        this.scene.add(rightMountain1);

        // Rocks on right mountain 1
        for (let i = 0; i < 4; i++) {
            const rockSize = 2 + Math.random() * 2;
            const rock = new THREE.Mesh(
                new THREE.BoxGeometry(rockSize, rockSize, rockSize),
                new THREE.MeshStandardMaterial({ color: 0x4a4a40, roughness: 1.0 })
            );
            const angle = (i / 4) * Math.PI * 2;
            rock.position.set(
                75 + Math.cos(angle) * 11,
                7 + Math.random() * 14,
                195 + Math.sin(angle) * 11
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        const rightSnow1 = new THREE.Mesh(
            new THREE.ConeGeometry(12, 13, 7),
            snowMat
        );
        rightSnow1.position.set(75, 32, 195);
        this.scene.add(rightSnow1);

        const rightMountainMat2 = new THREE.MeshStandardMaterial({
            color: 0x555555, // Neutral gray
            roughness: 0.93,
            metalness: 0.07
        });
        const rightMountain2 = new THREE.Mesh(
            new THREE.ConeGeometry(20, 32, 6),
            rightMountainMat2
        );
        rightMountain2.position.set(110, 16, 215);
        rightMountain2.castShadow = true;
        this.scene.add(rightMountain2);

        // Rocks on right mountain 2
        for (let i = 0; i < 3; i++) {
            const rockSize = 1.5 + Math.random() * 2;
            const rock = new THREE.Mesh(
                new THREE.BoxGeometry(rockSize, rockSize, rockSize),
                new THREE.MeshStandardMaterial({ color: 0x454545, roughness: 1.0 })
            );
            const angle = (i / 3) * Math.PI * 2;
            rock.position.set(
                110 + Math.cos(angle) * 9,
                5 + Math.random() * 11,
                215 + Math.sin(angle) * 9
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(rock);
        }

        const rightSnow2 = new THREE.Mesh(
            new THREE.ConeGeometry(10, 11, 6),
            snowMat
        );
        rightSnow2.position.set(110, 27, 215);
        this.scene.add(rightSnow2);


    }

    toggleBoundaryVisibility(visible) {
        if (!this.boundaryWalls) return;

        const targetOpacity = visible ? 0.3 : 0;
        this.boundaryWalls.forEach(wall => {
            wall.material.opacity = targetOpacity;
        });
    }

    toggleEntranceDoorCollision(isOpen) {
        if (!this.entranceDoorCollision) return;

        if (isOpen && this.entranceDoorClosed) {
            // Door opening - remove collision
            const index = this.collidables.indexOf(this.entranceDoorCollision);
            if (index > -1) {
                this.collidables.splice(index, 1);
            }
            this.entranceDoorClosed = false;
        } else if (!isOpen && !this.entranceDoorClosed) {
            // Door closing - add collision back
            this.collidables.push(this.entranceDoorCollision);
            this.entranceDoorClosed = true;
        }
    }

    addHallwayDecorations(room, width, depth) {
        // Helper method to add decorative shapes to hallway walls
        // Only decorates LATERAL walls (East and West), not entrance/exit walls
        const shapes = ['circle', 'triangle', 'square', 'hexagon', 'diamond'];
        const colors = [
            0xFF6B35, // Orange
            0xF7931E, // Bright Orange
            0xFDC830, // Yellow
            0x4ECDC4, // Turquoise
            0x44A08D, // Green
            0x667EEA, // Purple
            0xF093FB, // Pink
            0xC471F5  // Violet
        ];

        const decorY = 2.0; // Middle height

        // Add decorations ONLY to East and West walls (lateral walls)
        const eastX = width / 2 - 0.26;
        const westX = -width / 2 + 0.26;

        const numDecorations = Math.floor(depth / 1.5);

        for (let i = 0; i < numDecorations; i++) {
            const offsetZ = (i - (numDecorations - 1) / 2) * 1.5;

            // East wall decoration
            const shapeE = shapes[Math.floor(Math.random() * shapes.length)];
            const colorE = colors[Math.floor(Math.random() * colors.length)];
            const sizeE = 0.3 + Math.random() * 0.2;

            const decorE = new WallDecoration(shapeE, sizeE, colorE);
            decorE.setPosition(eastX, decorY, offsetZ);
            decorE.setRotation(0, -Math.PI / 2, 0);
            room.group.add(decorE.mesh);

            // West wall decoration
            const shapeW = shapes[Math.floor(Math.random() * shapes.length)];
            const colorW = colors[Math.floor(Math.random() * colors.length)];
            const sizeW = 0.3 + Math.random() * 0.2;

            const decorW = new WallDecoration(shapeW, sizeW, colorW);
            decorW.setPosition(westX, decorY, offsetZ);
            decorW.setRotation(0, Math.PI / 2, 0);
            room.group.add(decorW.mesh);
        }
    }

    init() {
        // --- 1. Habitación Central (Recepción) ---
        // Pos: 0,0 | Size: 20x20 | Color: Cream (0xF5F5DC)
        const centralRoom = new Room(this.scene, 0, 0, 20, 20, 0xF5F5DC);
        // Abrir puertas en lados Este y Oeste para conectar pasillos laterales
        centralRoom.addDoor('East', 4, 3.5);
        centralRoom.addDoor('West', 4, 3.5);

        // -- MOBILIARIO RECEPCIÓN --

        // Escritorio
        const desk = new Desk(4.5, 1.3, 0.8);
        desk.setPosition(0, 0, -6.0);
        desk.setRotation(Math.PI);
        this.scene.add(desk.mesh);
        this.desk = desk; // Keep reference for update
        if (this.desk.drawers) {
            this.desk.drawers.forEach(d => {
                this.interactables.push(d.interactableMesh);
            });
        }

        // Hint Note interaction
        if (this.desk.hintNote) {
            this.interactables.push(this.desk.hintNote.interactableMesh);
        }

        if (this.desk.secretNote) {
            this.interactables.push(this.desk.secretNote.interactableMesh);
        }

        // Computadora Retro
        const pc = new RetroComputer();
        pc.setPosition(0, 0.8, -6.0);
        pc.setRotation(Math.PI);
        this.scene.add(pc.mesh);
        this.interactables.push(pc.interactableMesh);
        const wasteBasket = new WasteBasket();
        // Position: Under desk extension (Left Wing).
        // Left Wing Center X (Global) = 1.85. Z = -7.35.
        // Let's put it on floor.
        wasteBasket.setPosition(2.2, 0, -6.5);
        this.scene.add(wasteBasket.mesh);
        this.interactables.push(wasteBasket.interactableMesh);

        // Flashlight in 3rd Drawer (Bottom Right Wing?)
        // Desk creates 3 drawers in Right Wing (indices 0, 1, 2) if loop is 0..2
        // Drawer 2 is the bottom one.
        if (this.desk.drawers && this.desk.drawers.length > 2) {
            const flashlight = new FlashlightItem();
            // Add to drawer hierarchy, not scene directly (so it moves with drawer)
            // Drawer adds items via addItem()
            this.desk.drawers[2].addItem(flashlight.mesh);

            // Position relative to drawer center
            flashlight.mesh.position.set(0, 0.05, 0);
            flashlight.mesh.rotation.y = Math.PI / 4;

            // Ensure interactable is tracked
            this.interactables.push(flashlight.interactableMesh);
            // Note: Drawer.addItem already checks for interactable userData!
            // Let's verify FlashlightItem.build adds hitbox with userData type='flashlight'.
            // Yes it does.
        }

        // --- ESTATUAS (Afrodita & Atenea) ---
        // Clock is presumably on North Wall (Z = -10).
        // Desk is at Z = -6.
        // Statues should be against the wall, flanking the clock?

        // Afrodita (Izquierda del reloj, mirando al frente)
        // Clock is at 0 (X). Left is -X (West) or +X (East)?
        // User view (Facing North): Left is West (-X).

        // --- ADDING STATUES ---
        // We will assume Statue is imported or available via the bundle if I add it to import list.
        // I need to update the import statement at top of file separately if I can't do it here. 
        // I will do it in a separate step to be safe, or just assume the previous replace handled imports? 
        // No, I need to update imports.
        // I'll add the code here and then update imports.

        const aphrodite = new Statue('aphrodite');
        aphrodite.setPosition(-6, 0, -9.0); // Left, Back
        aphrodite.setRotation(Math.PI / 4); // Angled towards center
        this.scene.add(aphrodite.mesh);

        const athena = new Statue('athena');
        athena.setPosition(6, 0, -9.0); // Right, Back
        athena.setRotation(-Math.PI / 4); // Angled towards center
        this.scene.add(athena.mesh);

        // Lámpara de Escritorio
        const deskLamp = new DeskLamp();
        deskLamp.setPosition(0.7, 0.8, -6.0);
        deskLamp.setRotation(Math.PI - 0.2);
        this.scene.add(deskLamp.mesh);
        this.interactables.push(deskLamp.interactableMesh);
        this.deskLamp = deskLamp; // Store ref

        // Palanca (Lever)
        this.lever = new Lever();
        // Moved to front of lamp (Lamp is at 0.7, 0.8, -6.0)
        // User requested "more to the left" (Left from desk view is +X). Moving to 1.0
        this.lever.setPosition(1.0, 0.8, -6.4);
        this.lever.setRotation(Math.PI);
        this.scene.add(this.lever.mesh);
        this.interactables.push(this.lever.interactableMesh);

        // Phone (Retro Style)
        // Right side of desk.
        // Desk Width 4.5. Center 0.
        // Right side is +X (Global -X is Right Wing? No, let's re-verify).
        // Desk Rotation.y = PI.
        // Desk Local +X is Global -X.
        // Desk Local Right is -X? No.
        // Desk is facing +Z (Visitor). User sits at -Z side?
        // Wait. Desk.build():
        // top.position.y = height.
        // Desk is at 0,0,-6. Rot PI.
        // So Local +Z points into the room (South).
        // User sits "behind" it (North side).
        // User view: Global +Z (South).
        // "Right side" from user perspective (sitting behind desk) is Global West (-X).
        // Or Global East (+X)?
        // If I sit at 0,0,-7 facing South (0,0,-5):
        // Right is West (-X). Left is East (+X).
        // Lever is at 1.0 (East/Left) which user said "move closer to left".
        // Phone needs to be on "Right side". So West (-X)?
        // User said "del lado derecho agrga un telfono".
        // Let's put it at X = -1.0 (West).

        const phone = new Phone(this.soundManager);
        // Symmetrical with Lamp (0.7, 0.8, -6.0)
        phone.setPosition(-0.7, 0.8, -6.0);
        phone.setRotation(Math.PI); // Face user
        this.scene.add(phone.mesh);
        this.interactables.push(phone.interactableMesh);

        // Pila de Papeles (Messy Stack)
        const paperStack = new PaperStack(120); // 120 papers
        // Position: Desk Extension (Left Wing).
        // Left Wing Center X (Global) = 1.85. Z = -7.35.
        // Corner of extension? Extension Width 0.8, Depth 1.5.
        // Let's put it slightly offset from center of wing.
        // X = 1.6 (Towards desk). Z = -7.0 (Towards visitor).
        paperStack.setPosition(1.7, 0.8, -7.0);
        paperStack.setRotation(Math.random() * Math.PI / 4); // Slight rotation
        this.scene.add(paperStack.mesh);
        this.interactables.push(paperStack.interactableMesh);


        // Reloj de Pared
        this.clock = new Clock();
        this.clock.mesh.position.set(0, 2.0, -9.8);
        this.scene.add(this.clock.mesh);

        // Colisión Escritorio (U-Shape)
        // 1. Main Desk
        // Desk Pos: 0, 0, -6. Rot: PI (180).
        // Main Desk Width: 4.5.
        const deskCollMainGeo = new THREE.BoxGeometry(4.5, 2, 1.3);
        const deskMainColl = new THREE.Mesh(deskCollMainGeo, new THREE.MeshBasicMaterial({ visible: false }));
        deskMainColl.position.set(0, 1, -6.0);
        this.scene.add(deskMainColl);
        this.collidables.push(deskMainColl);

        // 2. Wings (Extensions)
        // Wing Size: 0.8 width, 1.5 depth.
        // Desk Width 4.5.
        // Wing Center X (Global reflected): +/- 1.85.
        // Wing Z: -7.35.

        const wingCollGeo = new THREE.BoxGeometry(0.8, 2, 1.5);

        // Left Wing (Global Right)
        const wingL_Coll = new THREE.Mesh(wingCollGeo, new THREE.MeshBasicMaterial({ visible: false }));
        // Global X = +1.85
        wingL_Coll.position.set(1.85, 1, -7.35);
        this.scene.add(wingL_Coll);
        this.collidables.push(wingL_Coll);

        // Right Wing (Global Left)
        const wingR_Coll = new THREE.Mesh(wingCollGeo, new THREE.MeshBasicMaterial({ visible: false }));
        // Global X = -1.85
        wingR_Coll.position.set(-1.85, 1, -7.35);
        this.scene.add(wingR_Coll);
        this.collidables.push(wingR_Coll);

        // Lamparas de Pie
        const lamp1 = new FloorLamp();
        lamp1.setPosition(-9, 0, -9);
        this.scene.add(lamp1.mesh);
        this.floorLamps.push(lamp1);
        this.interactables.push(lamp1.interactableMesh);

        const lamp2 = new FloorLamp();
        lamp2.setPosition(9, 0, 9);
        this.scene.add(lamp2.mesh);
        this.floorLamps.push(lamp2);
        this.interactables.push(lamp2.interactableMesh);

        // Candelabro
        this.chandelier = new Chandelier();
        this.chandelier.setPosition(0, 3, 0);
        this.scene.add(this.chandelier.mesh);

        // Cuadros Central
        // centralRoom.addPaintingToWall('North', 4, 3, '', 'Mona Lisa (Falsa)', 'Una copia muy convincente.', '1', 6, 0);

        // Placeholder Grande 14 (Pared Oeste, Lado Sur)
        centralRoom.addPaintingToWall('West', 3, 3, 'cuadros/14.jpg', 'P-14', 'Cuadro 14', 'Grande', -5, 0);

        // Add Letter to Painting 14
        if (centralRoom.paintings.length > 0) {
            const p14 = centralRoom.paintings[centralRoom.paintings.length - 1];
            p14.mesh.userData.painting.letterData = {
                title: "La Noche Estrellada",
                place: "Tus Ojos",
                body: "En vos existe la plenitud, en vos existe el universo, tus ojos como soles iluminan mis días, y tu sonrisa como la luna calma el ardor de mi día. Ay amor mío, no ves que la noche es una combinación de las estrellas y la luna? Como no he de estar cómodo en ella?",
                signature: "Mandarino"
            };
        }

        // Puerta Principal (Sur)
        centralRoom.addDoor('South', 4, 3.5);
        this.mainDoor = new DoubleDoor(4, 3.5);
        this.mainDoor.setPosition(0, 0, 10);
        this.scene.add(this.mainDoor.mesh);
        this.interactables.push(this.mainDoor.interactableMesh);

        // Entrance Door Collision Box (blocks passage when door is closed)
        const doorCollisionGeo = new THREE.BoxGeometry(4, 3.5, 0.3);
        this.entranceDoorCollision = new THREE.Mesh(
            doorCollisionGeo,
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.entranceDoorCollision.position.set(0, 1.75, 10);
        this.scene.add(this.entranceDoorCollision);
        // Add to collidables initially (door starts closed)
        this.collidables.push(this.entranceDoorCollision);
        this.entranceDoorClosed = true; // Track door state

        // Set callback to toggle collision when door opens/closes
        this.mainDoor.onToggle = (isOpen) => {
            this.toggleEntranceDoorCollision(isOpen);
        };

        // Breakable Vases at Entrance (Inside)
        const vaseLeft = new BreakableVase('orchid');
        vaseLeft.setPosition(-2.5, 0, 9);
        this.scene.add(vaseLeft.mesh);
        this.interactables.push(vaseLeft.interactableMesh);

        const vaseRight = new BreakableVase('orchid');
        vaseRight.setPosition(2.5, 0, 9);
        vaseRight.setRotation(Math.PI / 6); // Slight rotation for variety
        this.scene.add(vaseRight.mesh);
        this.interactables.push(vaseRight.interactableMesh);

        // Ventanas Sur
        centralRoom.addCenteredWindow('South_L', 2, 2.5, 2);
        centralRoom.addCenteredWindow('South_R', 2, 2.5, 2);

        // Decoración Exterior
        const orchidLeft = new OrchidPot();
        orchidLeft.mesh.position.set(-3, 0, 11);
        this.scene.add(orchidLeft.mesh);

        const orchidRight = new OrchidPot();
        orchidRight.mesh.position.set(3, 0, 11);
        orchidRight.mesh.rotation.y = Math.PI / 4;
        this.scene.add(orchidRight.mesh);

        const flowerBoxL = new WindowFlowerBox(2.2);
        flowerBoxL.mesh.position.set(-6, 0.6, 10.4);
        this.scene.add(flowerBoxL.mesh);

        // Mesa Cruzada con Jarron (Esquina SW)
        const cornerTable = new CornerTable();
        cornerTable.setPosition(-9, 0, 9);
        this.scene.add(cornerTable.mesh);
        this.interactables.push(cornerTable.mesh); // In case we add interaction later

        const vase = new OrchidPot();
        // Table Height 0.7. Pot needs to sit on top.
        // OrchidPot.build sets y=0.2 (floor sit). To sit on 0.7, we need to add 0.7 - 0.2? No.
        // OrchidPot is built at local 0,0,0 range.
        // We set vase.mesh.position.
        // If vase sits on floor (y=0), elements are at +y.
        // If we put it at y=0.7, it sits on table.
        vase.mesh.position.set(-9, 0.7, 9);
        this.scene.add(vase.mesh);

        // Barreras de Museo (Frente a Cuadro 14)
        // P-14 está en Pared Oeste (X=-10), Z=-5.
        // Colocamos barrera a X=-8.0, Z=-5. Rotada 90 grados.
        const barrier = new MuseumBarrier(3.5);
        barrier.setPosition(-8.5, 0, -5);
        barrier.setRotation(Math.PI / 2);
        this.scene.add(barrier.mesh);
        this.collidables.push(barrier.collidableMesh); // Use the invisible hitbox

        // Replica Barrera (Lado Norte, Z=5)
        const barrier2 = new MuseumBarrier(3.5);
        barrier2.setPosition(-8.5, 0, 5);
        barrier2.setRotation(Math.PI / 2);
        this.scene.add(barrier2.mesh);
        this.collidables.push(barrier2.collidableMesh);

        const flowerBoxR = new WindowFlowerBox(2.2);
        flowerBoxR.mesh.position.set(6, 0.6, 10.4);
        this.scene.add(flowerBoxR.mesh);

        // Alfombra Roja
        const carpet = new RedCarpet(3, 15);
        carpet.setPosition(0, 0.01, 2.5);
        this.scene.add(carpet.mesh);

        // Silla
        const chair = new Chair();
        chair.setPosition(0, 0, -7.2);
        chair.setRotation(Math.PI);
        this.scene.add(chair.mesh);
        this.interactables.push(chair.interactableMesh);

        this.addRoom(centralRoom, 'CENTRAL');


        // --- ALA OESTE (IZQUIERDA) ---
        // L1 -> L2 -> L3 (Hacia el Norte, axis -Z)

        // --- Room L1 (Oeste Inmediato) ---
        // Pos: -25, 0
        const roomL1 = new Room(this.scene, -25, 0, 15, 15, 0xF5F5DC);
        roomL1.addDoor('East', 4, 3.5); // Conecta con Recepción
        roomL1.addDoor('North', 4, 3.5); // Conecta con L2

        // Cuadros L1
        roomL1.addPaintingToWall('North', 3, 3, 'cuadros/15.jpg', 'P-15', 'Cuadro 15', 'Grande', -4.75, 0);

        // Add Letter to Painting 15
        if (roomL1.paintings.length > 0) {
            const p15 = roomL1.paintings[roomL1.paintings.length - 1];
            p15.mesh.userData.painting.letterData = {
                title: "Musico Musiquista",
                place: "El ensueño",
                date: "",
                body: "Un musico, un musico que es cantante y que canta, que canta acerca de tus ojos, que toca acerca de tu mirada, y que en sus versos exclama \"Te amo, Giovana\"",
                signature: "Yo mismo"
            };
        }

        // Marcos para Vinilos (Grid 2x3 en Pared Oeste)
        // Pared Oeste L1 está en X = -32.5.
        const frameX = -32.2;
        // User wants ID ordering: Start Top-Left -> 1, 2, 3 (Row 1), 4, 5, 6 (Row 2).
        // On West Wall (Looking West), Left is South (+Z). Right is North (-Z).
        // So Z order needs to be [Positive, 0, Negative].

        // RE-CENTERING (Total 6 cols now).
        // Wall Center Z=0. Original Group Left (South), Generic Group Right (North).
        // Columns: 3.25, 1.95, 0.65 | -0.65, -1.95, -3.25

        const frameZ_Centers = [3.25, 1.95, 0.65]; // Left Group (Originals)
        const frameY_Centers = [2.5, 1.2]; // Top row, Bottom row

        const vinylColors = [
            0xFF0000, 0x0000FF, 0x00FF00, // Red, Blue, Green
            0xFFFF00, 0xFF00FF, 0x00FFFF  // Yellow, Magenta, Cyan
        ];

        const vinylTitles = [
            "Her",
            "Contigo",
            "La Gloria Eres Tu",
            "Every Breath You Take",
            "Labios Rotos",
            "Is This Love"
        ];

        let vIndex = 0;

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                const vf = new VinylFrame();
                vf.setPosition(frameX, frameY_Centers[r], frameZ_Centers[c]);
                vf.setRotation(Math.PI / 2); // Face East

                // Initialize Vinyl
                const vID = vIndex + 1;
                const color = vinylColors[vIndex];
                const title = vinylTitles[vIndex];
                vf.setVinyl(vID, color, title);

                this.scene.add(vf.mesh);

                // Add to interactables for click detection
                this.interactables.push(vf.mesh);

                vIndex++;
            }
        }
        // --- GENERIC VINYLS (6 More, to the Right/North) ---
        // New Z set for centering.
        const genericZ_Centers = [-0.65, -1.95, -3.25]; // Right Group

        const genericTitles = [
            "Tomando Té",
            "Prófugos",
            "Cup of Tea",
            "Hey",
            "Golden Hour",
            "Misty"
        ];

        // Reset local index for this array, but vIndex continues globally for ID
        let gIndex = 0;

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                const vf = new VinylFrame();
                // Same X and Y, shifted Z
                vf.setPosition(frameX, frameY_Centers[r], genericZ_Centers[c]);
                vf.setRotation(Math.PI / 2);

                const vID = vIndex + 1;
                // Random pastel color
                const color = Math.random() * 0xFFFFFF;

                // Use title from array
                const title = genericTitles[gIndex] || vID.toString();
                vf.setVinyl(vID, color, title);

                this.scene.add(vf.mesh);
                this.interactables.push(vf.mesh);

                vIndex++;
                gIndex++;
            }
        }

        // Tocadiscos en mesita (Esquina SW: X cerca de -32.5, Z cerca de +7.5)
        const recordTable = new RecordPlayerTable();
        // X = -31.5 (1m from West), Z = 6.5 (1m from South)
        recordTable.setPosition(-31.5, 0, 6.5);
        recordTable.setRotation(Math.PI / 4); // Angled 45 deg
        this.scene.add(recordTable.mesh);

        this.recordPlayer = recordTable; // Access for main.js

        // Piano (Pared Izquierda/South Wall)
        // Room L1 Center (-25, 0). South Wall Z = 7.5.
        // Place Piano against South Wall. X centered or slightly offset.
        // X range [-32.5, -17.5]. Center X = -25.
        const piano = new Piano();
        piano.setPosition(-25, 0, 0); // Centered in Room L1
        piano.setRotation(-Math.PI / 6); // Diagonal placement
        this.scene.add(piano.mesh);
        this.interactables.push(piano.mesh); // Or piano.interactableMesh if set? Yes it has hitBox with userData.
        // this.interactables.push(recordTable.mesh); // Future interaction

        // --- Wall Instruments (South Wall L1) ---
        // South Wall Z = 7.5. Inner Z approx 7.4. Moved to 7.0 to avoid clipping/invisibility.
        // Center X = -25. Spacing 3 units.
        const criolla = new WallInstrument('criolla', -25, 1.0, 7.0, Math.PI); // Center
        this.scene.add(criolla.mesh);

        const rock = new WallInstrument('rock', -22, 1.0, 7.0, Math.PI); // Right (East of Center)
        this.scene.add(rock.mesh);

        // Violin adjusted to be slightly higher as per user request (Y=1.3)
        const violin = new WallInstrument('violin', -28, 1.3, 7.0, Math.PI); // Left (West of Center)
        this.scene.add(violin.mesh);

        // --- Central Rug (Room L1) ---
        const centralRug = new CentralRug();
        centralRug.setPosition(-25, 0, 0); // Center of L1
        this.scene.add(centralRug.mesh);

        // --- ARCADE MACHINE (Room L1) ---
        const arcade = new ArcadeMachine();
        arcade.setPosition(-18, 0, -4); // East wall area
        arcade.setRotation(-Math.PI / 2); // Facing West (into room)

        // Interaction setup
        arcade.mesh.userData = { type: 'arcade' };
        // Traverse to ensure children also have the data if raycast hits them
        arcade.mesh.traverse((child) => {
            if (child.isMesh) {
                child.userData = { type: 'arcade', parent: arcade.mesh };
            }
        });

        this.scene.add(arcade.mesh);
        this.interactables.push(arcade.mesh);

        const arcadeBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 2, 0.8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        arcadeBox.position.set(-18, 1, -4);
        this.collidables.push(arcadeBox);
        this.scene.add(arcadeBox);

        this.addRoom(roomL1, 'L1');

        // Pasillo Central <-> L1
        const hallCent_L1 = new Room(this.scene, -13.75, 0, 7.5, 4, 0xF5F5DC);
        hallCent_L1.addDoor('East', 4, 4);
        hallCent_L1.addDoor('West', 4, 4);
        this.addRoom(hallCent_L1, 'HALL_L1');



        // --- Room L2 (Norte de L1) ---
        // Pos: -25, -25     (Gap logic: L1 End Z=-7.5. L2 Start Z=-17.5. Center L2=-25)
        const roomL2 = new Room(this.scene, -25, -25, 15, 15, 0xF5F5DC);
        roomL2.addDoor('South', 4, 3.5); // Conecta con L1
        roomL2.addDoor('North', 4, 3.5); // Conecta con L3

        // Cuadros L2 (ELIMINADOS)

        // --- FOXY THE PIRATE FOX (CINEMA ROOM) ---
        // Room Center: -25, -25. Size 15x15.
        // Corner placement: 
        // SW Corner: -31.5, -31.5 ??
        // Let's place him in a corner facing the center.
        // NE Corner: -18.5, -31.5 ? No, Z grows South (+Z). -25 is center. 
        // North is -Z (-32.5). South is +Z (-17.5).
        // West is -X (-32.5). East is +X (-17.5).
        // Let's put him in NW Corner (-31, -31).
        const foxy = new Foxy();
        foxy.setPosition(-31, 0, -31);
        foxy.setRotation(Math.PI / 4); // Facing SE (Center)
        this.scene.add(foxy.mesh);

        // --- MANGLE (The Mangle) ---
        // SE Corner of L2
        const mangle = new Mangle();
        mangle.setPosition(-19, 0, -19);
        mangle.setRotation(-Math.PI * 0.75); // Facing NW (Center)
        this.scene.add(mangle.mesh);

        // Breakable Vase at L2 Entrance (Right Side)
        // L2 South door is at Z=-17.5, right side (East) would be +X from center
        const vaseL2 = new BreakableVase('snakePlant');
        vaseL2.setPosition(-23, 0, -17); // Right side of entrance
        this.scene.add(vaseL2.mesh);
        this.interactables.push(vaseL2.interactableMesh);


        // --- CINEMA SETUP ---
        const cinemaScreen = new CinemaScreen();
        // Room L2 Size 15x15. Center relative to room group is 0,0.
        // North Wall is at Z = -7.5.
        // Place screen close to North Wall.
        cinemaScreen.setPosition(-7.3, 0, 0); // West wall (left side of room)
        cinemaScreen.setRotation(Math.PI / 2); // Face East 
        roomL2.group.add(cinemaScreen.mesh);

        const oldCamera = new OldCamera();
        // Camera near South Wall (Z = 7.5), facing North (Screen).
        // Rotate PI to face North? Default often faces +Z. 
        // If Default faces +Z (South), rotate PI to face -Z (North).
        // Let's assume Camera lens faces +Z by default?
        // In my build(): lens.position.set(0, 1.3, 0.4); -> +Z.
        // So to face North (-Z), rotate PI.
        oldCamera.setPosition(6, 0, 0); // 5 units back
        oldCamera.setRotation(-Math.PI / 2);
        roomL2.group.add(oldCamera.mesh);
        this.interactables.push(oldCamera.interactableMesh); // Make camera clickable

        // Store references for video playback
        this.cinemaScreen = cinemaScreen;
        this.oldCamera = oldCamera;

        // Add Camera to interactables? User didn't ask, but good practice.
        // Since OldCamera is just a visual prop for now, we leave it.
        // Unless user wants to look through it? User said 'una camara estilo antiguo'.
        // Let's just place it.
        this.addRoom(roomL2, 'L2');

        // --- GLOBO TERRÁQUEO ---
        // Center of L2: -25, -25
        const globe = new Globe();
        globe.setPosition(-31, 0, -44); // Moved to L3 SW Corner
        this.scene.add(globe.mesh);
        this.interactables.push(globe.interactableMesh);

        // Pasillo L1 <-> L2 (Vertical)
        // Center X = -25.
        // Z Gap: -7.5 to -17.5. Center Z = -12.5. Length 10. Width 4.
        const hallL1_L2 = new Room(this.scene, -25, -12.5, 4, 10, 0xF5F5DC);
        hallL1_L2.addDoor('South', 4, 4);
        hallL1_L2.addDoor('North', 4, 4);
        this.addRoom(hallL1_L2, 'HALL_L2');

        // Add wall decorations
        this.addHallwayDecorations(hallL1_L2, 4, 10);

        // --- Room L3 (Norte de L2) ---
        // Pos: -25, -50
        const roomL3 = new Room(this.scene, -25, -50, 15, 15, 0xF5F5DC);
        roomL3.addDoor('South', 4, 3.5); // Conecta con L2
        roomL3.addDoor('North', 4, 4);   // Conecta con el Pasillo Secreto (detrás de estantería)

        // Cuadros L3 (ELIMINADOS)

        this.addRoom(roomL3, 'L3');

        // Pasillo L2 <-> L3
        // Z Gap: -32.5 to -42.5. Center Z = -37.5.
        const hallL2_L3 = new Room(this.scene, -25, -37.5, 4, 10, 0xF5F5DC);
        hallL2_L3.addDoor('South', 4, 4);
        hallL2_L3.addDoor('North', 4, 4);
        this.addRoom(hallL2_L3, 'HALL_L3');

        // Add wall decorations
        this.addHallwayDecorations(hallL2_L3, 4, 10);


        // --- ALA ESTE (DERECHA) ---
        // R1 -> R2 -> R3 (Hacia el Norte)

        // --- Room R1 (Este Inmediato) ---
        // Pos: 25, 0
        const roomR1 = new Room(this.scene, 25, 0, 15, 15, 0xF5F5DC);
        roomR1.addDoor('West', 4, 3.5); // Conecta con Recepción
        roomR1.addDoor('North', 4, 3.5); // Conecta con R2

        // Distribución R1 (5 Cuadros)
        // Pared Sur (3 cuadros)
        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/1.jpg', 'P-01', 'Espacio para Cuadro 1', 'Pendiente de asignar');

        // Add Letter to Painting 1
        if (roomR1.paintings.length > 0) {
            // The last added painting is P-01 (since we just added it and it's the first one in R1?? No wait, check logic)
            // addPaintingToWall pushes to this.paintings.
            // If it's the first one in R1, it's at index 0.
            // CAUTION: existing code might have added paintings before? 
            // In the snippet, it seems to be the first one.
            // Let's rely on finding it or just assuming it's the last one added *if* we do it immediately.
            const p01 = roomR1.paintings[roomR1.paintings.length - 1];
            // Better safety: In addPaintingToWall we pass ID 'P-01'. 
            // usage: addPaintingToWall(wall, w, h, tex, id, title, desc, offU, offV)

            p01.mesh.userData.painting.letterData = {
                title: "No Hace Mucho",
                place: "Parque de las Naciones",
                // Date removed
                body: "Caminando a tu lado descubri que el mundo lo tiene todo para ofrecer, caminando a tu lado la existenica fue mas soportable, caminando a tu lado comencé a soñar, caminando a tu lado mis sueños se hacen realidad.",
                signature: "David (Grande)"
            };
        }

        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/2.jpg', 'P-02', 'Espacio para Cuadro 2', 'Pendiente de asignar', 3, 0); // Offset Right

        // Add Letter to Painting 2
        if (roomR1.paintings.length > 0) {
            const p02 = roomR1.paintings[roomR1.paintings.length - 1];
            p02.mesh.userData.painting.letterData = {
                title: "Celebración de la Vida",
                place: "Tu casa",
                body: "Recordas ese dia amor? Que trate de besarte mientras te tenia en mis brazos y que algunos se sorprendieron? Que me uní un poco más a tu familia y a tu circulo? Estabas deslumbrante, preciosa. A veces sueño recreando el momento exacto de esa foto, porque estaba emocionado de participar en algo tan importante como tu cumpleaños.",
                signature: "Rulitos"
            };
        }
        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/3.jpg', 'P-03', 'Espacio para Cuadro 3', 'Pendiente de asignar', -3, 0); // Offset Left

        // Add Letter to Painting 3
        if (roomR1.paintings.length > 0) {
            const p03 = roomR1.paintings[roomR1.paintings.length - 1];
            p03.mesh.userData.painting.letterData = {
                title: "El Día más Feliz de mi Vida",
                place: "Mi Casa",
                body: "Ese día, ese frabulloso día, que me diste el si, que me permitiste ser parte de tu alma mediante una palabra tan sencilla pero tan poderosa, que con nuestras almas sabíamos que no volveriamos a estar solos ni pasar frío ni en el invierno más cruel. Y acá estamos, hace un año de ese día, y quiero que renovemos ese voto de confianza, de amor, una vez más, un año más, te amo mi Naranjita preciosa.",
                signature: "Tu Novio"
            };
        }

        // Pared Este (2 cuadros)
        roomR1.addPaintingToWall('East', 3, 3, 'cuadros/4.jpg', 'P-04', 'Espacio para Cuadro 4', 'Pendiente de asignar', 2, 0);

        // Add Letter to Painting 4
        if (roomR1.paintings.length > 0) {
            const p04 = roomR1.paintings[roomR1.paintings.length - 1]; // Assuming P-04 is the last added
            // Better to find by ID if possible, but sequential add works here given context
            p04.mesh.userData.painting.letterData = {
                title: "Una Llamadita",
                place: "Nuestras Casas",
                body: "ALgo habremos dicho que nos hizo reír, que de tu interior hizo brotar una sonfonía de alegría, que otros vulgarmente llamaría risa.",
                signature: "El Pelao de Rulos"
            };
        }

        roomR1.addPaintingToWall('East', 2, 2, 'cuadros/5.jpg', 'P-05', 'Espacio para Cuadro 5', 'Pendiente de asignar', -3, 0);

        // Add Letter to Painting 5
        if (roomR1.paintings.length > 0) {
            const p05 = roomR1.paintings[roomR1.paintings.length - 1];
            p05.mesh.userData.painting.letterData = {
                title: "Un Picnic y Empanaditas",
                place: "Corrientes",
                body: "Sentaditos comiendo y mirando el paisaje, con la pancita llena y el corazón contento (no me vuelvo a pasar con la sal).",
                signature: "El Chef"
            };
        }

        this.addRoom(roomR1, 'R1');

        // --- HORSE SKELETON (Room R1 Center) ---
        const horse = new HorseSkeleton();
        horse.setPosition(25, 0, 0); // Center of R1
        horse.setRotation(-Math.PI / 4); // Angled 45 deg
        this.scene.add(horse.mesh);

        // Collision Box for Horse
        const horseBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2, 2.5),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        horseBox.position.set(25, 1, 0);
        this.collidables.push(horseBox);
        this.scene.add(horseBox);

        // Pasillo Central <-> R1
        const hallCent_R1 = new Room(this.scene, 13.75, 0, 7.5, 4, 0xF5F5DC);
        hallCent_R1.addDoor('West', 4, 4);
        hallCent_R1.addDoor('East', 4, 4);
        this.addRoom(hallCent_R1, 'HALL_R1');

        // Breakable Vases at R1 Hallway Entrance (Central Room Side)
        // Hallway West door is at X=10 (13.75 - 7.5/2 = 10)
        const vaseR1Left = new BreakableVase('sunflower');
        vaseR1Left.setPosition(8.5, 0, -2);
        this.scene.add(vaseR1Left.mesh);
        this.interactables.push(vaseR1Left.interactableMesh);

        const vaseR1Right = new BreakableVase('sunflower');
        vaseR1Right.setPosition(8.5, 0, 2);
        vaseR1Right.setRotation(Math.PI / 4);
        this.scene.add(vaseR1Right.mesh);
        this.interactables.push(vaseR1Right.interactableMesh);

        // --- Room R2 (Norte de R1) ---
        // Pos: 25, -25
        const roomR2 = new Room(this.scene, 25, -25, 15, 15, 0xF5F5DC);
        roomR2.addDoor('South', 4, 3.5); // Conecta con R1
        roomR2.addDoor('North', 4, 3.5); // Conecta con R3

        // Distribución R2 (4 Cuadros)
        // Pared Este (2 cuadros)
        roomR2.addPaintingToWall('East', 3, 3, 'cuadros/6.jpg', 'P-06', 'Espacio para Cuadro 6', 'Pendiente de asignar', 2, 0);

        // Add Letter to Painting 6
        if (roomR2.paintings.length > 0) {
            // P-06 is the first one added to R2
            // Let's grab the last one just to be consistent with previous pattern, knowing it's the one we just added.
            const p06 = roomR2.paintings[roomR2.paintings.length - 1];
            p06.mesh.userData.painting.letterData = {
                title: "Una Salida Romántica",
                place: "Corrientes",
                body: "Te tomaría entre mis brazos mil veces y te daría diez mil besos, para que cuando mi cuerpo se enfríe y mi alma deje este mundo, pueda presumir a los angeles que conocí el paraíso antes de siquiera haber dejado de respirar, que viví mas tiempo en las nubes que todos ellos.",
                signature: "El de la Camisa"
            };
        }
        roomR2.addPaintingToWall('East', 3, 3, 'cuadros/7.jpg', 'P-07', 'Espacio para Cuadro 7', 'Pendiente de asignar', -2, 0);

        // Add Letter to Painting 7
        if (roomR2.paintings.length > 0) {
            const p07 = roomR2.paintings[roomR2.paintings.length - 1]; // Assuming P-07 is the last one added
            p07.mesh.userData.painting.letterData = {
                title: "Cenita",
                place: "Tu casa de Corrientes",
                body: "Fabulosa en su vestido, despanpanante con su brillo, irresistible en su piel. Permiteme adentrarme en tu corazón, y no me dejes salir, pus allí quiero permanecer.",
                signature: "Io"
            };
        }
        // Pared Oeste (2 cuadros)
        roomR2.addPaintingToWall('West', 3, 3, 'cuadros/8.jpg', 'P-08', 'Espacio para Cuadro 8', 'Pendiente de asignar', 2, 0);

        // Add Letter to Painting 8
        if (roomR2.paintings.length > 0) {
            const p08 = roomR2.paintings[roomR2.paintings.length - 1]; // Assuming P-08 is the last one added
            p08.mesh.userData.painting.letterData = {
                title: "ARARARAR",
                place: "Cine",
                body: "PARA ENTENDER LA HISTORIA DE FNAF",
                signature: "Ñaca Ñaca"
            };
        }
        roomR2.addPaintingToWall('West', 3, 3, 'cuadros/9.jpg', 'P-09', 'Espacio para Cuadro 9', 'Pendiente de asignar', -2, 0);

        // Add Letter to Painting 9
        if (roomR2.paintings.length > 0) {
            const p09 = roomR2.paintings[roomR2.paintings.length - 1]; // Assuming P-09 is the last one added
            p09.mesh.userData.painting.letterData = {
                title: "My Silly Ass GF",
                place: "Shopping",
                body: "Tenemos que ir a jugar denuevo si o si.",
                signature: "Spartan 117"
            };
        }

        // Pared Norte (2 cuadros: 21, 22 a los lados de la puerta)
        roomR2.addPaintingToWall('North', 3, 4, 'cuadros/21.jpg', 'P-21', 'Cuadro 21', 'Vertical', -5, 0);

        // Add Letter to Painting 21
        if (roomR2.paintings.length > 0) {
            const p21 = roomR2.paintings[roomR2.paintings.length - 1]; // Assuming P-21 is the latest
            p21.mesh.userData.painting.letterData = {
                title: "Una Fiesta en Familia",
                place: "Tu Casa de Obe",
                body: "Gracis por abrirme las puertas de tu familia, gracias por abrirme las puertas de tu corazón, y en la fiesta donde lo que más importa es agradecer y dar, yo estuve y estoy agradecido por tu amor y quiero darte toda mi vida.",
                signature: "Tu Duende de Navidad"
            };
        }
        roomR2.addPaintingToWall('North', 3, 4, 'cuadros/22.jpg', 'P-22', 'Cuadro 22', 'Vertical', 5, 0);

        // Add Letter to Painting 22
        if (roomR2.paintings.length > 0) {
            const p22 = roomR2.paintings[roomR2.paintings.length - 1]; // Assuming P-22 is the latest
            p22.mesh.userData.painting.letterData = {
                title: "Un Nuevo Año",
                place: "Alem",
                body: "COmenzaba u nuevo año, y yo tenía todo lo que necesitaba, tenía todo lo que deseaba. Nada más hermoso que comenzar el año con el amor de mi vida, que empezar un nuevo capitulo con vos, te amo alma mía.",
                signature: "Tu Mandarino"
            };
        }

        this.addRoom(roomR2, 'R2');

        // Pasillo R1 <-> R2
        const hallR1_R2 = new Room(this.scene, 25, -12.5, 4, 10, 0xF5F5DC);
        hallR1_R2.addDoor('South', 4, 4);
        hallR1_R2.addDoor('North', 4, 4);
        this.addRoom(hallR1_R2, 'HALL_R2');

        // Add wall decorations
        this.addHallwayDecorations(hallR1_R2, 4, 10);

        // --- Room R3 (Norte de R2) ---
        // Pos: 25, -50
        const roomR3 = new Room(this.scene, 25, -50, 15, 15, 0xF5F5DC);
        roomR3.addDoor('South', 4, 3.5); // Conecta con R2

        // Distribución R3 (4 Cuadros)
        // Pared Norte (2 cuadros)
        roomR3.addPaintingToWall('North', 2.5, 2.5, 'cuadros/10.jpg', 'P-10', 'Espacio para Cuadro 10', 'Pendiente de asignar', 2, 0);

        // Add Letter to Painting 10
        if (roomR3.paintings.length > 0) {
            // P-10 is the first one added to R3
            const p10 = roomR3.paintings[roomR3.paintings.length - 1];
            p10.mesh.userData.painting.letterData = {
                title: "Un Paseo por la Historia",
                place: "Corrientes",
                body: "Un tere para el libertador de America, se lo merece despues de tanto esfuerzo no?",
                signature: "No San Martin"
            };
        }
        roomR3.addPaintingToWall('North', 2.5, 2.5, 'cuadros/11.jpg', 'P-11', 'Espacio para Cuadro 11', 'Pendiente de asignar', -2, 0);

        // Add Letter to Painting 11
        if (roomR3.paintings.length > 0) {
            const p11 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-11 is the last one added
            p11.mesh.userData.painting.letterData = {
                title: "El Mismo Paseito",
                place: "Corrientes",
                body: "Comamos Cheesecake denuevo o moriré",
                signature: "Quesito"
            };
        }
        // Pared Este (3 cuadros: 19, 12, 20)
        roomR3.addPaintingToWall('East', 5, 3, 'cuadros/12.jpg', 'P-12', 'Espacio para Cuadro 12', 'Horizontal', 0, 0);

        // Add Letter to Painting 12
        if (roomR3.paintings.length > 0) {
            const p12 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-12 is the last one added
            p12.mesh.userData.painting.letterData = {
                title: "Un Voto de Amor",
                place: "Corrientes",
                body: "Acostados en el pasto, con la inmensidad del cielo por delante, decidimos ser nosotros quines teniamos algo que ofrecerle a el, y le mostramos cuanto nos amamos, unimos nuestras manos y le demostramos que juntos teniamos algo mas hermoso que el mismimo cielo.",
                signature: "El de la Mano mas Oscura"
            };
        }
        roomR3.addPaintingToWall('East', 2, 2, 'cuadros/19.jpg', 'P-19', 'Cuadro 19', 'Cuadrado', -4.5, 0);

        // Add Letter to Painting 19
        if (roomR3.paintings.length > 0) {
            const p19 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-19 is the last one added
            p19.mesh.userData.painting.letterData = {
                title: "Una Alianza",
                place: "Corrientes York",
                body: "Dos pulseras, uan sola unión. Algún día será un anillo en tu dedo, y luego un anillo en el dedo de ambos.",
                signature: "Tu Aforturnado Admirador"
            };
        }
        roomR3.addPaintingToWall('East', 2, 2, 'cuadros/20.jpg', 'P-20', 'Cuadro 20', 'Cuadrado', 4.5, 0);

        // Add Letter to Painting 20
        if (roomR3.paintings.length > 0) {
            const p20 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-20 is the latest
            p20.mesh.userData.painting.letterData = {
                title: "Un día de Pileta",
                place: "Una Pileta",
                body: "Sin dudas de los días más hermosos de todo mi Enero, y que mes tan lindo además, siendo que comienza el año y tambien el amor de mi vida amplía su existencia. No puedo resistirme, por favor, tomame y no me sueltes.",
                signature: "Tu Empedernido Buscador"
            };
        }
        // Pared Oeste (3 cuadros: 16, 13, 17)
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/13.jpg', 'P-13', 'Espacio para Cuadro 13', 'Pendiente de asignar');

        // Add Letter to Painting 13
        if (roomR3.paintings.length > 0) {
            const p13 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-13 is the latest
            p13.mesh.userData.painting.letterData = {
                title: "MY GG ASS SILLY AND GORGEOUS WIFE",
                place: "NO SÉ",
                body: "MIRÁ LO QUE ES ESA CARITA DIOS MIOOOOOOOOOOOOOOOOOOOOOOOOOOOOO sos UN CARAMELITOOOOOOOOOOOOOOO ÑAM ÑAM",
                signature: "ÑAM ÑAM ÑAM ÑAM"
            };
        }
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/16.jpg', 'P-16', 'Cuadro 16', 'Lateral', -4, 0);

        // Add Letter to Painting 16
        if (roomR3.paintings.length > 0) {
            const p16 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-16 is the latest
            p16.mesh.userData.painting.letterData = {
                title: "Un Alfajorcito para un Mes Más",
                place: "Nuestras Casas",
                body: "Un alfajorcito, una pelicula, y mucho amor, muchísimo amor, para que con su calor funda las dificultades y nos sirvan para forjar un amor aún más fuerte.",
                signature: "Tu Amado"
            };
        }
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/17.jpg', 'P-17', 'Cuadro 17', 'Lateral', 4, 0);

        // Add Letter to Painting 17
        if (roomR3.paintings.length > 0) {
            const p17 = roomR3.paintings[roomR3.paintings.length - 1]; // Assuming P-17 is the latest
            p17.mesh.userData.painting.letterData = {
                title: "Frío y Calor",
                place: "Camita",
                body: "Vos con frío, yo con calor, pero siempre con ganas del otro.",
                signature: "David Vega"
            };
        }

        this.addRoom(roomR3, 'R3');

        // Pasillo R2 <-> R3
        const hallR2_R3 = new Room(this.scene, 25, -37.5, 4, 10, 0xF5F5DC);
        hallR2_R3.addDoor('South', 4, 4);
        hallR2_R3.addDoor('North', 4, 4);
        this.addRoom(hallR2_R3, 'HALL_R3');

        // Add wall decorations
        this.addHallwayDecorations(hallR2_R3, 4, 10);


        // Add Light Switches
        this.addSwitches();
    }

    addRoom(room, name = null) {
        this.rooms.push(room);
        if (name) {
            this.roomsMap.set(name, room);
        }
        // Agregar paredes a la lista global de colisiones
        this.collidables.push(...room.getCollidables());
        // Agregar cuadros a la lista global de interactuables
        room.paintings.forEach(p => {
            if (p.mesh) this.interactables.push(p.mesh);
        });
    }

    toggleSecretPassage(isOpen) {
        if (this.fillerWall) {
            this.fillerWall.visible = !isOpen;
            // Actualizar colisionables
            if (isOpen) {
                const idx = this.collidables.indexOf(this.fillerWall);
                if (idx > -1) this.collidables.splice(idx, 1);
            } else {
                if (!this.collidables.includes(this.fillerWall)) {
                    this.collidables.push(this.fillerWall);
                }
            }
        }

        if (this.secretCorridor) this.secretCorridor.group.visible = isOpen;
        if (this.portal1) this.portal1.mesh.visible = isOpen;
        if (this.isolatedRoom) this.isolatedRoom.group.visible = isOpen;
        if (this.portal2) this.portal2.mesh.visible = isOpen;
    }

    revealGoldenKey() {
        if (!this.desk || !this.desk.goldenKey || !this.desk.hintNote) return;
        if (this.desk.goldenKey.mesh.visible) return; // Already revealed

        // 1. Hide Note
        this.desk.hintNote.mesh.visible = false;
        const noteIdx = this.interactables.indexOf(this.desk.hintNote.interactableMesh);
        if (noteIdx > -1) this.interactables.splice(noteIdx, 1);

        // 2. Show Key
        this.desk.goldenKey.mesh.visible = true;

        // Add all key meshes back to interactables for raycasting
        this.desk.goldenKey.mesh.traverse(child => {
            if (child.isMesh) {
                this.interactables.push(child);
            }
        });

        console.log("Golden Key revealed in the desk drawer!");
    }

    // Toggle logic override/extension for Central Room to include furniture
    toggleRoomLights(name) {
        // ... (Groups logic remains)
        const groups = {
            'L1': ['L1', 'HALL_L1'],
            'L2': ['L2', 'HALL_L2'],
            'L3': ['L3', 'HALL_L3'],
            'R1': ['R1', 'HALL_R1'],
            'R2': ['R2', 'HALL_R2'],
            'R3': ['R3', 'HALL_R3'],
            'CENTRAL': ['CENTRAL']
        };

        const targets = groups[name] || [name];
        let primaryState = false;

        const primaryRoom = this.roomsMap.get(name);
        if (primaryRoom) {
            primaryState = primaryRoom.toggleLights();
        }

        targets.forEach(targetName => {
            if (targetName !== name) {
                const r = this.roomsMap.get(targetName);
                if (r) r.toggleLights(primaryState);
            }
        });

        // Special handling for CENTRAL
        if (name === 'CENTRAL') {
            if (primaryState) {
                // On? Maybe turn furniture on? Or leave them manual?
                // Bequest says: "cuando las luces esten apagas... el candelabro tambien se apague"
                // Implies OFF sync check.
                // Let's strictly sync OFF. If turning ON, maybe leave furniture as is or turn ON?
                // Usually "Room Switch" controls overheads. Furniture is local.
                // BUT user said "el candelabro tambien se apague y las lamparas tambien".
                // This implies when Room Lights go OFF -> Furniture OFF.
                // Does Room Lights ON -> Furniture ON? Maybe not.
                // Let's implement OFF Sync only for now to preserve manual control, 
                // UNLESS user assumes switch is master power.
                // Let's turn ON chanderlier with room, but maybe not desk lamp?
                // "apague" was the keyword.
                // Let's sync Chandelier to Room Light. DeskLamp usually independent but let's sync OFF.
                if (this.chandelier) this.chandelier.turnOn();
            } else {
                if (this.chandelier) this.chandelier.turnOff();
                if (this.deskLamp) this.deskLamp.turnOff();
                // FloorLamp not in World logic yet (it's in Furniture but not added to World explicitly as 'this.floorLamp'?)
                // Let's check init() in World.js.
            }
        }

        return primaryState;
    }

    toggleGlobalLights() {
        this.globalLightState = !this.globalLightState;

        // Toggle Room Lights
        this.rooms.forEach(r => r.toggleLights(this.globalLightState));

        // Toggle Furniture
        if (this.globalLightState) {
            if (this.chandelier) this.chandelier.turnOn();
            if (this.deskLamp) this.deskLamp.setState(true);
            this.floorLamps.forEach(l => l.setState(true));
        } else {
            if (this.chandelier) this.chandelier.turnOff();
            if (this.deskLamp) this.deskLamp.turnOff();
            this.floorLamps.forEach(l => l.turnOff());
        }
    }

    isAnyLightOn() {
        // Check Rooms
        for (const room of this.rooms) {
            if (room.lightsOn) return true;
        }
        // Check Furniture
        if (this.chandelier && this.chandelier.isOn) return true;
        if (this.deskLamp && this.deskLamp.isOn) return true;
        for (const lamp of this.floorLamps) {
            if (lamp.isOn) return true;
        }
        return false;
    }

    isPointInside(point) {
        for (const room of this.rooms) {
            // Simple AABB check
            // Room pos is center. Width is X size, Depth is Z size.
            const minX = room.position.x - room.width / 2;
            const maxX = room.position.x + room.width / 2;
            const minZ = room.position.z - room.depth / 2;
            const maxZ = room.position.z + room.depth / 2;

            if (point.x >= minX && point.x <= maxX &&
                point.z >= minZ && point.z <= maxZ) {
                return true;
            }
        }
        return false;
    }

    addSwitchToRoom(roomName, x, y, z, rotationY) {
        const room = this.roomsMap.get(roomName);
        if (!room) return;

        const sw = new LightSwitch();
        sw.setPosition(x, y, z);
        sw.setRotation(rotationY);
        sw.setRoomName(roomName); // To identify it on click

        this.scene.add(sw.mesh);
        this.interactables.push(sw.interactableMesh);

        // Link to room
        room.setLightSwitch(sw);
    }

    // Call this after all rooms are built
    addSwitches() {
        // Re-calibrated Positions (Inner Face Offset = 0.05 from Wall Surface)
        // Wall Thickness 0.5. Inner Surface is Center +/- 0.25 (or more for corner cases).

        // CENTRAL (0,0) - South Wall (Main Entrance)
        // South Wall Z=7.5. Inner Z=7.25.
        // Switch Z=7.245 (Almost touching). Faces North (PI).
        // X=2 (Right of door).
        this.addSwitchToRoom('CENTRAL', 2, 1.5, 7.245, Math.PI);

        // L1 (-25, 0) - East Wall (Entrance from Central)
        // East Wall X=-17.5. Inner X=-17.75.
        // Switch X=-17.8. Faces West (-PI/2).
        // Z=3 (Right of door which is at 0? No, room center 0. Door [2..6]? No, Door width 4 at 0).
        // Actually door is at CENTER of wall (0). Z range [-2, 2].
        // So Z=3 is safe right side.
        this.addSwitchToRoom('L1', -17.8, 1.5, -3, -Math.PI / 2);

        // L2 (-25, -25) - South Wall (Entrance from L1)
        // South Wall Z=-17.5. Inner Z=-17.75.
        // Switch Z=-17.8. Faces North (PI).
        // X= -22 (Right of door? Door at -25).
        this.addSwitchToRoom('L2', -22, 1.5, -17.8, Math.PI);

        // L3 (-25, -50) - South Wall (Entrance from L2)
        // South Wall Z=-42.5. Inner Z=-42.75.
        this.addSwitchToRoom('L3', -22, 1.5, -42.8, Math.PI);

        // --- MAD HATTER HAT (Room L3 Center) ---
        const hatSculpture = new MadHatterHat();
        hatSculpture.setPosition(-25, 0, -50);
        hatSculpture.mesh.traverse(child => {
            if (child.isMesh) {
                child.userData = { type: 'mad-hatter-hat' };
            }
        });
        this.scene.add(hatSculpture.mesh);
        this.interactables.push(hatSculpture.mesh);

        // Add Collider for Hat Pedestal
        const hatBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hatBox.position.set(-25, 0.5, -50);
        this.collidables.push(hatBox);
        this.scene.add(hatBox);

        // --- BOOKSHELVES (Room L3 North Wall) ---
        // Room Center: (-25, -50), Size 15x15.
        // North Wall Z = -50 - 7.5 = -57.5.
        // Place shelves at Z = -56.5 (Depth 0.8 -> Center offset 0.4 from back? No, center is center).
        // If box depth 0.8, back is at -0.4.
        // We want back at -57.4 or so. Center at -57.

        const shelf1 = new Bookshelf();
        shelf1.setPosition(-30, 0, -57);
        this.scene.add(shelf1.mesh);

        // Make Shelf1 Interactable for PDF
        shelf1.mesh.traverse(child => {
            if (child.isMesh) {
                child.userData = { type: 'pdf', file: 'books/Alicia.pdf' };
            }
        });
        this.interactables.push(shelf1.mesh);

        // this.collidables.push(shelf1.mesh); // REMOVED: Groups crash Player physics. Used manual box below.

        const shelf2 = new Bookshelf();
        shelf2.setPosition(-20, 0, -57);
        this.scene.add(shelf2.mesh);
        // this.collidables.push(shelf2.mesh);

        this.secretBookshelfDoor = new SecretBookshelfDoor();
        this.secretBookshelfDoor.setPosition(-25, 0, -57);
        this.scene.add(this.secretBookshelfDoor.mesh);
        this.interactables.push(this.secretBookshelfDoor.interactableMesh);

        // Manual Colliders for Shelves (Groups don't collide well with simple logic usually)
        const shelfBoxGeo = new THREE.BoxGeometry(3, 4, 1);
        const shelfBoxMat = new THREE.MeshBasicMaterial({ visible: false });

        const s1Box = new THREE.Mesh(shelfBoxGeo, shelfBoxMat);
        s1Box.position.set(-30, 2, -57);
        this.scene.add(s1Box);
        this.collidables.push(s1Box);

        const s2Box = new THREE.Mesh(shelfBoxGeo, shelfBoxMat);
        s2Box.position.set(-20, 2, -57);
        this.scene.add(s2Box);
        this.collidables.push(s2Box);

        // Collider for secret door
        const s3Box = new THREE.Mesh(shelfBoxGeo, shelfBoxMat);
        s3Box.position.set(-25, 2, -57);
        s3Box.userData = { type: 'secret-bookshelf-door', parentObj: this.secretBookshelfDoor };
        this.scene.add(s3Box);
        this.collidables.push(s3Box);

        this.secretCorridor = new Room(this.scene, -25, -62.5, 4, 10, 0x111111); // Dark walls
        this.secretCorridor.addDoor('South', 4, 4); // Connects to L3 (hidden by shelf)
        this.secretCorridor.addDoor('North', 4, 4); // Opening for portal
        this.secretCorridor.group.visible = false;
        this.addRoom(this.secretCorridor, 'SECRET_CORRIDOR');

        // Minecraft Portal in Corridor
        this.portal1 = new MinecraftPortal();
        this.portal1.setPosition(-25, 0, -67.4);
        this.portal1.mesh.visible = false;
        this.scene.add(this.portal1.mesh);

        // --- ISOLATED SECRET ROOM (Far Away) ---
        // Position: 200, 0, 200
        this.isolatedRoom = new Room(this.scene, 200, 200, 10, 10, 0xDDDDDD);
        this.isolatedRoom.addDoor('South', 4, 4); // Entrance from portal

        // Apply custom cracked rock floor
        const rockTex = this.isolatedRoom.generateCrackedRockTexture();
        this.isolatedRoom.setFloorTexture(rockTex);

        this.isolatedRoom.group.visible = false;

        // Add Painting 18 (Pelela)
        this.isolatedRoom.addPaintingToWall('North', 3, 3, 'cuadros/18.jpg', 'P-18', 'Pelela Momento', 'Foto', 0, 0);
        if (this.isolatedRoom.paintings.length > 0) {
            const p18 = this.isolatedRoom.paintings[this.isolatedRoom.paintings.length - 1];
            p18.mesh.userData.painting.letterData = {
                title: "Pelela Momento",
                place: "Mi Casa de Alem",
                body: "Mi veterinaria hermosa con mi gatita preciosa, se llevaron bien y encima Pelela se re mimoseaba, que nino todo.",
                signature: "El Fotografo"
            };
        }

        this.addRoom(this.isolatedRoom, 'ISOLATED_ROOM');

        // Add Secret Rug to Isolated Room
        const secretRug = new SecretRug();
        secretRug.setPosition(0, 0, 0); // Local to room group
        // Note: Room group is at (200, 0, 200). If I add to room group, pos needs to be relative.
        // Room class creates group at (x,0,z).
        // So I should add to this.isolatedRoom.group.
        // Rug position should be 0,0,0 (center of room).
        this.isolatedRoom.group.add(secretRug.mesh);

        // Minecraft Portal in Isolated Room
        this.portal2 = new MinecraftPortal();
        this.portal2.setPosition(200, 0, 204.9); // Adjusted for smaller room depth
        this.portal2.mesh.rotation.y = Math.PI; // Face North
        this.portal2.mesh.visible = false;
        this.scene.add(this.portal2.mesh);

        // --- MINECRAFT BLOCKS IN SECRET ROOM ---
        // Room center: 200, 200. Size: 10x10
        // Corners: NW(-5,-5), NE(5,-5), SW(-5,5), SE(5,5) relative to room center

        // Crafting Table and Furnace (side by side, touching)
        const craftingTable = new CraftingTable();
        craftingTable.setPosition(-0.5, 0, -3); // Centered left
        this.isolatedRoom.group.add(craftingTable.mesh);
        this.interactables.push(craftingTable.mesh);

        const furnace = new Furnace();
        furnace.setPosition(0.5, 0, -3); // Centered right, touching crafting table
        this.isolatedRoom.group.add(furnace.mesh);
        this.interactables.push(furnace.mesh);

        // --- FILLER WALL (To hide the opening in L3) ---
        const fillerGeo = new THREE.BoxGeometry(4.2, 4, 0.51); // Slightly larger to avoid gaps
        const fillerMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC });
        this.fillerWall = new THREE.Mesh(fillerGeo, fillerMat);
        this.fillerWall.position.set(-25, 2, -57.5);
        this.fillerWall.castShadow = true;
        this.fillerWall.receiveShadow = true;
        this.scene.add(this.fillerWall);
        this.collidables.push(this.fillerWall);


        // R1 (25, 0) - West Wall (Entrance from Central)
        // West Wall X=17.5. Inner X=17.75.
        // Switch X=17.8. Faces East (PI/2).
        this.addSwitchToRoom('R1', 17.8, 1.5, -3, Math.PI / 2);

        // R2 (25, -25) - South Wall
        // South Wall Z=-17.5. Inner Z=-17.75.
        this.addSwitchToRoom('R2', 28, 1.5, -17.8, Math.PI);

        // R3 (25, -50) - South Wall
        // South Wall Z=-42.5. Inner Z=-42.75.
        this.addSwitchToRoom('R3', 28, 1.5, -42.8, Math.PI);
    }

    toggleCeiling(shouldBeOpen) {
        // Sync Lever if needed
        if (this.lever && this.lever.isOpen !== shouldBeOpen) {
            this.lever.toggle();
        }

        // Trigger the Sequence
        if (shouldBeOpen) {
            // User wants to OPEN
            if (this.animState !== 'OPEN' && this.animState !== 'OPENING_CHANDELIER' && this.animState !== 'OPENING_CEILING') {
                this.animState = 'OPENING_CHANDELIER';
                console.log("Starting Open Sequence: Chandelier Retracting...");
            }
        } else {
            // User wants to CLOSE
            if (this.animState !== 'CLOSED' && this.animState !== 'CLOSING_CEILING' && this.animState !== 'CLOSING_CHANDELIER') {
                this.animState = 'CLOSING_CEILING';
                console.log("Starting Close Sequence: Ceiling Closing...");
            }
        }
    }

    getTerrainHeight(x, z) {
        // --- SAFE ZONES (Flat Floors) ---

        // 1. Secret Room Zone (Around 200, 200)
        if (x > 180 && x < 220 && z > 180 && z < 230) {
            return 0;
        }

        // 2. Main Museum Boundary
        // Expanded boundary to cover all wings and corridors
        const isOutsideBoundary = (
            Math.abs(x) > 60 ||
            z < -100 || z > 40
        );

        if (isOutsideBoundary) {
            // Formula matches createGround exactly for synchronization
            const baseHills = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 +
                Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;
            const detail = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5;

            return baseHills + detail;
        }

        return 0; // Flat area
    }

    getCeilingOpenness() {
        if (this.rooms.length > 0 && this.rooms[0].ceiling) {
            // Ceiling Closed = Scale 1. Open = Scale 0.
            // Openness = 1 - Scale.
            const scale = this.rooms[0].ceilingScale;
            // Clamp 0-1 just in case
            return Math.max(0, Math.min(1, 1.0 - scale));
        }
        return 0;
    }

    update(delta, time, camera) {
        // Update Components
        if (this.desk) this.desk.update(delta);
        if (this.chandelier) this.chandelier.update(delta);
        if (this.mainDoor) this.mainDoor.update(delta);
        if (this.sparrow) this.sparrow.update(delta, camera);
        if (this.recordPlayer) this.recordPlayer.update(delta);



        if (this.secretBookshelfDoor) {
            this.secretBookshelfDoor.update(delta);
        }

        if (this.portal1) this.portal1.update(delta);
        if (this.portal2) this.portal2.update(delta);

        this.rooms.forEach(room => {
            room.updateCeiling(delta);
        });

        // Update Phone (Pass Game Time)
        // 3AM Trigger Logic inside Phone
        if (this.phone) {
            this.phone.update(delta, time);
        }

        // --- Sequence Logic ---
        switch (this.animState) {
            case 'OPENING_CHANDELIER':
                if (this.chandelier) {
                    this.chandelier.retract();
                    if (this.chandelier.isHidden()) {
                        this.chandelier.setVisible(false); // Make invisible
                        this.animState = 'OPENING_CEILING';
                        this.isCeilingOpen = true; // Signal main.js to start fading light
                    }
                } else {
                    // No chandelier, skip
                    this.animState = 'OPENING_CEILING';
                }
                break;

            case 'OPENING_CEILING':
                this.rooms.forEach(r => r.setCeiling(true)); // Open Ceiling
                // Check if done? Not strictly necessary, can sit in OPEN state
                // But strictly 'OPEN' means fully done.
                if (this.getCeilingOpenness() > 0.99) {
                    this.animState = 'OPEN';
                }
                break;

            case 'CLOSING_CEILING':
                this.isCeilingOpen = false; // Signal main.js to start fading light (darken)
                this.rooms.forEach(r => r.setCeiling(false)); // Close Ceiling
                // Wait for close
                if (this.getCeilingOpenness() < 0.01) {
                    this.animState = 'CLOSING_CHANDELIER';
                    if (this.chandelier) this.chandelier.setVisible(true); // Make visible again
                }
                break;

            case 'CLOSING_CHANDELIER':
                if (this.chandelier) {
                    this.chandelier.extend();
                    if (this.chandelier.isFullyExtended()) {
                        this.animState = 'CLOSED';
                    }
                } else {
                    this.animState = 'CLOSED';
                }
                break;
        }
    }

    enablePartyMode() {
        console.log("PARTY TIME! Lights out!");
        this.globalLightState = false;
        this.isPartyMode = true;

        // 1. Rooms (Ceiling Lights & Panels)
        this.rooms.forEach(room => {
            room.toggleLights(false);
        });

        // 2. Floor Lamps
        this.floorLamps.forEach(lamp => {
            if (lamp.setState) lamp.setState(false);
            else if (lamp.toggle) {
                // Force off if no explicit set
                if (lamp.isOn) lamp.toggle();
            }
        });

        // 3. Desk Lamp
        if (this.deskLamp) {
            if (this.deskLamp.setState) this.deskLamp.setState(false);
            else if (this.deskLamp.toggle && this.deskLamp.isOn) this.deskLamp.toggle();
        }

        // 4. Chandelier
        if (this.chandelier && this.chandelier.toggleLight) {
            this.chandelier.toggleLight(false);
        }

        // 5. Street Lights (Handled by updateStreetLights flag)
        this.updateStreetLights(true); // Force update now, passing true (night) but flag will block it acting as OFF
    }
}









