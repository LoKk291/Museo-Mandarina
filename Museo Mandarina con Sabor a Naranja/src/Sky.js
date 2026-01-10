import * as THREE from 'three';

export class Sky {
    constructor(scene, lights) {
        this.scene = scene;
        this.lights = lights; // { dirLight, amiLight }
        this.clouds = [];

        // Cycle Config (Seconds)
        this.dayDuration = 600; // 10 minutes (06:00 to 20:00 = 14 game hours)
        this.nightDuration = 300; // 5 minutes (20:00 to 06:00 = 10 game hours)
        this.cycleDuration = this.dayDuration + this.nightDuration;

        // Initialize Time to 8:00 AM
        // 0s = 06:00. 
        // 8:00 is 2 hours after 06:00.
        // Day speed: 14 hours in 600s -> 42.857s per hour.
        // 2 hours * 42.857 = 85.714s
        this.time = 85.714;

        // Colors
        this.dayColor = new THREE.Color(0x87CEEB); // Sky Blue
        this.nightColor = new THREE.Color(0x0a0a20); // Deep Dark Blue/Black
        this.sunsetStartColor = new THREE.Color(0xffcc33); // Orange/Yellow
        this.sunsetEndColor = new THREE.Color(0xff6600); // Orange/Red

        this.initClouds();
        this.initSunMoon();
    }

    initClouds() {
        // Use Dodecahedron for "Low Poly Fluffy" look instead of Box
        const cloudGeo = new THREE.DodecahedronGeometry(1, 0);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9, // More solid white
            opacity: 0.9, // More solid white
            flatShading: true,
            emissive: 0xeeeeee, // Glow to stay white
            emissiveIntensity: 0.4 // Adjust brightness
        });

        // Create a few clusters of clouds
        // Increased count (15 -> 60) and range (200 -> 800)
        for (let i = 0; i < 60; i++) {
            const cluster = new THREE.Group();

            // Random position in sky
            const x = (Math.random() - 0.5) * 800; // Wider area
            const z = (Math.random() - 0.5) * 800;
            const y = 40 + Math.random() * 50; // Variation in height

            // Random parts for the cloud (More parts for realism)
            const parts = 5 + Math.floor(Math.random() * 8);
            for (let j = 0; j < parts; j++) {
                const mesh = new THREE.Mesh(cloudGeo, cloudMat);
                // Offset from center of cluster
                mesh.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 6
                );
                // Varied scales
                const scale = 3 + Math.random() * 5;
                mesh.scale.set(scale, scale * 0.8, scale);
                // Random Rotation
                mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

                cluster.add(mesh);
            }

            cluster.position.set(x, y, z);
            this.scene.add(cluster);
            this.clouds.push({
                mesh: cluster,
                speed: 0.5 + Math.random() * 1.5 // Slower, varying speed
            });
        }
    }

    initSunMoon() {
        // --- Sun ---
        // Create procedural texture for Sun (Glowing Gradient)
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = 512;
        sunCanvas.height = 512;
        const sunCtx = sunCanvas.getContext('2d');

        // Background (Orange-Red)
        sunCtx.fillStyle = '#ffaa33';
        sunCtx.fillRect(0, 0, 512, 512);

        // Turbulence/Noise (Simple Random Rects for "Plasma")
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const w = 20 + Math.random() * 30;
            const h = 10 + Math.random() * 20;
            sunCtx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, 0, 0.2)`;
            sunCtx.fillRect(x, y, w, h);
        }

        // Radial Glow (Bright Center)
        const sunGrad = sunCtx.createRadialGradient(256, 256, 50, 256, 256, 250);
        sunGrad.addColorStop(0, '#ffffdd'); // White/Yellow Core
        sunGrad.addColorStop(0.3, '#ffcc33'); // Yellow
        sunGrad.addColorStop(0.8, 'rgba(255, 170, 51, 0.8)'); // Orange
        sunGrad.addColorStop(1, 'rgba(255, 100, 0, 0.5)'); // Dark Orange edge
        sunCtx.fillStyle = sunGrad;
        sunCtx.fillRect(0, 0, 512, 512);

        const sunTex = new THREE.CanvasTexture(sunCanvas);
        sunTex.colorSpace = THREE.SRGBColorSpace;

        const sunGeo = new THREE.SphereGeometry(6, 32, 32); // Slightly larger
        const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffffff }); // White tint to let texture show
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // --- Moon ---
        // Create procedural texture for Moon (Craters)
        const moonCanvas = document.createElement('canvas');
        moonCanvas.width = 512;
        moonCanvas.height = 512;
        const moonCtx = moonCanvas.getContext('2d');

        // Base Grey
        moonCtx.fillStyle = '#dddddd';
        moonCtx.fillRect(0, 0, 512, 512);

        // Craters (Random Circles with shadow/highlight)
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 5 + Math.random() * 30;
            const grey = 150 + Math.random() * 80; // Base crater color

            // Crater base
            moonCtx.fillStyle = `rgb(${grey},${grey},${grey})`;
            moonCtx.beginPath();
            moonCtx.arc(x, y, r, 0, Math.PI * 2);
            moonCtx.fill();

            // Simple shading (Darker edge)
            moonCtx.strokeStyle = `rgba(100,100,100,0.5)`;
            moonCtx.lineWidth = 2;
            moonCtx.stroke();
        }

        const moonTex = new THREE.CanvasTexture(moonCanvas);
        moonTex.colorSpace = THREE.SRGBColorSpace;

        const moonGeo = new THREE.SphereGeometry(4, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTex,
            roughness: 0.9,
            metalness: 0.1,
            color: 0xddddff
        }); // Standard Material for moon to react slightly to light? 
        // Or Basic to be visible at night without light?
        // Moon should be self-illuminated or heavily lit by sun... but Sun is off at night.
        // Let's use Basic to ensure visibility.
        const moonMatBasic = new THREE.MeshBasicMaterial({ map: moonTex, color: 0xffffff });

        this.moonMesh = new THREE.Mesh(moonGeo, moonMatBasic);
        this.scene.add(this.moonMesh);
    }

    calculateGameTime(cycleTime) {
        // Returns game time in format { hours, minutes, continuousHour }
        // 0-600s -> 06:00 to 20:00 (14 hours)
        // 600-900s -> 20:00 to 06:00 (10 hours)

        let continuousHour = 0;

        if (cycleTime < this.dayDuration) {
            // Day Phase (14 hours duration)
            const progress = cycleTime / this.dayDuration;
            continuousHour = 6 + (progress * 14);
        } else {
            // Night Phase (10 hours duration)
            const nightProgress = (cycleTime - this.dayDuration) / this.nightDuration;
            continuousHour = 20 + (nightProgress * 10);
            if (continuousHour >= 24) continuousHour -= 24;
        }

        const hours = Math.floor(continuousHour);
        const minutes = Math.floor((continuousHour - hours) * 60);

        return { hours, minutes, continuousHour };
    }

    update(delta) {
        this.time += delta;
        const cycleTime = this.time % this.cycleDuration;

        // Move clouds
        this.clouds.forEach(cloud => {
            cloud.mesh.position.x += cloud.speed * delta;
            if (cloud.mesh.position.x > 400) {
                cloud.mesh.position.x = -400; // Wrap around (half of 800)
            }
        });

        const gameTime = this.calculateGameTime(cycleTime);
        const gh = gameTime.continuousHour; // 0-24 float

        // --- Celestial Positioning first to get Elevation ---
        // Map 24h to Angle 0-2PI
        // Sunrise (06:00) -> Angle 0 (Left/Eastern Horizon)
        // Noon (13:00) -> Angle PI/2 (Zenith)

        let cycleProg = 0;
        // Shift time so 6:00 is 0.
        let shiftedHour = gh - 6;
        if (shiftedHour < 0) shiftedHour += 24;

        cycleProg = shiftedHour / 24.0;

        const celestialAngle = cycleProg * Math.PI * 2;

        // Position
        const r = 80;
        const sunX = -Math.cos(celestialAngle) * r;
        const sunY = Math.sin(celestialAngle) * r;

        this.sunMesh.position.set(sunX, sunY, -20);
        this.moonMesh.position.set(-sunX, -sunY, -20); // Moon opposite

        // Rotate stars
        if (this.starField) {
            this.starField.rotation.z += delta * 0.005;
        }

        // --- Lighting & Sky Color Logic ---
        const elevation = sunY / r; // -1 to 1

        let fogColor = new THREE.Color();
        let starOpacity = 0;

        // Light Source Management
        const SUN_COLOR = 0xffaa33;
        const MOON_COLOR = 0x88bbff;

        if (elevation > -0.1) {
            // === DAY / SUN DOMINANT === (Includes Twilight)

            // LIGHT: Sun tracks Sun Mesh
            this.lights.dirLight.position.set(sunX, sunY, -10);
            this.lights.dirLight.color.setHex(SUN_COLOR);

            if (elevation > 0) {
                // Day / Sunrise
                if (elevation < 0.2) {
                    // Transition
                    const p = elevation / 0.2;
                    fogColor.lerpColors(this.sunsetEndColor, this.dayColor, p);
                    this.lights.dirLight.intensity = p;
                    starOpacity = 1.0 - p;
                } else {
                    // High Noon
                    fogColor.copy(this.dayColor);
                    this.lights.dirLight.intensity = 1.0;
                    starOpacity = 0;
                }
            } else {
                // Twilight (Sun just below horizon 0 to -0.1)
                // elevation -0.1 to 0
                const p = (elevation + 0.1) / 0.1; // 0 to 1
                fogColor.lerpColors(this.nightColor, this.sunsetEndColor, p);
                this.lights.dirLight.intensity = 0; // Sun off
                // Stars fading in
                starOpacity = 1.0 - (p * 0.5);
            }

            // Ambient Light (Reflects Sun)
            const ambInt = Math.max(0.1, this.lights.dirLight.intensity * 0.6);
            this.lights.amiLight.intensity = ambInt;
            this.lights.amiLight.color.setHex(0xffeeb1);

        } else {
            // === NIGHT / MOON DOMINANT ===

            // LIGHT: Moon tracks Moon Mesh
            // Moon Position is -sunX, -sunY
            this.lights.dirLight.position.set(-sunX, -sunY, -10);
            this.lights.dirLight.color.setHex(MOON_COLOR);

            // Moon Elevation is actually -elevation (approx)
            // If sun is down (-1), moon is up (1).
            // Moon Intensity max 0.25 (Soft)

            let moonInt = 0.25;

            // Fade moon light if Moon is rising/setting?
            // Moon Elevation opposite to sun.
            // If elevation is -0.1 (Sun just set), Moon Elevation is 0.1 (Rising)

            // Simply use constant soft light at night for gameplay
            this.lights.dirLight.intensity = moonInt;

            fogColor.copy(this.nightColor);
            starOpacity = 1.0; // Stars Full

            // Ambient Light (Cool Night)
            this.lights.amiLight.intensity = 0.15;
            this.lights.amiLight.color.setHex(0x223355);
        }

        if (this.starMat) this.starMat.opacity = starOpacity;

        // Apply visual updates
        this.scene.background = fogColor;
        this.scene.fog.color.copy(fogColor);
    }

    setTime(targetHour) {
        // Reverse calculate cycleTime from targetHour
        // Day: 06:00 to 20:00 (14 hours) -> 0 to 600s
        // Night: 20:00 to 06:00 (10 hours) -> 600 to 900s

        let newCycleTime = 0;

        // Normalize targetHour 0-24
        if (targetHour < 0) targetHour += 24;
        if (targetHour >= 24) targetHour -= 24;

        // Check if in Day Range (6 <= h < 20)
        if (targetHour >= 6 && targetHour < 20) {
            const hoursIntoDay = targetHour - 6;
            const ratio = hoursIntoDay / 14.0;
            newCycleTime = ratio * this.dayDuration;
        } else {
            // Night Range (20 <= h < 24 OR 0 <= h < 6)
            let hoursIntoNight = 0;
            if (targetHour >= 20) {
                hoursIntoNight = targetHour - 20;
            } else {
                hoursIntoNight = (targetHour + 24) - 20;
            }
            const ratio = hoursIntoNight / 10.0;
            newCycleTime = this.dayDuration + (ratio * this.nightDuration);
        }

        // Update this.time preserving current cycle loop count to avoid glitches?
        // Actually this.time is cumulative. We can just set it to newCycleTime logic.
        // But better to keep the magnitude.
        const currentCycles = Math.floor(this.time / this.cycleDuration);
        this.time = (currentCycles * this.cycleDuration) + newCycleTime;
    }

    getGameTime() {
        return this.calculateGameTime(this.time % this.cycleDuration);
    }
}
