# Blocpugna Architektur

## Ziel

Das Spiel soll weiter schnell im Browser laufen, aber neue Features sollen nicht mehr in einer einzigen Datei landen. Der erste Umbau trennt deshalb Datenmodule von der Runtime:

- Klassen liegen in `src/data/classes.js`
- Skills liegen in `src/data/abilities.js`
- Items liegen in `src/data/items.js`
- Die aktuelle Spielruntime liegt in `src/main.js`

## Naechste sinnvolle Schnitte

Die Runtime ist noch gross, aber jetzt vorbereitet fuer weitere Module:

```text
src/
  data/
    abilities.js
    classes.js
    items.js
  state/
    player.js
    world.js
    input.js
  systems/
    combat.js
    status-effects.js
    inventory.js
    loot.js
    multiplayer.js
    spawning.js
  render/
    canvas.js
    draw-characters.js
    draw-effects.js
    draw-world.js
    minimap.js
  ui/
    auth-ui.js
    class-select-ui.js
    hud.js
    inventory-ui.js
```

## Feature-Regel

Neue Klassen, Skills, Items oder Balance-Werte sollen zuerst als Daten in `src/data/*` angelegt werden. `src/main.js` sollte nur noch dann wachsen, wenn ein neues System wirklich noch keine eigene Datei hat.
