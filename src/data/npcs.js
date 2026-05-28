// Hub-NPCs in Pugna-Wiesen.
// Jeder hat eine Funktion und ein eigenes Aussehen.

export const npcs = [
  {
    id: "trader",
    name: "Haendlerin Mara",
    role: "Handel",
    hint: "Kauft Material, verkauft Traenke und Rüstung.",
    x: 980, y: 720,
    r: 36,
    colors: { head: "#fde68a", body: "#a16207", arms: "#fed7aa", legs: "#52320b" },
    accent: "hood",
    accentColor: "#854d0e",
    interactKey: "G",
    overlayId: "traderOverlay",
  },
  {
    id: "trainer",
    name: "Meisterin Kael",
    role: "Talente",
    hint: "Kostenloser Talent-Reset alle 5 Minuten.",
    x: 1460, y: 820,
    r: 36,
    colors: { head: "#bfdbfe", body: "#1e40af", arms: "#3b82f6", legs: "#172554" },
    accent: "wizard-hat",
    accentColor: "#60a5fa",
    interactKey: "H",
    overlayId: "trainerOverlay",
  },
  {
    id: "courier",
    name: "Kurier Sven",
    role: "Aufträge",
    hint: "Tägliche Quest gegen Belohnung.",
    x: 1080, y: 920,
    r: 34,
    colors: { head: "#fde68a", body: "#15803d", arms: "#22c55e", legs: "#14532d" },
    accent: "hood",
    accentColor: "#166534",
    interactKey: "J",
    overlayId: "courierOverlay",
  },
  {
    id: "gambler",
    name: "Glücksspiel-Gunter",
    role: "Glücksspiel",
    hint: "Wirf Trash rein — je mehr Wert, desto höher die Chance auf was Gutes!",
    x: 1320, y: 700,
    r: 36,
    colors: { head: "#fde68a", body: "#7c3aed", arms: "#a855f7", legs: "#4c1d95" },
    accent: "wizard-hat",
    accentColor: "#fbbf24",
    interactKey: "K",
    overlayId: "gambleOverlay",
  },
];

export const shopItems = [
  { id: "health_potion", price: 18, label: "Roter Trank" },
  { id: "metin_shard", price: 35, label: "Metin-Splitter" },
  { id: "leather_armor", price: 120, label: "Lederweste" },
  { id: "iron_blade", price: 280, label: "Eisenklinge (zufällige Affixe)" },
];

export const sellPrices = {
  health_potion: 6,
  metin_shard: 12,
  gem: 24,
  pugna_core: 60,
  frost_core: 80,
  ember_spark: 80,
  shadow_essence: 80,
  sky_shard: 90,
  rust_sword: 8,
  twin_daggers: 8,
  apprentice_staff: 8,
  iron_blade: 80,
  metin_glaive: 140,
  pugna_cleaver: 220,
  storm_saber: 200,
  fullmoon_sickle: 380,
  leather_armor: 30,
  iron_armor: 90,
  steel_armor: 180,
  dragon_plate: 320,
  leather_boots: 20,
  swift_boots: 70,
  shadow_steps: 160,
  windwalkers: 340,
  leather_cap: 22,
  iron_helm: 75,
  arcane_circlet: 170,
  crown_of_kings: 360,
};

// Tägliche Quests — werden gewürfelt
export const dailyQuests = [
  { id: "hunt_frost", goal: { type: "kill", world: "frostwastes", count: 12 }, reward: { gold: 180, item: "frost_core", count: 1 }, desc: "Töte 12 Mobs in den Frost-Öden." },
  { id: "hunt_ember", goal: { type: "kill", world: "emberforge", count: 12 }, reward: { gold: 200, item: "ember_spark", count: 1 }, desc: "Töte 12 Mobs in der Glut-Schmiede." },
  { id: "stone_break", goal: { type: "stone", count: 2 }, reward: { gold: 240, item: "pugna_core", count: 2 }, desc: "Zerstöre 2 Metin-Steine (egal wo)." },
  { id: "level_up", goal: { type: "level", count: 1 }, reward: { gold: 150, item: "gem", count: 3 }, desc: "Steige 1 Level auf." },
];

export function getNpcById(id) {
  return npcs.find((n) => n.id === id);
}
