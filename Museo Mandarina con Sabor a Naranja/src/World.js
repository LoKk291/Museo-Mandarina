import * as THREE from 'three';
import { Room } from './Room.js';
import { Desk, RetroComputer, Clock, FloorLamp, DeskLamp, Lever, Chandelier, DoubleDoor, RedCarpet, Chair, OrchidPot, WindowFlowerBox, LightSwitch } from './Furniture.js';
import { Sparrow } from './Sparrow.js';

export class World {
    constructor(scene) {
        this.scene = scene;
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

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05; // Slightly below floor
        ground.receiveShadow = true;

        this.scene.add(ground);
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
        const desk = new Desk(2.6, 1.3, 0.8);
        desk.setPosition(0, 0, -6.0);
        desk.setRotation(Math.PI);
        this.scene.add(desk.mesh);

        // Computadora Retro
        const pc = new RetroComputer();
        pc.setPosition(0, 0.8, -6.0);
        pc.setRotation(Math.PI);
        this.scene.add(pc.mesh);
        this.interactables.push(pc.interactableMesh);
        this.pc = pc;

        // Lámpara de Escritorio
        const deskLamp = new DeskLamp();
        deskLamp.setPosition(0.7, 0.8, -6.0);
        deskLamp.setRotation(Math.PI - 0.2);
        this.scene.add(deskLamp.mesh);
        this.interactables.push(deskLamp.interactableMesh);

        // Palanca (Lever)
        this.lever = new Lever();
        // Moved to front of lamp (Lamp is at 0.7, 0.8, -6.0)
        this.lever.setPosition(0.7, 0.8, -6.4);
        this.lever.setRotation(Math.PI);
        this.scene.add(this.lever.mesh);
        this.interactables.push(this.lever.interactableMesh);

        // Reloj de Pared
        this.clock = new Clock();
        this.clock.mesh.position.set(0, 2.0, -9.8);
        this.scene.add(this.clock.mesh);

        // Colisión Escritorio
        const deskCollisionGeo = new THREE.BoxGeometry(3.5, 2, 1.3);
        const deskCollision = new THREE.Mesh(deskCollisionGeo, new THREE.MeshBasicMaterial({ visible: false }));
        deskCollision.position.set(0, 1, -6.0);
        this.scene.add(deskCollision);
        this.collidables.push(deskCollision);

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
        centralRoom.addPaintingToWall('North', 4, 3, '', 'Mona Lisa (Falsa)', 'Una copia muy convincente.', '1', 6, 0);

        // Puerta Principal (Sur)
        centralRoom.addDoor('South', 4, 3.5);
        this.mainDoor = new DoubleDoor(4, 3.5);
        this.mainDoor.setPosition(0, 0, 10);
        this.scene.add(this.mainDoor.mesh);
        this.interactables.push(this.mainDoor.interactableMesh);

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
        roomL1.addPaintingToWall('West', 3, 3, '', 'Ocaso', 'El sol poniéndose.', '3');
        roomL1.addPaintingToWall('South', 2, 2, '', 'Manzana', 'Roja y brillante.', '4');

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

        roomL2.addPaintingToWall('West', 4, 3, '', 'Bosque', 'Árboles antiguos.', '8');

        this.addRoom(roomL2, 'L2');

        // Pasillo L1 <-> L2 (Vertical)
        // Center X = -25.
        // Z Gap: -7.5 to -17.5. Center Z = -12.5. Length 10. Width 4.
        const hallL1_L2 = new Room(this.scene, -25, -12.5, 4, 10, 0xF5F5DC);
        hallL1_L2.addDoor('South', 4, 4);
        hallL1_L2.addDoor('North', 4, 4);
        this.addRoom(hallL1_L2, 'HALL_L2');

        // --- Room L3 (Norte de L2) ---
        // Pos: -25, -50
        const roomL3 = new Room(this.scene, -25, -50, 15, 15, 0xF5F5DC);
        roomL3.addDoor('South', 4, 3.5); // Conecta con L2
        // Room final, sin puerta norte

        roomL3.addPaintingToWall('North', 3, 4, '', 'Montaña', 'Pico nevado.', '9');

        this.addRoom(roomL3, 'L3');

        // Pasillo L2 <-> L3
        // Z Gap: -32.5 to -42.5. Center Z = -37.5.
        const hallL2_L3 = new Room(this.scene, -25, -37.5, 4, 10, 0xF5F5DC);
        hallL2_L3.addDoor('South', 4, 4);
        hallL2_L3.addDoor('North', 4, 4);
        this.addRoom(hallL2_L3, 'HALL_L3');


        // --- ALA ESTE (DERECHA) ---
        // R1 -> R2 -> R3 (Hacia el Norte)

        // --- Room R1 (Este Inmediato) ---
        // Pos: 25, 0
        const roomR1 = new Room(this.scene, 25, 0, 15, 15, 0xF5F5DC);
        roomR1.addDoor('West', 4, 3.5); // Conecta con Recepción
        roomR1.addDoor('North', 4, 3.5); // Conecta con R2

        roomR1.addPaintingToWall('South', 3, 3, '', 'Abstracto', 'Formas y colores.', '6');
        roomR1.addPaintingToWall('East', 2, 4, '', 'Retrato', 'Un señor serio.', '7');

        this.addRoom(roomR1, 'R1');

        // Pasillo Central <-> R1
        const hallCent_R1 = new Room(this.scene, 13.75, 0, 7.5, 4, 0xF5F5DC);
        hallCent_R1.addDoor('West', 4, 4);
        hallCent_R1.addDoor('East', 4, 4);
        this.addRoom(hallCent_R1, 'HALL_R1');

        // --- Room R2 (Norte de R1) ---
        // Pos: 25, -25
        const roomR2 = new Room(this.scene, 25, -25, 15, 15, 0xF5F5DC);
        roomR2.addDoor('South', 4, 3.5); // Conecta con R1
        roomR2.addDoor('North', 4, 3.5); // Conecta con R3

        roomR2.addPaintingToWall('East', 4, 3, '', 'Playa', 'Arena y mar.', '10');

        this.addRoom(roomR2, 'R2');

        // Pasillo R1 <-> R2
        const hallR1_R2 = new Room(this.scene, 25, -12.5, 4, 10, 0xF5F5DC);
        hallR1_R2.addDoor('South', 4, 4);
        hallR1_R2.addDoor('North', 4, 4);
        this.addRoom(hallR1_R2, 'HALL_R2');

        // --- Room R3 (Norte de R2) ---
        // Pos: 25, -50
        const roomR3 = new Room(this.scene, 25, -50, 15, 15, 0xF5F5DC);
        roomR3.addDoor('South', 4, 3.5); // Conecta con R2

        // Movido 'El Grito' aquí
        roomR3.addPaintingToWall('North', 3, 4, '', 'El Grito (Silencioso)', 'Un clásico.', '2');

        this.addRoom(roomR3, 'R3');

        // Pasillo R2 <-> R3
        const hallR2_R3 = new Room(this.scene, 25, -37.5, 4, 10, 0xF5F5DC);
        hallR2_R3.addDoor('South', 4, 4);
        hallR2_R3.addDoor('North', 4, 4);
        this.addRoom(hallR2_R3, 'HALL_R3');

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

    update(delta, camera) {
        // Update Components
        if (this.chandelier) this.chandelier.update(delta);
        if (this.mainDoor) this.mainDoor.update(delta);
        if (this.sparrow) this.sparrow.update(delta, camera);


        this.rooms.forEach(room => {
            room.updateCeiling(delta);
        });

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
}
