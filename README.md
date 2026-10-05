# Birthday Boyfighter

[Play Birthday Boyfighter](https://frankstop.github.io/BirthdayBoyfighter/)

A five-wave dessert boxing arcade game. React 19, TypeScript, Vite 8 and Phaser 4. The production background and 24 character/object poses were generated from the accepted art direction, packaged locally, and used directly in the game. No accounts, backend, runtime AI, remote assets or paid services.

## Play

Open the separately provided `Birthday_Boyfighter.html` in a modern desktop browser. It embeds the code and images and needs no installation. Use a browser to open it, rather than a file previewer. Local score storage depends on the browser's permissions for local files; failure does not prevent play. Mobile is best served over HTTP/HTTPS.

For development, install Node 22.12+ and run these commands from this directory:

```bash
npm ci
npm run dev
```

Open the URL Vite prints. `npm run build` produces `dist/`; serve this directory with any static web host. `npm run preview` serves the production build. `npm run portable` rebuilds and writes `release/Birthday_Boyfighter.html`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move / face | A/D or left/right arrows | Left/right buttons |
| Jab | J (hold for repeat) | Jab |
| Charged punch | Hold K, release; full charge 0.7 seconds | Hold Charge, release |
| Dodge | Space | Dodge |
| Birthday Blowout | L, after 20 connected punches | Blowout |
| Pause | P or Escape | Top-right pause button |

Keyboard controls prevent scrolling. Touch buttons use independent pointer capture so movement and attacks can be held simultaneously. Losing focus clears held inputs and pauses an active run. Rotate mobile devices into landscape for the full arena.

## Run and score

Cupcakes, bruisers, candle casters and piñata cakes appear over the first four waves. The fifth wave introduces the 30-health Uninvited Wedding Cake. Its attack cycle is slam, frosting spread, cupcake summons; below 15 health its top tier disappears and windups shorten. Up to eight ordinary enemies can exist, plus the boss. Every attack has at least 0.55 seconds of windup with a pose, ground stripes and a text warning. Touching cakes does not cause damage.

Start with five health. Attacks take one health; damage grants one second of immunity. Dodge grants 0.2 seconds of immunity and has a 0.9-second cooldown. Charged punches deal up to three damage, can hit multiple enemies and interrupt bruiser windups. Blowout damages nearby enemies and clears projectiles without damaging the player.

Hits: 25 points. Cake destruction: 150. Candy: 75. Wave clear: 500 and one health restored. Boss defeat: 3,000 bonus. Multipliers are x2 at 5 connected hits, x3 at 10, x4 at 20. Taking damage or waiting two seconds resets the combo. Candy expires after eight seconds. Piñatas drop five candies.

Settings include separate music/effects sliders, mute, reduced motion and screen shake. The original procedural soundtrack and effects are synthesized with Web Audio after user interaction. Settings and best score are stored locally, with graceful storage failure.

## Architecture

- `src/main.tsx`: React menus, tutorial, HUD, settings and touch controls.
- `src/game/config.ts`: balance values, enemy definitions and wave lineups.
- `src/game/world.ts`: simulation, combat, enemy state machines and progression.
- `src/game/scene.ts`: Phaser rendering, generated sprite poses, particles and camera feedback.
- `src/game/input.ts`: keyboard and independent touch input sources.
- `src/game/audio.ts`: original procedural music/effects.
- `src/game/persistence.ts`: local preferences and best score.
- `public/assets/`: generated production room and transparent character atlas.
- `art/accepted-concept.png`: the approved visual reference. Its inaccurate sample controls, three-heart HUD and wave denominator were replaced with the requested controls, five health and five waves.

The logical simulation uses a 1280 × 720 arena and a fixed 120 Hz step. Rendering scales for device density up to 2x. Simulation coordinates and collision dimensions remain fixed when resizing. Hit-stop freezes only the struck enemy for 50 ms. Particles are capped at 160, with fewer under reduced motion.

## Verification

Run `npm test`. Fifteen automated groups cover:

- Punch anticipation, glove reach, once-per-enemy damage and recovery.
- Full charge, multiple targets and bruiser interruption.
- Dodge direction, immunity/cooldown, damage immunity and game over.
- Contact safety and telegraph durations.
- Twenty-hit special charge, radial damage and projectile clearing.
- Combo thresholds/expiry and score.
- Candy collection, eight-second lifetime and piñata loot.
- Boss attack rotation, summon cap and faster second phase.
- Pause/focus loss, resume, quit and full restart reset.
- Best score and blocked storage.
- Simultaneous touch input sources and charge release.
- Equivalent movement at 30/60/120 FPS.
- Projectile punching and player damage.
- Audio initialization, independent volumes, mute and pause using an AudioContext mock.
- A complete five-wave simulation using regular movement/attack inputs and normal health. No HP, spawn, cooldown or combat cheats.

Final controller run: **239.27 seconds**, **17,850 points**, **48 cakes destroyed**, **4 health remaining**, victory. The TypeScript check and production build pass. A size warning reflects the bundled Phaser engine; assets and engine are local.

### Verification limits

This is an automated simulation playthrough, not a human browser playthrough. The session denied local server binding, an alternate server tool required unavailable approval, and the browser denied local-file navigation. No browser rendering screenshot or manual touch/audio test was possible. Actual menu clicks, visual sprite/collision alignment, resizing/tab-switch behavior, mobile presentation and browser-specific audio behavior remain unverified. Automated input/audio tests cover the underlying logic, not physical touches or audible output. The requested final visual signoff remains outstanding.

## Asset rights

The game art was generated for this project. Audio is original procedural synthesis. React, Vite and TypeScript use MIT licensing; Phaser uses MIT licensing. Dependencies retain their respective upstream licenses. No third-party songs or sound recordings are bundled.

## GitHub Pages

Published from `main` → `/docs`. After changing source, run `npm test && npm run pages`, commit source and `docs/`, and push. Vite uses relative asset URLs so the game works at a repository subpath.
