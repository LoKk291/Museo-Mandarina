import * as THREE from 'three';

export class Painting {
    constructor(width, height, imagePath, title, description, id) {
        this.width = width;
        this.height = height;
        this.imagePath = imagePath;
        this.title = title || "Sin Título";
        this.description = description || "Descripción pendiente.";
        this.id = id || "?";

        // Group Container
        this.mesh = new THREE.Group();
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.painting = this; // Interaction on the whole group

        // --- 1. Frame (Marco) ---
        // Extra size for frame
        const frameThickness = 0.2; // Width of the frame border
        const frameDepth = 0.08; // How much it sticks out

        // Frame Geometry (Box)
        const frameW = this.width + frameThickness;
        const frameH = this.height + frameThickness;
        const frameGeo = new THREE.BoxGeometry(frameW, frameH, frameDepth);

        // Frame Texture
        const frameLoader = new THREE.TextureLoader();
        const frameTex = frameLoader.load('textures/frame.png');
        frameTex.colorSpace = THREE.SRGBColorSpace;

        const frameMat = new THREE.MeshStandardMaterial({
            map: frameTex,
            roughness: 0.5,
            metalness: 0.1,
            color: 0xffffff
        });

        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.z = frameDepth / 2; // Sit on wall (z=0) -> center at z/2
        frameMesh.castShadow = true;
        frameMesh.receiveShadow = true;
        this.mesh.add(frameMesh);

        // --- 2. Canvas (Pintura) ---
        // Sits slightly in front of the frame background?
        // Or frame acts as border. 
        // Let's put Canvas 'inside' or on top.
        // User wants "relief". Frame should be deeper.
        // Canvas sits at front face of frame??
        // Let's make Canvas slightly thinner but same Z-front as frame?
        // Or recessed? Frames usually stick out more than canvas.

        const canvasDepth = 0.02;
        // Position Z: 
        // Frame Front is at z = frameDepth (0.08).
        // Let's put Canvas Front at z = 0.06 (Recessed 2cm)
        // Canvas Center Z = 0.06 - canvasDepth/2 = 0.05.

        const canvasGeo = new THREE.BoxGeometry(this.width, this.height, canvasDepth);

        // Placeholder Texture
        const placeholderTex = this.createPlaceholderTexture(this.id);
        this.canvasMat = new THREE.MeshStandardMaterial({
            map: placeholderTex,
            roughness: 0.8,
            side: THREE.FrontSide
        });

        this.canvasMesh = new THREE.Mesh(canvasGeo, this.canvasMat);
        // Frame Front Face is at z = frameDepth/2 + frameDepth/2 = frameDepth = 0.08
        // Wait, BoxGeometry is centered at 0,0,0 local. 
        // We moved frameMesh to z = frameDepth/2. Front face is at frameDepth.
        // So Canvas must be at > frameDepth.
        // Let's set Canvas Z = 0.09.
        this.canvasMesh.position.z = 0.09;
        this.canvasMesh.castShadow = true;
        this.canvasMesh.receiveShadow = true;
        this.mesh.add(this.canvasMesh);

        // Load Real Image
        if (imagePath && imagePath !== '') {
            this.loadTextureWithFallback(imagePath);
        }
    }

    loadTextureWithFallback(path) {
        const loader = new THREE.TextureLoader();

        const onLoad = (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            if (this.canvasMat) {
                this.canvasMat.map = t;
                this.canvasMat.needsUpdate = true;
            }
        };

        const onError = (originalErr) => {
            // Determine fallback
            let fallbackPath = null;
            const lower = path.toLowerCase();

            if (lower.endsWith('.jpg')) {
                fallbackPath = path.substring(0, path.length - 4) + '.webp';
            } else if (lower.endsWith('.webp')) {
                fallbackPath = path.substring(0, path.length - 5) + '.jpg';
            }

            if (fallbackPath) {
                console.log(`[Painting] Primary path failed (${path}), trying fallback: ${fallbackPath}`);
                loader.load(fallbackPath, onLoad, undefined, (fallbackErr) => {
                    console.error(`[Painting] Failed to load both ${path} and ${fallbackPath}`);
                });
            } else {
                console.error("Error loading painting:", path, originalErr);
            }
        };

        loader.load(path, onLoad, undefined, onError);
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
