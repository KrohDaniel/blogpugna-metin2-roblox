// Boss: Jarl Borealis — Tyrann der Frost-Oeden
// Spezialitaeten: 3 Phasen, Eis-Speer-Salven, Frost-Nova bei <50% HP, Add-Spawn bei <25% HP.
// Schwer designed: hohe HP, lange Reichweite, schnelle Mobs bei Phasenwechsel.

export const frostJarl = {
  id: "frost_jarl",
  worldId: "frostwastes",
  name: "Jarl Borealis",
  title: "Tyrann der Frost-Oeden",
  rank: "boss",
  spawnDelay: 25, // s nach Welt-Betreten
  baseStats: {
    hp: 2400,
    damage: 90,
    speed: 78,
    r: 52,
    scale: 1.7,
    xp: 520,
  },
  // Farben fuer drawBlockPerson + Aussehen
  appearance: {
    head: "#bae6fd",
    body: "#1e3a5f",
    arms: "#3b5f8a",
    legs: "#0f1f3a",
    accent: "horned-helm",
    accentColor: "#e0f0ff",
    aura: "rgba(160, 220, 255, 0.32)",
  },
  // Abilities: phasenabhaengig
  abilities: {
    // Phase 1 (>66% HP)
    frostSpear: {
      phase: 1,
      cooldown: 5,
      damage: 0.85,
      speed: 360,
      pierce: 3,
      color: "#bae6fd",
      glow: "rgba(125, 211, 252, 0.55)",
      hint: "Drei Eis-Speere als Fächer in Richtung Spieler",
      counter: "Seitlich ausweichen oder über die Strecke laufen",
    },
    // Phase 2 (<66% HP) — mit Telegraph
    frostNova: {
      phase: 2,
      cooldown: 11,
      damage: 0.85, // war 1.4 — viel zu hart
      radius: 280,
      color: "#e0f0ff",
      hint: "Lädt 1.5s → Schockwelle + Verlangsamung 2s",
      counter: "Während des Ladens (weißer Ring) aus dem Radius rennen",
      telegraphDuration: 1.5,
      slowDuration: 2,
    },
    // Phase 3 (<33% HP)
    summonShards: {
      phase: 3,
      cooldown: 12,
      count: 4,
      addStats: { hp: 80, damage: 24, speed: 160 },
      addColor: "#7dd3fc",
      hint: "Beschwört 4 Frost-Splitter (mob-tier)",
      counter: "Adds zuerst töten, sonst werden sie überwältigend",
    },
  },
  drops: {
    guaranteed: ["frost_core"],
    rolls: [
      { id: "metin_glaive", chance: 0.4 },
      { id: "pugna_cleaver", chance: 0.18 },
      { id: "fullmoon_sickle", chance: 0.05 },
      { id: "dragon_plate", chance: 0.08 },
    ],
    goldRange: [180, 320],
  },
  introToast: "Jarl Borealis erhebt sich aus dem Eis...",
  defeatToast: "Jarl Borealis ist gefallen. Ein Frost-Splitter folgt dir nun.",
  pet: {
    id: "frost_jarl_pet",
    name: "Frost-Splitter (Pet)",
    scale: 0.45,
    hp: 60,
    damage: 0.18, // multiplier von Boss-Damage
    attackRange: 220,
    attackCooldown: 1.4,
    speed: 280,
    color: "#bae6fd",
    glow: "rgba(125, 211, 252, 0.55)",
    style: "frostling",
  },
};
