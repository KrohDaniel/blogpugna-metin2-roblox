# Blocpugna — Handoff für den Backend-/Datenbank-Kollegen

Stand: 2026-05-27. Dieses Dokument beschreibt, was beim aktuellen Firebase-Setup angepasst werden sollte, damit das Spiel sauber läuft.

## Aktueller Stand

- **Hosting**: `firebase.json` zeigt auf `.` (gesamtes Repo), Site nicht explizit konfiguriert. `.firebaserc` zeigt auf Projekt `blogpugna`.
- **Realtime Database**: nur die `blocpugna/...`-Subtree wird genutzt. Regeln liegen in [database.rules.json](database.rules.json).
- **Auth**: keine Firebase-Auth, sondern Username + SHA-256-Passwort-Hash in der Datenbank (Prototyp).

## Was JETZT in der Database geschrieben wird

```
blocpugna/
├── users/{username}/
│   ├── passwordHash       (SHA-256-Hash)
│   └── createdAt          (number)
└── rooms/{roomId}/
    ├── players/{username}/      ← Live-Position aller Spieler
    │   ├── name, color, x, y
    │   ├── hp, maxHp, level
    │   ├── classId          ← NEU, wird gesendet aber NICHT validiert
    │   ├── weapon, weaponUpgrade
    │   ├── armorLevel
    │   └── updatedAt
    └── world/
        ├── mobs/{serverId}      ← Host-synchronisierte Mobs
        ├── stones/{serverId}    ← Host-synchronisierte Steine
        ├── loot/{id}            ← Drops, ownerLock-System
        ├── hits/{id}            ← Damage-Events
        ├── grants/{id}          ← Gold/XP-Belohnungen
        ├── host                 ← Host-Election (name + ts heartbeat)
        └── pvp/
            ├── mode             ("duel" | "race")
            ├── ready/{username} ← Wer ist bereit
            ├── match            ← Aktive Runde (players, status, endsAt)
            ├── scores
            └── hits/{id}        ← PvP-Damage-Events
```

## Bekannte Lücken in den aktuellen Rules

### 1. `classId` wird geschrieben, aber nicht erlaubt
[database.rules.json](database.rules.json) hat `$other: { ".validate": false }` unter `players/{username}` — das heißt, der neue `classId`-Schreibversuch wird **abgelehnt** sobald die Rules strikt greifen.

**Fix** (im Block `players.$username.$other` ergänzen oder vorher als eigene Property freigeben):
```json
"classId": { ".validate": "newData.isString() && newData.val().length <= 24" },
```

### 2. `world`-Subtree hat keinerlei Validierung
Aktuell:
```json
"world": { ".write": "$roomId.matches(...)" }
```
Das erlaubt jedem authentifizierten Spieler, **alles** in den World-State zu schreiben — inkl. Host-Override, Mob-Spawning, Loot-Manipulation.

**Empfehlung**: Validierung pro Subpfad. Beispielskizze:
```json
"world": {
  "host": {
    ".validate": "newData.hasChildren(['name', 'ts']) && newData.child('ts').isNumber()"
  },
  "mobs": {
    "$mobId": {
      ".validate": "newData.hasChildren(['x', 'y', 'hp', 'rank'])"
    }
  },
  "loot": {
    "$lootId": {
      ".validate": "newData.hasChildren(['id', 'x', 'y', 'count'])"
    }
  },
  "pvp": {
    "match": {
      ".validate": "newData.hasChildren(['status', 'players'])"
    }
  }
}
```

### 3. Kein TTL / Cleanup
- `world/hits/{id}`, `world/loot/{id}`, `world/grants/{id}`, `pvp/hits/{id}` werden geschrieben aber **nie automatisch gelöscht**
- Das Spiel löscht via Client (siehe `pruneHits`, `pruneLoot` etc.), aber wenn ein Spieler crasht bleiben Einträge hängen
- **Empfehlung**: Cloud Function die alle 5 Minuten Einträge älter als 60s löscht, oder TTL via Realtime DB → Firestore migrieren

### 4. Passwörter sind SHA-256 ohne Salt
- Aktuell: `SHA-256("blocpugna:" + username + ":" + password)`
- Pro: keine Server-Logik nötig
- Contra: Rainbow-Table-Angriffe möglich, kein bcrypt/scrypt
- **Empfehlung für Production**: Migration zu Firebase Auth (Email/Password oder Anonymous)

## Was NEU mit ins Backend müsste (Wunsch-Liste)

Aktuell ist alles im `localStorage` des Clients:

| Daten | Aktuell | Empfehlung |
|-------|---------|------------|
| Charakter-Roster (mehrere Helden pro User) | `localStorage["blocpugnaChars:{username}"]` | `blocpugna/users/{username}/characters/{charId}` |
| Talente / Talent-Punkte | localStorage | `characters/{charId}/talents` |
| Pets (Boss-Defeat-Unlocks) | localStorage | `characters/{charId}/pets` |
| Item-Inventar | localStorage | `characters/{charId}/inventory` |
| Courier-Quest-State | localStorage | `characters/{charId}/courierState` |
| Trainer-Cooldown | localStorage | `characters/{charId}/trainerLastReset` |

**Vorgeschlagenes Char-Schema:**
```json
{
  "characters": {
    "{charId}": {
      "name": "string (2-16 chars)",
      "classId": "warrior | shadow | runemage",
      "level": "number",
      "xp": "number",
      "nextXp": "number",
      "gold": "number",
      "hp": "number",
      "maxHp": "number",
      "baseAttack": "number",
      "attackBonus": "number",
      "armorLevel": "number",
      "inventory": [{ "id": "string", "count": "number", "upgrade": "number", "affixes": { } }],
      "weapon": "string",
      "weaponIndex": "number",
      "armorIndex": "number",
      "talents": { },
      "talentPoints": "number",
      "pets": { "{bossId}": { "unlockedAt": "number" } },
      "activePet": "string | null",
      "courierState": { "questId", "progress", "claimed", "resetAt" },
      "trainerLastReset": "number",
      "mobsKilled": "number",
      "stonesKilled": "number",
      "createdAt": "number",
      "lastPlayedAt": "number"
    }
  }
}
```

**Validierungs-Constraints, die wir brauchen:**
- `name` darf nicht von anderem Char belegt sein (uniqueness im Roster)
- `level` ≤ 100, monoton oder nur via Server-Tx erhöhbar
- `gold` ≥ 0
- `weaponIndex`/`armorIndex` ≤ inventory.length

## Mini-Migration-Plan

1. **Phase 1** (jetzt): `classId` zur Player-Rule hinzufügen, sonst Multiplayer-Sync broken.
2. **Phase 2**: Validierung für `world/*` Subpfade hinzufügen.
3. **Phase 3**: TTL-Cleanup via Cloud Function (oder Migration zu Firestore mit Document-TTL).
4. **Phase 4**: Characters in Firebase persistieren (cross-device).
5. **Phase 5**: Firebase Auth statt SHA-256 Username/Password.

## Test-Vorgehen vor Deploy

```bash
# Lokal mit Emulator testen
firebase emulators:start --only database,hosting

# Rules-Tests
firebase emulators:exec --only database "node scripts/rules-tests.js"

# Deploy
firebase deploy --only database:rules        # zuerst nur Rules
firebase deploy --only hosting               # dann Hosting
```

## Kontakt

- **Frontend / Game-Code**: Andreas Kroh
- **Repo**: https://github.com/KrohDaniel/blogpugna-metin2-roblox
- **Branch**: `main`
- **Stand-Tag**: `pets-1` (Cache-Bust-Version in [index.html](index.html))

Bei Fragen zu konkreten Datenflüssen siehe [src/main.js](src/main.js) — die relevanten Funktionen heißen `syncPresence`, `startWorldSync`, `publishHit`, `publishLoot`, `pushGrant`, `applyPvpSnapshot`.
