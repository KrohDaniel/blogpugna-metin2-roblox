# Blocpugna Prototype

Ein spielbarer Browser-Prototyp fuer ein blockiges Action-Rollenspiel mit Mobs,
Loot, Inventar und Metin-Steinen.

## Start

Oeffne `index.html` direkt im Browser.

Online-Version: `https://blogpugna.web.app`

## Multiplayer

- Username und Passwort im Startdialog eintragen
- Neue Namen mit `Registrieren` anlegen
- Bestehende Namen mit `Einloggen` betreten
- Andere eingeloggte Spieler erscheinen live auf derselben Map

Hinweis: Die aktuelle Username/Passwort-Loesung ist ein Prototyp ueber Firebase
Realtime Database und nicht fuer echte Produktionsaccounts gedacht.

## Steuerung

- `WASD` oder Pfeiltasten: bewegen
- Maus: zielen
- Linksklick oder `Leertaste`: schlagen
- `Q`: Schwertverbesserung mit roter Waffen-Aura
- `E`: Sichelhieb als Flaechenangriff
- `F`: Schmied benutzen, wenn du neben ihm stehst
- `1`: Heiltrank nutzen
- Inventar-Slot anklicken: Trank nutzen oder Waffe ausruesten

## Inhalt

- Blockiger Roblox-inspirierter Stil ohne offizielle Roblox-Assets
- **Shared World**: alle eingeloggten Spieler sehen dieselben Mobs, Steine und Loot
- **Host-System** mit Auto-Failover: erster Spieler wird Host, bei Disconnect uebernimmt automatisch ein anderer
- **Damage-Credit Loot**: wer den meisten Schaden macht, bekommt Loot 6s reserviert (rot/gruen umrandet)
- Gegner mit Nahkampf-KI, Mob-Anzahl und HP skalieren mit Anzahl Spieler (1+0.35*N)
- Metin-Steine mit mehr Leben und garantierter Waffen-Lootrolle
- Ruestung als Drop: Lederweste / Eisenharnisch / Stahlpanzer / Drachenplatte (4 Tiers)
- Rare/Epic-Waffen mit mehr Schaden, groesserer Reichweite und eigenen Angriffseffekten
- Vollmondsichel als legendaerer Drop von Metin-Steinen, Minibossen und Bossen
- Mehr Gegnerwellen, Minibosse und Bosse mit griechischen Namen
- Schmied-NPC fuer Waffen- *und* Ruestungs-Upgrades bis +9 (Ruestungs-Upgrade staerkt das aktuelle Item)
- Schwierigkeitsboost: Mob HP +60%, dmg +40%, schnellere Waves, traegere Heiltraenke
- Minimap rechts oben mit Boss-/Mob-/Spieler-Markern und Host-Anzeige
- Tod setzt Level, Stats, Gold und Inventar (inkl. Ruestungsplatz) zurueck
- Kleine Firebase-Username-Auth und Live-Spieler auf gemeinsamer Map
- XP, Level, Gold, Inventar und Quest-Fortschritt
