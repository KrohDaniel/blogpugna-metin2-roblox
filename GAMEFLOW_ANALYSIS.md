# Blocpugna — Gameflow & Spielspaß-Analyse

Stand: shadow-2. Ehrlicher Außen-Blick auf das was funktioniert, was schiefläuft und wo der Spielspaß noch klemmt.

## TL;DR

Das Spiel hat eine **solide Basis**, aber die Mid- und Endgame-Loop ist noch dünn. Konkret:

- **Combat** fühlt sich gut an (Klassen-Identität klar, Skill-Effekte spürbar)
- **Progression-Kurve hat einen harten Cliff** zwischen Hub und nächster Welt
- **Variety bricht nach 15 Minuten ein** — Combat ist immer dieselbe Loop
- **Schatten ist nach Rework überpowered** im Vergleich zu Krieger/Magier
- **Bosse fehlen in 4 von 5 Welten** — nur Frost-Jarl ist echter Encounter
- **Pets nicht skalierbar** — keine Feed-/Level-Mechanik

Detaillierte Einschätzung unten.

---

## 1. Gameflow-Loop (Was tut der Spieler?)

### Aktuelle 10-Minuten-Loop

```
Spawn in Wiesen
  ↓
NPC-Quest holen (optional)
  ↓
Portal → Frost-Öden
  ↓
Mobs töten bis Level-Up
  ↓
Stein zerstören → Wächter spawnen → mehr Mobs
  ↓
Frost-Jarl spawnt → Boss-Fight
  ↓
Loot einsammeln
  ↓
Zurück zur Wiese → Schmied → Upgrade
  ↓
Repeat
```

### Problem 1: Keine Mid-Term-Goals

Zwischen "Level 1 grinden" und "Boss farmen" gibt es **nichts**. Keine:
- Achievement-Liste ("Erstes +5", "5 Bosse besiegt")
- Sammelziele ("Alle 4 Spezial-Steine besitzen")
- Klassen-spezifische Quests ("Töte 50 Mobs mit reinem Auto-Attack")
- Welt-Erkundungs-Belohnung (Schatztruhen / versteckte Areale)

**Vorschlag**: Achievement-System mit kleinen Goldboni und kosmetischen Titeln im Char-Sheet. Niedrige Hürde zu bauen, hoher Loop-Effekt.

### Problem 2: Welt-Übergang ist abrupt

Wiesen sind Hub mit Passive-Mobs (Level 1-3). Sobald du durchs Frost-Portal gehst → Mobs Level 6-15. Zwischen-Stufe fehlt.

**Vorschlag**: Wiesen-Außenbereich (außerhalb Safe-Zone) bekommt einen "Wald"-Sub-Bereich mit Level 2-5 Mobs. Soft-Tutorial vor dem Sprung.

---

## 2. Combat-Loop

### Was funktioniert
- **Klassen-Identität** ist klar spürbar (Tank vs Burst vs Range)
- **Cooldowns** geben taktische Entscheidungen
- **Crit/Affix-System** gibt Drops Wert
- **Skill-Cast-Feedback** (Flash, Particles) ist sauber

### Was nicht funktioniert

**Combat ist 80 % Auto-Attack-Spam.** Die Skills (Q/E/R) sind zu langsam im Cooldown gegen Standard-Mobs:
- Schildstoss CD 7s, Erdbeben CD 42s
- Standard-Mob stirbt in 1-2 Sekunden
- → Du nutzt Skills nur gegen Bosse, gegen Standard-Mobs gar nicht

**Vorschlag**:
- Mob-Wellen aufdrehen: 2-3 Mobs gleichzeitig → Skills werden lohnend
- Oder: Skills bekommen Cooldown-Reset bei Mob-Kills (z.B. -1s pro Kill)

**Mob-AI ist primitiv** — alle laufen direkt auf den Spieler. Keine:
- Ranged-Mobs (außer Frost-Schamane theoretisch — der hat aber nicht wirklich Range-Attacke)
- Charger-Mobs (kurze Sprints)
- Heal-/Support-Mobs
- Mobs die fliehen wenn HP niedrig

**Vorschlag**: Per Mob-Typ eine `aiPattern`-Property einführen: `chase | ranged | charger | swarmer`.

---

## 3. Klassen-Balance (Nach Schatten-Rework)

Ich rechne mit Level 10, durchschnittlichem Loot:

| Klasse | Effektive DPS | Sustain | Mobility | Trade-Off |
|--------|--------------|---------|----------|-----------|
| Krieger | ~55 DPS, +Eisenhaut bei 3+ Mobs | Hoch durch HP + Armor | Sehr niedrig | OK — tankt aber lahm |
| **Schatten** | **~95 DPS, 100% Crit im Window** | **+30% Heal alle 5.5s** | **+280 Dash** | **Overpowered seit Rework** |
| Magier | ~65 DPS (mit Pierce), Boss-Buff +50% | Niedrig | Mittel | Boss-Magier OK, Mobs-Magier zäh |

### Schatten ist jetzt zu stark
- Nebelschritt heilt 30 % maxHP + 2s 100 % Crit + 280 Range = **5-Sekunden-Vollvernichtung-Kombo**
- Schatten-Doppel: 6s Unsichtbarkeit + Decoy-Detonation = Risiko-freier Engage
- Cooldown 5.5s auf Nebelschritt → Spammbar
- **Vorschlag**: Nebelschritt-Cooldown 5.5s → 9s, Heal 30 % → 20 %, Crit-Window 2s → 1.5s
- Oder: Heal nur wenn man ein Mob im Dash-Pfad trifft (skill-shot-belohnt)

### Krieger im Hintertreffen
- Eisenhaut nur bei 3+ Mobs aktiv = im Frost-Boss-Solo nutzlos
- Schildstoss + Rundumschlag sind beide Frontal-CCs — keine Mobility
- **Vorschlag**: Krieger-Passive immer aktiv (+10 % DEF), Eisenhaut wird zur "%-pro-naher-Mob"-Skala (3-5 % pro Mob in 150px)

### Magier
- Pierce 3+ funktioniert gut gegen Mob-Wellen
- Single-Target gegen Boss bleibt langsam trotz +50 %-Buff
- Manaschild-Talent (+10 HP/Punkt) ist relativ schwach
- **Vorschlag**: Stab-Auto-Attack-Cooldown 0.62s → 0.50s ODER Projektil-Geschwindigkeit 520 → 700 (weniger frustrierend gegen schnelle Ziele)

---

## 4. Itemization

### Was funktioniert
- Affix-System (Crit/LS/CDR) gibt Drops Bedeutung
- Spezial-Steine (Frost-Kern etc.) als Anti-Bruch-Mechanik
- Stacking + Merge = saubere Inventar-Hygiene

### Was klemmt

**Affixe sind zufällig — keine Steuerung**. Spieler wollen Build planen:
- "Ich brauche jetzt eine Waffe mit CDR" → kann nicht gezielt farmen
- **Vorschlag**: Re-Roll-Mechanik beim Schmied (kostet 3 Spezial-Steine, würfelt einen Affix neu)

**Rüstungs-Tier-Sprung zu groß**:
- Lederweste (4 DEF) → Eisenharnisch (9 DEF) → Stahlpanzer (16 DEF) → Drachenplatte (26 DEF)
- Der Magier-Klassen-Bonus +0 Rüstung wird durch Drachenplatte komplett irrelevant
- **Vorschlag**: Rüstungs-Werte halbieren, Klassen-Boni werden wichtiger

**+9 Upgrade-Spiral ist eindimensional**:
- Du brauchst nur Gold + Material + Spezial-Stein
- Keine Wahl, kein Risiko-Mitigationen-Spiel
- **Vorschlag**: "Glücks-Schmiedung" — 50/50 ob +1 oder +2, dafür höhere Bruchchance

---

## 5. Bosse + Encounter

### Aktuell: Nur Frost-Jarl ist ein "echter" Boss

| Welt | Boss-Status |
|------|-------------|
| Wiesen | Kein Boss (Safe-Hub) ✓ |
| Frost-Öden | **Jarl Borealis** (3 Phasen, eigene Mechaniken) ★ |
| Glut-Schmiede | Generischer Boss ❌ |
| Schattensumpf | Generischer Boss ❌ |
| Himmelsturm | Generischer Boss ❌ |
| Arena | — |

**Klar erkennbarer Hauptmangel**: 4 von 5 Welten haben Beigemüse statt Boss-Gefühl.

**Vorschlag-Konzepte** (eine Datei pro):
- **Glut**: "Pyromant Asaru" — beschwört Lava-Pools die Boden-Areale für 4s sperren, Phasen über Hitze-Aufstieg
- **Sumpf**: "Mutter der Schleime" — splittet bei 50 % HP in 3 kleinere Versionen
- **Sky**: "Sturm-Zaren" — Trio das gleichzeitig spawnt, jeder hat Element (Blitz/Wind/Donner)

Und jeder Boss gibt ein eigenes Pet → 4 Pets statt 1.

### Mob-Vielfalt innerhalb einer Welt
Aktuell pro Welt **1-2 Mob-Skins** + 1 Elite-Skin. Das ist zu wenig für 20 min Spielzeit pro Welt.

**Vorschlag**: 4-5 Skins pro Rang pro Welt, evtl. mit kleinen Mechanik-Twists (Schleimer splittet bei Tod in 2 Mini-Schleimer etc.)

---

## 6. PvP

### Aktuell
- Arena als separate Welt
- Bot-Training mit 3 Klassen-Wahlmöglichkeiten
- Spiegel-Duell + Metin-Rennen

### Was fehlt
- **Ranglisten** (auch nur lokal)
- **Best-of-X** statt Ein-Hit-Mode
- **Bot-Schwierigkeitsgrade** (aktuell 1.15× — sollte easy/medium/hard sein)
- **Belohnungen** — Bot-Sieg gibt 0 Loot, nur Score-Zähler

**Vorschlag**: 10er-Rang-System, Bot-Schwierigkeit wählbar, pro Sieg 50 Gold + kleine Chance auf Affix-Reroll-Token.

---

## 7. Pets

### Aktuell
- 1 Pet (Frost-Splitter) vom Frost-Jarl
- Schießt Projektile auf nächstes Mob
- An/Aus-Toggle, kein Level, kein Feed

### Schwächen
- Wenn man 4 Bosse besiegt hat → 4 statische Pets, kein Stärken-Vergleich
- Kein Grund das Pet zu wechseln außer "ich will den Look"
- Pet-DPS skaliert mit deinem ATK, aber nicht mit Boss-Schwierigkeit

**Vorschlag**: Pets bekommen "Synergie" — Frost-Pet slowt Mobs zusätzlich, Glut-Pet zündet DoT, Sumpf-Pet vergiftet, Sky-Pet macht Crit-Bonus auf markierte Ziele. Wahl wird taktisch.

---

## 8. Schmied + NPCs

### Was funktioniert
- Händlerin Mara: Klare Funktion (Kaufen/Verkaufen)
- Meisterin Kael: 5-min-Talent-Reset = niedriger Stress beim Experimentieren
- Kurier Sven: Daily Quest = Reason to come back
- Schmied: Bruch-Risiko-Mechanik fühlt sich gefährlich

### Was klemmt
- NPCs sind statisch — kein Dialog, keine Story
- Keine Sammler/Botanikerin/etc — nur 3 Funktionen
- Daily-Quest variiert wenig (immer Mobs töten / Steine brechen / Level-Up)

**Vorschlag**:
- 1-2 Sätze Persönlichkeit pro NPC ("Mara: 'Frische Tränke heute, halbes Glas geschenkt!'")
- NPC-Reputation: 10 Käufe bei Mara → 10 % Rabatt
- Quest-Pool erweitern: "Sammle 5 Frost-Kerne", "Schmiede ein Item auf +6"

---

## 9. Performance + UX-Details

### Was funktioniert
- UI-Throttling (10 Hz für Stats) hat Frame-Drops reduziert
- Off-Screen-Culling für Mobs
- Inventar-Filter + Scroll

### Was klemmt
- **Mini-Map fehlt** in den 4 Außenwelten (nur Wiesen hat zentralisierten Schmied)
- **Kein Compass/Direction-Indicator** → man verläuft sich
- **Drop-Loot ohne Magnet** → man muss exakt drüberlaufen
- **Toast-Spam** bei Wave-Spawns

**Vorschlag**:
- Mini-Map oben-rechts immer sichtbar, Portale & Bosse markiert
- Loot-Magnet (Items kommen zum Spieler in 60px Range)
- Toast-Queue: max 1 sichtbar, neue ersetzen alte sofort

---

## 10. Spielspaß-Score (1-10)

| Kategorie | Score | Begründung |
|-----------|-------|------------|
| Combat-Feel | 7 | Skills fühlen sich knackig an, aber 80 % Auto-Attack |
| Klassen-Vielfalt | 6 | 3 Klassen, klare Identität, aber Schatten op |
| Welt-Erkundung | 5 | 5 Welten gestartet, aber 4 davon nicht ausgebaut |
| Progression | 4 | Cliff zwischen Welten, keine Mid-Goals |
| Item-Loop | 6 | Affix-System solid, aber kein Build-Crafting |
| Boss-Encounter | 5 | Jarl ★, andere ❌ |
| PvP | 4 | Funktional, aber kein Reward-Loop |
| Pet-System | 4 | Existiert, aber keine Tiefe |
| Sound | 0 | **Kein Audio überhaupt** |
| UI/UX | 7 | Solide, paar Polish-Lücken |

**Gesamt: ~5.0/10 Spielspaß-Tauglichkeit für Solo-Sessions ≥ 30 Min**

Das Spiel ist in den ersten 15 Minuten **richtig gut**. Danach merkt man die Lücken. Mit 3-4 Polish-Sessions kommst du locker auf 7+.

---

## Top-5 Hebel für maximalen Spaß-Gewinn

Priorisiert nach Aufwand/Wirkung:

1. **Schatten nerfen + Krieger buffen** — sofort spürbar besseres Klassen-Gleichgewicht (1h Arbeit)
2. **3 Welt-Bosse mit eigenen Mechaniken** (à 1.5h pro Boss) — gibt jeder Welt einen Endgame-Punkt
3. **Achievement-System mit ~15 Trophies** (3h) — gibt langzeitige Motivation
4. **Sound: 8-10 Effekte minimum** (Hit, Crit, Level-Up, Portal, Boss-Intro) — riesiger Feel-Hebel mit wenig Aufwand
5. **Mini-Map + Loot-Magnet** (2h) — UX-Schmerz weg

Sound ist der größte Hebel pro Aufwand. Selbst billige Synth-Beeps machen das Spiel sofort 2 Punkte spielspaßiger.
