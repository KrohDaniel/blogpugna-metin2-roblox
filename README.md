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
- Gegner mit Nahkampf-KI
- Metin-Steine mit mehr Leben und garantierter Waffen-Lootrolle
- Rare/Epic-Waffen mit mehr Schaden, groesserer Reichweite und eigenen Angriffseffekten
- Vollmondsichel als legendaerer Drop von Metin-Steinen, Minibossen und Bossen
- Mehr Gegnerwellen, Minibosse und Bosse mit griechischen Namen
- Schmied-NPC auf der Karte fuer Waffen- und Ruestungsupgrades bis +9
- Tod setzt Level, Stats, Gold und Inventar zurueck
- Kleine Firebase-Username-Auth und Live-Spieler auf gemeinsamer Map
- XP, Level, Gold, Inventar und Quest-Fortschritt
