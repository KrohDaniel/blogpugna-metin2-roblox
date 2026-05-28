# Blocpugna — Spielanleitung & Index

> Vollständige Referenz: Klassen, Waffen, Runen, Steine, Bosse, Welten.
> Live: https://blogpugna.web.app · Repo: KrohDaniel/blogpugna-metin2-roblox

Datenquellen im Code (zum Nachvollziehen):
- Klassen → `src/data/classes.js` · Fähigkeiten → `src/data/abilities.js` · Talente → `src/data/talents.js`
- Waffen/Items/Runen-Items → `src/data/items.js` · Runen-Logik → `src/data/runes.js`
- Welten/Steine → `src/data/worlds.js` · Mobs → `src/data/mobs.js` · Drops → `src/data/drops.js`
- Bosse → `src/data/bosses/*.js` · NPCs → `src/data/npcs.js`
- Spiel-Logik → `src/main.js`

---

## 1. Steuerung

### Desktop
| Eingabe | Aktion |
|---|---|
| WASD / Pfeile | Bewegen |
| Maus | Zielen |
| Linksklick / Leertaste | Angreifen |
| Q / E / R | Skill 1 / Skill 2 / Ulti |
| 1 | Heiltrank |
| F | Schmied (in seiner Nähe) |
| I / C / M / P / T / B | Inventar / Charakter / Quest / PvP / Talente / Codex |
| R (tot) | Neustart |

### Mobile (Touch)
- **Joystick links** = bewegen
- **⚔ / Q / E / R / 🧪** = Angriff / Skills / Trank (mit Cooldown-Ring + Timer)
- **Auto-Aim**: Skills/Angriff zielen automatisch aufs nächste Mob; Joystick-Richtung übersteuert; Tap auf Gegner fixiert Ziel 2.5s
- **⛶** = Vollbild · **☰** = Menü (alle Panels)
- HP/XP/Stats oben links · bei Tod großer **Neustart**-Button

---

## 2. Die 5 Klassen

> **Combo-Meter** (alle): füllt sich durch Skills/Crits/Synergien → "FLOW BEREIT" bei 100%.

### 🛡 Krieger — Tank / Kontrolle
- **Stats:** 190 HP, langsam, Schwert · **Passive Eisenhaut:** weniger Schaden je mehr Gegner nah
- **Q Schildstoss:** Stun + Knockback-Kegel
- **E Wirbelschlag:** 360° AoE (+55% gegen gestunte = "KOMBO")
- **R Erdbeben:** Schockwelle + Krater, schleudert/stunt alles
- **Resource Wut (0-100):** durch Treffer-einstecken → ≥50 +10%, ≥100 +25% Schaden

### 🗡 Schattenläufer — Burst / Mobilität
- **Stats:** 95 HP, schnell, Dolche · **Passive Rückenjäger:** +50% gegen markierte/gestunte Ziele
- **Q Nebelschritt:** Dash + 30% Heilung + Crit-Fenster (Richtung steuerbar — auch Escape nach hinten)
- **E Giftmarke:** Kegel-DoT + Marke, hinterlässt Gift-Wolke
- **R Schatten-Doppel:** 3.5s unsichtbar + Decoy
- **Resource:** Mark-Count (Awareness)
- **Synergie:** Magier-Feuerball auf Marke = ✦ DETONATE ✦ +110%

### 🔥 Runenmagier — AoE / Support
- **Stats:** 125 HP, Ranged (Zauberstab) · **Passive Runenfluss:** schnellere CD auf Abstand
- **Q Feuerkugel:** Ranged-Explosion + Lava-Pool, detoniert Marken
- **E Frostkreis:** Slow + bleibender Eis-Ring
- **R Meteor:** Telegraph → Einschlag + Krater + Lava
- **Resource 🔥+❄ Charges (0-3):** beide voll → ✦ DAMPF ✦ +50% Schaden 6s

### 🌿 Druidin — Natur / Crowd Control
- **Stats:** 145 HP, Naturstab · **Passive Naturverbunden:** +2 HP/s in Wiesen/Sumpf
- **Q Wurzeln:** Kegel-Stun, sichtbare Wurzeln
- **E Insekten-Schwarm:** Insekten jagen Mobs (gegen Bosse gedrosselt)
- **R Bär-Form:** 8s +50% HP, +40% Schaden → bei Talent-Mastery 3+ danach **Wolfsform** (+60% Tempo)
- **Resource:** Wildkraft / Form-Timer

### 💋 Lyra die Verführerin — Charm / Glas-Kanone
- **Stats:** 105 HP, schnell, Polstange · **Passive Anmut:** +20% Ausweichen, Charme-Stacks
- **Q Wirbelschlag:** Spin-AoE, baut Charme-Stack
- **E Luftkuss:** Gegner wird verliebt → greift eigene Verbündete an (Confusion)
- **R Tanz der Verführung:** alle Gegner 5s verliebt (greifen nicht an)
- **Resource Charme-Stacks (0-5):** bei 5 → garantierter Crit + 8% Heilung
- **Muse:** solange 1 Mob charmed/confused → +12% Schaden, +8% Tempo, +1 HP/s

---

## 3. Waffen-System

**Die eine Regel:** Passt der Waffentyp zur Klasse → **100% Schaden**, sonst **75%**.

| Klasse | Waffentyp |
|---|---|
| Krieger | Schwert |
| Schatten | Dolche |
| Magier | Zauberstab |
| Druidin | Naturstab |
| Lyra | Polstange |

### Waffen-Leitern (je 4 Stufen, Sockel = Rarität)
| Rarität | Sockel | Krieger | Schatten | Magier | Druidin | Lyra |
|---|---|---|---|---|---|---|
| Common | 0 | Rostklinge | Zwillingsdolche | Lehrlingsstab | Spross-Stab | Tanzstange |
| Rare | 1 | Eisenklinge | Reisszähne | Kristallstab | Eichenstab | Seiden-Stange |
| Epic | 2 | Pugna-Spalter | Gift-Kris | Runenstab | Dornenstab | Rosen-Stange |
| Legendary | 3 | Vollmondsichel | Nachtzahn | Sturmzepter | Weltenwurzel* | Herzbrecher* |

### ⭐ Signatur-Waffen (legendär, mit aktivem Effekt)
| Waffe | Klasse | Effekt |
|---|---|---|
| Erdspalter | Krieger | Jeder 3. Schlag = Schockwelle |
| Schattenbiss | Schatten | Crits teleportieren hinter das Ziel |
| Sturmrute | Magier | Auto-Attacks ketten zum 2. Gegner |
| Weltenwurzel | Druidin | Wurzeln breiten sich auf Nachbarn aus |
| Herzbrecher | Lyra | Charme springt beim Tod auf nächsten Mob |

Schmied (F): Waffen/Rüstung verstärken bis **+9** (Bruch-Risiko, durch Spezial-Steine reduziert).

---

## 4. Runen-System

**Steine & Bosse droppen Runen → in Waffen-Sockel setzen (max 3, = Rarität).**

### 4 Wertigkeiten (Tier)
| Tier | Symbol | Multiplikator | Quelle |
|---|---|---|---|
| Rissig | ◇ | ×1 | normale Steine |
| Klar | ◆ | ×2 | Steine höhere Welten |
| Strahlend | ✦ | ×3.5 | Boss/Miniboss-Steine |
| Perfekt | ★ | ×5 | Bosse (höhere Welten) |

### 6 Runen-Typen
| Rune | Effekt |
|---|---|
| 🔴 Rubin | +Angriff |
| 🔵 Saphir | +Crit-Chance |
| 🟢 Smaragd | +Lebensraub |
| 🟡 Topas | -Cooldown |
| 🟣 Amethyst | +Skill-Schaden |
| ⚪ Diamant | +alle Werte (klein) |

### 💎 Runen-Wörter (3-Runen-Kombi = benannter Bonus)
| Name | Kombi | Min-Tier | Effekt |
|---|---|---|---|
| Berserker | Rubin+Saphir+Topas | Klar | <30% HP: +40% Schaden, +20% Tempo |
| Lebensquell | Smaragd×2+Diamant | Klar | +8% Lebensraub auf alle Treffer |
| Arkane Flut | Amethyst×2+Topas | Klar | +25% Skill-Schaden, +15% CDR |
| Meuchler | Saphir×2+Rubin | Klar | Crits +50% Schaden |
| Bollwerk | Diamant×3 | Klar | +15% maxHP, -15% Schaden |
| Blutfürst | Smaragd+Rubin+Saphir | Strahlend | +30% Schaden, +12% Lebensraub, Kills heilen |

---

## 5. Steine (pro Welt)

| Welt | Stein | Spezial-Material (Schmied: -Bruchchance) |
|---|---|---|
| Pugna-Wiesen | Pugna-Stein | — |
| Frost-Öden | Eis-Monolith | Frost-Kern (-20%) |
| Glut-Schmiede | Glut-Brocken | Glut-Funke (-18%) |
| Schattensumpf | Moos-Idol | Schatten-Essenz (-16%) |
| Himmelsturm | Sturm-Splitter | Sturm-Splitter-Mat (-22%) |
| Tide-Klippen | Tide-Säule | Tide-Perle (-25%) |

Steine droppen: Material + **Runen** (35% Chance) + Gold. Manche Steine spawnen Wächter-Mobs beim Zerschlagen.

---

## 6. Welten & Bosse

> Boss spawnt nach Welt-Betreten. **3 Phasen** (66% / 33% HP). Jeder Phasenwechsel triggert deinen **Klassen-Spotlight** (4s).

| Welt | Level | Boss (HP) | Fähigkeiten | Pet |
|---|---|---|---|---|
| Pugna-Wiesen | 1-3 | (Safe-Hub, Schmied, NPCs) | — | — |
| Frost-Öden | 6-15 | **Jarl Borealis** (2400) | Eis-Speer, Frost-Nova (Telegraph), Splitter-Adds | Frost-Splitter |
| Glut-Schmiede | 10-22 | **Pyromant Asaru** (2700) | Feuerbolzen, Lava-Pools, Feuersäulen | Glut-Geist |
| Schattensumpf | 14-26 | **Mutter Sphagne** (3200) | Gift-Wolke, **Selbst-Teilung**, Sporen-Burst | Spore-Faun |
| Himmelsturm | 20-35 | **Aetherius** (3600) | Blitz-Kette, Wind-Burst, Donnerschlag | Blitz-Wisp |
| Tide-Klippen | 18-30 | **Leviathan** (4200) | Wellenschlag, Abtauchen (1.8×), Whirlpool | Aal-Geist |

### Boss-Phase-Spotlights
| Klasse | Spotlight (4s) |
|---|---|
| Krieger | +30% Schaden + 50 Wut |
| Schatten | Marken halten 60s |
| Magier | 3🔥 + 3❄ sofort |
| Druidin | Bär-Form startet automatisch |
| Lyra | Boss 2s charmbar + Stacks auf 5 |

> Bosse machen nur **35% Kontaktschaden** (Nahkampf bleibt fair). Echte Gefahr = telegraphierte Fähigkeiten → ausweichen.

### 🌍 Weltboss
Geteiltes Event auf der Map: alle Spieler sehen eine gemeinsame HP-Leiste oben und kämpfen zusammen. Loot nach Schadensbeitrag.

---

## 7. Pets & Pet-Evolution

- Boss besiegen → Pet wird freigeschaltet (auch im Multiplayer, wenn du Schaden gemacht hast)
- Pet im Charakter-Menü an/aus
- Pets sammeln XP → **entwickeln sich** zu stärkeren Stufen und schalten eine eigene Fähigkeit frei

---

## 8. Konkrete Anleitung — so spielst du dich hoch

1. **Start in Pugna-Wiesen** (Safe-Hub): Klasse wählen, Schmied + NPCs sind hier, keine aggressiven Mobs
2. **Leveln:** Mobs + Metin-Steine kloppen → XP, Gold, erste Waffen + Runen
3. **Klassen-Waffe ausrüsten:** achte auf deinen Typ (grüner Haken). Fremde Waffe = nur 75%
4. **Verstärken beim Schmied (F):** Waffe auf +3...+9 (Spezial-Steine senken Bruch-Risiko)
5. **Sockeln:** Runen aus Steinen in die Waffen-Sockel → baue Richtung Runen-Wort
6. **Portale an den Welt-Ecken** → nächste Welt (höheres Level = bessere Drops + Runen-Tiers)
7. **Boss legen:** Telegraphs ausweichen, Phasenwechsel = dein Spotlight-Burst-Fenster → Pet als Belohnung
8. **Endgame:** Perfekt-Runen + Signatur-Waffe + passendes Runen-Wort = dein finaler Build
9. **Tod:** -1 Level, Inventar bleibt → Respawn beim Schmied

**Klassen-Builds (Beispiele):**
- Krieger: Rubine + Berserker-Wort, tanken für Wut-Boost
- Schatten: Saphire + Meuchler, markieren → Burst
- Magier: Amethyst + Arkane Flut, 🔥❄ für Dampf rotieren
- Druidin: Bär→Wolf-Chain, Wurzeln für Setup
- Lyra: erst 1 Mob confusen (Muse), dann Charme-Stacks für garantierten Crit
