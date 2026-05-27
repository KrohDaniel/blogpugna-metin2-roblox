# Blocpugna — Balance-Analyse (Stand: worlds-1)

## Ausgangswerte

### Klassen Level 1 (effektive Werte mit Startwaffe + L1-Bonus +1)
| Klasse | HP | ATK | Speed | Waffen-CD | Reach | Spez. |
|--------|----|----|-------|-----------|-------|-------|
| Krieger | 190 | 16 | 215 | 0.42 s | 82 | +3 Rüstung Basis |
| Schatten | 95 | 24 | 320 | **0.28 s** | 64 | +8% Crit Basis |
| Magier | 125 | 17 | 250 | 0.62 s | 360 (Stab) | +8% CDR Basis, Pierce 3+ |

### Effektive DPS (Auto-Attack, Single-Target, L1)
- Krieger: 16 / 0.42 ≈ **38 DPS**
- Schatten: 24 / 0.28 ≈ **86 DPS** (+ Crit-Avg ≈ 92 DPS)
- Magier: 17×0.85 / 0.62 ≈ **23 DPS** single, **70 DPS** auf 3 Ziele (Pierce)

### Mob-Stats (single player, difficultyScale = 1.0)
| Rank | HP | DMG | XP | Notiz |
|------|----|----|----|-------|
| Mob | 48 | 26 | 18 | spawn ~ überall |
| Elite | 95 | 44 | 36 | ~22% Anteil |
| Miniboss | 260 | 52 | 96 | alle ~18-30s |
| Boss | 680 | 72 | 220 | alle ~55s |
| Metin-Stein | 280 | — | 70 | feste Spots |

### Level-Skalierung Spieler
- HP pro Level: Krieger +18, Schatten +10, Magier +13
- ATK pro Level: Krieger +1.6, Schatten +2.2, Magier +1.8
- Plus pauschal `+floor(level * 1.5)` ATK für alle
- XP-Kurve: nextXp = 50 × 1.35^(level-1)
- Talent-Punkt: +1 pro Level-Up

## Befund

### 🟥 Großes Problem 1: Mobs skalieren NICHT mit Spieler-Level
- `mobStats` nutzt nur `difficultyScale` = 1 + 0.35×(Spieler-1) — also nur Multiplayer-Boost
- Konsequenz: Krieger auf L10 hat ATK ≈ 47, Mob hat immer noch 48 HP → **One-Shot**
- Boss L1 (680 HP) ist nach Level 5-6 ein Witz
- Eliten machen 44 Schaden → trivial wenn Spieler 280 HP hat

**Fix-Vorschlag:** `mobStats` multipliziert HP+DMG mit `(1 + (player.level - 1) * 0.18)` oder ähnlich. Bonus-XP mit `mob_level / player_level` Ratio um Grinding-Schutz.

### 🟥 Großes Problem 2: Schatten-DPS bei L1 schon 2.2× Krieger
- Schatten erreicht 92 DPS gegen Kriegers 38 DPS — das ist kein Burst, das ist Sustained.
- Schatten kompensiert nur durch 50% weniger HP, aber bei mehreren Mobs sterben beide gleich schnell

**Fix-Vorschlag:** Schatten-Startbonus von +5 auf +3 reduzieren, oder Dolch-Cooldown von 0.28 auf 0.34 hoch (DPS dann ~70).

### 🟧 Mittleres Problem: Magier Single-Target zu schwach
- 23 DPS single-target heißt: Boss 680 HP / 23 = 29s reine Auto-Attacks
- Pierce nur in Gruppen sinnvoll — gegen Bosse fühlt sich Magier zäh an
- Feuerkugel (Cooldown 6s) macht 1.4× ATK = 24 dmg auf 170 Radius — solider Burst

**Fix-Vorschlag:** Stab gegen Boss-Mob (rank "boss") +50% Damage, oder Magier-Crit-Basis +5% wie Schatten.

### 🟧 Item-Upgrades sind zu stark gegenüber Base-ATK
- +9-Aufwertung gibt +27 ATK
- Bei L1-Krieger (ATK 12) heißt +9 → 39 ATK = +225%
- Risikobalken bei +9 nur 55% — wer 2-3 Anläufe spart, hat Endgame-Stats auf L1

**Fix-Vorschlag:** Bruchchance +7..+9 auf 50/65/80% hoch, oder Material-Kosten exponentiell statt linear. Alternativ Upgrade-Bonus auf +2 ATK reduzieren.

### 🟧 Affix-Stacking exponentiell stark
- Schatten mit 3 Legendary-Items × 25% Crit + 8% Basis + 12% Talents = **95% Crit** (cap 85%)
- Crit-Multiplier 1.85× → effektiver ATK-Multiplier 1.72×
- Lifesteal 15% pro Item × 3 Items + 4% × 3 Talents = 57% (cap 60%) — praktisch unsterblich

**Fix-Vorschlag:** Cap-Werte runter (Crit 65%, Lifesteal 35%, CDR 50%) oder Diminishing Returns nach 30% pro Stat.

### 🟧 Talent-System cap zu früh
- 5 Knoten × 3 Punkte = 15 Punkte max → ab Level 16 keine Wirkung mehr
- Aktuell skaliert XP-Kurve aber nicht so schnell, L16 ist erreichbar

**Fix-Vorschlag:** Pro Knoten Max 5 Punkte (25 total) oder zweite Reihe "Mastery"-Knoten ab Level 15.

### 🟥 Welt-Modifier zu pauschal
- Frost-Öden: 0.75× Speed, 1.4× DMG, 1.2× HP — aber dieselben Base-Stats
- Konsequenz: Frost-Mob hat 67 HP, 36 DMG — immer noch trivial für L10
- Welt-Level-Range im Konzept (6-15 für Frost), aber **kein Soft-Lock** im Code

**Fix-Vorschlag:** Mob-Base-Stats abhängig von `worldDef.levelRange[0]`. Frost-Mob sollte 200+ HP haben damit das thematische Sinn macht.

### 🟢 Was funktioniert
- Klassen-Identität klar: Tank/Burst/Range — Spielgefühl unterschiedlich
- Ulti-Cooldowns (38-45s) angemessen
- Schmied-Bruchsystem fühlt sich gefährlich an
- Affix-Roll macht jeden Drop besonders
- Welt-Themen visuell unterscheidbar

## Empfohlene Reihenfolge der Fixes
1. **Mob-Level-Skalierung** ([mobStats](src/main.js)) — größter Hebel
2. **Schatten-DPS nerfen** (Dolch-CD 0.28→0.34 oder Bonus +5→+3)
3. **Affix-Caps senken** ([totalCritChance/Lifesteal/Cdr](src/main.js))
4. **Magier-Single-Target-Buff** (Stab +50% gegen Boss)
5. **Welt-Mob-Stats** an Welt-Level binden
6. **Bruchchance** bei hohen Upgrades steiler
7. **Talent-Reihe 2** ab Level 15
