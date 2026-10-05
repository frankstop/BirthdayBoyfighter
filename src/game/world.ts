import { C, type Kind, type Mode } from './config';
import { AudioBus } from './audio';
import { Input } from './input';
import { read, save } from './persistence';
export type Enemy = {
    id: number;
    kind: Kind;
    x: number;
    hp: number;
    face: number;
    state: 'walk' | 'warn' | 'attack' | 'recover';
    timer: number;
    vx: number;
    hit: boolean;
    move: number;
    flash: number;
    action: number;
    stop: number;
};
export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: number;
    size: number;
};
export type Projectile = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
};
export type Snapshot = {
    mode: Mode;
    hp: number;
    score: number;
    best: number;
    combo: number;
    mult: number;
    wave: number;
    kills: number;
    special: number;
    boss: number;
    banner: string;
    charge: number;
    dodge: number;
};
export class World {
    mode: Mode = 'title';
    input: Input;
    audio = new AudioBus();
    time = 0;
    score = 0;
    best = read('best', 0);
    combo = 0;
    lastHit = -10;
    special = 0;
    wave = 1;
    kills = 0;
    banner = '';
    bannerTime = 0;
    breakTime = 0;
    spawnTimer = 2;
    spawnIndex = 0;
    nextId = 1;
    warning: {
        kind: Kind;
        x: number;
        timer: number;
    }[] = [];
    enemies: Enemy[] = [];
    projectiles: Projectile[] = [];
    particles: Particle[] = [];
    candies: {
        x: number;
        life: number;
    }[] = [];
    floaters: {
        x: number;
        y: number;
        text: string;
        life: number;
    }[] = [];
    shake = 0;
    victoryTimer = 0;
    specialFx = 0;
    bossDeathX = 900;
    player = { x: 640, face: 1, hp: 5, inv: 0, dodge: 0, dodgeCd: 0, jabCd: 0, charge: 0, attack: 0, attackAge: 0, damage: 1, range: 0, targets: new Set<number>(), hurt: 0, moving: false };
    constructor(public changed: (s: Snapshot) => void) { this.input = new Input(() => { if (this.mode === 'playing')
        this.pause(); }); }
    mult() { return this.combo >= 20 ? 4 : this.combo >= 10 ? 3 : this.combo >= 5 ? 2 : 1; }
    snapshot(): Snapshot { return { mode: this.mode, hp: this.player.hp, score: this.score, best: this.best, combo: this.combo, mult: this.mult(), wave: this.wave, kills: this.kills, special: this.special, boss: this.enemies.find(e => e.kind === 'boss')?.hp ?? 0, banner: this.banner, charge: this.player.charge, dodge: this.player.dodgeCd }; }
    emit() { this.changed(this.snapshot()); }
    start(tutorial = true) { this.time = 0; this.score = 0; this.combo = 0; this.lastHit = -10; this.special = 0; this.wave = 1; this.kills = 0; this.enemies = []; this.projectiles = []; this.particles = []; this.candies = []; this.floaters = []; this.warning = []; this.nextId = 1; this.spawnIndex = 0; this.spawnTimer = 2; this.breakTime = 0; this.shake = 0; this.victoryTimer = 0; this.specialFx = 0; this.bossDeathX = 900; this.player = { x: 640, face: 1, hp: 5, inv: 0, dodge: 0, dodgeCd: 0, jabCd: 0, charge: 0, attack: 0, attackAge: 0, damage: 1, range: 0, targets: new Set(), hurt: 0, moving: false }; this.input.clear(); this.mode = tutorial ? 'tutorial' : 'playing'; this.banner = 'WAVE 1 • CUPCAKE SCRAPPERS'; this.bannerTime = 3; this.audio.unlock(); this.audio.setPaused(tutorial); this.emit(); }
    play() { this.mode = 'playing'; this.audio.unlock(); this.audio.setPaused(false); this.input.clear(); this.emit(); }
    pause() { this.mode = 'paused'; this.input.clear(); this.player.charge = 0; this.audio.setPaused(true); this.emit(); }
    quit() { this.mode = 'title'; this.input.clear(); this.audio.setPaused(true); this.emit(); }
    finish(mode: 'over' | 'victory') { this.mode = mode; this.best = Math.max(this.best, this.score); save('best', this.best); this.audio.sound(mode === 'victory' ? 'victory' : 'hurt'); this.audio.setPaused(true); this.input.clear(); this.emit(); }
    add(kind: Kind, x: number) { if (kind !== 'boss' && this.enemies.filter(e => e.kind !== 'boss').length >= C.maxEnemies)
        return; this.enemies.push({ id: this.nextId++, kind, x, hp: C.enemy[kind].hp, face: x < 640 ? 1 : -1, state: 'walk', timer: kind === 'boss' ? 2 : 1, vx: 0, hit: false, move: 0, flash: 0, action: 0, stop: 0 }); if (kind === 'boss')
        this.audio.sound('boss'); }
    burst(x: number, y: number, count = 20) { const colors = [0xff99b1, 0xffefba, 0xffcc70, 0x45c7c0, 0x8a53aa]; if (this.audio.prefs.reduced)
        count = Math.ceil(count / 4); for (let i = 0; i < count && this.particles.length < C.particleCap; i++)
        this.particles.push({ x, y, vx: (Math.random() - .5) * 480, vy: -Math.random() * 370, life: .5 + Math.random() * .5, color: colors[i % 5], size: 3 + Math.random() * 7 }); }
    hit(e: Enemy, d: number, charged: boolean) { if (e.hp <= 0)
        return; e.hp -= d; e.flash = .13; e.vx = this.player.face * (charged ? 400 : 170); e.move = Math.max(e.move, .1); e.stop = .05; if (charged && e.kind === 'bruiser' && e.state === 'warn') {
        e.state = 'recover';
        e.timer = .9;
    } this.combo = this.time - this.lastHit <= C.comboWindow ? this.combo + 1 : 1; this.lastHit = this.time; this.special = Math.min(20, this.special + 1); const points = C.score.hit * this.mult(); this.score += points; this.floaters.push({ x: e.x, y: C.floor - 100, text: '+' + points, life: .8 }); this.burst(e.x, C.floor - 65, charged ? 28 : 12); this.audio.sound(charged ? 'charge' : 'punch'); this.shake = Math.max(this.shake, charged ? 7 : 3); if (e.hp <= 0) {
        this.kills++;
        this.score += C.score.kill * this.mult();
        this.burst(e.x, C.floor - 60, e.kind === 'boss' ? 80 : 35);
        this.audio.sound('splat');
        for (let i = 0; i < (e.kind === 'pinata' ? 5 : 1); i++)
            this.candies.push({ x: Math.max(25, Math.min(1255, e.x + (i - 2) * 25)), life: 8 });
        if (e.kind === 'boss') {
            this.score += C.score.boss;
            this.bossDeathX = e.x;
            this.victoryTimer = 3;
            this.banner = 'MAKE A WISH!';
            this.bannerTime = 3;
            this.projectiles = [];
        }
    } }
    hurt() { const p = this.player; if (p.inv > 0 || p.dodge > 0 || this.victoryTimer)
        return; p.hp--; p.inv = C.invulnerability; p.hurt = .3; p.charge = 0; p.attack = 0; this.combo = 0; this.shake = 8; this.audio.sound('hurt'); if (p.hp <= 0)
        this.finish('over'); }
    punch(charged: boolean) { const p = this.player; if (p.attack > 0 || p.dodge > 0)
        return; p.damage = charged ? 1 + Math.floor(Math.min(1, p.charge / C.chargeTime) * 2) : 1; p.range = charged ? 104 : 83; p.attack = charged ? .32 : .2; p.attackAge = 0; p.targets.clear(); p.jabCd = C.jabCooldown; p.charge = 0; this.audio.sound('dodge'); }
    specialAttack() { if (this.special < 20)
        return; this.special = 0; this.specialFx = .5; this.audio.sound('special'); this.burst(this.player.x, C.floor - 60, 80); this.shake = 12; for (const e of this.enemies)
        if (Math.abs(e.x - this.player.x) < 270)
            this.hit(e, 5, true); this.special = 0; this.projectiles = []; }
    tick(dt: number) {
        dt = Math.min(dt, .04);
        if (this.mode !== 'playing') {
            this.input.frame();
            return;
        }
        this.time += dt;
        const p = this.player;
        for (const key of ['inv', 'dodge', 'dodgeCd', 'jabCd', 'attack', 'hurt'] as const)
            p[key] = Math.max(0, p[key] - dt);
        this.shake = Math.max(0, this.shake - dt * 40);
        this.specialFx = Math.max(0, this.specialFx - dt);
        if (this.time - this.lastHit > C.comboWindow)
            this.combo = 0;
        if (this.bannerTime > 0) {
            this.bannerTime -= dt;
            if (this.bannerTime <= 0)
                this.banner = '';
        }
        if (this.victoryTimer > 0) {
            this.victoryTimer -= dt;
            this.updateEffects(dt);
            if (this.victoryTimer <= 0)
                this.finish('victory');
            this.input.frame();
            return;
        }
        const dir = Number(this.input.held.has('right')) - Number(this.input.held.has('left'));
        p.moving = dir !== 0;
        if (dir)
            p.face = dir;
        if (p.dodge > 0)
            p.x += p.face * 900 * dt;
        else
            p.x += dir * C.speed * dt * (p.charge > 0 ? .55 : 1);
        p.x = Math.max(48, Math.min(1232, p.x));
        if (this.input.pressed.has('dodge') && p.dodgeCd <= 0) {
            p.dodge = C.dodgeTime;
            p.dodgeCd = C.dodgeCooldown;
            p.inv = Math.max(p.inv, C.dodgeTime);
            p.charge = 0;
            this.audio.sound('dodge');
        }
        if (this.input.held.has('charge') && p.dodge <= 0 && p.attack <= 0)
            p.charge = Math.min(C.chargeTime, p.charge + dt);
        if (this.input.released.has('charge') && p.charge > 0)
            this.punch(true);
        if (this.input.held.has('jab') && p.jabCd <= 0 && p.charge <= 0)
            this.punch(false);
        if (this.input.pressed.has('special'))
            this.specialAttack();
        if (p.attack > 0) {
            p.attackAge += dt;
            if (p.attackAge >= .055 && p.attackAge < .13) {
                for (const e of this.enemies) {
                    const forward = (e.x - p.x) * p.face;
                    if (forward > -10 && forward < C.enemy[e.kind].r + p.range && !p.targets.has(e.id)) {
                        p.targets.add(e.id);
                        this.hit(e, p.damage, p.damage >= 3);
                        if (p.damage === 1)
                            break;
                    }
                }
                this.projectiles = this.projectiles.filter(b => { if ((b.x - p.x) * p.face > 0 && (b.x - p.x) * p.face < p.range + 16 && Math.abs(b.y - (C.floor - 65)) < 55) {
                    this.burst(b.x, b.y, 8);
                    this.score += 25;
                    this.audio.sound('splat');
                    return false;
                } return true; });
            }
        }
        this.updateEnemies(dt);
        if (this.mode !== 'playing') {
            this.input.frame();
            return;
        }
        this.projectiles = this.projectiles.filter(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (Math.abs(b.x - p.x) < 29 && Math.abs(b.y - (C.floor - 60)) < 55) {
            this.hurt();
            return false;
        } return b.life > 0 && b.x > -80 && b.x < 1360; });
        if (this.mode !== 'playing') {
            this.input.frame();
            return;
        }
        this.candies = this.candies.filter(c => { c.life -= dt; if (Math.abs(c.x - p.x) < 52) {
            this.score += C.score.candy * this.mult();
            this.audio.sound('pickup');
            return false;
        } return c.life > 0; });
        this.updateEffects(dt);
        this.progress(dt);
        this.input.frame();
    }
    updateEffects(dt: number) { this.particles = this.particles.filter(b => { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 650 * dt; return b.life > 0; }); this.floaters = this.floaters.filter(f => { f.life -= dt; f.y -= 60 * dt; return f.life > 0; }); }
    updateEnemies(dt: number) {
        for (const e of this.enemies) {
            if (e.hp <= 0)
                continue;
            if (e.stop > 0) {
                e.stop -= dt;
                continue;
            }
            const cfg = C.enemy[e.kind], dist = Math.abs(e.x - this.player.x);
            e.timer -= dt;
            e.flash = Math.max(0, e.flash - dt);
            e.move = Math.max(0, e.move - dt);
            e.x += e.vx * dt;
            e.vx *= Math.exp(-dt * 10);
            e.x = Math.max(30, Math.min(1250, e.x));
            if (e.state === 'walk') {
                e.face = e.x < this.player.x ? 1 : -1;
                if (e.kind === 'caster') {
                    if (dist < 270)
                        e.x -= e.face * cfg.speed * dt;
                    else if (dist > 410)
                        e.x += e.face * cfg.speed * dt;
                    if (e.timer <= 0) {
                        e.state = 'warn';
                        e.timer = .75;
                    }
                }
                else if (e.kind === 'boss') {
                    if (dist > 155)
                        e.x += e.face * cfg.speed * dt;
                    if (e.timer <= 0) {
                        e.state = 'warn';
                        e.timer = e.hp < 15 ? .65 : .9;
                    }
                }
                else {
                    if (dist > (e.kind === 'bruiser' ? 108 : 100)) {
                        e.x += e.face * cfg.speed * dt * (e.kind === 'pinata' ? (Math.sin(this.time * 5) > 0 ? 2 : 0) : 1);
                    }
                    else if (e.timer <= 0) {
                        e.state = 'warn';
                        e.timer = e.kind === 'bruiser' ? .85 : .55;
                    }
                }
            }
            else if (e.state === 'warn' && e.timer <= 0) {
                e.state = 'attack';
                e.timer = .23;
                e.hit = false;
                if (e.kind === 'caster') {
                    this.projectiles.push({ x: e.x, y: C.floor - 65, vx: e.face * 200, vy: 0, life: 7 });
                    this.audio.sound('splat');
                }
                if (e.kind === 'boss') {
                    const action = e.action++ % 3;
                    if (action === 1) {
                        for (const vy of [-40, 0, 40])
                            this.projectiles.push({ x: e.x, y: C.floor - 80, vx: e.face * 175, vy, life: 7 });
                    }
                    else if (action === 2) {
                        if (this.enemies.filter(a => a.hp > 0 && a.kind === 'cupcake').length < 3) {
                            this.warning.push({ kind: 'cupcake', x: e.x > 640 ? 50 : 1230, timer: 1 });
                            this.warning.push({ kind: 'cupcake', x: e.x > 640 ? 1230 : 50, timer: 1 });
                        }
                    }
                    else {
                        e.hit = true;
                        if (dist < 195)
                            this.hurt();
                        this.burst(e.x, C.floor, 20);
                    }
                }
            }
            else if (e.state === 'attack') {
                if (e.kind === 'cupcake' || e.kind === 'pinata')
                    e.x += e.face * 400 * dt;
                if (!e.hit && e.kind !== 'caster' && e.kind !== 'boss' && Math.abs(e.x - this.player.x) < cfg.r + 42) {
                    this.hurt();
                    e.hit = true;
                }
                if (e.timer <= 0) {
                    e.state = 'recover';
                    e.timer = e.kind === 'boss' ? 1.8 : e.kind === 'bruiser' ? 1.3 : .8;
                }
            }
            else if (e.state === 'recover' && e.timer <= 0) {
                e.state = 'walk';
                e.timer = e.kind === 'caster' ? 1.7 : e.kind === 'boss' ? (e.hp < 15 ? 1 : 1.6) : .6;
            }
        }
        this.enemies = this.enemies.filter(e => e.hp > 0);
    }
    progress(dt: number) {
        if (this.breakTime > 0) {
            this.breakTime -= dt;
            if (this.breakTime <= 0) {
                this.wave++;
                this.spawnIndex = 0;
                this.spawnTimer = 1.2;
                this.banner = ['', 'CUPCAKE SCRAPPERS', 'LAYER CAKE BRUISERS', 'CANDLE CASTERS', 'PARTY ANIMALS', 'THE UNINVITED WEDDING CAKE'][this.wave];
                this.bannerTime = 3;
            }
            return;
        }
        this.warning = this.warning.filter(w => { w.timer -= dt; if (w.timer <= 0) {
            this.add(w.kind, w.x);
            return false;
        } return true; });
        this.spawnTimer -= dt;
        const lineup = C.waves[this.wave - 1];
        if (this.spawnIndex < lineup.length && this.spawnTimer <= 0 && this.enemies.length + this.warning.length < 6) {
            const kind = lineup[this.spawnIndex++];
            this.warning.push({ kind, x: this.spawnIndex % 2 ? 65 : 1215, timer: 1 });
            this.spawnTimer = this.wave === 1 ? 5 : this.wave === 4 ? 4 : 4.5;
        }
        if (this.spawnIndex >= lineup.length && this.enemies.length === 0 && this.warning.length === 0 && this.wave < 5) {
            this.score += C.score.wave;
            this.player.hp = Math.min(5, this.player.hp + 1);
            this.projectiles = [];
            this.breakTime = 4;
            this.banner = 'WAVE CLEARED! +500 • +1 HEALTH';
            this.bannerTime = 4;
            this.audio.sound('wave');
        }
    }
    destroy() { this.input.destroy(); this.audio.destroy(); }
}
