import * as THREE from 'three';
import { Room } from './Room.js';
import { Desk, RetroComputer, Clock, FloorLamp, DeskLamp, Lever, Chandelier, DoubleDoor, RedCarpet, Chair, OrchidPot, WindowFlowerBox, LightSwitch, Phone, PaperStack, WasteBasket, Statue, Globe, CornerTable, MuseumBarrier, VinylFrame, RecordPlayerTable, Piano, MadHatterHat, Bookshelf, HorseSkeleton, ArcadeMachine } from './Furniture.js';
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

        // --- Room L3 (Norte de L2) ---
        // Pos: -25, -50
        const roomL3 = new Room(this.scene, -25, -50, 15, 15, 0xF5F5DC);
        roomL3.addDoor('South', 4, 3.5); // Conecta con L2
        // Room final, sin puerta norte

        // Cuadros L3 (ELIMINADOS)

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

        // Distribución R1 (5 Cuadros)
        // Pared Sur (3 cuadros)
        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/1.jpg', 'P-01', 'Espacio para Cuadro 1', 'Pendiente de asignar');
        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/2.jpg', 'P-02', 'Espacio para Cuadro 2', 'Pendiente de asignar', 3, 0); // Offset Right
        roomR1.addPaintingToWall('South', 2, 2, 'cuadros/3.jpg', 'P-03', 'Espacio para Cuadro 3', 'Pendiente de asignar', -3, 0); // Offset Left

        // Pared Este (2 cuadros)
        roomR1.addPaintingToWall('East', 3, 3, 'cuadros/4.jpg', 'P-04', 'Espacio para Cuadro 4', 'Pendiente de asignar', 2, 0);
        roomR1.addPaintingToWall('East', 2, 2, 'cuadros/5.jpg', 'P-05', 'Espacio para Cuadro 5', 'Pendiente de asignar', -3, 0);

        roomR1.addPaintingToWall('East', 3, 3, 'cuadros/4.jpg', 'P-04', 'Espacio para Cuadro 4', 'Pendiente de asignar', 2, 0);
        roomR1.addPaintingToWall('East', 2, 2, 'cuadros/5.jpg', 'P-05', 'Espacio para Cuadro 5', 'Pendiente de asignar', -3, 0);

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

        // --- Room R2 (Norte de R1) ---
        // Pos: 25, -25
        const roomR2 = new Room(this.scene, 25, -25, 15, 15, 0xF5F5DC);
        roomR2.addDoor('South', 4, 3.5); // Conecta con R1
        roomR2.addDoor('North', 4, 3.5); // Conecta con R3

        // Distribución R2 (4 Cuadros)
        // Pared Este (2 cuadros)
        roomR2.addPaintingToWall('East', 3, 3, 'cuadros/6.jpg', 'P-06', 'Espacio para Cuadro 6', 'Pendiente de asignar', 2, 0);
        roomR2.addPaintingToWall('East', 3, 3, 'cuadros/7.jpg', 'P-07', 'Espacio para Cuadro 7', 'Pendiente de asignar', -2, 0);
        // Pared Oeste (2 cuadros)
        roomR2.addPaintingToWall('West', 3, 3, 'cuadros/8.jpg', 'P-08', 'Espacio para Cuadro 8', 'Pendiente de asignar', 2, 0);
        roomR2.addPaintingToWall('West', 3, 3, 'cuadros/9.jpg', 'P-09', 'Espacio para Cuadro 9', 'Pendiente de asignar', -2, 0);

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

        // Distribución R3 (4 Cuadros)
        // Pared Norte (2 cuadros)
        roomR3.addPaintingToWall('North', 2.5, 2.5, 'cuadros/10.jpg', 'P-10', 'Espacio para Cuadro 10', 'Pendiente de asignar', 2, 0);
        roomR3.addPaintingToWall('North', 2.5, 2.5, 'cuadros/11.jpg', 'P-11', 'Espacio para Cuadro 11', 'Pendiente de asignar', -2, 0);
        // Pared Este (3 cuadros: 19, 12, 20)
        roomR3.addPaintingToWall('East', 5, 3, 'cuadros/12.jpg', 'P-12', 'Espacio para Cuadro 12', 'Horizontal', 0, 0);
        roomR3.addPaintingToWall('East', 2, 2, 'cuadros/19.jpg', 'P-19', 'Cuadro 19', 'Cuadrado', -4.5, 0);
        roomR3.addPaintingToWall('East', 2, 2, 'cuadros/20.jpg', 'P-20', 'Cuadro 20', 'Cuadrado', 4.5, 0);
        // Pared Oeste (3 cuadros: 16, 13, 17)
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/13.jpg', 'P-13', 'Espacio para Cuadro 13', 'Pendiente de asignar');
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/16.jpg', 'P-16', 'Cuadro 16', 'Lateral', -4, 0);
        roomR3.addPaintingToWall('West', 3, 4, 'cuadros/17.jpg', 'P-17', 'Cuadro 17', 'Lateral', 4, 0);

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

        // --- MAD HATTER HAT (Room L3 Center) ---
        const hatSculpture = new MadHatterHat();
        hatSculpture.setPosition(-25, 0, -50);
        this.scene.add(hatSculpture.mesh);
        this.interactables.push(hatSculpture.mesh); // Make clickable? Maybe just decorative.

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
        shelf1.setPosition(-28, 0, -57);
        this.scene.add(shelf1.mesh);
        // this.collidables.push(shelf1.mesh); // REMOVED: Groups crash Player physics. Used manual box below.

        const shelf2 = new Bookshelf();
        shelf2.setPosition(-22, 0, -57);
        this.scene.add(shelf2.mesh);
        // this.collidables.push(shelf2.mesh);

        // Manual Colliders for Shelves (Groups don't collide well with simple logic usually)
        const shelfBoxGeo = new THREE.BoxGeometry(3, 4, 1);
        const shelfBoxMat = new THREE.MeshBasicMaterial({ visible: false });

        const s1Box = new THREE.Mesh(shelfBoxGeo, shelfBoxMat);
        s1Box.position.set(-28, 2, -57);
        this.scene.add(s1Box);
        this.collidables.push(s1Box);

        const s2Box = new THREE.Mesh(shelfBoxGeo, shelfBoxMat);
        s2Box.position.set(-22, 2, -57);
        this.scene.add(s2Box);
        this.collidables.push(s2Box);


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

    update(delta, time, camera) {
        // Update Components
        if (this.desk) this.desk.update(delta);
        if (this.chandelier) this.chandelier.update(delta);
        if (this.mainDoor) this.mainDoor.update(delta);
        if (this.sparrow) this.sparrow.update(delta, camera);
        if (this.recordPlayer) this.recordPlayer.update(delta);


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
}
