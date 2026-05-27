# Anweisungen für den Backend-Entwickler (Claude Code)

Hi! Du nutzt Claude Code wie ich. Kopier dir den Prompt unten in dein Claude-Code-Terminal und Claude erledigt die meisten Schritte für dich.

## Vor dem Start

```bash
git fetch origin
git checkout feat/classes-worlds-pets
git pull
```

Dann lies kurz die [HANDOFF.md](HANDOFF.md) (5 Min) — die enthält das vollständige Schema und die Lücken in den Rules.

---

## Prompt für Claude Code (einfach einfügen und absenden)

````
Hi Claude. Ich bin der Backend-Entwickler für das Blocpugna-Spiel
(https://github.com/KrohDaniel/blogpugna-metin2-roblox).

Bitte führe folgendes durch:

## Aufgabe 1 — Critical Fix: classId in den Player-Rules erlauben

Das Frontend schreibt seit dem Update das Feld `classId` in jedes
Player-Objekt unter `blocpugna/rooms/{roomId}/players/{username}`.
Die aktuelle database.rules.json blockt das durch `$other: { ".validate": false }`.

Bitte:
1. Lies database.rules.json
2. Füge `classId` als erlaubte Property hinzu (String, max 24 Zeichen):
   "classId": { ".validate": "newData.isString() && newData.val().length <= 24" }
3. Zeige mir das Diff vor dem Speichern

## Aufgabe 2 — World-Subtree absichern

Aktuell ist `rooms/{roomId}/world` komplett ohne Validierung schreibbar.
Das ist eine Sicherheitslücke (jeder kann Host-Override, Mob-Spawning,
Loot-Manipulation triggern).

Ergänze pro Subpfad eine Mindestvalidierung:
- world.host: muss { name: string, ts: number } sein
- world.mobs.$id: muss x, y, hp, rank haben (numbers + string)
- world.stones.$id: muss x, y, hp haben
- world.loot.$id: muss id (string), x, y, count haben
- world.hits.$id: muss { kind, serverId, amount, ts } haben
- world.pvp.match: muss status + players haben

Schreib die Rules. Zeig mir das Diff. Validier sie wenn möglich
mit dem Firebase-Emulator (`firebase emulators:start --only database`)
bevor wir deployen.

## Aufgabe 3 — Charakter-Schema vorbereiten (Phase 2, später)

Das Frontend speichert Charaktere aktuell nur in localStorage.
Für cross-device Sync brauchen wir einen `characters`-Subpfad:
`blocpugna/users/{username}/characters/{charId}`

Das vollständige Schema steht in HANDOFF.md (Sektion "Vorgeschlagenes
Char-Schema"). Schreib NUR die Rules dafür — die Frontend-Migration
mache ich später. Wichtige Constraints:
- name uniqueness pro user
- level monoton wachsend
- gold >= 0
- weaponIndex/armorIndex valide gegen inventory.length

## Aufgabe 4 — Deploy

NUR Rules deployen, NICHT Hosting:
`firebase deploy --only database:rules --project blogpugna`

WICHTIG: Verifiziere mit `firebase use` dass das aktive Projekt
"blogpugna" ist, NICHT "human-premium" (das ist Andreas' Business-App).
Wenn falsch: `firebase use blogpugna` zuerst.

## Aufgabe 5 — Status-Bericht

Sag mir am Ende:
- Welche Rules hast du geändert (mit Zeilennummern)
- Hast du den Emulator-Test bestanden?
- Wurden die Rules erfolgreich deployed?
- Welche Felder aus dem Char-Schema sind NICHT in den Rules implementiert
  (für die spätere Migration)

Bitte fang an mit Aufgabe 1 und arbeite dich der Reihe nach durch.
````

---

## Was Claude Code von dir braucht

- Firebase CLI installiert: `npm install -g firebase-tools`
- Eingeloggt mit dem Account der zu **blogpugna** Schreibrechte hat
- Im Repo-Root: `/path/to/blogpugna-metin2-roblox`

## Was du danach manuell prüfen solltest

1. **Firebase Console** (https://console.firebase.google.com/project/blogpugna/database/rules) — die deployten Rules anschauen
2. **Test mit dem Spiel**:
   - https://blogpugna.web.app öffnen
   - Einloggen + Charakter erstellen
   - Schauen ob `classId` jetzt in Player-Objekt geschrieben wird (Browser DevTools → Network → realtime database)

## Fragen → ans Frontend

Wenn du Schema-Details brauchst die nicht in HANDOFF.md stehen, oder ein
Frontend-Field unklar ist, schreib direkt eine Issue mit dem Tag
`@frontend` — Andreas (oder Claude bei ihm) antwortet schnell.

## Was NICHT in deinen Job gehört

- Hosting-Deploys (mache ich vom Frontend aus)
- Frontend-Code-Änderungen (`src/` oder `index.html`)
- Game-Balance-Änderungen (BALANCE.md ist nur info, kein Auftrag)

---

**Branch-Stand bei Übergabe**: `feat/classes-worlds-pets` @ `7513dd1`
**Letzte Frontend-Version**: `v=gold-pack-1` (siehe index.html)
