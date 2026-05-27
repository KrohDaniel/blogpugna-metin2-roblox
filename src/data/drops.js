// Klare Drop-Tabellen pro Welt + Mob-Rank.
// rolls: Liste von Drop-Versuchen; jeder Eintrag {id, chance}
// goldRange: [min, max]
// specialStone: Welt-Material das mit eigener Chance droppt

export const dropTables = {
  meadows: {
    mob: { rolls: [
      { id: "health_potion", chance: 0.18 },
      { id: "metin_shard", chance: 0.12 },
      { id: "gem", chance: 0.05 },
    ], goldRange: [4, 10] },
    elite: { rolls: [
      { id: "health_potion", chance: 0.32 },
      { id: "metin_shard", chance: 0.32 },
      { id: "gem", chance: 0.15 },
      { id: "rust_sword", chance: 0.08 },
      { id: "iron_blade", chance: 0.04 },
    ], goldRange: [10, 22] },
    miniboss: { rolls: [
      { id: "iron_blade", chance: 0.4 },
      { id: "metin_glaive", chance: 0.18 },
      { id: "metin_shard", chance: 0.7 },
      { id: "leather_armor", chance: 0.2 },
      { id: "iron_armor", chance: 0.08 },
    ], goldRange: [40, 70] },
    boss: { rolls: [
      { id: "metin_glaive", chance: 0.45 },
      { id: "pugna_cleaver", chance: 0.15 },
      { id: "iron_armor", chance: 0.25 },
      { id: "pugna_core", chance: 0.6 },
    ], goldRange: [90, 160] },
    metin: { rolls: [
      { id: "metin_shard", chance: 1 },
      { id: "iron_blade", chance: 0.25 },
      { id: "metin_glaive", chance: 0.1 },
      { id: "gem", chance: 0.6 },
    ], goldRange: [30, 60] },
  },
  frostwastes: {
    mob: { rolls: [
      { id: "health_potion", chance: 0.20 },
      { id: "metin_shard", chance: 0.15 },
      { id: "frost_core", chance: 0.04 },
    ], goldRange: [6, 14] },
    elite: { rolls: [
      { id: "frost_core", chance: 0.18 },
      { id: "iron_blade", chance: 0.15 },
      { id: "iron_armor", chance: 0.10 },
      { id: "metin_shard", chance: 0.40 },
    ], goldRange: [12, 28] },
    miniboss: { rolls: [
      { id: "frost_core", chance: 0.55 },
      { id: "metin_glaive", chance: 0.30 },
      { id: "iron_armor", chance: 0.25 },
      { id: "steel_armor", chance: 0.08 },
    ], goldRange: [55, 95] },
    boss: { rolls: [
      { id: "frost_core", chance: 1 },
      { id: "metin_glaive", chance: 0.5 },
      { id: "pugna_cleaver", chance: 0.25 },
      { id: "fullmoon_sickle", chance: 0.06 },
      { id: "dragon_plate", chance: 0.10 },
    ], goldRange: [180, 320] },
    metin: { rolls: [
      { id: "frost_core", chance: 0.45 },
      { id: "metin_glaive", chance: 0.18 },
      { id: "metin_shard", chance: 1 },
      { id: "iron_armor", chance: 0.20 },
    ], goldRange: [40, 80] },
  },
  emberforge: {
    mob: { rolls: [
      { id: "ember_spark", chance: 0.05 },
      { id: "metin_shard", chance: 0.18 },
      { id: "health_potion", chance: 0.22 },
    ], goldRange: [8, 18] },
    elite: { rolls: [
      { id: "ember_spark", chance: 0.22 },
      { id: "pugna_core", chance: 0.08 },
      { id: "iron_blade", chance: 0.18 },
    ], goldRange: [16, 32] },
    miniboss: { rolls: [
      { id: "ember_spark", chance: 0.6 },
      { id: "pugna_cleaver", chance: 0.22 },
      { id: "steel_armor", chance: 0.18 },
    ], goldRange: [70, 110] },
    boss: { rolls: [
      { id: "ember_spark", chance: 1 },
      { id: "pugna_cleaver", chance: 0.5 },
      { id: "fullmoon_sickle", chance: 0.10 },
      { id: "dragon_plate", chance: 0.18 },
    ], goldRange: [200, 360] },
    metin: { rolls: [
      { id: "ember_spark", chance: 0.50 },
      { id: "pugna_cleaver", chance: 0.16 },
      { id: "metin_shard", chance: 1 },
    ], goldRange: [50, 90] },
  },
  shadowfen: {
    mob: { rolls: [
      { id: "shadow_essence", chance: 0.05 },
      { id: "health_potion", chance: 0.20 },
      { id: "metin_shard", chance: 0.20 },
    ], goldRange: [8, 18] },
    elite: { rolls: [
      { id: "shadow_essence", chance: 0.22 },
      { id: "gem", chance: 0.25 },
      { id: "iron_blade", chance: 0.18 },
    ], goldRange: [16, 32] },
    miniboss: { rolls: [
      { id: "shadow_essence", chance: 0.55 },
      { id: "storm_saber", chance: 0.18 },
      { id: "iron_armor", chance: 0.30 },
    ], goldRange: [60, 100] },
    boss: { rolls: [
      { id: "shadow_essence", chance: 1 },
      { id: "storm_saber", chance: 0.45 },
      { id: "fullmoon_sickle", chance: 0.10 },
      { id: "dragon_plate", chance: 0.15 },
    ], goldRange: [200, 350] },
    metin: { rolls: [
      { id: "shadow_essence", chance: 0.50 },
      { id: "storm_saber", chance: 0.12 },
      { id: "metin_shard", chance: 1 },
    ], goldRange: [50, 90] },
  },
  tideklippen: {
    mob: { rolls: [
      { id: "tide_pearl", chance: 0.06 },
      { id: "health_potion", chance: 0.20 },
      { id: "metin_shard", chance: 0.22 },
    ], goldRange: [10, 22] },
    elite: { rolls: [
      { id: "tide_pearl", chance: 0.26 },
      { id: "storm_saber", chance: 0.16 },
      { id: "iron_armor", chance: 0.20 },
    ], goldRange: [22, 42] },
    miniboss: { rolls: [
      { id: "tide_pearl", chance: 0.6 },
      { id: "pugna_cleaver", chance: 0.25 },
      { id: "steel_armor", chance: 0.32 },
    ], goldRange: [85, 140] },
    boss: { rolls: [
      { id: "tide_pearl", chance: 1 },
      { id: "fullmoon_sickle", chance: 0.35 },
      { id: "dragon_plate", chance: 0.35 },
      { id: "pugna_cleaver", chance: 0.25 },
    ], goldRange: [300, 500] },
    metin: { rolls: [
      { id: "tide_pearl", chance: 0.55 },
      { id: "storm_saber", chance: 0.10 },
      { id: "metin_shard", chance: 1 },
    ], goldRange: [70, 120] },
  },
  skyspire: {
    mob: { rolls: [
      { id: "sky_shard", chance: 0.06 },
      { id: "health_potion", chance: 0.18 },
      { id: "gem", chance: 0.10 },
    ], goldRange: [10, 22] },
    elite: { rolls: [
      { id: "sky_shard", chance: 0.28 },
      { id: "storm_saber", chance: 0.15 },
      { id: "metin_glaive", chance: 0.15 },
    ], goldRange: [22, 40] },
    miniboss: { rolls: [
      { id: "sky_shard", chance: 0.65 },
      { id: "fullmoon_sickle", chance: 0.16 },
      { id: "steel_armor", chance: 0.30 },
    ], goldRange: [80, 130] },
    boss: { rolls: [
      { id: "sky_shard", chance: 1 },
      { id: "fullmoon_sickle", chance: 0.30 },
      { id: "dragon_plate", chance: 0.32 },
    ], goldRange: [260, 440] },
    metin: { rolls: [
      { id: "sky_shard", chance: 0.55 },
      { id: "fullmoon_sickle", chance: 0.08 },
      { id: "metin_shard", chance: 1 },
    ], goldRange: [70, 110] },
  },
};

export function getDropTable(worldId, rank) {
  const w = dropTables[worldId] || dropTables.meadows;
  return w[rank] || w.mob;
}

export function rollDrops(worldId, rank) {
  const table = getDropTable(worldId, rank);
  const drops = [];
  for (const entry of table.rolls || []) {
    if (Math.random() < entry.chance) drops.push(entry.id);
  }
  const gold = table.goldRange ? Math.floor(table.goldRange[0] + Math.random() * (table.goldRange[1] - table.goldRange[0] + 1)) : 0;
  return { drops, gold };
}
