# Blocpugna — Performance-Analyse

## Aktuelle Hotspots

### 1. `updateUi()` lief jeden Frame → DOM-Spam
- ~30+ `textContent`-Writes pro Frame bei 60fps = 1800 DOM-Ops/s
- **Fix**: Throttling auf 10Hz für non-kritische UI (Stats-Texte). Cooldowns + HP-Bar weiterhin jeden Frame.
- **Impact**: ~50-70% weniger Layout-Thrashing.

### 2. Off-Screen Mobs/Stones gerendert
- Welt = 2400×1600, Canvas zeigt ~1280×720 → ~75% der Welt off-screen
- **Fix**: Viewport-Culling im Draw-Loop für Mobs + Stones (80px Padding für Soft-Cull).
- **Impact**: Auf dicht bevölkerten Maps 30-50% weniger ctx.fill-Calls.

### 3. Partikel-System sammelt sich an
- Particles, weaponTrails, crescentWaves, projectiles — alle als Arrays mit `.splice()` in der Mitte
- Aktuell: kein Hard-Cap → bei Bossfights können >500 Particles entstehen
- **Empfohlen** (nicht in dieser Runde): Hard-Cap 200, älteste droppen first

### 4. Firebase-Multiplayer-Sync
- `syncPresence()` läuft jeden Frame, intern throttled auf 120ms — gut
- `onValue`-Listener für Players + World feuern oft → könnte mit `requestIdleCallback` wrapper gepuffert werden

### 5. `applyCharacter` ruft DOM-heavy renderInventory + renderTalents + updateUi 
- OK weil nur bei Char-Switch, nicht im Hot-Path

## Bereits gemachte Quick-Wins
- `updateUi` Throttling 10Hz (kritische UI 60fps)
- Off-Screen-Culling für Mobs + Stones
- Particles haben begrenzte Life-Times (~0.3-0.7s, sterben schnell)

## Größere Optionen für später
- **Sprite-Caching**: drawStone/drawMob nutzen viele ctx.fillRect-Aufrufe → wenn jeder Mob in OffscreenCanvas pre-rendert würde, ein einziger drawImage statt 15+ fills
- **Quadtree für Hit-Detection**: aktuell O(n²) bei "alle Mobs vs alle Projektile" — Quadtree wäre O(n log n)
- **Worker-Thread für Path-AI**: Mob-Bewegung könnte off-thread
- **WebGL-Render**: bei >100 Mobs gleichzeitig wäre 2D-Context limit

## Was *jetzt* spürbar sein sollte
- Weniger Stocker beim Inventar-Öffnen während Mobs aktiv
- Mehr stabile 60fps bei Wave-Spawns
- Beim Bosskampf weniger Frame-Drops durch Particle-Burst
