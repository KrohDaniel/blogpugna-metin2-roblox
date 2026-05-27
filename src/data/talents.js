// Skill-Tree: 5 Knoten pro Klasse, jeweils 0-3 Punkte
// Effekt-Keys werden in main.js zu Modifiern aggregiert.

export const talentTrees = {
  warrior: [
    { id: "w_hp", name: "Eiserne Brust", desc: "+12 max HP pro Punkt", max: 3, effect: "maxHpBonus", per: 12, icon: "❤" },
    { id: "w_atk", name: "Schwerthieb", desc: "+1.5 Angriff pro Punkt", max: 3, effect: "attackBonusFlat", per: 1.5, icon: "⚔" },
    { id: "w_def", name: "Stein-Haut", desc: "+1 Rüstung pro Punkt", max: 3, effect: "armorBonus", per: 1, icon: "🛡" },
    { id: "w_cdr", name: "Kampf-Trance", desc: "+4% CDR pro Punkt", max: 3, effect: "cdrBonus", per: 0.04, icon: "⏱" },
    { id: "w_ls", name: "Blutdurst", desc: "+3% Lifesteal pro Punkt", max: 3, effect: "lifestealBonus", per: 0.03, icon: "🩸" },
  ],
  shadow: [
    { id: "s_crit", name: "Tödlicher Blick", desc: "+5% Crit pro Punkt", max: 3, effect: "critBonus", per: 0.05, icon: "🎯" },
    { id: "s_atk", name: "Klingenrausch", desc: "+2 Angriff pro Punkt", max: 3, effect: "attackBonusFlat", per: 2, icon: "🗡" },
    { id: "s_speed", name: "Wind-Schritt", desc: "+6% Tempo pro Punkt", max: 3, effect: "speedBonus", per: 0.06, icon: "💨" },
    { id: "s_cdr", name: "Schatten-Fluss", desc: "+4% CDR pro Punkt", max: 3, effect: "cdrBonus", per: 0.04, icon: "⏱" },
    { id: "s_ls", name: "Vampirklinge", desc: "+4% Lifesteal pro Punkt", max: 3, effect: "lifestealBonus", per: 0.04, icon: "🩸" },
  ],
  runemage: [
    { id: "m_atk", name: "Arkane Macht", desc: "+1.5 Angriff pro Punkt", max: 3, effect: "attackBonusFlat", per: 1.5, icon: "✨" },
    { id: "m_pierce", name: "Durchbohrend", desc: "+1 Stab-Pierce pro Punkt", max: 3, effect: "piercebonus", per: 1, icon: "➳" },
    { id: "m_cdr", name: "Rune-Fluss", desc: "+5% CDR pro Punkt", max: 3, effect: "cdrBonus", per: 0.05, icon: "⏱" },
    { id: "m_hp", name: "Mana-Schild", desc: "+10 max HP pro Punkt", max: 3, effect: "maxHpBonus", per: 10, icon: "❤" },
    { id: "m_crit", name: "Arkaner Crit", desc: "+4% Crit pro Punkt", max: 3, effect: "critBonus", per: 0.04, icon: "🎯" },
  ],
};

export function getTalentTree(classId) {
  return talentTrees[classId] || [];
}
