export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    load(key, path) {
        const audio = new Audio(path);
        this.sounds[key] = audio;
    }

    setVolume(key, vol) {
        if (this.sounds[key]) this.sounds[key].volume = Math.max(0, Math.min(1, vol));
    }

    setPlaybackRate(key, rate) {
        if (this.sounds[key]) this.sounds[key].playbackRate = rate;
    }

    setLoop(key, loop) {
        if (this.sounds[key]) this.sounds[key].loop = loop;
    }

    play(key, clone = true) {
        if (!this.enabled) return null;
        const sound = this.sounds[key];
        if (sound) {
            if (clone) {
                // Allow overlapping sounds (e.g. rapid shooting, typing)
                const cloneAudio = sound.cloneNode();
                cloneAudio.volume = sound.volume;
                cloneAudio.playbackRate = sound.playbackRate || 1.0; // Apply rate
                cloneAudio.play().catch(e => console.warn("Audio play blocked (user interac needed?)", e));
                return cloneAudio;
            } else {
                // Restart same instance
                sound.currentTime = 0;
                sound.playbackRate = sound.playbackRate || 1.0; // Apply rate for non-clones too
                sound.play().catch(e => console.warn("Audio play blocked", e));
                return sound;
            }
        } else {
            console.warn(`Sound '${key}' not loaded.`);
            return null;
        }
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

    // --- DTMF Tones (Dual Tone Multi Frequency) ---
    playDTMF(key) {
        if (!this.enabled) return;
        this.initSynth();
        const t = this.ctx.currentTime;
        const duration = 0.15; // Short beep

        // Frequencies matrix
        //       1209 1336 1477
        // 697    1    2    3
        // 770    4    5    6
        // 852    7    8    9
        // 941    *    0    #

        const dtmf = {
            '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
            '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
            '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
            '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };

        const freqs = dtmf[key];
        if (!freqs) return;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        gain.connect(this.ctx.destination);

        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + duration);
        });
    }

    playVinyl(id) {
        if (!this.enabled) return;

        // Stop currently playing vinyl if any
        if (this.currentVinyl) {
            this.currentVinyl.pause();
            this.currentVinyl.currentTime = 0;
        }

        const path = `sounds/vinilos/${id}.mp3`;
        const audio = new Audio(path);
        audio.volume = 0.5; // Reasonable volume
        audio.play().catch(e => console.warn("Vinyl play blocked", e));

        this.currentVinyl = audio;
    }

    stopVinyl() {
        if (this.currentVinyl) {
            this.currentVinyl.pause();
            this.currentVinyl = null;
        }
    }

    setVinylVolume(vol) {
        if (this.currentVinyl) {
            this.currentVinyl.volume = Math.max(0, Math.min(1, vol));
        }
    }
}
