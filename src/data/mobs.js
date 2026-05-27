// Welt-spezifische Mob-Pools mit eigenem Look und Namen.
// Jeder Eintrag definiert wie drawBlockPerson die Figur faerbt + welche Form sie hat.

export const mobPools = {
  meadows: {
    mob: [
      { name: "Schattenklotz", head: "#b34d54", body: "#5b2229", arms: "#7f2f37", legs: "#242936", accent: null, shape: "humanoid" },
      { name: "Wiesen-Wicht", head: "#a08c4e", body: "#4c4424", arms: "#6e6235", legs: "#2b2a18", accent: null, shape: "humanoid" },
    ],
    elite: [
      { name: "Pugna-Wache", head: "#c084fc", body: "#65358f", arms: "#8b5cc0", legs: "#2a1e3a", accent: "horned-helm", accentColor: "#d8b4fe", shape: "humanoid" },
    ],
  },
  frostwastes: {
    mob: [
      { name: "Frost-Wolf", head: "#bae6fd", body: "#4a6987", arms: "#5c7ea0", legs: "#1e2f44", accent: null, shape: "quad" },
      { name: "Eis-Klotz", head: "#e0f2fe", body: "#3b5f8a", arms: "#5781b0", legs: "#1a2b48", accent: null, shape: "humanoid" },
    ],
    elite: [
      { name: "Frost-Schamane", head: "#cdebff", body: "#1a3f6b", arms: "#3d6fa3", legs: "#0e1f3a", accent: "wizard-hat", accentColor: "#bae6fd", shape: "humanoid" },
    ],
  },
  emberforge: {
    mob: [
      { name: "Glut-Cultist", head: "#fed7aa", body: "#9a3412", arms: "#c2410c", legs: "#431407", accent: "hood", accentColor: "#7c2d12", shape: "humanoid" },
      { name: "Asche-Imp", head: "#fb923c", body: "#dc2626", arms: "#ea580c", legs: "#3f1414", accent: null, shape: "imp" },
    ],
    elite: [
      { name: "Flammen-Hexer", head: "#fde68a", body: "#b91c1c", arms: "#dc2626", legs: "#3f0808", accent: "wizard-hat", accentColor: "#fb923c", shape: "humanoid" },
    ],
  },
  shadowfen: {
    mob: [
      { name: "Sumpf-Schleimer", head: "#bbf7a0", body: "#4d7c0f", arms: "#3f6212", legs: "#1a2e0a", accent: null, shape: "slime" },
      { name: "Moor-Krieger", head: "#84a665", body: "#365314", arms: "#4d7c0f", legs: "#1c2e10", accent: null, shape: "humanoid" },
    ],
    elite: [
      { name: "Hexen-Druide", head: "#a3b18a", body: "#1d3018", arms: "#3a5a2d", legs: "#0e1c08", accent: "hood", accentColor: "#2d4a1f", shape: "humanoid" },
    ],
  },
  skyspire: {
    mob: [
      { name: "Sky-Schwaermer", head: "#c4b5fd", body: "#5b21b6", arms: "#7c3aed", legs: "#1e1b4b", accent: null, shape: "flyer" },
      { name: "Blitz-Geist", head: "#ddd6fe", body: "#4c1d95", arms: "#6d28d9", legs: "#1e1735", accent: null, shape: "humanoid" },
    ],
    elite: [
      { name: "Sturm-Herold", head: "#ddd6fe", body: "#3b0764", arms: "#5b21b6", legs: "#16113a", accent: "horned-helm", accentColor: "#ddd6fe", shape: "humanoid" },
    ],
  },
};

export function rollMobSkin(worldId, rank) {
  const pool = mobPools[worldId]?.[rank];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
