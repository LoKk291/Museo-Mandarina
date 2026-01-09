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

        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);
        this.scene.add(this.group);

        this.buildStructure();
    }

    buildStructure() {
        // Materiales
        // Suelo: Cargar Textura
        const textureLoader = new THREE.TextureLoader();
        const floorTexture = textureLoader.load('textures/wood_floor.jpg');
        // Configurar repetición para que no se estire
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        // Ajustar repetición basada en tamaño (aprox 1 repetición cada 4 metros)
        floorTexture.repeat.set(this.width / 4, this.depth / 4);
        // Ajustar color espacio sRGB
        floorTexture.colorSpace = THREE.SRGBColorSpace;

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.8,
            color: 0xffffff // Blanco para no tintar la textura
        });

        // Techo color cielo (Azul claro) para simular estar abierto/soleado
        const ceilingMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
        const wallMat = new THREE.MeshStandardMaterial({ color: this.wallColor });

        // Suelo
        const floorGeo = new THREE.PlaneGeometry(this.width, this.depth);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Techo
        const ceilingGeo = new THREE.PlaneGeometry(this.width, this.depth);
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.height;
        this.group.add(ceiling);

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
        // Aquí podríamos añadir lógica para "saltar" creación si hay una puerta GRANDE,
        // o crear 2 segmentos si la puerta está en medio.
        // Por ahora, creamos la pared sólida.
        // Si quisiéramos huecos, modificaríamos la geometría.

        const thickness = this.wallThickness;
        // Si está rotada (Este/Oeste), el ancho geométrico es thickness, y la profundidad es 'width' (que es depth de habitación)
        let geo;
        if (rotated) {
            geo = new THREE.BoxGeometry(thickness, height, width);
        } else {
            geo = new THREE.BoxGeometry(width, height, thickness);
        }

        const wall = new THREE.Mesh(geo, material);
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
        const mat = oldWall.material;

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
}
