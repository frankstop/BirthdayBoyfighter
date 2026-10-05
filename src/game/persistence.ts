export type Preferences = {
    music: number;
    effects: number;
    mute: boolean;
    reduced: boolean;
    shake: boolean;
};
export const defaults: Preferences = { music: .3, effects: .65, mute: false, reduced: false, shake: true };
export function read<T>(key: string, fallback: T): T { try {
    const s = localStorage.getItem('bbf-v1-' + key);
    return s ? JSON.parse(s) : fallback;
}
catch {
    return fallback;
} }
export function save(key: string, value: unknown) { try {
    localStorage.setItem('bbf-v1-' + key, JSON.stringify(value));
}
catch { /* Private browser / full storage: gameplay remains available. */ } }
export function preferences(): Preferences { const p = read('preferences', defaults); return { ...defaults, ...p, music: Math.max(0, Math.min(1, Number(p.music) || 0)), effects: Math.max(0, Math.min(1, Number(p.effects) || 0)) }; }
