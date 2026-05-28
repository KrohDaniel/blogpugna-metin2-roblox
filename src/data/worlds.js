// Welt-Konzepte für Blocpugna
// Jede Welt: eigenes Theme (Bodenfarbe, Stimmung), Mob-Pool, empfohlenes Level.
// Erreichbar über Portale an den Rand-Kanten der Start-Welt.

export const worldDefs = {
  meadows: {
    id: "meadows",
    name: "Pugna-Wiesen",
    subtitle: "Weite Heimatregion — friedlich, ein paar passive Kreaturen",
    levelRange: [1, 3],
    size: { w: 3600, h: 2400 },
    ground: "#2f4630",
    groundAccent: "rgba(255,255,255,0.05)",
    fog: "rgba(78,91,55,0.4)",
    safeZone: true,
    passiveMobs: { count: 7, mobsOnly: true },
    portals: {
      north: { to: "frostwastes", label: "Frost-Oeden" },
      east: { to: "emberforge", label: "Glut-Schmiede" },
      south: { to: "shadowfen", label: "Schattensumpf" },
      west: { to: "skyspire", label: "Himmelsturm" },
    },
    mobPalette: { mob: "#b34d54", elite: "#c084fc", boss: "#d946ef" },
  },
  frostwastes: {
    id: "frostwastes",
    name: "Frost-Oeden",
    subtitle: "eisig, weite Sicht, langsame Mobs mit hohem Schaden",
    levelRange: [6, 15],
    ground: "#1f3a4a",
    groundAccent: "rgba(180,210,240,0.08)",
    fog: "rgba(140,180,210,0.18)",
    portals: { south: { to: "meadows", label: "Pugna-Wiesen" }, east: { to: "frost_raid", label: "Eisbrecher-Raid (Lv18+)" } },
    mobPalette: { mob: "#7dd3fc", elite: "#9ee7ff", boss: "#bae6fd" },
    mobModifiers: { speedMult: 0.75, damageMult: 1.4, hpMult: 1.2, status: "frozen-aura" },
    flavor: "Frost-Mobs hinterlassen kurze Frost-Pfützen die dich verlangsamen.",
  },
  emberforge: {
    id: "emberforge",
    name: "Glut-Schmiede",
    subtitle: "Lava-Klippen, Feuer-Cultisten, dichte Wellen",
    levelRange: [10, 22],
    ground: "#3a1a18",
    groundAccent: "rgba(255,140,60,0.12)",
    fog: "rgba(255,80,40,0.22)",
    portals: { west: { to: "meadows", label: "Pugna-Wiesen" } },
    mobPalette: { mob: "#ff7a3d", elite: "#ff9540", boss: "#ffd86b" },
    mobModifiers: { speedMult: 1.15, damageMult: 1.25, hpMult: 1.1, status: "burning-aura" },
    flavor: "Eliten zünden DoT-Felder. Hier droppen mehr Pugna-Kerne.",
  },
  shadowfen: {
    id: "shadowfen",
    name: "Schattensumpf",
    subtitle: "schlecht beleuchtet, getarnte Gegner, Gift",
    levelRange: [14, 26],
    ground: "#1a2418",
    groundAccent: "rgba(80,150,80,0.08)",
    fog: "rgba(40,60,30,0.42)",
    portals: { north: { to: "meadows", label: "Pugna-Wiesen" }, east: { to: "tideklippen", label: "Tide-Klippen" } },
    mobPalette: { mob: "#65a82c", elite: "#83b95c", boss: "#a9d18e" },
    mobModifiers: { speedMult: 0.95, damageMult: 1.2, hpMult: 1.35, status: "poison-aura" },
    flavor: "Sichtreichweite reduziert. Mehr Gift-Eliten. Bessere Affix-Chancen.",
  },
  tideklippen: {
    id: "tideklippen",
    name: "Tide-Klippen",
    subtitle: "Sturm-gepeitschte Küste, Welt-Boss: Leviathan",
    levelRange: [18, 30],
    ground: "#0d2434",
    groundAccent: "rgba(70, 180, 220, 0.10)",
    fog: "rgba(40, 90, 130, 0.32)",
    portals: { west: { to: "shadowfen", label: "Schattensumpf" } },
    mobPalette: { mob: "#22d3ee", elite: "#67e8f9", boss: "#0ea5e9" },
    mobModifiers: { speedMult: 1.10, damageMult: 1.30, hpMult: 1.20, status: "wet-aura" },
    flavor: "Regen + Blitze. Tide-Mobs treffen hart, wenn man auf nassen Steinen steht.",
  },
  skyspire: {
    id: "skyspire",
    name: "Himmelsturm",
    subtitle: "schmale Plattformen, fliegende Mobs, mehr Loot",
    levelRange: [20, 35],
    ground: "#1f2235",
    groundAccent: "rgba(150,170,255,0.08)",
    fog: "rgba(120,140,220,0.18)",
    portals: { east: { to: "meadows", label: "Pugna-Wiesen" } },
    mobPalette: { mob: "#c4b8ff", elite: "#a695ff", boss: "#7a6cf2" },
    mobModifiers: { speedMult: 1.25, damageMult: 1.5, hpMult: 0.85, status: "shock-aura" },
    flavor: "Mobs sind schnell und fragil. Wer überlebt droppt epischen Loot.",
  },
};

// Arena ist eine separate Welt fuer PvP-Bot-Matches: kein Mob-Spawn, zentraler Stein im Race-Modus.
worldDefs.arena = {
  id: "arena",
  name: "Duell-Arena",
  subtitle: "PvP-Trainingsplatz",
  levelRange: [1, 99],
  ground: "#1c1c25",
  groundAccent: "rgba(255,255,255,0.04)",
  fog: "rgba(70,70,90,0.18)",
  portals: {},
  mobPalette: {},
  noWildMobs: true,
  arena: true,
  flavor: "Geschlossene Plattform fuer 1v1-Duelle und Metin-Rennen gegen Bots.",
};

// Eisbrecher-Raid: langer Korridor, Flucht vor der Lawine. Kein wildes Spawnen — die
// Raid-Logik steuert Blockaden + Boss. Rueckweg ueber West-Portal (Abbruch).
worldDefs.frost_raid = {
  id: "frost_raid",
  name: "Eisbrecher-Tunnel",
  subtitle: "RAID: Flucht vor der Lawine — räum die Blockaden, erreiche den Frost-Wyrm",
  levelRange: [18, 22],
  size: { w: 4900, h: 1000 },
  ground: "#16384a",
  groundAccent: "rgba(180,210,240,0.12)",
  fog: "rgba(150,190,220,0.20)",
  portals: { west: { to: "frostwastes", label: "Zurück (Abbruch)" } },
  mobPalette: { mob: "#7dd3fc", elite: "#9ee7ff", boss: "#bae6fd" },
  mobModifiers: { speedMult: 0.9, damageMult: 1.5, hpMult: 1.4, status: "frozen-aura" },
  noWildMobs: true,
  raid: true,
  flavor: "Renne nach rechts. Eis-Blockaden zwingen dich zum Kampf — und die Lawine wartet nicht.",
};

export function getWorldDef(worldId) {
  return worldDefs[worldId] || worldDefs.meadows;
}

export const PORTAL_EDGE_THRESHOLD = 80; // wie nah am Rand muss man sein

export const stoneStyles = {
  meadows: { name: "Pugna-Stein", core: "#4bb7d9", shine: "#86efff", facets: "#1e567a", shape: "shard" },
  frostwastes: { name: "Eis-Monolith", core: "#bae6fd", shine: "#f0f9ff", facets: "#1e3a5f", shape: "crystal" },
  emberforge: { name: "Glut-Brocken", core: "#fb923c", shine: "#fed7aa", facets: "#7c2d12", shape: "molten" },
  shadowfen: { name: "Moos-Idol", core: "#84a665", shine: "#bbf7a0", facets: "#1d3018", shape: "totem" },
  skyspire: { name: "Sturm-Splitter", core: "#c4b5fd", shine: "#ddd6fe", facets: "#3b0764", shape: "spire" },
  tideklippen: { name: "Tide-Säule", core: "#22d3ee", shine: "#a5f3fc", facets: "#0e7490", shape: "spire" },
};

export function getStoneStyle(worldId) {
  return stoneStyles[worldId] || stoneStyles.meadows;
}

export const portalColors = {
  meadows: "#86efac",
  frostwastes: "#bae6fd",
  emberforge: "#fb923c",
  shadowfen: "#84a665",
  skyspire: "#c4b5fd",
  tideklippen: "#22d3ee",
  arena: "#7a6cf2",
};

export function getPortalColor(worldId) {
  return portalColors[worldId] || "#a695ff";
}

export const weatherStyles = {
  meadows: { type: "pollen", color: "#fff2a8", count: 30, speed: 22, direction: 0.6 },
  frostwastes: { type: "snow", color: "#e0f2fe", count: 80, speed: 70, direction: 0.4 },
  emberforge: { type: "ash", color: "#fb923c", count: 60, speed: -40, direction: -0.3 },
  shadowfen: { type: "firefly", color: "#bbf7a0", count: 40, speed: 0, direction: 0 },
  skyspire: { type: "wind", color: "#ddd6fe", count: 50, speed: 180, direction: 0 },
  tideklippen: { type: "rain", color: "#67e8f9", count: 120, speed: 320, direction: 0.2 },
  arena: null,
};

export function getWeather(worldId) {
  return weatherStyles[worldId];
}
