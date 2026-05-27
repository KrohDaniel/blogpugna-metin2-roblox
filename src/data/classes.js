export const DEFAULT_CLASS_ID = "warrior";

export const classDefs = {
  warrior: {
    id: "warrior",
    name: "Krieger",
    role: "Tank / Kontrolle",
    fantasy: "Steht vorne, bindet Gegner und oeffnet sichere Fenster fuer Team-Schaden.",
    color: "#d94b3d",
    accent: "#f4c95d",
    stats: {
      maxHp: 190,
      speed: 215,
      baseAttack: 9,
      attackBonus: 3,
      armorLevel: 3,
      hpPerLevel: 18,
      attackPerLevel: 1.6,
    },
    weaponStyle: "sword",
    starterWeapon: "rust_sword",
    bodyAccent: "horned-helm",
    bars: { leben: 10, schaden: 6, tempo: 4, team: 9 },
    abilities: ["shieldBash", "whirlwind", "earthquake"],
    passive: {
      name: "Eisenhaut",
      text: "Weniger eingehender Schaden, wenn mehrere Gegner nah an dir sind.",
    },
  },
  shadow: {
    id: "shadow",
    name: "Schattenlaeufer",
    role: "Burst / Mobilitaet",
    fantasy: "Springt in Luecken, markiert Ziele und bestraft betaeubte Gegner.",
    color: "#6f63ff",
    accent: "#35d0a4",
    stats: {
      maxHp: 95,
      speed: 320,
      baseAttack: 13,
      attackBonus: 3,
      armorLevel: 0,
      hpPerLevel: 10,
      attackPerLevel: 2.0,
    },
    weaponStyle: "dagger",
    starterWeapon: "twin_daggers",
    bodyAccent: "hood",
    bars: { leben: 4, schaden: 10, tempo: 10, team: 6 },
    abilities: ["shadowStep", "poisonMark", "shadowStorm"],
    passive: {
      name: "Rueckenjaeger",
      text: "Mehr Schaden gegen markierte, betaeubte oder geschwaechte Ziele.",
    },
  },
  runemage: {
    id: "runemage",
    name: "Runenmagier",
    role: "AoE / Support",
    fantasy: "Kontrolliert Flaechen, detoniert Marken und schuetzt kurze Team-Momente.",
    color: "#2aa66f",
    accent: "#f2d06b",
    stats: {
      maxHp: 125,
      speed: 250,
      baseAttack: 8,
      attackBonus: 4,
      armorLevel: 1,
      hpPerLevel: 13,
      attackPerLevel: 1.8,
    },
    weaponStyle: "staff",
    starterWeapon: "apprentice_staff",
    bodyAccent: "wizard-hat",
    bars: { leben: 5, schaden: 8, tempo: 5, team: 10 },
    abilities: ["fireOrb", "frostCircle", "meteor"],
    passive: {
      name: "Runenfluss",
      text: "Skills laden etwas schneller, wenn du Gegner auf Abstand haeltst.",
    },
  },
};

export function getClassDef(classId) {
  return classDefs[classId] || classDefs[DEFAULT_CLASS_ID];
}
