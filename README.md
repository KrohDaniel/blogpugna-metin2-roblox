# Blocpugna Prototype

Ein spielbarer Browser-Prototyp fuer ein blockiges Action-Rollenspiel mit Mobs,
Loot, Inventar und Metin-Steinen.

> **📖 Vollständige Spielanleitung & Index:** siehe [SPIELANLEITUNG.md](SPIELANLEITUNG.md)
> — alle Klassen, Waffen, Runen, Steine, Bosse, Welten + konkrete Aufstiegs-Anleitung.

## Start

Starte lokal einen kleinen Server, damit die ES-Module sauber geladen werden:

```bash
npm run dev
```

Danach im Browser oeffnen: `http://127.0.0.1:5173/`

Online-Version: `https://blogpugna.web.app`

## Multiplayer

- Username und Passwort im Startdialog eintragen
- Neue Namen mit `Registrieren` anlegen
- Bestehende Namen mit `Einloggen` betreten
- Andere eingeloggte Spieler erscheinen live auf derselben Map

Hinweis: Die aktuelle Username/Passwort-Loesung ist ein Prototyp ueber Firebase
Realtime Database und nicht fuer echte Produktionsaccounts gedacht.

## Steuerung (Kurzfassung)

- `WASD` / Pfeile: bewegen · Maus: zielen · Linksklick / `Leertaste`: schlagen
- `Q` / `E` / `R`: Skill 1 / Skill 2 / Ulti · `1`: Heiltrank · `F`: Schmied
- `I C M P T B`: Inventar / Charakter / Quest / PvP / Talente / Codex
- **Mobile:** Joystick + Touch-Buttons mit Auto-Aim, `⛶` Vollbild, `☰` Menü

→ Details + alle Mechaniken: [SPIELANLEITUNG.md](SPIELANLEITUNG.md)

## Inhalt (Überblick)

- Blockiger Roblox-inspirierter Stil ohne offizielle Roblox-Assets
- **5 Klassen** mit eigenen Skills, Resourcen & Combos: Krieger, Schattenläufer, Runenmagier, Druidin, Lyra (Verführerin)
- **Waffen-System** mit Klassen-Affinität (passt = 100%, sonst 75%), 4-Stufen-Leitern, Signatur-Waffen mit aktivem Effekt
- **Runen-System**: Steine/Bosse droppen Runen (4 Wertigkeiten × 6 Typen), max 3 Sockel pro Waffe, **Runen-Wörter** als Kombi-Boni
- **5 Bosse** in 5 Welten, je 3 Phasen + Klassen-Spotlight, droppen **Pets** (mit Evolution)
- **Weltboss-Event** mit geteilter HP-Leiste für alle Spieler
- **Shared World** + Host-Failover + Damage-Credit-Loot
- Schmied (Verstärken bis +9), NPCs (Händler/Trainer/Kurier), Talent-Bäume, Codex/Bestiarium
- Mobile-optimiert: Touch-Controls, Auto-Aim, Cooldown-Ringe, responsive Menüs
- Tod: -1 Level, Inventar bleibt · Firebase-Auth + Cloud-Charakter-Sync (cross-device)
