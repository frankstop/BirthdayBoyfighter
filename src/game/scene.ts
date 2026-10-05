import Phaser from 'phaser';
import { World } from './world';
import { C } from './config';
export class PartyScene extends Phaser.Scene {
    world: World;
    gfx!: Phaser.GameObjects.Graphics;
    player!: Phaser.GameObjects.Image;
    actors = new Map<number, Phaser.GameObjects.Image>();
    objects: Phaser.GameObjects.Image[] = [];
    labels: Phaser.GameObjects.Text[] = [];
    acc = 0;
    sim = 0;
    constructor(world: World) { super('Party'); this.world = world; }
    preload() { this.load.image('room', 'assets/party-room.png'); this.load.spritesheet('cast', 'assets/characters.png', { frameWidth: 256, frameHeight: 256 }); }
    create() { this.add.image(640, 360, 'room').setDisplaySize(1280, 720); this.gfx = this.add.graphics().setDepth(4); this.player = this.add.image(640, C.floor, 'cast', 0).setOrigin(.5, 1).setDisplaySize(170, 170).setDepth(6); this.game.canvas.setAttribute('aria-label', 'Birthday Boyfighter game arena'); this.cameras.main.setZoom(Math.min(window.devicePixelRatio || 1, 2)).centerOn(640, 360); this.world.emit(); }
    sprite(frame: number, x: number, y: number, size: number, flip = false) { const a = this.add.image(x, y, 'cast', frame).setDisplaySize(size, size).setFlipX(flip).setDepth(5); this.objects.push(a); return a; }
    label(text: string, x: number, y: number, size = 22, color = '#291637') { const a = this.add.text(x, y, text, { fontFamily: 'Arial Black, sans-serif', fontSize: size, color, stroke: '#fff0c7', strokeThickness: 4 }).setOrigin(.5).setDepth(10); this.labels.push(a); return a; }
    update(_t: number, delta: number) { const w = this.world; this.sim += Math.min(delta / 1000, .25); while (this.sim >= 1 / 120) {
        w.tick(1 / 120);
        this.sim -= 1 / 120;
    } this.acc += delta; if (this.acc > 70) {
        w.emit();
        this.acc = 0;
    } this.draw(); }
    draw() {
        const w = this.world, p = w.player, active = w.mode !== 'title', title = w.mode === 'title';
        this.gfx.clear();
        for (const o of this.objects)
            o.destroy();
        this.objects = [];
        for (const o of this.labels)
            o.destroy();
        this.labels = [];
        for (const [id, o] of this.actors)
            if (!w.enemies.some(e => e.id === id)) {
                o.destroy();
                this.actors.delete(id);
            }
        const motion = !w.audio.prefs.reduced;
        const phase = Math.sin(this.time.now / 140);
        let frame = p.hurt > 0 ? 5 : p.dodge > 0 ? 4 : p.attack > 0 ? (p.attackAge < .055 ? 3 : 2) : p.charge > 0 ? 3 : p.moving ? 1 : w.mode === 'victory' ? 6 : 0;
        this.player.setFrame(title ? 0 : frame).setPosition(title ? 700 : p.x, title ? 610 : C.floor + (motion && p.moving ? phase * 3 : 0)).setDisplaySize(title ? 245 : 170, title ? 245 : 170).setFlipX(!title && p.face < 0).setAlpha(p.inv > 0 ? .72 : 1);
        if (title) {
            this.sprite(16, 1085, 480, 370, true);
            this.sprite(7, 925, 555, 110, true);
            this.sprite(7, 570, 565, 100);
            this.player.y += motion ? Math.sin(this.time.now / 250) * 3 : 0;
        }
        if (active) {
            for (const e of w.enemies) {
                let o = this.actors.get(e.id);
                if (!o) {
                    o = this.add.image(e.x, C.floor, 'cast').setOrigin(.5, 1).setDepth(5);
                    this.actors.set(e.id, o);
                }
                let f = C.enemy[e.kind].frame;
                if (e.kind === 'boss' && e.hp < 15)
                    f = 18;
                else if (e.state === 'warn')
                    f = e.kind === 'cupcake' ? 8 : e.kind === 'bruiser' ? 10 : e.kind === 'caster' ? 13 : e.kind === 'pinata' ? 15 : 17;
                else if (e.state === 'attack')
                    f = e.kind === 'bruiser' ? 11 : e.kind === 'cupcake' ? 8 : e.kind === 'pinata' ? 15 : f;
                const size = C.enemy[e.kind].size;
                const hop = e.kind === 'pinata' && e.state === 'walk' && motion ? Math.max(0, Math.sin(w.time * 5)) * 24 : 0;
                o.setFrame(f).setPosition(e.x, C.floor - hop).setDisplaySize(size * (e.move > 0 ? 1.12 : 1), size * (e.move > 0 ? .9 : 1)).setFlipX(e.face < 0).setAlpha(e.flash > 0 ? .75 : 1);
                if (e.state === 'warn') {
                    const r = e.kind === 'boss' ? 195 : e.kind === 'caster' ? 46 : e.kind === 'bruiser' ? 120 : 100;
                    this.gfx.lineStyle(4, 0x301539, 1);
                    this.gfx.strokeEllipse(e.x, C.floor + 3, r * 2, 22);
                    this.gfx.lineStyle(3, 0xf65067, 1);
                    for (let x = e.x - r; x < e.x + r; x += 20)
                        this.gfx.lineBetween(x, C.floor + 5, x + 10, C.floor - 6);
                    this.label(e.kind === 'caster' ? 'CANDLE!' : e.kind === 'boss' ? 'WATCH OUT!' : '!', e.x, C.floor - size - 12, 23, '#b71c44');
                }
                if (e.kind !== 'boss' && e.hp < C.enemy[e.kind].hp) {
                    this.gfx.fillStyle(0x291637);
                    this.gfx.fillRoundedRect(e.x - 27, C.floor - size - 5, 54, 7, 3);
                    this.gfx.fillStyle(0xf36b83);
                    this.gfx.fillRoundedRect(e.x - 25, C.floor - size - 3, 50 * e.hp / C.enemy[e.kind].hp, 3, 1);
                }
            }
            for (const b of w.projectiles)
                this.sprite(21, b.x, b.y, 45, b.vx < 0);
            for (const c of w.candies)
                this.sprite(20, c.x, C.floor - 14 + (motion ? Math.sin(w.time * 6) * 3 : 0), 42).setAlpha(c.life < 2 ? .65 : 1);
            for (const a of w.warning) {
                this.gfx.lineStyle(4, 0x291637);
                this.gfx.strokeCircle(a.x, C.floor - 30, 29);
                this.label('INCOMING', a.x < 640 ? 85 : 1195, C.floor - 105, 18);
                this.label(a.x < 640 ? '››' : '‹‹', a.x, C.floor - 30, 32);
            }
            if (p.charge > 0) {
                this.gfx.fillStyle(0x291637);
                this.gfx.fillRoundedRect(p.x - 38, C.floor - 180, 76, 9, 4);
                this.gfx.fillStyle(p.charge >= .7 ? 0xffcc49 : 0xf96577);
                this.gfx.fillRoundedRect(p.x - 35, C.floor - 177, 70 * p.charge / .7, 3, 1);
            }
            for (const f of w.floaters)
                this.label(f.text, f.x, f.y, 20, '#b82d54').setAlpha(f.life);
            for (const b of w.particles) {
                this.gfx.fillStyle(b.color, Math.min(1, b.life * 2));
                this.gfx.fillCircle(b.x, b.y, b.size);
            }
            if (w.specialFx > 0) {
                const radius = 270 * (1 - w.specialFx / .5);
                this.gfx.lineStyle(10, 0xff99b1, w.specialFx * 2);
                this.gfx.strokeCircle(p.x, C.floor - 65, radius);
                this.sprite(22, p.x, C.floor - 70, 100 + radius).setAlpha(w.specialFx * 1.5);
            }
            if (w.victoryTimer > 0) {
                const collapse = 3 - w.victoryTimer;
                for (let i = 0; i < 3; i++) {
                    const fall = Math.max(0, collapse - i * .45);
                    this.sprite(16, w.bossDeathX + (i - 1) * fall * 40, C.floor - 130 + Math.min(160, fall * fall * 140), 260).setCrop(0, i * 85, 256, 85).setAngle((i - 1) * fall * 20).setAlpha(Math.max(0, 1 - fall / 2));
                }
                this.player.setFrame(6);
                if (Math.random() < .25)
                    w.burst(640 + Math.random() * 500, 120, 5);
            }
        }
        if (w.audio.prefs.shake && !w.audio.prefs.reduced && w.shake > 0)
            this.cameras.main.centerOn(640 + (Math.random() - .5) * w.shake, 360 + (Math.random() - .5) * w.shake);
        else
            this.cameras.main.centerOn(640, 360);
    }
}
export function mountGame(parent: HTMLElement, world: World) { return new Phaser.Game({ type: Phaser.AUTO, width: 1280 * Math.min(window.devicePixelRatio || 1, 2), height: 720 * Math.min(window.devicePixelRatio || 1, 2), parent, backgroundColor: '#9bcac8', scene: [new PartyScene(world)], scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true }, fps: { target: 60 } }); }
