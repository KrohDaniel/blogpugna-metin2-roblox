import { runeTypes, runeTiers, runeId, runeValue } from "./runes.js";

export const MAX_STACK = 128;

export function item(id, count = 1) {
  return { id, count };
}

// Welcher Waffentyp passt zu welcher Klasse (die "eine Regel": passt = 100%, sonst 75%)
export const classWeaponType = {
  warrior: "sword",
  shadow: "dagger",
  runemage: "staff",
  druid: "naturestaff",
  charmer: "pole",
};

// Passt die Waffe zur Klasse? Gibt Schadens-Multiplikator zurueck.
export function weaponClassMatch(weaponDef, classId) {
  if (!weaponDef) return 1;
  const wt = weaponDef.weaponType || weaponDef.style || "sword";
  const want = classWeaponType[classId];
  if (!want) return 1;
  return wt === want ? 1 : 0.75;
}

// === RÜSTUNGS-TYPEN ===
export const armorTypeMods = {
  leder:  { label: "Leder",           defMult: 0.85, speedMult: 1.08, desc: "+8% Tempo, -15% Verteidigung" },
  leicht: { label: "Leichte Ruestung", defMult: 1.0,  speedMult: 1.0,  desc: "ausgewogen" },
  schwer: { label: "Schwere Ruestung", defMult: 1.35, speedMult: 0.92, desc: "+35% Verteidigung, -8% Tempo" },
};

export const classArmorType = {
  warrior: "schwer",
  shadow: "leder",
  runemage: "leicht",
  druid: "leder",
  charmer: "leicht",
};

// Affinitaet: passt = +10% Verteidigung, sonst -10%
export function armorClassMatch(armorDef, classId) {
  if (!armorDef || !armorDef.armorType) return 1;
  const want = classArmorType[classId];
  if (!want) return 1;
  return armorDef.armorType === want ? 1.10 : 0.90;
}

export const itemDefs = {
  health_potion: { name: "Roter Trank", icon: "🧪", type: "potion", rarity: "common", heal: 32, color: "#ff5d62" },
  // === KRIEGER · Schwert-Leiter ===
  rust_sword: { name: "Rostklinge", icon: "🗡", type: "weapon", rarity: "common", attack: 3, color: "#d9dee5", glow: "rgba(217,222,229,0.18)", reach: 82, cooldown: 0.42, style: "sword", weaponType: "sword" },
  iron_blade: { name: "Eisenklinge", icon: "🗡", type: "weapon", rarity: "rare", attack: 8, color: "#9ee7ff", glow: "rgba(85,215,255,0.28)", reach: 92, cooldown: 0.38, style: "sword", weaponType: "sword" },
  pugna_cleaver: { name: "Pugna-Spalter", icon: "⚔", type: "weapon", rarity: "epic", attack: 21, color: "#c084fc", glow: "rgba(192,132,252,0.42)", reach: 118, cooldown: 0.46, style: "sword", weaponType: "sword" },
  fullmoon_sickle: { name: "Vollmondsichel", icon: "🌙", type: "weapon", rarity: "legendary", attack: 29, color: "#fff2a8", glow: "rgba(244,201,93,0.48)", reach: 132, cooldown: 0.33, style: "sword", weaponType: "sword" },
  // === SCHATTEN · Dolch-Leiter ===
  twin_daggers: { name: "Zwillingsdolche", icon: "🗡", type: "weapon", rarity: "common", attack: 4, color: "#a8b3c7", glow: "rgba(168,179,199,0.22)", reach: 64, cooldown: 0.34, style: "dagger", weaponType: "dagger" },
  fang_daggers: { name: "Reisszaehne", icon: "🗡", type: "weapon", rarity: "rare", attack: 9, color: "#35d0a4", glow: "rgba(53,208,164,0.3)", reach: 70, cooldown: 0.30, style: "dagger", weaponType: "dagger" },
  venom_kris: { name: "Gift-Kris", icon: "🗡", type: "weapon", rarity: "epic", attack: 18, color: "#84cc16", glow: "rgba(132,204,22,0.4)", reach: 74, cooldown: 0.28, style: "dagger", weaponType: "dagger" },
  nightfang: { name: "Nachtzahn", icon: "🗡", type: "weapon", rarity: "legendary", attack: 26, color: "#7a6cf2", glow: "rgba(122,108,242,0.5)", reach: 78, cooldown: 0.26, style: "dagger", weaponType: "dagger" },
  // === MAGIER · Zauberstab-Leiter ===
  apprentice_staff: { name: "Lehrlingsstab", icon: "🪄", type: "weapon", rarity: "common", attack: 4, color: "#9ee7ff", glow: "rgba(85,215,255,0.32)", reach: 360, cooldown: 0.62, style: "staff", weaponType: "staff", projectile: { speed: 520, color: "#9ee7ff", glow: "rgba(85,215,255,0.55)" } },
  crystal_staff: { name: "Kristallstab", icon: "🪄", type: "weapon", rarity: "rare", attack: 10, color: "#7dd3fc", glow: "rgba(125,211,252,0.4)", reach: 380, cooldown: 0.58, style: "staff", weaponType: "staff", projectile: { speed: 560, color: "#7dd3fc", glow: "rgba(125,211,252,0.6)" } },
  rune_staff: { name: "Runenstab", icon: "🪄", type: "weapon", rarity: "epic", attack: 19, color: "#c084fc", glow: "rgba(192,132,252,0.42)", reach: 400, cooldown: 0.54, style: "staff", weaponType: "staff", projectile: { speed: 600, color: "#c084fc", glow: "rgba(192,132,252,0.6)" } },
  storm_scepter: { name: "Sturmzepter", icon: "🪄", type: "weapon", rarity: "legendary", attack: 27, color: "#fde047", glow: "rgba(253,224,71,0.5)", reach: 430, cooldown: 0.50, style: "staff", weaponType: "staff", projectile: { speed: 660, color: "#fde047", glow: "rgba(253,224,71,0.65)" } },
  // === DRUIDIN · Naturstab-Leiter ===
  sprout_staff: { name: "Spross-Stab", icon: "🌿", type: "weapon", rarity: "common", attack: 4, color: "#a3e635", glow: "rgba(163,230,53,0.32)", reach: 340, cooldown: 0.60, style: "staff", weaponType: "naturestaff", projectile: { speed: 500, color: "#a3e635", glow: "rgba(163,230,53,0.55)" } },
  oak_staff: { name: "Eichenstab", icon: "🌿", type: "weapon", rarity: "rare", attack: 9, color: "#65a30d", glow: "rgba(101,163,13,0.4)", reach: 360, cooldown: 0.56, style: "staff", weaponType: "naturestaff", projectile: { speed: 540, color: "#65a30d", glow: "rgba(101,163,13,0.6)" } },
  thorn_staff: { name: "Dornenstab", icon: "🌿", type: "weapon", rarity: "epic", attack: 18, color: "#16a34a", glow: "rgba(22,163,74,0.42)", reach: 380, cooldown: 0.52, style: "staff", weaponType: "naturestaff", projectile: { speed: 580, color: "#16a34a", glow: "rgba(22,163,74,0.6)" } },
  worldtree_staff: { name: "Weltenwurzel", icon: "🌳", type: "weapon", rarity: "legendary", attack: 26, color: "#84cc16", glow: "rgba(132,204,22,0.5)", reach: 410, cooldown: 0.48, style: "staff", weaponType: "naturestaff", projectile: { speed: 620, color: "#84cc16", glow: "rgba(132,204,22,0.65)" }, signature: "worldtree" },
  // === LYRA · Polstange-Leiter ===
  dancer_pole: { name: "Tanzstange", icon: "💃", type: "weapon", rarity: "common", attack: 5, color: "#ec4899", glow: "rgba(236,72,153,0.40)", reach: 88, cooldown: 0.40, style: "pole", weaponType: "pole" },
  silk_pole: { name: "Seiden-Stange", icon: "💃", type: "weapon", rarity: "rare", attack: 10, color: "#f472b6", glow: "rgba(244,114,182,0.4)", reach: 94, cooldown: 0.36, style: "pole", weaponType: "pole" },
  rose_pole: { name: "Rosen-Stange", icon: "🌹", type: "weapon", rarity: "epic", attack: 19, color: "#db2777", glow: "rgba(219,39,119,0.42)", reach: 100, cooldown: 0.32, style: "pole", weaponType: "pole" },
  heartbreaker: { name: "Herzbrecher", icon: "💔", type: "weapon", rarity: "legendary", attack: 27, color: "#f5d042", glow: "rgba(245,208,66,0.5)", reach: 106, cooldown: 0.30, style: "pole", weaponType: "pole", signature: "heartbreaker" },
  // === Allround / neutral ===
  metin_glaive: { name: "Metin-Gleve", icon: "⚔", type: "weapon", rarity: "rare", attack: 14, color: "#55d7ff", glow: "rgba(85,215,255,0.36)", reach: 108, cooldown: 0.36, style: "sword", weaponType: "sword" },
  storm_saber: { name: "Sturmsaebel", icon: "⚡", type: "weapon", rarity: "epic", attack: 17, color: "#f4c95d", glow: "rgba(244,201,93,0.42)", reach: 102, cooldown: 0.28, style: "sword", weaponType: "sword" },
  // === SIGNATUR-WAFFEN (legendaer, je 1 pro Klasse, mit aktivem Effekt) ===
  earthsplitter: { name: "Erdspalter", icon: "⚔", type: "weapon", rarity: "legendary", attack: 30, color: "#f59e0b", glow: "rgba(245,158,11,0.55)", reach: 120, cooldown: 0.40, style: "sword", weaponType: "sword", signature: "earthsplitter" },
  shadowbite: { name: "Schattenbiss", icon: "🗡", type: "weapon", rarity: "legendary", attack: 27, color: "#6f63ff", glow: "rgba(111,99,255,0.55)", reach: 76, cooldown: 0.26, style: "dagger", weaponType: "dagger", signature: "shadowbite" },
  tempest_rod: { name: "Sturmrute", icon: "🪄", type: "weapon", rarity: "legendary", attack: 28, color: "#22d3ee", glow: "rgba(34,211,238,0.55)", reach: 420, cooldown: 0.50, style: "staff", weaponType: "staff", projectile: { speed: 660, color: "#22d3ee", glow: "rgba(34,211,238,0.65)" }, signature: "tempest" },
  // === LEDER (leder): wenig Verteidigung, +Tempo, +Ausweichen — fuer Schatten/Druidin ===
  leather_armor: { name: "Lederweste", icon: "🦊", type: "armor", rarity: "common", defense: 4, color: "#a98056", armorType: "leder" },
  hunter_leather: { name: "Jaeger-Leder", icon: "🦊", type: "armor", rarity: "rare", defense: 8, color: "#84a665", armorType: "leder" },
  shadow_leather: { name: "Schatten-Leder", icon: "🦊", type: "armor", rarity: "epic", defense: 14, color: "#6f63ff", armorType: "leder" },
  // === LEICHT (leicht): ausgewogen — fuer Magier/Lyra ===
  iron_armor: { name: "Eisenharnisch", icon: "🛡", type: "armor", rarity: "rare", defense: 9, color: "#9ee7ff", armorType: "leicht" },
  mage_robe: { name: "Magier-Robe", icon: "🥋", type: "armor", rarity: "common", defense: 5, color: "#7dd3fc", armorType: "leicht" },
  silk_garb: { name: "Seiden-Gewand", icon: "🥋", type: "armor", rarity: "epic", defense: 15, color: "#ec4899", armorType: "leicht" },
  // === SCHWER (schwer): viel Verteidigung, -Tempo — fuer Krieger ===
  steel_armor: { name: "Stahlpanzer", icon: "⚙", type: "armor", rarity: "epic", defense: 16, color: "#c084fc", armorType: "schwer" },
  knight_plate: { name: "Ritter-Panzer", icon: "⚙", type: "armor", rarity: "rare", defense: 12, color: "#94a3b8", armorType: "schwer" },
  dragon_plate: { name: "Drachenplatte", icon: "🐉", type: "armor", rarity: "legendary", defense: 26, color: "#fff2a8", armorType: "schwer" },
  metin_shard: { name: "Metin-Splitter", icon: "✦", type: "material", rarity: "rare", color: "#9ee7ff" },
  pugna_core: { name: "Pugna-Kern", icon: "◉", type: "material", rarity: "epic", color: "#c084fc" },
  gem: { name: "Kristall", icon: "◆", type: "material", rarity: "rare", color: "#7dd3fc" },
  // Welt-spezifische Spezial-Steine: Schmied-Material das Bruchchance reduziert
  frost_core: { name: "Frost-Kern", icon: "❄", type: "material", rarity: "epic", color: "#bae6fd", breakReduce: 0.20, source: "frostwastes" },
  ember_spark: { name: "Glut-Funke", icon: "🔥", type: "material", rarity: "epic", color: "#fb923c", breakReduce: 0.18, source: "emberforge" },
  shadow_essence: { name: "Schatten-Essenz", icon: "☘", type: "material", rarity: "epic", color: "#84a665", breakReduce: 0.16, source: "shadowfen" },
  sky_shard: { name: "Sturm-Splitter", icon: "⚡", type: "material", rarity: "epic", color: "#ddd6fe", breakReduce: 0.22, source: "skyspire" },
  tide_pearl: { name: "Tide-Perle", icon: "💧", type: "material", rarity: "epic", color: "#22d3ee", breakReduce: 0.25, source: "tideklippen" },
  // Legendäres Upgrade-Material: nur von Bossen + Metin-Steinen höherer Welten
  ancient_relic: { name: "Uraltes Relikt", icon: "🏆", type: "material", rarity: "legendary", color: "#fde047" },
};

// === Runen als Items generieren (type × tier) ===
for (const [typeKey, t] of Object.entries(runeTypes)) {
  for (const [tierKey, ti] of Object.entries(runeTiers)) {
    const id = runeId(typeKey, tierKey);
    itemDefs[id] = {
      name: `${ti.mark} ${ti.label}er ${t.label}`,
      icon: t.icon,
      type: "rune",
      rarity: tierKey === "perfekt" ? "legendary" : tierKey === "strahlend" ? "epic" : tierKey === "klar" ? "rare" : "common",
      color: t.color,
      runeType: typeKey,
      runeTier: tierKey,
    };
  }
}

// === Signatur-Effekt-Beschreibungen (fuer Tooltips) ===
export const signatureDefs = {
  earthsplitter: { name: "Erdspalter", desc: "Jeder 3. Schlag entfesselt eine Schockwelle." },
  shadowbite: { name: "Schattenbiss", desc: "Crits teleportieren dich hinter das Ziel." },
  tempest: { name: "Sturmrute", desc: "Auto-Attacks ketten zu einem 2. Gegner." },
  worldtree: { name: "Weltenwurzel", desc: "Wurzeln breiten sich auf benachbarte Gegner aus." },
  heartbreaker: { name: "Herzbrecher", desc: "Charme springt beim Tod auf den naechsten Mob ueber." },
};

export const typeBadges = {
  weapon: "⚔",
  armor: "🛡",
  potion: "🧪",
  material: "✦",
  rune: "💎",
};

export const rarityLabels = {
  common: "Gewöhnlich",
  rare: "Selten",
  epic: "Episch",
  legendary: "Legendär",
};

// Sockel-Anzahl einer Waffen-Instanz (aus Rarität)
export function weaponSocketCount(invItem) {
  if (!invItem) return 0;
  const def = itemDefs[invItem.id];
  if (!def || def.type !== "weapon") return 0;
  return { common: 0, rare: 1, epic: 2, legendary: 3 }[def.rarity] || 0;
}

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
