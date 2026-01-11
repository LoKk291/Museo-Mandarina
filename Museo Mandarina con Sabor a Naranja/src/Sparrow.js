import * as THREE from 'three';

export class Sparrow {
    constructor(scene, interactables) {
        this.scene = scene;
        this.interactables = interactables;
        this.mesh = new THREE.Group();

        // Physics State
        this.state = 'FLYING';
        this.position = new THREE.Vector3(0, 3, 0);
        this.velocity = new THREE.Vector3(1, 0, 1).normalize();
        this.acceleration = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();

        // Physics Params
        this.maxSpeed = 3.5;
        this.maxForce = 0.08;

        this.perchTime = 0;
        this.wingPhase = 0;

        // Audio
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.nextChirpTime = (performance.now() / 1000) + Math.random() * 3 + 2; // Use system time (seconds)

        this.chirpSounds = [];
        // Load 5 variations
        for (let i = 1; i <= 5; i++) {
            const audio = new Audio(`sounds/sparrow/gorrion${i}.mp3`);
            audio.volume = 0.4;
            this.chirpSounds.push(audio);
        }

        this.build();
        this.createLabel();
        this.pickNewTarget();
        this.isHovered = false;

        // Init visual pos
        this.mesh.position.copy(this.position);
    }

    createLabel() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(0, 0, 256, 64, 10);
        ctx.fill();

        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = '#FFA500'; // Naranja
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Naranjita', 128, 32);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        this.labelSprite = new THREE.Sprite(mat);
        this.labelSprite.scale.set(0.5, 0.125, 1);
        this.labelSprite.position.set(0, 0.2, 0);
        this.mesh.add(this.labelSprite);
    }

    onHover(active) {
        if (this.isHovered === active) return;
        this.isHovered = active;
        this.labelSprite.material.opacity = active ? 1 : 0;
    }

    build() {
        // 1. Body
        const bodyGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 1.0 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1, 0.8, 1.5);
        this.mesh.add(body);

        // 2. Head
        const headGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 1.0 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.04, 0.08);
        this.mesh.add(head);

        // 3. Beak
        const beakGeo = new THREE.ConeGeometry(0.01, 0.02, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = -Math.PI / 2;
        beak.position.set(0, 0, 0.05);
        head.add(beak);

        // 4. Belly
        const bellyGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 1.0 });
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.set(0, -0.02, 0);
        belly.scale.set(0.9, 0.5, 1.2);
        this.mesh.add(belly);

        // 5. Wings
        const wingGeo = new THREE.PlaneGeometry(0.15, 0.1);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, side: THREE.DoubleSide });

        this.leftWing = new THREE.Group();
        this.leftWing.position.set(0.04, 0.02, 0);
        this.mesh.add(this.leftWing);
        const lwMesh = new THREE.Mesh(wingGeo, wingMat);
        lwMesh.position.set(0.075, 0, -0.02);
        lwMesh.rotation.x = -Math.PI / 2;
        this.leftWing.add(lwMesh);

        this.rightWing = new THREE.Group();
        this.rightWing.position.set(-0.04, 0.02, 0);
        this.mesh.add(this.rightWing);
        const rwMesh = new THREE.Mesh(wingGeo, wingMat);
        rwMesh.position.set(-0.075, 0, -0.02);
        rwMesh.rotation.x = -Math.PI / 2;
        this.rightWing.add(rwMesh);

        // 6. Tail
        const tailGeo = new THREE.PlaneGeometry(0.08, 0.15);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(0, 0, -0.12);
        tail.rotation.x = -Math.PI / 2 - 0.2;
        this.mesh.add(tail);

        // 7. Hitbox
        const hitboxGeo = new THREE.SphereGeometry(0.2);
        const hitbox = new THREE.Mesh(hitboxGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitbox.userData = { type: 'sparrow', parentObj: this };
        this.interactableMesh = hitbox;
        this.mesh.add(hitbox);

        this.mesh.castShadow = true;
    }

    pickNewTarget() {
        if (Math.random() < 0.6 && this.interactables.length > 0) {
            this.state = 'LANDING';
            // Pick a random spot in room but constrain height
            this.targetPos.set(
                (Math.random() - 0.5) * 10,
                Math.random() > 0.5 ? 0.1 : 1.0,
                (Math.random() - 0.5) * 10 + 5
            );
        } else {
            this.state = 'FLYING';
            this.targetPos.set(
                (Math.random() - 0.5) * 14,
                2.0 + Math.random() * 1.5,
                (Math.random() - 0.5) * 14 + 5
            );
        }
    }

    seek(target) {
        const desired = new THREE.Vector3().subVectors(target, this.position);

        const d = desired.length();
        let speed = this.maxSpeed;

        if (this.state === 'LANDING' || this.state === 'PERCHED') {
            if (d < 2.0) {
                speed = THREE.MathUtils.mapLinear(d, 0, 2.0, 0, this.maxSpeed);
            }
        }

        desired.normalize().multiplyScalar(speed);

        const steer = new THREE.Vector3().subVectors(desired, this.velocity);
        steer.clampLength(0, this.maxForce);
        return steer;
    }

    update(delta) {
        const now = performance.now() / 1000;
        this.wingPhase += delta * 15;

        // 1. Audio Logic
        if (now > this.nextChirpTime) {
            this.chirp();
            this.nextChirpTime = now + Math.random() * 3 + 2;
        }

        // 2. Physics Update
        if (this.state === 'PERCHED') {
            this.perchTime -= delta;
            this.velocity.set(0, 0, 0);

            if (Math.sin(this.wingPhase * 0.5) > 0.95) {
                this.mesh.rotation.y += (Math.random() - 0.5) * 0.1;
            }

            this.leftWing.rotation.z = 0.2;
            this.rightWing.rotation.z = -0.2;

            if (this.perchTime <= 0) {
                this.state = 'TAKEOFF';
                this.targetPos.y += 1.0;
                this.pickNewTarget();
                this.state = 'FLYING';
            }
        } else {
            const steer = this.seek(this.targetPos);
            this.acceleration.add(steer);

            this.velocity.add(this.acceleration);
            this.velocity.clampLength(0, this.maxSpeed);

            const moveStep = this.velocity.clone().multiplyScalar(delta);
            this.position.add(moveStep);
            this.mesh.position.copy(this.position);

            this.acceleration.set(0, 0, 0);

            if (this.velocity.lengthSq() > 0.01) {
                const lookTarget = this.position.clone().add(this.velocity);
                this.mesh.lookAt(lookTarget);
            }

            const flapAmp = (this.state === 'LANDING') ? 0.2 : 0.5;
            this.leftWing.rotation.z = Math.sin(this.wingPhase) * flapAmp;
            this.rightWing.rotation.z = -Math.sin(this.wingPhase) * flapAmp;

            const d = this.position.distanceTo(this.targetPos);
            if (d < 0.2) {
                if (this.state === 'LANDING') {
                    this.state = 'PERCHED';
                    this.perchTime = Math.random() * 4 + 2;
                } else {
                    this.pickNewTarget();
                }
            }
        }
    }

    chirp() {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Pick random sound
        const sound = this.chirpSounds[Math.floor(Math.random() * this.chirpSounds.length)];
        if (sound) {
            // Reset to 0 if playing
            sound.currentTime = 0;
            // Play
            sound.play().catch(e => {
                // Auto-play blocked likely
            });
        }
    }
}
