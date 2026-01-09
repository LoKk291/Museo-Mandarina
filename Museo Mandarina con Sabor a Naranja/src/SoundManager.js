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
}
