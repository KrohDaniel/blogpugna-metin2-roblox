// Skill-Tree: Stat-Knoten + Mastery-Knoten die direkt Abilities verstärken.
// Max-Punkte pro Knoten = 5. Bei Level-Up gibt es 1 Punkt — bis Level 40 also volle Auswahl.

export const talentTrees = {
  warrior: [
    // Stat-Knoten
    { id: "w_hp", name: "Eiserne Brust", desc: "+15 max HP pro Punkt", max: 5, effect: "maxHpBonus", per: 15, icon: "❤" },
    { id: "w_atk", name: "Schwerthieb", desc: "+2 Angriff pro Punkt", max: 5, effect: "attackBonusFlat", per: 2, icon: "⚔" },
    { id: "w_def", name: "Stein-Haut", desc: "+1 Rüstung pro Punkt", max: 5, effect: "armorBonus", per: 1, icon: "🛡" },
    { id: "w_ls", name: "Blutdurst", desc: "+3% Lifesteal pro Punkt", max: 5, effect: "lifestealBonus", per: 0.03, icon: "🩸" },
    // Mastery-Knoten (direkt an Abilities)
    { id: "m_shieldbash", name: "Meister: Schildstoss", desc: "+20% Schaden + 0.4s längerer Stun pro Punkt", max: 5, effect: "abilityMastery", target: "shieldBash", icon: "🛡" },
    { id: "m_whirlwind", name: "Meister: Rundumschlag", desc: "+12% Radius + 15% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "whirlwind", icon: "🌀" },
    { id: "m_earthquake", name: "Meister: Erdbeben", desc: "+10% Radius + 20% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "earthquake", icon: "💥" },
  ],
  shadow: [
    // Stat-Knoten
    { id: "s_crit", name: "Tödlicher Blick", desc: "+5% Crit pro Punkt", max: 5, effect: "critBonus", per: 0.05, icon: "🎯" },
    { id: "s_atk", name: "Klingenrausch", desc: "+2 Angriff pro Punkt", max: 5, effect: "attackBonusFlat", per: 2, icon: "🗡" },
    { id: "s_speed", name: "Wind-Schritt", desc: "+5% Tempo pro Punkt", max: 5, effect: "speedBonus", per: 0.05, icon: "💨" },
    { id: "s_ls", name: "Vampirklinge", desc: "+3% Lifesteal pro Punkt", max: 5, effect: "lifestealBonus", per: 0.03, icon: "🩸" },
    // Mastery
    { id: "m_shadowstep", name: "Meister: Nebelschritt", desc: "+40 Range + 5% Heal pro Punkt", max: 5, effect: "abilityMastery", target: "shadowStep", icon: "💨" },
    { id: "m_poisonmark", name: "Meister: Giftmarke", desc: "+1s Gift-Dauer + 10% DoT pro Punkt", max: 5, effect: "abilityMastery", target: "poisonMark", icon: "☠" },
    { id: "m_shadowdouble", name: "Meister: Schatten-Doppel", desc: "+1s Unsichtbarkeit + 15% Detonations-Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "shadowDouble", icon: "👤" },
  ],
  charmer: [
    // Stat-Knoten
    { id: "c_evade", name: "Anmut", desc: "+4% Ausweich-Chance pro Punkt", max: 5, effect: "evadeBonus", per: 0.04, icon: "✨" },
    { id: "c_crit", name: "Stilett-Krit", desc: "+5% Crit pro Punkt", max: 5, effect: "critBonus", per: 0.05, icon: "🎯" },
    { id: "c_speed", name: "Pirouette", desc: "+5% Tempo pro Punkt", max: 5, effect: "speedBonus", per: 0.05, icon: "💨" },
    { id: "c_ls", name: "Bezauberndes Blut", desc: "+3% Lifesteal pro Punkt", max: 5, effect: "lifestealBonus", per: 0.03, icon: "🩸" },
    // Mastery
    { id: "m_polespin", name: "Meister: Wirbelschlag", desc: "+12% Radius + 12% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "poleSpin", icon: "💃" },
    { id: "m_blowkiss", name: "Meister: Luftkuss", desc: "+1s Confusion + 15% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "blowKiss", icon: "💋" },
    { id: "m_charmdance", name: "Meister: Tanz der Verfuehrung", desc: "+30 Radius + 1s Charme pro Punkt", max: 5, effect: "abilityMastery", target: "charmDance", icon: "🌹" },
  ],
  runemage: [
    // Stat-Knoten
    { id: "m_atk", name: "Arkane Macht", desc: "+2 Angriff pro Punkt", max: 5, effect: "attackBonusFlat", per: 2, icon: "✨" },
    { id: "m_pierce", name: "Durchbohrend", desc: "+1 Stab-Pierce pro Punkt", max: 5, effect: "piercebonus", per: 1, icon: "➳" },
    { id: "m_hp", name: "Mana-Schild", desc: "+12 max HP pro Punkt", max: 5, effect: "maxHpBonus", per: 12, icon: "❤" },
    { id: "m_crit", name: "Arkaner Crit", desc: "+4% Crit pro Punkt", max: 5, effect: "critBonus", per: 0.04, icon: "🎯" },
    // Mastery
    { id: "m_fireorb", name: "Meister: Feuerkugel", desc: "+10% Radius + 15% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "fireOrb", icon: "🔥" },
    { id: "m_frostcircle", name: "Meister: Frostkreis", desc: "+1s Slow + 10% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "frostCircle", icon: "❄" },
    { id: "m_meteor", name: "Meister: Meteor", desc: "+10% Radius + 15% Schaden pro Punkt", max: 5, effect: "abilityMastery", target: "meteor", icon: "☄" },
  ],
};

// CDR wandert von Talenten zu Items - Talente skalieren jetzt Abilities direkt
// So vermeidet man Stacking-Probleme und Talente fühlen sich kraftvoller an.

export function getTalentTree(classId) {
  return talentTrees[classId] || [];
}

export function abilityMasteryLevel(talents, abilityId) {
  if (!talents) return 0;
  const tree = Object.values(talentTrees).flat();
  for (const node of tree) {
    if (node.effect === "abilityMastery" && node.target === abilityId) {
      return talents[node.id] || 0;
    }
  }
  return 0;
}
