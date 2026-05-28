// Runen-System: Steine droppen Runen, Runen werden in Waffen-Sockel gesetzt.
// Sockel-Anzahl ergibt sich aus Waffen-Raritaet (common 0, rare 1, epic 2, legendary 3).

// 4 Wertigkeiten (Tiers) — Multiplikator auf den Basis-Wert der Rune
export const runeTiers = {
  rissig:    { label: "Rissig",    mult: 1,   color: "#94a3b8", mark: "◇" },
  klar:      { label: "Klar",      mult: 2,   color: "#60a5fa", mark: "◆" },
  strahlend: { label: "Strahlend", mult: 3.5, color: "#c084fc", mark: "✦" },
  perfekt:   { label: "Perfekt",   mult: 5,   color: "#fde047", mark: "★" },
};

export const tierOrder = ["rissig", "klar", "strahlend", "perfekt"];

// 6 Runen-Typen. base = Wert bei Tier "rissig" (×mult fuer hoehere Tiers).
// stat-Schluessel werden in main.js auf Spieler-Boni gemappt.
export const runeTypes = {
  ruby:     { label: "Rubin",    icon: "🔴", stat: "flatAttack",   base: 3,    suffix: "",  color: "#ef4444", desc: "+Angriff" },
  sapphire: { label: "Saphir",   icon: "🔵", stat: "crit",         base: 0.03, suffix: "%", color: "#3b82f6", desc: "+Crit-Chance" },
  emerald:  { label: "Smaragd",  icon: "🟢", stat: "lifesteal",    base: 0.02, suffix: "%", color: "#22c55e", desc: "+Lebensraub" },
  topaz:    { label: "Topas",    icon: "🟡", stat: "cdr",          base: 0.03, suffix: "%", color: "#eab308", desc: "-Cooldown" },
  amethyst: { label: "Amethyst", icon: "🟣", stat: "skillDamage",  base: 0.04, suffix: "%", color: "#a855f7", desc: "+Skill-Schaden" },
  diamond:  { label: "Diamant",  icon: "⚪", stat: "allStats",     base: 0.015,suffix: "%", color: "#e5e7eb", desc: "+Alle Werte" },
};

// Rune-Item-ID Format: rune_<type>_<tier>  (z.B. rune_ruby_klar)
export function runeId(type, tier) { return `rune_${type}_${tier}`; }

export function parseRune(id) {
  if (!id || !id.startsWith("rune_")) return null;
  const [, type, tier] = id.split("_");
  if (!runeTypes[type] || !runeTiers[tier]) return null;
  return { type, tier, def: runeTypes[type], tierDef: runeTiers[tier] };
}

// Wirkwert einer Rune (base × tier-mult)
export function runeValue(type, tier) {
  const t = runeTypes[type];
  const ti = runeTiers[tier];
  if (!t || !ti) return 0;
  return t.base * ti.mult;
}

export function runeLabel(id) {
  const r = parseRune(id);
  if (!r) return id;
  return `${r.tierDef.mark} ${r.tierDef.label}er ${r.def.label}`;
}

export function runeColor(id) {
  const r = parseRune(id);
  return r ? r.def.color : "#94a3b8";
}

// Anzahl Sockel je Waffen-Raritaet
export function socketCountForRarity(rarity) {
  return { common: 0, rare: 1, epic: 2, legendary: 3 }[rarity] || 0;
}

// ===== RUNEN-WÖRTER =====
// Bestimmte Typ-Kombinationen (in beliebiger Reihenfolge, ab Mindest-Tier)
// schalten einen benannten Bonus frei — zusaetzlich zu den Einzel-Runen.
// "types" = sortierte Typ-Liste, minTier = Mindest-Wertigkeit ALLER Runen.
export const runeWords = [
  {
    id: "berserker",
    name: "Berserker",
    types: ["ruby", "sapphire", "topaz"],
    minTier: "klar",
    desc: "Unter 30% HP: +40% Schaden & +20% Tempo.",
    effect: { lowHpDamage: 0.40, lowHpSpeed: 0.20 },
    color: "#ef4444",
  },
  {
    id: "lifewell",
    name: "Lebensquell",
    types: ["emerald", "emerald", "diamond"],
    minTier: "klar",
    desc: "Alle Treffer heilen zusaetzlich 8% des Schadens.",
    effect: { bonusLifesteal: 0.08 },
    color: "#22c55e",
  },
  {
    id: "arcane_surge",
    name: "Arkane Flut",
    types: ["amethyst", "amethyst", "topaz"],
    minTier: "klar",
    desc: "+25% Skill-Schaden, Skills laden 15% schneller.",
    effect: { skillDamage: 0.25, cdr: 0.15 },
    color: "#a855f7",
  },
  {
    id: "assassin",
    name: "Meuchler",
    types: ["sapphire", "sapphire", "ruby"],
    minTier: "klar",
    desc: "Crits machen +50% Schaden.",
    effect: { critMult: 0.50 },
    color: "#3b82f6",
  },
  {
    id: "fortress",
    name: "Bollwerk",
    types: ["diamond", "diamond", "diamond"],
    minTier: "klar",
    desc: "+15% maxHP und -15% erlittener Schaden.",
    effect: { maxHpPct: 0.15, damageReduction: 0.15 },
    color: "#e5e7eb",
  },
  {
    id: "vampire",
    name: "Blutfuerst",
    types: ["emerald", "ruby", "sapphire"],
    minTier: "strahlend",
    desc: "+30% Schaden, +12% Lebensraub. Kills heilen voll.",
    effect: { flatDamagePct: 0.30, bonusLifesteal: 0.12, killHeal: true },
    color: "#dc2626",
  },
];

// Prueft welches Runen-Wort von einem Sockel-Array (Array von Rune-IDs) erfuellt wird.
export function activeRuneWord(socketIds) {
  const runes = (socketIds || []).map(parseRune).filter(Boolean);
  if (runes.length < 3) return null;
  const types = runes.map((r) => r.type).sort();
  for (const word of runeWords) {
    const need = [...word.types].sort();
    if (need.length !== types.length) continue;
    const matches = need.every((t, i) => t === types[i]);
    if (!matches) continue;
    // Mindest-Tier pruefen
    const minIdx = tierOrder.indexOf(word.minTier);
    const allMeet = runes.every((r) => tierOrder.indexOf(r.tier) >= minIdx);
    if (allMeet) return word;
  }
  return null;
}
