export const MAX_STACK = 128;

export function item(id, count = 1) {
  return { id, count };
}

export const itemDefs = {
  health_potion: { name: "Roter Trank", icon: "🧪", type: "potion", rarity: "common", heal: 32, color: "#ff5d62" },
  rust_sword: { name: "Rostklinge", icon: "🗡", type: "weapon", rarity: "common", attack: 3, color: "#d9dee5", glow: "rgba(217,222,229,0.18)", reach: 82, cooldown: 0.42, style: "sword" },
  twin_daggers: { name: "Zwillingsdolche", icon: "🗡", type: "weapon", rarity: "common", attack: 4, color: "#a8b3c7", glow: "rgba(168,179,199,0.22)", reach: 64, cooldown: 0.34, style: "dagger" },
  apprentice_staff: { name: "Lehrlingsstab", icon: "🪄", type: "weapon", rarity: "common", attack: 4, color: "#9ee7ff", glow: "rgba(85,215,255,0.32)", reach: 360, cooldown: 0.62, style: "staff", projectile: { speed: 520, color: "#9ee7ff", glow: "rgba(85,215,255,0.55)" } },
  iron_blade: { name: "Eisenklinge", icon: "🗡", type: "weapon", rarity: "rare", attack: 8, color: "#9ee7ff", glow: "rgba(85,215,255,0.28)", reach: 92, cooldown: 0.38 },
  metin_glaive: { name: "Metin-Gleve", icon: "⚔", type: "weapon", rarity: "rare", attack: 14, color: "#55d7ff", glow: "rgba(85,215,255,0.36)", reach: 108, cooldown: 0.36 },
  pugna_cleaver: { name: "Pugna-Spalter", icon: "⚔", type: "weapon", rarity: "epic", attack: 21, color: "#c084fc", glow: "rgba(192,132,252,0.42)", reach: 118, cooldown: 0.46 },
  storm_saber: { name: "Sturmsaebel", icon: "⚡", type: "weapon", rarity: "epic", attack: 17, color: "#f4c95d", glow: "rgba(244,201,93,0.42)", reach: 102, cooldown: 0.28 },
  fullmoon_sickle: { name: "Vollmondsichel", icon: "🌙", type: "weapon", rarity: "legendary", attack: 29, color: "#fff2a8", glow: "rgba(244,201,93,0.48)", reach: 132, cooldown: 0.33 },
  leather_armor: { name: "Lederweste", icon: "🛡", type: "armor", rarity: "common", defense: 4, color: "#a98056" },
  iron_armor: { name: "Eisenharnisch", icon: "🛡", type: "armor", rarity: "rare", defense: 9, color: "#9ee7ff" },
  steel_armor: { name: "Stahlpanzer", icon: "🛡", type: "armor", rarity: "epic", defense: 16, color: "#c084fc" },
  dragon_plate: { name: "Drachenplatte", icon: "🐉", type: "armor", rarity: "legendary", defense: 26, color: "#fff2a8" },
  metin_shard: { name: "Metin-Splitter", icon: "✦", type: "material", rarity: "rare", color: "#9ee7ff" },
  pugna_core: { name: "Pugna-Kern", icon: "◉", type: "material", rarity: "epic", color: "#c084fc" },
  gem: { name: "Kristall", icon: "◆", type: "material", rarity: "rare", color: "#7dd3fc" },
  // Welt-spezifische Spezial-Steine: Schmied-Material das Bruchchance reduziert
  frost_core: { name: "Frost-Kern", icon: "❄", type: "material", rarity: "epic", color: "#bae6fd", breakReduce: 0.20, source: "frostwastes" },
  ember_spark: { name: "Glut-Funke", icon: "🔥", type: "material", rarity: "epic", color: "#fb923c", breakReduce: 0.18, source: "emberforge" },
  shadow_essence: { name: "Schatten-Essenz", icon: "☘", type: "material", rarity: "epic", color: "#84a665", breakReduce: 0.16, source: "shadowfen" },
  sky_shard: { name: "Sturm-Splitter", icon: "⚡", type: "material", rarity: "epic", color: "#ddd6fe", breakReduce: 0.22, source: "skyspire" },
};

export const typeBadges = {
  weapon: "⚔",
  armor: "🛡",
  potion: "🧪",
  material: "✦",
};

export const rarityLabels = {
  common: "Gewöhnlich",
  rare: "Selten",
  epic: "Episch",
  legendary: "Legendär",
};

export const affixCatalog = {
  crit: { label: "Crit-Chance", suffix: "%", scale: 100, color: "#ff9540" },
  lifesteal: { label: "Lebensraub", suffix: "%", scale: 100, color: "#51d37a" },
  cdr: { label: "Cooldown-Reduktion", suffix: "%", scale: 100, color: "#9ee7ff" },
};

const affixRolls = {
  rare: { count: 1, ranges: { crit: [0.05, 0.10], lifesteal: [0.03, 0.06], cdr: [0.05, 0.10] } },
  epic: { count: 2, ranges: { crit: [0.10, 0.18], lifesteal: [0.06, 0.10], cdr: [0.08, 0.14] } },
  legendary: { count: 3, ranges: { crit: [0.15, 0.25], lifesteal: [0.10, 0.15], cdr: [0.12, 0.20] } },
};

export function rollAffixes(rarity) {
  const rule = affixRolls[rarity];
  if (!rule) return {};
  const keys = Object.keys(rule.ranges);
  const result = {};
  const pool = [...keys];
  for (let i = 0; i < rule.count && pool.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    const key = pool.splice(idx, 1)[0];
    const [lo, hi] = rule.ranges[key];
    const val = Math.round((lo + Math.random() * (hi - lo)) * 1000) / 1000;
    result[key] = val;
  }
  return result;
}
