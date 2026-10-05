import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { World, type Snapshot } from './game/world';
import { mountGame } from './game/scene';
import { preferences, save, type Preferences } from './game/persistence';
import './style.css';
const hints = [['A D / ← →', 'MOVE'], ['J', 'JAB'], ['HOLD K', 'CHARGE'], ['SPACE', 'DODGE'], ['L', 'BLOWOUT']];
function Settings({ prefs, onChange, onBack }: {
    prefs: Preferences;
    onChange: (p: Preferences) => void;
    onBack: () => void;
}) { return <section className="paper modal"><h2>Sound & feel</h2>{(['music', 'effects'] as const).map(k => <label className="slider" key={k}>{k === 'music' ? 'Music' : 'Sound effects'}<input aria-label={k === 'music' ? 'Music volume' : 'Effects volume'} type="range" min="0" max="1" step=".05" value={prefs[k]} onChange={e => onChange({ ...prefs, [k]: Number(e.target.value) })}/><span>{Math.round(prefs[k] * 100)}%</span></label>)}{(['mute', 'reduced', 'shake'] as const).map(k => <label className="toggle" key={k}><input type="checkbox" checked={prefs[k]} onChange={e => onChange({ ...prefs, [k]: e.target.checked })}/>{k === 'mute' ? 'Mute all audio' : k === 'reduced' ? 'Reduced motion' : 'Screen shake'}</label>)}<button className="primary" onClick={onBack}>Back</button></section>; }
function Touch({ world }: {
    world: World;
}) { const button = (a: string, label: string, extra = '') => <button key={a} className={'touch ' + extra} aria-label={label} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); world.audio.unlock(); world.input.set('touch:' + e.pointerId, a, true); }} onPointerUp={e => world.input.set('touch:' + e.pointerId, a, false)} onPointerCancel={e => world.input.set('touch:' + e.pointerId, a, false)} onLostPointerCapture={e => world.input.set('touch:' + e.pointerId, a, false)}>{label}</button>; return <div className="touch-controls"><div>{button('left', '←')}{button('right', '→')}</div><div>{button('dodge', 'Dodge')}{button('charge', 'Charge')}{button('jab', 'Jab', 'red')}{button('special', 'Blowout', 'yellow')}</div></div>; }
function App() {
    const host = useRef<HTMLDivElement>(null), worldRef = useRef<World | null>(null);
    const [snap, setSnap] = useState<Snapshot | null>(null), [prefs, setPrefs] = useState(preferences), [panel, setPanel] = useState<'none' | 'help' | 'settings'>('none'), [confirm, setConfirm] = useState<'restart' | 'quit' | null>(null);
    useEffect(() => { const w = new World(setSnap); worldRef.current = w; w.audio.update(prefs); const g = mountGame(host.current!, w); return () => { g.destroy(true); w.destroy(); }; }, []);
    const w = worldRef.current;
    const mode = snap?.mode ?? 'title';
    const update = (p: Preferences) => { setPrefs(p); save('preferences', p); w?.audio.update(p); };
    const begin = () => { setPanel('none'); w?.start(true); };
    return <main><div className="game-wrap"><div className="arena" ref={host}/><div className="ui">
 <header className="hud"><div className="score"><small>SCORE</small><div><strong>{String(snap?.score ?? 0).padStart(6, '0')}</strong><span className="score-best">BEST {String(snap?.best ?? 0).padStart(6, '0')}</span></div></div><div className="health" aria-label={`${snap?.hp ?? 5} of 5 health`}>{Array.from({ length: 5 }, (_, i) => <svg key={i} className={i < (snap?.hp ?? 5) ? 'full' : 'empty'} viewBox="0 0 24 24"><path d="M12 21C-8 9 3-6 12 4C21-6 32 9 12 21Z"/></svg>)}</div><div className="combo"><small>COMBO</small><strong>{snap?.combo ?? 0}<em> ×{snap?.mult ?? 1}</em></strong></div><div className="wave"><small>WAVE</small><strong>{snap?.wave ?? 1}/5</strong></div><div className="special"><small>BIRTHDAY BLOWOUT <b>{snap?.special === 20 ? 'READY!' : `${snap?.special ?? 0}/20`}</b></small><div className="meter"><i style={{ width: `${(snap?.special ?? 0) * 5}%` }}/></div></div><button className="pause-button" aria-label={mode === 'playing' ? 'Pause game' : 'Sound settings'} onClick={() => { if (mode === 'playing')
        w?.pause();
    else
        setPanel('settings'); }}>{mode === 'playing' ? 'Ⅱ' : 'Sound'}</button></header>
 {mode === 'title' && panel === 'none' ? <section className="title-menu"><div className="title-paper"><svg className="crown" viewBox="0 0 100 70"><path d="M10 60L3 12L30 30L48 3L66 30L96 12L87 60Z"/></svg><h1>BIRTHDAY<br />BOYFIGHTER</h1><p>The cakes are fighting back.</p></div><button className="primary play" onClick={begin}>PLAY</button><button className="secondary how" onClick={() => setPanel('help')}>HOW TO PLAY</button><p className="best">PERSONAL BEST • {String(snap?.best ?? 0).padStart(6, '0')}</p></section> : null}
 {mode === 'playing' && snap?.banner ? <div className="banner" role="status">{snap.banner}</div> : null}
 {mode === 'playing' && snap?.boss ? <div className="boss-bar"><span>THE UNINVITED WEDDING CAKE</span><div className="meter"><i style={{ width: `${snap.boss / 30 * 100}%` }}/></div></div> : null}
 {(mode === 'tutorial' || panel === 'help') ? <div className="scrim"><section className="paper modal help"><h2>Time to frost some fools.</h2><p>Face a cake. Punch. Dodge when it winds up.</p><div className="instructions">{hints.map(([key, label]) => <div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}</div><p>Hold K for 0.7 seconds for a 3-damage punch. Charged punches interrupt bruisers. Land 20 punches to unlock your frosting blowout.</p><p>Striped ground markers mean an attack is coming. Candy is safe. Cakes only hurt you when they attack.</p><button className="primary" onClick={() => { if (mode === 'tutorial')
        w?.play();
    else
        setPanel('none'); }}>{mode === 'tutorial' ? 'LET’S PARTY' : 'GOT IT'}</button></section></div> : null}
 {mode === 'paused' && panel === 'none' && !confirm ? <div className="scrim"><section className="paper modal pause"><h2>Party paused</h2><button className="primary" onClick={() => w?.play()}>Resume</button><button onClick={() => setConfirm('restart')}>Restart</button><button onClick={() => setPanel('settings')}>Settings</button><button onClick={() => setConfirm('quit')}>Quit to title</button></section></div> : null}
 {panel === 'settings' ? <div className="scrim"><Settings prefs={prefs} onChange={update} onBack={() => setPanel('none')}/></div> : null}
 {confirm ? <div className="scrim"><section className="paper modal"><h2>{confirm === 'restart' ? 'Start over?' : 'Leave the party?'}</h2><p>Your current run will end.</p><button className="primary" onClick={() => { if (confirm === 'restart')
        w?.start(false);
    else
        w?.quit(); setConfirm(null); }}>{confirm === 'restart' ? 'Restart run' : 'Quit run'}</button><button onClick={() => setConfirm(null)}>Keep playing</button></section></div> : null}
 {mode === 'over' || mode === 'victory' ? <div className="scrim end"><section className="paper modal"><h2>{mode === 'victory' ? 'HAPPY BIRTHDAY!' : 'Frosted out.'}</h2><p>{mode === 'victory' ? 'You saved the party. Make a wish, champ.' : 'The party isn’t over. Go another round.'}</p><div className="stats"><div><small>FINAL SCORE</small><strong>{snap?.score.toLocaleString()}</strong></div><div><small>PERSONAL BEST</small><strong>{snap?.best.toLocaleString()}</strong></div><div><small>WAVE REACHED</small><strong>{snap?.wave}/5</strong></div><div><small>CAKES DESTROYED</small><strong>{snap?.kills}</strong></div></div><button className="primary" onClick={() => w?.start(false)}>Play again</button><button onClick={() => w?.quit()}>Back to title</button></section></div> : null}
 <footer className="control-hints">{hints.map(([key, label]) => <span key={key}><kbd>{key}</kbd> {label}</span>)}<span><kbd>P</kbd> PAUSE</span></footer>
 {mode === 'playing' && w ? <Touch world={w}/> : null}</div></div><div className="rotate"><h2>Turn the party sideways.</h2><p>Rotate your phone to landscape for room to punch.</p></div><p className="caption">Five waves. One uninvited wedding cake. A whole lot of frosting.</p></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
