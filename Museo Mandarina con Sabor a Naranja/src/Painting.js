import * as THREE from 'three';

export class Painting {
    constructor(width, height, imagePath, title, description, id) {
        this.width = width;
        this.height = height;
        this.imagePath = imagePath;
        this.title = title || "Sin Título";
        this.description = description || "Descripción pendiente.";
        this.id = id || "?";

        // Geometría del cuadro
        this.geometry = new THREE.PlaneGeometry(width, height);

        // Crear textura con el número
        const texture = this.createPlaceholderTexture(this.id);

        this.material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.FrontSide
        });

        // Si hay una imagen real, intentaríamos cargarla (esto sobreescribiría el mapa si funcionara)
        // const loader = new THREE.TextureLoader();
        // const tex = loader.load(imagePath, (t) => { this.material.map = t; this.material.needsUpdate = true; });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Guardar referencia
        this.mesh.userData.painting = this;
    }

    createPlaceholderTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fondo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 512, 512);

        // Borde
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 20;
        ctx.strokeRect(0, 0, 512, 512);

        // Texto (Número)
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 256);

        // Texto pequeño "Img"
        ctx.font = '40px Arial';
        ctx.fillText("Imagen", 256, 380);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
    }
}
