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
    // Phase 1 (>66% HP): Frost-Speer-Salve alle 5s
    frostSpear: {
      cooldown: 5,
      damage: 0.85, // multiplier auf bossDamage
      speed: 360,
      pierce: 3,
      color: "#bae6fd",
      glow: "rgba(125, 211, 252, 0.55)",
      hint: "3 Eis-Speere in Richtung Spieler",
    },
    // Phase 2 (<66% HP): Frost-Nova um sich rum, 10s CD
    frostNova: {
      cooldown: 10,
      damage: 1.4,
      radius: 280,
      color: "#e0f0ff",
      hint: "Schockwelle + Verlangsamung 3s",
      slowDuration: 3,
    },
    // Phase 3 (<33% HP): Add-Spawn alle 12s + verstaerkte Speere
    summonShards: {
      cooldown: 12,
      count: 4,
      addStats: { hp: 80, damage: 24, speed: 160 },
      addColor: "#7dd3fc",
      hint: "Beschwoert 4 Frost-Splitter",
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
