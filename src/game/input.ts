export class Input {
    held = new Set<string>();
    pressed = new Set<string>();
    released = new Set<string>();
    sources = new Map<string, string>();
    map: Record<string, string> = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyJ: 'jab', KeyK: 'charge', Space: 'dodge', KeyL: 'special', Escape: 'pause', KeyP: 'pause' };
    constructor(public pause: () => void) { window.addEventListener('keydown', this.down); window.addEventListener('keyup', this.up); window.addEventListener('blur', this.blur); document.addEventListener('visibilitychange', this.visibility); }
    down = (e: KeyboardEvent) => { const a = this.map[e.code]; if (a && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        if (!e.repeat) {
            if (a === 'pause')
                this.pause();
            else
                this.set('key:' + e.code, a, true);
        }
    } };
    up = (e: KeyboardEvent) => { const a = this.map[e.code]; if (a) {
        e.preventDefault();
        this.set('key:' + e.code, a, false);
    } };
    set(source: string, a: string, on: boolean) { if (on) {
        this.sources.set(source, a);
        if (!this.held.has(a))
            this.pressed.add(a);
        this.held.add(a);
    }
    else {
        if (!this.sources.has(source))
            return;
        this.sources.delete(source);
        if (![...this.sources.values()].includes(a)) {
            this.held.delete(a);
            this.released.add(a);
        }
    } }
    blur = () => { this.clear(); this.pause(); };
    visibility = () => { if (document.hidden)
        this.blur(); };
    clear() { this.sources.clear(); this.held.clear(); this.pressed.clear(); this.released.clear(); }
    frame() { this.pressed.clear(); this.released.clear(); }
    destroy() { window.removeEventListener('keydown', this.down); window.removeEventListener('keyup', this.up); window.removeEventListener('blur', this.blur); document.removeEventListener('visibilitychange', this.visibility); }
}
