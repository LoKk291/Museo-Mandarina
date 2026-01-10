export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    load(key, path) {
        const audio = new Audio(path);
        this.sounds[key] = audio;
    }

    play(key, clone = true) {
        if (!this.enabled) return;
        const sound = this.sounds[key];
        if (sound) {
            if (clone) {
                // Allow overlapping sounds (e.g. rapid shooting, typing)
                const cloneAudio = sound.cloneNode();
                cloneAudio.volume = sound.volume;
                cloneAudio.play().catch(e => console.warn("Audio play blocked (user interac needed?)", e));
            } else {
                // Restart same instance
                sound.currentTime = 0;
                sound.play().catch(e => console.warn("Audio play blocked", e));
            }
        } else {
            console.warn(`Sound '${key}' not loaded.`);
        }
    }

    setVolume(key, vol) {
        if (this.sounds[key]) this.sounds[key].volume = Math.max(0, Math.min(1, vol));
    }

    stop(key) {
        const sound = this.sounds[key];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    // --- PROCEDURAL AUDIO (Synthesizer) ---
    initSynth() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.createNoiseBuffer();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate; // 1 second
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    playMechanicalClick() {
        if (!this.enabled) return;
        this.initSynth();
        const t = this.ctx.currentTime;

        if (!this.noiseBuffer) this.createNoiseBuffer();

        // Tune: Standard Office Keyboard (Plastic, slightly hollow)
        // 1. Keycap Hit (The "Clack")
        const clickSrc = this.ctx.createBufferSource();
        clickSrc.buffer = this.noiseBuffer;

        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.value = 2000; // Plastic resonance
        clickFilter.Q.value = 1.0;

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0, t);
        clickGain.gain.linearRampToValueAtTime(0.5, t + 0.005);
        clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

        clickSrc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.ctx.destination);

        clickSrc.start(t);
        clickSrc.stop(t + 0.05);

        // 2. Bottom Out (The dull thud)
        const thudSrc = this.ctx.createBufferSource();
        thudSrc.buffer = this.noiseBuffer;

        const thudFilter = this.ctx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 500; // Mid-range hollow

        const thudGain = this.ctx.createGain();
        thudGain.gain.setValueAtTime(0, t);
        thudGain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        thudSrc.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(this.ctx.destination);

        thudSrc.start(t);
        thudSrc.stop(t + 0.1);
    }
}
