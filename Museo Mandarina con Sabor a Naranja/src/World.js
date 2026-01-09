import * as THREE from 'three';
import { Room } from './Room.js';
import { Desk, RetroComputer } from './Furniture.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.rooms = [];
        this.collidables = []; // Walls for collision
        this.interactables = []; // Paintings for clicking

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
        const desk = new Desk(2.2, 1.0, 0.8);
        desk.setPosition(0, 0, 3); // Un poco desplazado hacia el sur desde el centro
        this.scene.add(desk.mesh);

        // Agregar Mobiliario: Computadora Retro
        const pc = new RetroComputer();
        // El escritorio esta en y=0, altura 0.8. La PC debe ir encima (y=0.8)
        pc.setPosition(0, 0.8, 3);
        // Rotar para mirar hacia "atras" (hacia la cámara si entras desde el norte)
        // Ojo: Desk está en Z=3. Si entras desde Z=-10, ves el escritorio de frente?
        // El escritorio está orientado por defecto (largo X).
        pc.setRotation(Math.PI); // Mirando hacia el Norte
        this.scene.add(pc.mesh);
        this.interactables.push(pc.interactableMesh);


        // Agregar colisión simple para el escritorio (Caja invisible)
        // Nota: Nuestro sistema de colisión actual usa meshes directos con BoundingBox.
        // Podríamos añadir las partes del escritorio a collidables, pero sería caro.
        // Mejor añadir una caja invisible simple.
        const deskCollisionGeo = new THREE.BoxGeometry(2.2, 2, 1.0);
        const deskCollision = new THREE.Mesh(deskCollisionGeo, new THREE.MeshBasicMaterial({ visible: false }));
        deskCollision.position.set(0, 1, 3);
        this.scene.add(deskCollision);
        this.collidables.push(deskCollision);


        // Agregar Cuadros a Central
        centralRoom.addPaintingToWall('North', 4, 3, '', 'Mona Lisa (Falsa)', 'Una copia muy convincente.', '1');
        centralRoom.addPaintingToWall('South', 3, 4, '', 'El Grito (Silencioso)', 'No hace ruido.', '2');

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
}
