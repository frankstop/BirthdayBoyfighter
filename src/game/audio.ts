import { defaults, type Preferences } from './persistence';
export class AudioBus {
    ctx?: AudioContext;
    prefs: Preferences = defaults;
    music?: GainNode;
    fx?: GainNode;
    timer?: ReturnType<typeof setInterval>;
    step = 0;
    paused = true;
    unlock() { if (!this.ctx) {
        this.ctx = new AudioContext();
        this.music = this.ctx.createGain();
        this.fx = this.ctx.createGain();
        this.music.connect(this.ctx.destination);
        this.fx.connect(this.ctx.destination);
        this.timer = setInterval(() => this.beat(), 180);
    } void this.ctx.resume(); this.update(this.prefs); }
    update(p: Preferences) { this.prefs = p; if (this.ctx) {
        this.music!.gain.setValueAtTime(p.mute || this.paused ? 0 : p.music * .18, this.ctx.currentTime);
        this.fx!.gain.setValueAtTime(p.mute ? 0 : p.effects * .3, this.ctx.currentTime);
    } }
    tone(freq: number, duration: number, target: GainNode, type: OscillatorType = 'triangle', slide = 0) { if (!this.ctx)
        return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slide)
        o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + duration); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + duration); o.connect(g); g.connect(target); o.start(); o.stop(t + duration); }
    beat() { if (!this.ctx || this.paused || this.prefs.mute)
        return; const notes = [261, 329, 392, 523, 440, 392, 329, 392, 293, 349, 440, 587, 523, 440, 349, 293]; this.tone(notes[this.step % 16], .15, this.music!); if (this.step % 2 === 0)
        this.tone([65, 65, 87, 98][Math.floor(this.step / 4) % 4], .17, this.music!, 'sine'); this.step++; }
    sound(name: string) { if (!this.ctx)
        return; const map: Record<string, number[]> = { punch: [160, .09, 40], charge: [240, .16, 35], splat: [330, .12, 50], dodge: [600, .13, 150], pickup: [880, .14, 1320], hurt: [130, .25, 50], wave: [523, .4, 1046], boss: [90, .5, 40], victory: [660, .65, 1320], special: [1000, .5, 70] }; const [f, d, s] = map[name] || map.punch; this.tone(f, d, this.fx!, 'triangle', s); }
    setPaused(p: boolean) { this.paused = p; this.update(this.prefs); }
    destroy() { clearInterval(this.timer); void this.ctx?.close(); }
}
