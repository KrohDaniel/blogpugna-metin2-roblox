# Blocpugna — Award-Roadmap

Ziel: Von "solider Prototyp" zu "preiswürdig". 6 Phasen, je deployable.

## Phase 1 — Visual Identity & Game-Feel ⭐
**Aufwand: ~2h** | **Wirkung: drastischer Look-Sprung**

- Player-Walking-Animation (Beine wackeln im Takt)
- Mob-Sterbe-Animation (rotate + fade + Loot-Pop)
- Boss-Idle-Atmen (subtile Skalierung)
- Combo-Counter HUD oben mittig (steigt mit Hits in 2s-Fenster)
- Camera-Lerp + Lookahead (folgt Spieler weicher, schaut in Bewegungsrichtung)
- Additive Glow auf Crits + Ulti
- Damage-Numbers mit Skalierungs-Animation

## Phase 2 — Attack-Animationen
**Aufwand: ~2h** | **Wirkung: jede Attacke fühlt sich befriedigend an**

- Attack-Wind-Up: 80ms vor dem Swing, leicht nach hinten
- Recovery: 120ms danach, langsamer Slow-Stop
- Skill-Cast-Pose: kurz still, Aura-Build-Up
- Mob-Attack-Telegraph (rote Linie wo sie schlagen)
- Floating-Text mit Wobble-Animation

## Phase 3 — Neue Klasse: Druide 🌿
**Aufwand: ~3h** | **4. spielbare Klasse**

- Klasse: **Hain-Druidin** (Naturalistin, Transform-Skill)
- Q **Wurzeln**: lange Sperr-CC (3s Root)
- E **Schwarm**: 5 kleine Insekten, jagen Ziele 4s
- R **Verwandlung**: 6s Bär-Form (+50% HP, +30% DMG, kann nur Auto-Attack)
- Passive: Heilt 2 HP/s in Welten mit Natur-Theme (meadows/shadowfen)

## Phase 4 — Neue Welt + Boss: Leviathan 🌊
**Aufwand: ~3h** | **5. Welt, einzigartiger Boss**

- Neue Welt: **Tide-Klippen** (östlich vom Sumpf, Level 18-30)
- Mob-Pool: Tide-Greifer (Krake), Sturm-Marder, Riff-Wächter
- Boss: **Tideborn Leviathan** — 3-Phasen-Encounter
  - P1: Wellen-Schwall (telegraph Linien aus Boss-Richtung)
  - P2: **Untertauch** — Boss verschwindet 4s, Schatten-Indikator wo er auftaucht, Mega-Sprung
  - P3: Wirbelsturm-Saugen (zieht Spieler zur Mitte, muss laufen)
- Pet: Aal-Knecht (orbit + lightning chain)

## Phase 5 — Welt-Atmosphäre
**Aufwand: ~2h** | **Welten fühlen sich lebendig an**

- Wetter-System pro Welt:
  - Frost: leichter Schneefall (treibende Partikel)
  - Glut: Asche-Flocken steigen auf
  - Sumpf: Nebel-Schwaden + Glühwürmchen
  - Sky: Wolken-Schleier + Wind-Linien
  - Tide: Regen-Tropfen + Blitze
- Day-Night-Cycle (4 Min Zyklus, beeinflusst Mob-Color-Tone)
- Combo-Counter mit Damage-Multiplier (+5% pro Stufe, max 5)

## Phase 6 — Award-Polish 🏆
**Aufwand: ~2-3h** | **Erste Eindruck = Wow**

- Animiertes Hauptmenü (Logo-Reveal mit Partikeln, vor Login)
- Splash-Screen mit Klassen-Showcase
- Death-Cam: 3s-Slow-Mo-Replay vor dem Tod
- Boss-Defeat-Cinematic (3s Zoom + Slowmo + Confetti)
- Settings-Menü (Sound/Effekt/Shake Sliders)

## Timeline

Jede Phase wird **einzeln deployed + Cache-bumped**. Falls Bugs auftauchen, hat man clean rollback per Cache-Version.

| Phase | Deploy-Tag | Sichtbar als |
|-------|-----------|--------------|
| 1 | `v=anim-1` | Walking, Death-Anim, Combo |
| 2 | `v=anim-2` | Wind-Up, Recovery, Telegraphs |
| 3 | `v=druid-1` | 4. Klasse spielbar |
| 4 | `v=leviathan-1` | Neue Welt + Boss |
| 5 | `v=weather-1` | Welten lebendig |
| 6 | `v=award-1` | Wow-Faktor komplett |

Los geht's mit Phase 1.
