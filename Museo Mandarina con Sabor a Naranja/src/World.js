import * as THREE from 'three';
import { Room } from './Room.js';
import { Desk, RetroComputer, Clock, FloorLamp, DeskLamp, Lever, Chandelier, DoubleDoor } from './Furniture.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.rooms = [];
        this.collidables = []; // Walls for collision
        this.interactables = []; // Paintings for clicking
        this.clock = null;
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
    }

    init() {
        // --- 1. Habitación Central (Grande) ---
        // Pos: 0,0 | Size: 20x20 | Color: Cream (0xF5F5DC)
        const centralRoom = new Room(this.scene, 0, 0, 20, 20, 0xF5F5DC);
        // Abrir puertas en lados Este y Oeste para conectar pasillos
        centralRoom.addDoor('East', 4, 3.5);
        centralRoom.addDoor('West', 4, 3.5);

        // Agregar Mobiliario: Escritorio
        const desk = new Desk(2.6, 1.3, 0.8); // Larger Desk
        desk.setPosition(0, 0, -6.0); // Further from wall
        desk.setRotation(Math.PI); // Drawers on other side?
        this.scene.add(desk.mesh);

        // Agregar Mobiliario: Computadora Retro
        const pc = new RetroComputer();
        // El escritorio esta en y=0, altura 0.8. La PC debe ir encima (y=0.8)
        pc.setPosition(0, 0.8, -6.0);
        // Rotar para mirar hacia el Norte (Wall). Back to user entering room.
        pc.setRotation(Math.PI);
        this.scene.add(pc.mesh);
        this.scene.add(pc.mesh);
        this.interactables.push(pc.interactableMesh);
        this.pc = pc; // Store ref for main.js

        // Agregar Mobiliario: Lámpara de Escritorio
        const deskLamp = new DeskLamp();
        // Desk at 0, 0, -6.0.
        // Lamp to the right of sitting person (facing North) -> East (+X)
        deskLamp.setPosition(0.7, 0.8, -6.0);
        // Point Towards Back Wall (North / -Z).
        // "Opposite" of towards user.
        // Towards user was ~0 (South).
        // Towards wall is PI (North).
        deskLamp.setRotation(Math.PI - 0.2); // Slight angle still to face center-ish if needed, or straight back.
        // actually PI points straight North. -0.2 makes it point North-North-West (tilted left).
        // To aim at center of desk back from right side, we probably want North-West.
        // Math.PI + 0.2 would be North-North-East (Right).
        // Math.PI - 0.2 is North-North-West (Left). Correct.
        this.scene.add(deskLamp.mesh);
        this.interactables.push(deskLamp.interactableMesh);

        // Agregar Palanca (Lever) para el techo
        this.lever = new Lever();
        // Colocar en el escritorio, lado izquierdo
        this.lever.setPosition(-0.7, 0.8, -6.0);
        this.lever.setRotation(Math.PI); // Mirando hacia usuario?? O hacia pared.
        // Desk rotation is PI.
        this.scene.add(this.lever.mesh);
        this.interactables.push(this.lever.interactableMesh);

        // Agregar Reloj de Pared (En lugar del cuadro 1 - Norte)
        this.clock = new Clock();
        // Pared Norte está en Z = -10. 
        // addPaintingToWall en Norte pone Z = -depth/2 + dist + thickness/2.
        // -10 + 0.1 + 0.25 = -9.65 approx.
        // ShiftH era 0.
        // Altura cuadro era por defecto (height/2 = 2) + shiftV (0) = 2.
        // Clock queremos un poco mas alto quizas, o igual. 
        // Painting 1 size was 4x3. Center at Y=2.
        this.clock.mesh.position.set(0, 2.0, -9.8);
        this.scene.add(this.clock.mesh);

        // Agregar colisión simple para el escritorio (Caja invisible)
        // Agregar colisión simple para el escritorio (Caja invisible)
        const deskCollisionGeo = new THREE.BoxGeometry(2.6, 2, 1.3);
        const deskCollision = new THREE.Mesh(deskCollisionGeo, new THREE.MeshBasicMaterial({ visible: false }));
        deskCollision.position.set(0, 1, -6.0);
        this.scene.add(deskCollision);
        this.collidables.push(deskCollision);

        // Agregar Lamparas de Pie (Luz Calida)
        const lamp1 = new FloorLamp();
        lamp1.setPosition(-9, 0, -9); // Esquina Noroeste (Mas cerca esquina)
        this.scene.add(lamp1.mesh);

        const lamp2 = new FloorLamp();
        lamp2.setPosition(9, 0, 9); // Esquina Sureste (Mas cerca esquina)
        this.scene.add(lamp2.mesh);

        // Agregar Candelabro Central
        this.chandelier = new Chandelier();
        // Height: Room is 4. Hang it from center (0,0). 
        // Chain goes up 1m from body. Main body at 0. Top of chain at +1.5 from center?
        // Ceiling is at 4.
        // If we put it at y=3, top chain will be at ~3.5-4.
        this.chandelier.setPosition(0, 3, 0);
        this.scene.add(this.chandelier.mesh);

        // Agregar Cuadros a Central
        // Mover Cuadro 1 "Mona Lisa" a otro lado.
        // Pared Sur tiene "El Grito".
        // Pared Este tiene puerta centrada.
        // Pared Oeste tiene puerta centrada.
        // Movemos Mona Lisa al SUR, desplazada? O al Norte desplazada?
        // Hagamos Norte desplazada a la derecha
        centralRoom.addPaintingToWall('North', 4, 3, '', 'Mona Lisa (Falsa)', 'Una copia muy convincente.', '1', 6, 0);

        // El otro cuadro ya estaba en Sur
        // REMOVED (Replaced by Door)
        // centralRoom.addPaintingToWall('South', 3, 4, '', 'El Grito (Silencioso)', 'No hace ruido.', '2');

        // Agregar Puerta Doble al Sur
        centralRoom.addDoor('South', 4, 3.5);
        this.mainDoor = new DoubleDoor(4, 3.5);
        // Wall thickness is 0.5. Door frame depth 0.3.
        // Center of wall is Z = depth/2 = 10.
        this.mainDoor.setPosition(0, 0, 10);
        // Rotate if needed? Default is aligned X. Wall South is aligned X.
        // But South wall faces North?
        this.scene.add(this.mainDoor.mesh);
        this.interactables.push(this.mainDoor.interactableMesh);

        this.addRoom(centralRoom);

        // --- 2. Habitación Oeste (Izquierda) ---
        // Color: Cream

        const westRoomX = -25;
        const westRoom = new Room(this.scene, westRoomX, 0, 15, 15, 0xF5F5DC);
        westRoom.addDoor('East', 4, 3.5); // Puerta hacia Central

        // Cuadros Oeste
        westRoom.addPaintingToWall('North', 2, 2, '', 'Naturaleza', 'Arboles y cosas.', '3', -3);
        westRoom.addPaintingToWall('North', 2, 2, '', 'Manzana', 'Una fruta roja.', '4', 3);
        westRoom.addPaintingToWall('West', 5, 3, '', 'Paisaje Largo', 'Muy panorámico.', '5');

        this.addRoom(westRoom);

        // Pasillo Oeste
        // Conecta x=-10 (Central) con x=-17.5 (Oeste)
        // Posición centro: (-10 + -17.5)/2 = -13.75
        // Largo (Ancho geométrico X): 7.5
        // Profundidad ("Ancho" del pasillo Z): 4
        // NOTA: Para Room, width es X, depth es Z.
        // Pasillo con mismo color o ligeramente diferente? Usaremos Cream también para continuidad.
        const westHall = new Room(this.scene, -13.75, 0, 7.5, 4, 0xF5F5DC);
        // El pasillo es abierto por los dos lados, así que "quitamos" las paredes Este y Oeste completas
        // O usamos addDoor con el ancho total del pasillo para abrirlo entero.
        westHall.addDoor('East', 3.8, 3.5); // Casi todo el ancho
        westHall.addDoor('West', 3.8, 3.5);
        this.addRoom(westHall);


        // --- 3. Habitación Este (Derecha) ---
        // Simétrico al Oeste
        const eastRoomX = 25;
        const eastRoom = new Room(this.scene, eastRoomX, 0, 15, 15, 0xF5F5DC);
        eastRoom.addDoor('West', 4, 3.5); // Connect to hall

        // Cuadros Este
        eastRoom.addPaintingToWall('South', 3, 3, '', 'Abstracto #1', 'Nadie lo entiende.', '6');
        eastRoom.addPaintingToWall('East', 2, 4, '', 'Retrato', 'Un señor serio.', '7');
        // Moved "El Grito" here
        eastRoom.addPaintingToWall('North', 3, 4, '', 'El Grito (Silencioso)', 'Moved from Main Hall.', '2');

        this.addRoom(eastRoom);

        // Pasillo Este
        // Conecta x=10 con x=17.5. Centro: 13.75
        const eastHall = new Room(this.scene, 13.75, 0, 7.5, 4, 0xF5F5DC);
        eastHall.addDoor('West', 3.8, 3.5);
        eastHall.addDoor('East', 3.8, 3.5);
        this.addRoom(eastHall);
    }

    addRoom(room) {
        this.rooms.push(room);
        // Agregar paredes a la lista global de colisiones
        this.collidables.push(...room.getCollidables());
        // Agregar cuadros a la lista global de interactuables
        room.paintings.forEach(p => {
            if (p.mesh) this.interactables.push(p.mesh);
        });
    }

    toggleCeiling(shouldBeOpen) {
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

    update(delta) {
        // Update Components
        if (this.chandelier) this.chandelier.update(delta);
        if (this.mainDoor) this.mainDoor.update(delta);

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
