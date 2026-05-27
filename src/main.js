import { DEFAULT_CLASS_ID, classDefs, getClassDef } from "./data/classes.js";
import { abilityDefs, getAbilityDef } from "./data/abilities.js";
import { MAX_STACK, item, itemDefs, typeBadges, rarityLabels, affixCatalog, rollAffixes } from "./data/items.js";
import { getTalentTree, abilityMasteryLevel } from "./data/talents.js";
import { worldDefs, getWorldDef, PORTAL_EDGE_THRESHOLD, getStoneStyle, getPortalColor, getWeather } from "./data/worlds.js";
import { rollMobSkin } from "./data/mobs.js";
import { bossForWorld, petForBossId, bosses } from "./data/bosses/index.js";
import { rollDrops, dropTables, getDropTable } from "./data/drops.js";
import { mobPools } from "./data/mobs.js";
import { sfx, setSoundEnabled, isSoundEnabled } from "./audio.js";
import { npcs, shopItems, sellPrices, dailyQuests } from "./data/npcs.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  hpText: document.querySelector("#hpText"),
  hpBar: document.querySelector("#hpBar"),
  xpText: document.querySelector("#xpText"),
  xpBar: document.querySelector("#xpBar"),
  levelText: document.querySelector("#levelText"),
  goldText: document.querySelector("#goldText"),
  attackText: document.querySelector("#attackText"),
  armorText: document.querySelector("#armorText"),
  inventory: document.querySelector("#inventory"),
  sortInventory: document.querySelector("#sortInventory"),
  questProgress: document.querySelector("#questProgress"),
  questText: document.querySelector("#questText"),
  toast: document.querySelector("#toast"),
  classOverlay: document.querySelector("#classOverlay"),
  classChoices: document.querySelector("#classChoices"),
  classTitle: document.querySelector("#classTitle"),
  classRole: document.querySelector("#classRole"),
  classFantasy: document.querySelector("#classFantasy"),
  classPassive: document.querySelector("#classPassive"),
  classConfirm: document.querySelector("#classConfirm"),
  classChange: document.querySelector("#classChange"),
  classNameText: document.querySelector("#classNameText"),
  classNameTextStats: document.querySelector("#classNameTextStats"),
  itemTooltip: document.querySelector("#itemTooltip"),
  actionPotion: document.querySelector("#actionPotion"),
  actionSmith: document.querySelector("#actionSmith"),
  potionCount: document.querySelector("#potionCount"),
  potionStatus: document.querySelector("#potionStatus"),
  overlayBackdrop: document.querySelector("#overlayBackdrop"),
  charLevel: document.querySelector("#charLevel"),
  charGold: document.querySelector("#charGold"),
  charAttack: document.querySelector("#charAttack"),
  charArmor: document.querySelector("#charArmor"),
  charHp: document.querySelector("#charHp"),
  charXp: document.querySelector("#charXp"),
  charCrit: document.querySelector("#charCrit"),
  charLifesteal: document.querySelector("#charLifesteal"),
  charCdr: document.querySelector("#charCdr"),
  equipWeaponSlot: document.querySelector("#equipWeaponSlot"),
  equipArmorSlot: document.querySelector("#equipArmorSlot"),
  skillPrimary: document.querySelector("#skillPrimary"),
  skillSecondary: document.querySelector("#skillSecondary"),
  skillUltimate: document.querySelector("#skillUltimate"),
  pvpStatus: document.querySelector("#pvpStatus"),
  pvpText: document.querySelector("#pvpText"),
  pvpModeDuel: document.querySelector("#pvpModeDuel"),
  pvpModeRace: document.querySelector("#pvpModeRace"),
  pvpBotToggle: document.querySelector("#pvpBotToggle"),
  pvpBotScore: document.querySelector("#pvpBotScore"),
  pvpBotStatus: document.querySelector("#pvpBotStatus"),
  pvpReady: document.querySelector("#pvpReady"),
  pvpScoreLocal: document.querySelector("#pvpScoreLocal"),
  pvpScoreRemote: document.querySelector("#pvpScoreRemote"),
  blacksmithDistance: document.querySelector("#blacksmithDistance"),
  blacksmithText: document.querySelector("#blacksmithText"),
  upgradeWeapon: document.querySelector("#upgradeWeapon"),
  upgradeArmor: document.querySelector("#upgradeArmor"),
  mergeStacks: document.querySelector("#mergeStacks"),
  talentPts: document.querySelector("#talentPts"),
  talentPtsInline: document.querySelector("#talentPtsInline"),
  talentList: document.querySelector("#talentList"),
  resetTalents: document.querySelector("#resetTalents"),
  smithNear: document.querySelector("#smithNear"),
  smithSlot: document.querySelector("#smithSlot"),
  smithCostList: document.querySelector("#smithCostList"),
  smithRiskBlock: document.querySelector("#smithRiskBlock"),
  smithRiskFill: document.querySelector("#smithRiskFill"),
  smithRiskText: document.querySelector("#smithRiskText"),
  smithReturn: document.querySelector("#smithReturn"),
  smithOverlay: document.querySelector("#smithOverlay"),
  worldNameText: document.querySelector("#worldNameText"),
  authOverlay: document.querySelector("#authOverlay"),
  authForm: document.querySelector("#authForm"),
  authUsername: document.querySelector("#authUsername"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  registerButton: document.querySelector("#registerButton"),
  playerNameText: document.querySelector("#playerNameText"),
  charSelectOverlay: document.querySelector("#charSelectOverlay"),
  charSelectUser: document.querySelector("#charSelectUser"),
  charList: document.querySelector("#charList"),
  charCreateBtn: document.querySelector("#charCreateBtn"),
  charLogoutBtn: document.querySelector("#charLogoutBtn"),
  charCreateOverlay: document.querySelector("#charCreateOverlay"),
  charNameInput: document.querySelector("#charNameInput"),
  charCreateCancel: document.querySelector("#charCreateCancel"),
  charCreateNext: document.querySelector("#charCreateNext"),
  charCreateMessage: document.querySelector("#charCreateMessage"),
  switchCharBtn: document.querySelector("#switchCharBtn"),
};

let currentCharId = null;
let pendingCharName = null;
let charCreateMode = false;

const world = { w: 2400, h: 1600 };
function applyWorldSize() {
  const def = currentWorld();
  if (def.size) {
    world.w = def.size.w;
    world.h = def.size.h;
  } else {
    world.w = 2400;
    world.h = 1600;
  }
  // Schmied bleibt in der Mitte der meadows
  if (def.id === "meadows") {
    blacksmith.x = world.w / 2;
    blacksmith.y = world.h / 2;
    // NPCs um den Schmied gruppieren
    const offsets = {
      trader: [-220, 80],
      trainer: [220, 80],
      courier: [0, 240],
    };
    for (const npc of npcs) {
      const off = offsets[npc.id];
      if (off) {
        npc.x = blacksmith.x + off[0];
        npc.y = blacksmith.y + off[1];
      }
    }
  }
}
const blacksmith = { x: 1220, y: 820, r: 44 };
const keys = new Set();
const particles = [];
const floatingText = [];
const droppedItems = [];
const weaponTrails = [];
const crescentWaves = [];
const projectiles = [];
const skillFlashes = [];
const lavaPools = []; // ground DoT zones: { x, y, radius, damage, life, color, slow?, isPoison? }
let cameraShake = 0;
let pvpBotActive = false;
let pvpBotScore = 0;
let pvpBotClass = "warrior";
let pvpBotEntity = null;
let pvpBotRespawnTimer = 0;
let pvpBotAttackCd = 0;
let smithSelectedIndex = null;
let currentWorldId = "meadows";
let portalCooldown = 0;
let preArenaWorldId = "meadows";
let uiThrottle = 0;
let hitStopTimer = 0;
const dyingMobs = []; // { x, y, color, scale, life, maxLife, rot }
let comboCount = 0;
let comboTimer = 0;
let comboMaxDmg = 0;
const insectSwarm = [];
const weatherParticles = []; // { x, y, vx, vy, life, type, color, size }
let traderMode = "buy";
let trainerLastReset = 0;
let courierState = null;
let petRuntime = null;
let shadowDecoy = null;
let mergeSlots = [null, null, null];
let smithMode = "weapon";
let codexWorldId = "meadows";
let last = performance.now();
let mouse = { x: canvas.width / 2, y: canvas.height / 2, worldX: 0, worldY: 0 };
let toastTimer = 0;
let waveTimer = 3.5;
let minibossTimer = 18;
let bossTimer = 48;
let authUser = null;
let authColor = "#55d7ff";
let multiplayerReady = false;
let lastPresenceSync = 0;
let remotePlayers = {};
let playerRef = null;
let unsubscribePlayers = null;
let pvpState = { mode: "duel", ready: {}, match: null, scores: {}, hits: {} };
let pvpReady = false;
let pvpMode = localStorage.getItem("blocpugnaPvpMode") || "duel";
let pvpAppliedMatchId = null;
const processedPvpHits = new Set();
const pvpSavedState = {};

const pvpModes = {
  duel: {
    name: "Spiegel-Duell",
    duration: 75,
    playerDamageScale: 1,
    text: "Fairer Best-of-Moment: gleiche PvP-Lebenspunkte, wenig Gear-Vorteil, erster Knockout zaehlt.",
  },
  race: {
    name: "Metin-Rennen",
    duration: 90,
    playerDamageScale: 0.55,
    text: "Mehr Schaden am zentralen Metin gewinnt. PvP stoert, aber entscheidet nicht allein.",
  },
};

const player = {
  classId: localStorage.getItem("blocpugnaClass") || DEFAULT_CLASS_ID,
  x: world.w / 2,
  y: world.h / 2,
  r: 22,
  hp: 120,
  maxHp: 120,
  xp: 0,
  nextXp: 50,
  level: 1,
  gold: 0,
  baseAttack: 8,
  attackBonus: 3,
  armorLevel: 0,
  speed: 250,
  attackCooldown: 0,
  invuln: 2,
  powerWindow: 0,
  abilityCooldowns: {},
  dashCritWindow: 0,
  mobsKilled: 0,
  stonesKilled: 0,
  inventory: [
    item("health_potion", 3),
    item("rust_sword", 1),
    item("leather_armor", 1),
  ],
  weapon: "rust_sword",
  weaponIndex: 1,
  armorIndex: 2,
};

const defaultPlayerState = {
  classId: DEFAULT_CLASS_ID,
  maxHp: 120,
  nextXp: 50,
  baseAttack: 8,
  attackBonus: 3,
  armorLevel: 0,
  inventory: [
    item("health_potion", 3),
    item("rust_sword", 1),
    item("leather_armor", 1),
  ],
  weapon: "rust_sword",
  weaponIndex: 1,
  armorIndex: 2,
};

function attackPower() {
  const classDef = getClassDef(player.classId);
  const classBonus = 0;
  const powerBonus = player.powerWindow > 0 ? 10 + Math.floor(player.level * 0.7) : 0;
  const talentBonus = talentEffect("attackBonusFlat");
  const bearMult = player.bearForm > 0 ? 1.4 : 1;
  return Math.round((player.baseAttack + player.attackBonus + weaponUpgradeBonus() + classBonus + powerBonus + talentBonus + Math.floor(player.level * 1.5)) * bearMult);
}

function currentWeapon() {
  const weaponItem = player.inventory[player.weaponIndex];
  const id = weaponItem?.id || player.weapon || "rust_sword";
  return { ...(itemDefs[id] || itemDefs.rust_sword), id };
}

function equippedWeaponItem() {
  const entry = player.inventory[player.weaponIndex];
  if (entry && itemDefs[entry.id]?.type === "weapon") return entry;
  return player.inventory.find((item) => item.id === player.weapon && itemDefs[item.id]?.type === "weapon");
}

function weaponUpgradeBonus() {
  return (equippedWeaponItem()?.upgrade || 0) * 3;
}

function equippedArmorItem() {
  if (typeof player.armorIndex !== "number" || player.armorIndex < 0) return null;
  const entry = player.inventory[player.armorIndex];
  if (entry && itemDefs[entry.id]?.type === "armor") return entry;
  return null;
}

function totalDefense() {
  const armor = equippedArmorItem();
  const classDef = getClassDef(player.classId);
  const nearbyThreats = mobs.filter((mob) => dist(player, mob) < 150).length;
  const ironSkin = classDef.id === "warrior" && nearbyThreats >= 3 ? 5 : 0;
  const base = armor ? (itemDefs[armor.id].defense + (armor.upgrade || 0) * 4) : 0;
  return base + player.armorLevel * 3 + ironSkin;
}

function itemLabel(invItem) {
  const def = itemDefs[invItem.id];
  const upgrade = invItem.upgrade ? ` +${invItem.upgrade}` : "";
  return `${def.name}${upgrade}`;
}

// Power-Score: einheitliche Vergleichszahl pro Item
const rarityValue = { common: 1, rare: 3, epic: 7, legendary: 14 };
function itemPowerScore(invItem) {
  if (!invItem) return 0;
  const def = itemDefs[invItem.id];
  if (!def) return 0;
  let score = (rarityValue[def.rarity] || 0) * 5;
  if (def.type === "weapon") score += (def.attack || 0) * 2 + (invItem.upgrade || 0) * 8;
  if (def.type === "armor") score += (def.defense || 0) * 2 + (invItem.upgrade || 0) * 10;
  if (def.type === "potion") score += (def.heal || 0) * 0.4;
  if (invItem.affixes) {
    for (const v of Object.values(invItem.affixes)) score += v * 80;
  }
  if (def.type === "material") score = (rarityValue[def.rarity] || 0) * 4;
  return Math.round(score);
}

function svgIconFor(invItem, color) {
  const def = itemDefs[invItem.id];
  if (!def) return null;
  const c = color || def.color || "#f4f0df";
  const dark = "#101419";
  const shine = "#ffffff";
  let body = "";
  if (def.type === "weapon") {
    if (def.style === "dagger") {
      // Doppel-Dolch
      body = `
        <path d="M14 28 L26 6 L30 8 L18 30 Z" fill="${c}"/>
        <path d="M18 30 L14 32 L12 28 L14 28 Z" fill="${dark}"/>
        <path d="M22 28 L34 6 L38 8 L26 30 Z" fill="${c}" opacity="0.8"/>
      `;
    } else if (def.style === "staff") {
      // Stab mit Orb
      body = `
        <rect x="22" y="14" width="4" height="32" fill="#5a3a26"/>
        <circle cx="24" cy="12" r="8" fill="${c}"/>
        <circle cx="22" cy="10" r="3" fill="${shine}" opacity="0.85"/>
      `;
    } else if (invItem.id === "fullmoon_sickle") {
      // Sichel
      body = `
        <path d="M10 30 Q24 6 40 14 Q34 24 22 28 Q14 30 10 30 Z" fill="${c}"/>
        <rect x="14" y="28" width="4" height="14" fill="${dark}"/>
      `;
    } else {
      // Schwert
      body = `
        <path d="M22 4 L26 4 L26 30 L22 30 Z" fill="${c}"/>
        <rect x="16" y="30" width="16" height="3" fill="${dark}"/>
        <rect x="22" y="33" width="4" height="6" fill="#5a3a26"/>
        <rect x="22" y="38" width="4" height="4" fill="${dark}"/>
      `;
    }
  } else if (def.type === "armor") {
    body = `
      <path d="M10 12 L24 8 L38 12 L36 32 Q24 40 12 32 Z" fill="${c}"/>
      <path d="M14 16 L24 13 L34 16 L32 28 Q24 33 16 28 Z" fill="${shine}" opacity="0.25"/>
      <circle cx="24" cy="20" r="3" fill="${dark}"/>
    `;
  } else if (def.type === "potion") {
    body = `
      <rect x="20" y="6" width="8" height="6" fill="${dark}"/>
      <path d="M16 12 L32 12 L34 36 Q24 42 14 36 Z" fill="${c}" opacity="0.5"/>
      <path d="M16 22 L32 22 L34 36 Q24 42 14 36 Z" fill="${c}"/>
      <circle cx="20" cy="30" r="2" fill="${shine}" opacity="0.6"/>
    `;
  } else if (def.type === "material") {
    if (invItem.id === "frost_core") {
      body = `<path d="M24 4 L34 24 L24 44 L14 24 Z" fill="${c}"/><path d="M24 12 L30 24 L24 36 L18 24 Z" fill="${shine}" opacity="0.4"/>`;
    } else if (invItem.id === "ember_spark") {
      body = `<path d="M24 6 Q14 18 18 32 Q24 44 30 32 Q34 18 24 6 Z" fill="${c}"/><path d="M24 18 Q20 26 22 34 Q24 38 26 34 Q28 26 24 18 Z" fill="${shine}" opacity="0.6"/>`;
    } else if (invItem.id === "sky_shard") {
      body = `<path d="M24 4 L30 18 L44 24 L30 30 L24 44 L18 30 L4 24 L18 18 Z" fill="${c}"/>`;
    } else if (invItem.id === "shadow_essence") {
      body = `<circle cx="24" cy="24" r="14" fill="${c}"/><circle cx="20" cy="20" r="5" fill="${shine}" opacity="0.45"/>`;
    } else if (invItem.id === "pugna_core") {
      body = `<circle cx="24" cy="24" r="14" fill="${c}"/><circle cx="24" cy="24" r="8" fill="${dark}"/><circle cx="24" cy="24" r="3" fill="${shine}"/>`;
    } else if (invItem.id === "gem") {
      body = `<path d="M14 16 L24 4 L34 16 L24 44 Z" fill="${c}"/><path d="M14 16 L34 16 L24 28 Z" fill="${shine}" opacity="0.45"/>`;
    } else if (invItem.id === "metin_shard") {
      body = `<path d="M24 6 L30 22 L44 24 L32 32 L36 44 L24 36 L12 44 L16 32 L4 24 L18 22 Z" fill="${c}"/>`;
    } else return null;
  } else return null;
  return `<svg class="item-svg" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function bestPowerInInventory() {
  let best = 0;
  for (const inv of player.inventory) {
    if (!inv) continue;
    const def = itemDefs[inv.id];
    if (!def || def.type === "material" || def.type === "potion") continue;
    best = Math.max(best, itemPowerScore(inv));
  }
  return best;
}

function classAbilityIds(classId = player.classId) {
  return getClassDef(classId).abilities;
}

function primaryAbilityId() {
  return classAbilityIds()[0];
}

function secondaryAbilityId() {
  return classAbilityIds()[1];
}

function ultimateAbilityId() {
  return classAbilityIds()[2];
}

function abilityCooldown(abilityId) {
  return player.abilityCooldowns[abilityId] || 0;
}

function setAbilityCooldown(abilityId) {
  const cd = getAbilityDef(abilityId).cooldown;
  player.abilityCooldowns[abilityId] = cd * (1 - totalCdr());
}

function rollCrit() {
  // Shadow im Dash-Crit-Window: 100% Crit für ALLE Treffer 2s lang
  if (player.classId === "shadow" && player.dashCritWindow > 0) return true;
  return Math.random() < totalCritChance();
}

function applyCritAndLifesteal(amount) {
  let dmg = amount * comboDamageMult();
  let crit = false;
  if (rollCrit()) {
    dmg = Math.round(dmg * 1.85);
    crit = true;
    sfx.crit();
    hitStopTimer = Math.max(hitStopTimer, 0.08);
  } else {
    dmg = Math.round(dmg);
    sfx.hit();
  }
  const ls = totalLifesteal();
  if (ls > 0) {
    const heal = Math.max(1, Math.round(dmg * ls));
    player.hp = Math.min(player.maxHp, player.hp + heal);
  }
  return { dmg, crit };
}

function applyClass(classId, preserveProgress = false) {
  const classDef = getClassDef(classId);
  const hpPct = preserveProgress ? clamp(player.hp / Math.max(1, player.maxHp), 0.2, 1) : 1;
  player.classId = classDef.id;
  player.maxHp = classDef.stats.maxHp;
  player.hp = Math.ceil(player.maxHp * hpPct);
  player.speed = classDef.stats.speed;
  player.baseAttack = classDef.stats.baseAttack;
  player.attackBonus = classDef.stats.attackBonus;
  player.armorLevel = classDef.stats.armorLevel;
  player.abilityCooldowns = {};
  player.powerWindow = 0;
  player.dashCritWindow = 0;
  localStorage.setItem("blocpugnaClass", classDef.id);
  document.body.dataset.playerClass = classDef.id;
  if (ui.classNameText) ui.classNameText.textContent = classDef.name;
  if (ui.classNameTextStats) ui.classNameTextStats.textContent = classDef.name;
  renderClassSelect(classDef.id);
  renderAbilityButtons();
  renderTalents();
  updateUi();
}

function bar(value) {
  return "#".repeat(value).padEnd(10, ".");
}

function renderClassSelect(selectedId = player.classId) {
  if (!ui.classChoices) return;
  ui.classChoices.innerHTML = "";
  for (const classDef of Object.values(classDefs)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "class-card";
    button.classList.toggle("selected", classDef.id === selectedId);
    button.dataset.classId = classDef.id;
    button.style.setProperty("--class-color", classDef.color);
    const renderBar = (label, val) => `
      <div class="cc-bar">
        <span class="cc-bar-label">${label}</span>
        <div class="cc-bar-track"><span class="cc-bar-fill" style="width:${val * 10}%"></span></div>
        <span class="cc-bar-val">${val}</span>
      </div>`;
    button.innerHTML = `
      <span class="class-card-mark"></span>
      <strong>${classDef.name}</strong>
      <small>${classDef.role}</small>
      <div class="cc-bars">
        ${renderBar("Leben", classDef.bars.leben)}
        ${renderBar("Schaden", classDef.bars.schaden)}
        ${renderBar("Tempo", classDef.bars.tempo)}
        ${renderBar("Team", classDef.bars.team)}
      </div>
    `;
    ui.classChoices.append(button);
  }
  updateClassPreview(selectedId);
}

function updateClassPreview(classId) {
  const classDef = getClassDef(classId);
  if (!ui.classTitle) return;
  ui.classTitle.textContent = classDef.name;
  ui.classRole.textContent = classDef.role;
  ui.classFantasy.textContent = classDef.fantasy;
  ui.classPassive.textContent = `${classDef.passive.name}: ${classDef.passive.text}`;
  ui.classConfirm.dataset.classId = classDef.id;
}

function renderAbilityButtons() {
  const abilityButtons = [ui.skillPrimary, ui.skillSecondary, ui.skillUltimate];
  classAbilityIds().forEach((abilityId, index) => {
    const ability = getAbilityDef(abilityId);
    const button = abilityButtons[index];
    if (!button || !ability) return;
    button.dataset.abilityId = ability.id;
    button.style.setProperty("--ability-color", ability.color || "#f4c95d");
    button.dataset.tooltipName = ability.name;
    button.dataset.tooltipHint = ability.hint;
    button.dataset.tooltipKey = ability.key;
    button.innerHTML = `
      <span class="ability-icon" style="color:${ability.color || "#f4c95d"}">${ability.icon || "✦"}</span>
      <span class="ability-info">
        <span class="ability-head">
          <strong>${ability.name}</strong>
          <kbd>${ability.key}</kbd>
        </span>
      </span>
      <span class="ability-cooldown" aria-hidden="true">Bereit</span>
    `;
  });
}

const mobs = [];
const stones = [];
const greekBossNames = [
  "Sokrates",
  "Platon",
  "Aristoteles",
  "Leonidas",
  "Perikles",
  "Solon",
  "Hippokrates",
  "Pythagoras",
  "Archimedes",
  "Homer",
];

const multiplayerRoom = "main";

applyClass(player.classId, false);

function spawnMob(x, y, rank = "mob") {
  if (typeof rank === "boolean") rank = rank ? "elite" : "mob";
  const stats = mobStats(rank);
  const wDef = currentWorld();
  const mods = wDef.mobModifiers || {};
  const palette = wDef.mobPalette || {};
  const skin = rollMobSkin(currentWorldId, rank === "mob" || rank === "elite" ? rank : "elite");
  // Mob-Level aus Welt + Rank ableiten
  const worldMin = wDef.levelRange?.[0] || 1;
  const worldMax = wDef.levelRange?.[1] || 1;
  const mobLevel = Math.max(1, Math.round(worldMin + Math.random() * (worldMax - worldMin)
    + (rank === "elite" ? 1 : 0)
    + (rank === "miniboss" ? 3 : 0)
    + (rank === "boss" ? 5 : 0)));
  mobs.push({
    x, y,
    r: stats.r,
    hp: Math.round(stats.hp * (mods.hpMult || 1)),
    maxHp: Math.round(stats.hp * (mods.hpMult || 1)),
    speed: Math.round(stats.speed * (mods.speedMult || 1)),
    damage: Math.round(stats.damage * (mods.damageMult || 1)),
    xp: stats.xp + Math.round((mods.hpMult || 1 - 1) * 8),
    elite: rank !== "mob",
    rank,
    name: skin?.name || stats.name,
    color: palette[rank] || stats.color,
    scale: stats.scale,
    hitTimer: 0,
    worldStatus: mods.status,
    skin,
    level: mobLevel,
  });
}

function difficultyScale() {
  const players = 1 + Object.keys(remotePlayers || {}).length;
  return 1 + (players - 1) * 0.35;
}

function mobStats(rank) {
  const s = difficultyScale();
  const wDef = currentWorld();
  const worldMin = wDef.levelRange?.[0] || 1;
  // Mob-Stats skalieren nur mit Welt-Basis-Level (NICHT mit Spielerlevel)
  // So bleibt ein Lv2-Mob in den Wiesen schwach, auch wenn der Spieler Lv 30 ist.
  const worldScale = 1 + (worldMin - 1) * 0.20;
  // Anti-Bully: wenn Spieler die Welt deutlich überlevelt → weniger Schaden + weniger XP
  const playerLvl = player.level || 1;
  const overLevel = Math.max(0, playerLvl - worldMin);
  const damagePenalty = Math.max(0.25, 1 - overLevel * 0.06); // -6% pro Level über Welt-Min, min 25%
  const xpPenalty = Math.max(0.20, 1 - overLevel * 0.05);
  const totalHp = (base) => Math.round(base * s * worldScale);
  const totalDmg = (base) => Math.max(1, Math.round(base * s * worldScale * damagePenalty));
  const totalXp = (base) => Math.max(1, Math.round(base * worldScale * xpPenalty));
  if (rank === "boss") {
    const name = greekBossNames[Math.floor(Math.random() * greekBossNames.length)];
    return { r: 42, hp: totalHp(680), speed: 84, damage: totalDmg(72), xp: totalXp(220), name, color: "#d946ef", scale: 1.55 };
  }
  if (rank === "miniboss") {
    const name = greekBossNames[Math.floor(Math.random() * greekBossNames.length)];
    return { r: 34, hp: totalHp(260), speed: 96, damage: totalDmg(52), xp: totalXp(96), name, color: "#f97316", scale: 1.28 };
  }
  if (rank === "elite") return { r: 26, hp: totalHp(95), speed: 102, damage: totalDmg(44), xp: totalXp(36), name: "Elite", color: "#c084fc", scale: 1.05 };
  return { r: 20, hp: totalHp(48), speed: 124, damage: totalDmg(26), xp: totalXp(18), name: "Schattenklotz", color: "#b34d54", scale: 0.9 };
}

function spawnStone(x, y) {
  const s = difficultyScale();
  const wDef = currentWorld();
  const worldBase = 1 + ((wDef.levelRange?.[0] || 1) - 1) * 0.20;
  const hp = Math.round(280 * s * worldBase);
  const style = getStoneStyle(currentWorldId);
  stones.push({
    x, y,
    r: 38,
    hp,
    maxHp: hp,
    pulse: Math.random() * 10,
    hitTimer: 0,
    style,
    spawnThresholds: [0.75, 0.5, 0.25], // bei diesen HP-Anteilen werden Mobs gespawnt
    spawnedAt: [],
  });
}

const SAFE_ZONE_RADIUS = 520;

function inSafeZone(x, y, padding = 0) {
  if (currentWorldId !== "meadows") return false;
  return Math.hypot(x - blacksmith.x, y - blacksmith.y) < SAFE_ZONE_RADIUS + padding;
}

function randomPointAwayFromPlayer(minDistance = 360) {
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = 160 + Math.random() * (world.w - 320);
    y = 150 + Math.random() * (world.h - 300);
    tries += 1;
  } while ((Math.hypot(x - player.x, y - player.y) < minDistance || inSafeZone(x, y, 60)) && tries < 80);
  return { x, y };
}

function spawnSpecialMob(rank, announce = true) {
  // Bei Boss-Spawn: Welt-spezifischen Boss nutzen falls definiert
  if (rank === "boss") {
    const bossDef = bossForWorld(currentWorldId);
    if (bossDef) {
      spawnWorldBoss(bossDef);
      return;
    }
  }
  const point = randomPointAwayFromPlayer(rank === "boss" ? 900 : 720);
  spawnMob(point.x, point.y, rank);
  const mob = mobs[mobs.length - 1];
  if (announce) showToast(`${rank === "boss" ? "Boss" : "Miniboss"} ${mob.name} ist erschienen.`);
}

function spawnWorldBoss(bossDef) {
  const point = randomPointAwayFromPlayer(900);
  const s = difficultyScale();
  const lvl = player.level || 1;
  const lvlScale = 1 + (lvl - 1) * 0.22;
  const wDef = currentWorld();
  const worldBase = 1 + ((wDef.levelRange?.[0] || 1) - 1) * 0.18;
  const hp = Math.round(bossDef.baseStats.hp * s * lvlScale * worldBase);
  const dmg = Math.round(bossDef.baseStats.damage * s * (1 + (lvl - 1) * 0.14) * worldBase);
  mobs.push({
    x: point.x, y: point.y,
    r: bossDef.baseStats.r,
    hp,
    maxHp: hp,
    speed: bossDef.baseStats.speed,
    damage: dmg,
    xp: bossDef.baseStats.xp,
    elite: true,
    rank: "boss",
    name: bossDef.name,
    color: bossDef.appearance.body,
    scale: bossDef.baseStats.scale,
    hitTimer: 0,
    bossDef,
    bossPhase: 1,
    abilityCds: {},
    isWorldBoss: true,
  });
  showToast(bossDef.introToast || `${bossDef.name} erscheint.`);
  sfx.bossIntro();
  cameraShake = 0.5;
  skillFlashes.push({ color: bossDef.appearance.head || "#fff", life: 0.4, maxLife: 0.4 });
}

function updateWorldBoss(mob, dt) {
  if (!mob.bossDef) return;
  const def = mob.bossDef;
  const pct = mob.hp / mob.maxHp;
  const newPhase = pct < 0.33 ? 3 : pct < 0.66 ? 2 : 1;
  if (newPhase !== mob.bossPhase) {
    mob.bossPhase = newPhase;
    cameraShake = 0.4;
    skillFlashes.push({ color: def.appearance.head, life: 0.3, maxLife: 0.3 });
    showToast(`${def.name} — Phase ${newPhase}!`);
    sfx.bossPhase();
    // Split-Trigger bei Phase-2 für Mutter Sphagne
    if (def.abilities.splitSelf && mob.bossPhase === 2 && !mob.hasSplit) {
      mob.hasSplit = true;
      spawnSphagneDaughters(mob, def);
      return; // mob ist jetzt eine der Töchter
    }
  }
  for (const k of Object.keys(mob.abilityCds || {})) {
    mob.abilityCds[k] = Math.max(0, mob.abilityCds[k] - dt);
  }
  // Charge-States ticken
  if (mob.charges) {
    for (const key of Object.keys(mob.charges)) {
      const c = mob.charges[key];
      c.t -= dt;
      if (c.t <= 0) {
        const ab = def.abilities[key];
        if (ab) executeBossAbility(mob, def, key, ab, c);
        delete mob.charges[key];
      }
    }
  }
  const dx = player.x - mob.x;
  const dy = player.y - mob.y;
  const d = Math.hypot(dx, dy) || 1;
  // Dispatcher pro Ability
  for (const [key, ab] of Object.entries(def.abilities)) {
    if (ab.phase && mob.bossPhase < ab.phase) continue;
    if ((mob.abilityCds[key] || 0) > 0) continue;
    if (mob.charges?.[key]) continue;
    if (ab.id === "splitSelf") continue; // einmaliger Phasen-Trigger, kein Cooldown-Cast
    // Distanz-Check pro Ability
    const inRange = checkAbilityRange(ab, d);
    if (!inRange) continue;
    // Mit oder ohne Telegraph
    if (ab.telegraphDuration) {
      mob.charges = mob.charges || {};
      mob.charges[key] = { t: ab.telegraphDuration, max: ab.telegraphDuration, x: player.x, y: player.y };
      mob.abilityCds[key] = ab.cooldown + ab.telegraphDuration;
      if (key === "frostNova" || key === "lavaPool" || key === "fireColumn" || key === "windBurst" || key === "thunderclap" || key === "poisonCloud" || key === "sporeBurst") {
        showToast(`${def.name} lädt ${ab.hint?.split(" ")[0] || key}!`);
      }
    } else {
      executeBossAbility(mob, def, key, ab);
      mob.abilityCds[key] = ab.cooldown;
    }
    break; // pro Frame nur eine Ability auslösen
  }
}

function checkAbilityRange(ab, d) {
  if (ab.id === "fireBolt" || ab.id === "frostSpear" || ab.id === "lightningChain" || ab.id === "waveStrike") return d < 560;
  if (ab.id === "windBurst") return d < (ab.radius || 260) + 40;
  if (ab.id === "thunderclap") return d < (ab.radius || 180) + 60;
  if (ab.id === "lavaPool" || ab.id === "poisonCloud" || ab.id === "fireColumn" || ab.id === "sporeBurst") return d < 380;
  if (ab.id === "frostNova") return d < (ab.radius || 280) + 80;
  if (ab.id === "submerge") return d < 600;
  if (ab.id === "whirlpool") return d < 300;
  if (ab.id === "summonShards") return true;
  return d < 480;
}

function executeBossAbility(mob, def, key, ab, chargeInfo) {
  switch (ab.id) {
    case "frostSpear": castFrostSpear(mob, def); return;
    case "frostNova": castFrostNova(mob, def); return;
    case "summonShards": summonShards(mob, def); return;
    case "fireBolt": castFireBolt(mob, def, ab); return;
    case "lavaPool": castLavaPool(mob, def, ab, chargeInfo); return;
    case "fireColumn": castFireColumn(mob, def, ab, chargeInfo); return;
    case "poisonCloud": castPoisonCloud(mob, def, ab, chargeInfo); return;
    case "sporeBurst": castSporeBurst(mob, def, ab); return;
    case "lightningChain": castLightningChain(mob, def, ab); return;
    case "windBurst": castWindBurst(mob, def, ab); return;
    case "thunderclap": castThunderclap(mob, def, ab); return;
    case "waveStrike": castWaveStrike(mob, def, ab); return;
    case "submerge": castSubmerge(mob, def, ab, chargeInfo); return;
    case "whirlpool": castWhirlpool(mob, def, ab); return;
  }
}

function castWaveStrike(mob, def, ab) {
  const baseAngle = Math.atan2(player.y - mob.y, player.x - mob.x);
  for (let i = -2; i <= 2; i += 1) {
    const a = baseAngle + i * 0.14;
    projectiles.push({
      x: mob.x + Math.cos(a) * (mob.r + 12),
      y: mob.y + Math.sin(a) * (mob.r + 12),
      vx: Math.cos(a) * ab.speed,
      vy: Math.sin(a) * ab.speed,
      range: 540,
      travelled: 0,
      color: ab.color,
      glow: ab.glow,
      damage: Math.round(mob.damage * ab.damage),
      owner: "bot",
      pierce: ab.pierce || 2,
      hits: new Set(),
      life: 1.8,
    });
  }
}

function castSubmerge(mob, def, ab, chargeInfo) {
  // Während Charge unsichtbar machen
  mob.submerged = true;
  // Charge-Position = Spieler-Position zum Zeitpunkt des Casts
  if (chargeInfo) {
    // Bei Aufschlag: AoE Damage
    crescentWaves.push({
      x: chargeInfo.x, y: chargeInfo.y, angle: 0,
      range: ab.radius * 1.1, radius: ab.radius * 1.1,
      color: ab.color, life: 0.6, maxLife: 0.6,
    });
    for (let i = 0; i < 80; i += 1) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: chargeInfo.x + (Math.random() - 0.5) * ab.radius * 0.4,
        y: chargeInfo.y + (Math.random() - 0.5) * 30,
        vx: Math.cos(a) * (220 + Math.random() * 260),
        vy: Math.sin(a) * (180 + Math.random() * 260),
        life: 0.6,
        color: i % 2 === 0 ? ab.color : "#a5f3fc",
        size: 4,
      });
    }
    cameraShake = 0.6;
    if (Math.hypot(player.x - chargeInfo.x, player.y - chargeInfo.y) < ab.radius && player.invuln <= 0) {
      const dmg = Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4));
      player.hp -= dmg;
      player.invuln = 0.8;
      floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
    }
    // Boss taucht am chargeInfo-Punkt auf
    mob.x = chargeInfo.x;
    mob.y = chargeInfo.y;
    mob.submerged = false;
  }
}

function castWhirlpool(mob, def, ab) {
  // Wirbel-Zone — Spieler wird gezogen
  lavaPools.push({
    x: mob.x, y: mob.y,
    radius: ab.radius,
    damage: mob.damage * ab.damage,
    life: ab.duration,
    color: ab.color,
    isWhirlpool: true,
    pull: ab.pull,
    centerX: mob.x,
    centerY: mob.y,
  });
}

// === PYROMANT ABILITIES ===
function castFireBolt(mob, def, ab) {
  const a = Math.atan2(player.y - mob.y, player.x - mob.x);
  // 3 Salven in 0.15s Abstand
  for (let i = 0; i < 3; i += 1) {
    setTimeout(() => {
      if (!mobs.includes(mob)) return;
      const angle = a + (Math.random() - 0.5) * 0.1;
      projectiles.push({
        x: mob.x + Math.cos(angle) * (mob.r + 8),
        y: mob.y + Math.sin(angle) * (mob.r + 8),
        vx: Math.cos(angle) * ab.speed,
        vy: Math.sin(angle) * ab.speed,
        range: 520,
        travelled: 0,
        color: ab.color,
        glow: ab.glow,
        damage: Math.round(mob.damage * ab.damage),
        owner: "bot",
        pierce: ab.pierce || 1,
        hits: new Set(),
        life: 1.8,
      });
    }, i * 150);
  }
}

function castLavaPool(mob, def, ab, chargeInfo) {
  if (!chargeInfo) return;
  // Pool spawnen am charge-Position
  lavaPools.push({
    x: chargeInfo.x, y: chargeInfo.y,
    radius: ab.radius,
    damage: mob.damage * ab.damage, // pro Sekunde
    life: ab.duration,
    color: ab.color,
  });
  for (let i = 0; i < 30; i += 1) {
    const ang = Math.random() * Math.PI * 2;
    particles.push({
      x: chargeInfo.x, y: chargeInfo.y,
      vx: Math.cos(ang) * (140 + Math.random() * 200),
      vy: Math.sin(ang) * (140 + Math.random() * 200),
      life: 0.5,
      color: i % 2 === 0 ? "#fb923c" : "#fff2a8",
      size: 4,
    });
  }
}

function castFireColumn(mob, def, ab, chargeInfo) {
  if (!chargeInfo) return;
  crescentWaves.push({
    x: chargeInfo.x, y: chargeInfo.y, angle: 0,
    range: ab.radius * 1.1, radius: ab.radius * 1.1,
    color: ab.color, life: 0.6, maxLife: 0.6,
  });
  for (let i = 0; i < 60; i += 1) {
    particles.push({
      x: chargeInfo.x + (Math.random() - 0.5) * ab.radius * 0.5,
      y: chargeInfo.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 80,
      vy: -200 - Math.random() * 260,
      life: 0.8,
      color: i % 2 === 0 ? "#fff2a8" : "#fb923c",
      size: 5,
    });
  }
  cameraShake = 0.35;
  if (Math.hypot(player.x - chargeInfo.x, player.y - chargeInfo.y) < ab.radius && player.invuln <= 0) {
    const dmg = Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4));
    player.hp -= dmg;
    player.invuln = 0.7;
    floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
  }
}

// === SPHAGNE ABILITIES ===
function castPoisonCloud(mob, def, ab, chargeInfo) {
  if (!chargeInfo) return;
  lavaPools.push({
    x: chargeInfo.x, y: chargeInfo.y,
    radius: ab.radius,
    damage: mob.damage * ab.damage,
    life: ab.duration,
    color: ab.color,
    slow: ab.slow || 0,
    isPoison: true,
  });
  for (let i = 0; i < 30; i += 1) {
    const ang = Math.random() * Math.PI * 2;
    particles.push({
      x: chargeInfo.x, y: chargeInfo.y,
      vx: Math.cos(ang) * (80 + Math.random() * 80),
      vy: Math.sin(ang) * (80 + Math.random() * 80),
      life: 0.7,
      color: i % 2 === 0 ? "#bbf7a0" : "#84a665",
      size: 5,
    });
  }
}

function spawnSphagneDaughters(parent, def) {
  // Den Boss selbst zu einer Tochter machen + eine zweite spawnen
  parent.hp = Math.round(parent.maxHp * 0.45);
  parent.maxHp = parent.hp;
  parent.damage = Math.round(parent.damage * 0.6);
  parent.scale = (parent.scale || 1) * 0.7;
  parent.r = Math.round(parent.r * 0.78);
  parent.name = `${def.name} (Tochter)`;
  parent.isDaughter = true;
  // Zweite Tochter daneben
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle) * 80;
  const dy = Math.sin(angle) * 80;
  mobs.push({
    x: parent.x + dx, y: parent.y + dy,
    r: parent.r,
    hp: parent.hp, maxHp: parent.hp,
    speed: parent.speed,
    damage: parent.damage,
    xp: Math.round(parent.xp * 0.5),
    elite: true,
    rank: "boss",
    name: parent.name,
    color: def.appearance.body,
    scale: parent.scale,
    hitTimer: 0,
    bossDef: def,
    bossPhase: 2,
    abilityCds: {},
    isWorldBoss: false,
    isDaughter: true,
    hasSplit: true,
  });
  cameraShake = 0.55;
  showToast(`${def.name} teilt sich!`);
}

function castSporeBurst(mob, def, ab) {
  const radius = ab.radius;
  crescentWaves.push({
    x: mob.x, y: mob.y, angle: 0,
    range: radius * 1.1, radius: radius * 1.1,
    color: ab.color, life: 0.6, maxLife: 0.6,
  });
  for (let i = 0; i < 40; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: mob.x, y: mob.y,
      vx: Math.cos(a) * (180 + Math.random() * 180),
      vy: Math.sin(a) * (180 + Math.random() * 180),
      life: 0.6,
      color: "#bbf7a0",
      size: 5,
    });
  }
  if (Math.hypot(player.x - mob.x, player.y - mob.y) < radius && player.invuln <= 0) {
    const dmg = Math.max(5, Math.round(mob.damage * ab.damage - totalDefense() * 0.5));
    player.hp -= dmg;
    player.invuln = 0.6;
    floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
    applyStatus(player, "poisoned", 3);
  }
}

// === AETHERIUS ABILITIES ===
function castLightningChain(mob, def, ab) {
  // Springt bis zu 3x zwischen Spieler/Bot/Stein
  const targets = [];
  targets.push({ x: player.x, y: player.y, isPlayer: true });
  let last = { x: mob.x, y: mob.y };
  const visited = new Set();
  for (let jump = 0; jump < (ab.maxJumps || 3); jump += 1) {
    let best = null, bestD = ab.jumpRange;
    for (const candidate of [{ x: player.x, y: player.y, isPlayer: true }]) {
      if (visited.has("player")) continue;
      const dd = Math.hypot(candidate.x - last.x, candidate.y - last.y);
      if (dd < bestD) { best = candidate; bestD = dd; }
    }
    if (!best) break;
    // Visualisierung: weißer Strahl
    for (let i = 0; i < 12; i += 1) {
      const t = i / 12;
      particles.push({
        x: last.x + (best.x - last.x) * t + (Math.random() - 0.5) * 14,
        y: last.y + (best.y - last.y) * t + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.3,
        color: ab.color,
        size: 4,
      });
    }
    if (best.isPlayer && player.invuln <= 0) {
      const dmg = Math.max(6, Math.round(mob.damage * ab.damage - totalDefense() * 0.4));
      player.hp -= dmg;
      player.invuln = 0.3;
      floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
      visited.add("player");
    }
    last = best;
  }
}

function castWindBurst(mob, def, ab) {
  crescentWaves.push({
    x: mob.x, y: mob.y, angle: 0,
    range: ab.radius * 1.1, radius: ab.radius * 1.1,
    color: ab.color, life: 0.5, maxLife: 0.5,
  });
  const dd = Math.hypot(player.x - mob.x, player.y - mob.y);
  if (dd < ab.radius && player.invuln <= 0) {
    const dmg = Math.max(5, Math.round(mob.damage * ab.damage - totalDefense() * 0.4));
    player.hp -= dmg;
    player.invuln = 0.5;
    floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
    // Knockback
    const a = Math.atan2(player.y - mob.y, player.x - mob.x);
    player.x = clamp(player.x + Math.cos(a) * ab.knockback, player.r, world.w - player.r);
    player.y = clamp(player.y + Math.sin(a) * ab.knockback, player.r, world.h - player.r);
  }
  cameraShake = 0.3;
}

function castThunderclap(mob, def, ab) {
  crescentWaves.push({
    x: mob.x, y: mob.y, angle: 0,
    range: ab.radius * 1.1, radius: ab.radius * 1.1,
    color: ab.color, life: 0.7, maxLife: 0.7,
  });
  for (let i = 0; i < 50; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: mob.x, y: mob.y,
      vx: Math.cos(a) * (220 + Math.random() * 200),
      vy: Math.sin(a) * (220 + Math.random() * 200),
      life: 0.5,
      color: ab.color,
      size: 5,
    });
  }
  cameraShake = 0.5;
  const dd = Math.hypot(player.x - mob.x, player.y - mob.y);
  if (dd < ab.radius && player.invuln <= 0) {
    const dmg = Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4));
    player.hp -= dmg;
    player.invuln = ab.stunDuration || 1.5;
    floatText(player.x, player.y - 36, `STUN -${dmg}`, ab.color);
  }
}

function castFrostSpear(mob, def) {
  const ab = def.abilities.frostSpear;
  const baseAngle = Math.atan2(player.y - mob.y, player.x - mob.x);
  for (let i = -1; i <= 1; i += 1) {
    const a = baseAngle + i * 0.18;
    projectiles.push({
      x: mob.x + Math.cos(a) * (mob.r + 8),
      y: mob.y + Math.sin(a) * (mob.r + 8),
      vx: Math.cos(a) * ab.speed,
      vy: Math.sin(a) * ab.speed,
      range: 560,
      travelled: 0,
      color: ab.color,
      glow: ab.glow,
      damage: Math.round(mob.damage * ab.damage),
      owner: "bot",
      pierce: 1,
      hits: new Set(),
      life: 2.0,
    });
  }
  skillFlashes.push({ color: ab.color, life: 0.15, maxLife: 0.15 });
}

function castFrostNova(mob, def) {
  const ab = def.abilities.frostNova;
  crescentWaves.push({
    x: mob.x, y: mob.y, angle: 0,
    range: ab.radius * 1.1, radius: ab.radius * 1.1,
    color: ab.color, life: 0.7, maxLife: 0.7,
  });
  for (let i = 0; i < 60; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: mob.x, y: mob.y,
      vx: Math.cos(a) * (200 + Math.random() * 220),
      vy: Math.sin(a) * (200 + Math.random() * 220),
      life: 0.6,
      color: i % 2 === 0 ? ab.color : "#bae6fd",
      size: 4,
    });
  }
  cameraShake = 0.3;
  if (Math.hypot(player.x - mob.x, player.y - mob.y) < ab.radius && player.invuln <= 0) {
    const dmg = Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.5));
    player.hp -= dmg;
    player.invuln = 0.6;
    floatText(player.x, player.y - 36, `-${dmg}`, ab.color);
    // Slow
    player.frostSlowTimer = ab.slowDuration;
  }
}

function summonShards(mob, def) {
  const ab = def.abilities.summonShards;
  for (let i = 0; i < ab.count; i += 1) {
    const a = (i / ab.count) * Math.PI * 2;
    const sx = mob.x + Math.cos(a) * (mob.r + 60);
    const sy = mob.y + Math.sin(a) * (mob.r + 60);
    mobs.push({
      x: sx, y: sy, r: 18,
      hp: ab.addStats.hp, maxHp: ab.addStats.hp,
      speed: ab.addStats.speed,
      damage: ab.addStats.damage,
      xp: 12,
      rank: "mob",
      elite: false,
      name: "Frost-Splitter",
      color: ab.addColor,
      scale: 0.75,
      hitTimer: 0,
      skin: { name: "Frost-Splitter", head: "#e0f0ff", body: "#3b5f8a", arms: "#5781b0", legs: "#1a2b48", shape: "humanoid" },
    });
  }
  skillFlashes.push({ color: ab.addColor, life: 0.25, maxLife: 0.25 });
  showToast(`${def.name} ruft Frost-Splitter!`);
}

function currentWorld() {
  return getWorldDef(currentWorldId);
}

function travelToWorld(targetId, edge) {
  if (!worldDefs[targetId]) return;
  const fromDef = currentWorld();
  currentWorldId = targetId;
  const def = currentWorld();
  applyWorldSize();
  // Spieler kommt vom gegenüberliegenden Rand rein
  const oppositeEdge = { north: "south", south: "north", east: "west", west: "east" }[edge];
  // Spawn etwas ausserhalb des Triggers
  if (oppositeEdge === "south") { player.x = world.w / 2; player.y = world.h - 180; }
  else if (oppositeEdge === "north") { player.x = world.w / 2; player.y = 180; }
  else if (oppositeEdge === "west") { player.x = 180; player.y = world.h / 2; }
  else if (oppositeEdge === "east") { player.x = world.w - 180; player.y = world.h / 2; }
  else { player.x = blacksmith.x; player.y = blacksmith.y + 120; }
  player.invuln = 2;
  mobs.length = 0;
  stones.length = 0;
  droppedItems.length = 0;
  projectiles.length = 0;
  lavaPools.length = 0;
  seedWorld();
  portalCooldown = 2.2;
  showToast(`Du betrittst: ${def.name}`);
  sfx.portal();
  cameraShake = 0.3;
  skillFlashes.push({ color: "#9ee7ff", life: 0.3, maxLife: 0.3 });
}

function checkPortalTransition() {
  if (portalCooldown > 0) return;
  const def = currentWorld();
  const portals = def.portals || {};
  const positions = {
    north: { x: world.w / 2, y: 90 },
    south: { x: world.w / 2, y: world.h - 90 },
    east: { x: world.w - 90, y: world.h / 2 },
    west: { x: 90, y: world.h / 2 },
  };
  const triggerR = 56;
  for (const [edge, portal] of Object.entries(portals)) {
    const pos = positions[edge];
    if (!pos) continue;
    if (Math.hypot(player.x - pos.x, player.y - pos.y) < triggerR) {
      travelToWorld(portal.to, edge);
      return;
    }
  }
}

function seedWorld() {
  const wDef = currentWorld();
  if (wDef.arena) {
    if (pvpMode === "race") spawnStone(world.w / 2, world.h / 2);
    return;
  }
  // Meadows: wenige passive Mobs, keine Eliten, kein Boss, ein Trainings-Stein
  if (wDef.passiveMobs) {
    const cfg = wDef.passiveMobs;
    for (let i = 0; i < cfg.count; i += 1) {
      const point = randomPointAwayFromPlayer(420);
      spawnMob(point.x, point.y, "mob");
      const m = mobs[mobs.length - 1];
      if (m) {
        m.passive = true;
        m.speed = Math.round(m.speed * 0.4);
      }
    }
    // 1 Trainings-Stein im NO
    spawnStone(world.w * 0.72, world.h * 0.32);
    return;
  }
  if (wDef.noWildMobs) return;
  for (let i = 0; i < 30; i += 1) {
    const point = randomPointAwayFromPlayer(760);
    spawnMob(point.x, point.y, Math.random() < 0.22 ? "elite" : "mob");
  }
  for (let i = 0; i < 2; i += 1) spawnSpecialMob("miniboss", false);
  const stoneSpots = [[440, 430], [1800, 470], [1220, 1240]];
  for (const [x, y] of stoneSpots) spawnStone(x, y);
}

applyWorldSize();
seedWorld();

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  keys.add(event.key.toLowerCase());
  if (event.code === "Space") {
    event.preventDefault();
    swing();
  }
  const key = event.key.toLowerCase();
  if (key === "q") useAbility(primaryAbilityId());
  if (key === "e") useAbility(secondaryAbilityId());
  if (key === "r") useAbility(ultimateAbilityId());
  if (key === "f") useBlacksmith();
  if (event.key === "1") usePotion();
  if (key === "g" || key === "h" || key === "j") interactNpc(key);
  if (key === "i" || key === "c") toggleOverlay("invOverlay");
  if (key === "t") toggleOverlay("talentsOverlay");
  if (key === "b") { toggleOverlay("codexOverlay"); renderCodex(); }
  if (key === "m") toggleOverlay("questOverlay");
  if (key === "p") toggleOverlay("pvpOverlay");
  if (event.key === "Escape") closeAllOverlays();
});

function toggleOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const willOpen = el.classList.contains("hidden");
  closeAllOverlays();
  if (willOpen) {
    el.classList.remove("hidden");
    ui.overlayBackdrop?.classList.remove("hidden");
    document.querySelector(`[data-overlay="${id}"]`)?.classList.add("active");
  }
}

function closeAllOverlays() {
  document.querySelectorAll(".overlay-panel").forEach((p) => p.classList.add("hidden"));
  document.querySelectorAll(".hud-toggles button").forEach((b) => b.classList.remove("active"));
  ui.overlayBackdrop?.classList.add("hidden");
}

document.querySelectorAll(".hud-toggles button[data-overlay]").forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleOverlay(btn.dataset.overlay);
    if (btn.dataset.overlay === "codexOverlay") renderCodex();
  });
});
document.querySelectorAll(".overlay-close").forEach((btn) => {
  btn.addEventListener("click", closeAllOverlays);
});
ui.overlayBackdrop?.addEventListener("click", closeAllOverlays);

ui.actionPotion?.addEventListener("click", () => usePotion());
ui.actionSmith?.addEventListener("click", () => useBlacksmith());

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

canvas.addEventListener("mousedown", swing);
ui.skillPrimary.addEventListener("click", () => useAbility(primaryAbilityId()));
ui.skillSecondary.addEventListener("click", () => useAbility(secondaryAbilityId()));
ui.skillUltimate?.addEventListener("click", () => useAbility(ultimateAbilityId()));
ui.upgradeWeapon.addEventListener("click", () => smithUpgradeSelected());
ui.smithReturn?.addEventListener("click", () => {
  smithSelectedIndex = null;
  renderSmithSlot();
});
function renderCodex() {
  const tabs = document.querySelector("#codexTabs");
  const content = document.querySelector("#codexContent");
  if (!tabs || !content) return;
  // Tabs
  const worldOrder = ["meadows", "frostwastes", "emberforge", "shadowfen", "skyspire"];
  tabs.innerHTML = worldOrder.map((id) => {
    const def = worldDefs[id];
    if (!def) return "";
    return `<button type="button" data-codex-world="${id}" class="${id === codexWorldId ? "active" : ""}">${def.name}</button>`;
  }).join("");
  tabs.querySelectorAll("[data-codex-world]").forEach((b) => b.addEventListener("click", () => {
    codexWorldId = b.dataset.codexWorld;
    renderCodex();
  }));
  // Content für aktuelle Welt
  const wDef = worldDefs[codexWorldId];
  const pool = mobPools[codexWorldId] || {};
  const drops = dropTables[codexWorldId] || {};
  const boss = bossForWorld(codexWorldId);
  const sectionHTML = [];
  // Welt-Info-Header
  sectionHTML.push(`
    <div class="codex-world-head">
      <strong>${wDef.name}</strong>
      <small>${wDef.subtitle || ""}</small>
      <small class="codex-lvl">Level: ${wDef.levelRange?.[0] || "?"} – ${wDef.levelRange?.[1] || "?"}</small>
    </div>
  `);
  // Mobs + Eliten
  for (const rank of ["mob", "elite"]) {
    const skins = pool[rank];
    if (!skins?.length) continue;
    const table = drops[rank];
    sectionHTML.push(`<div class="codex-section"><h3>${rank === "mob" ? "Mobs" : "Eliten"}</h3>`);
    for (const skin of skins) {
      sectionHTML.push(`
        <div class="codex-card">
          <div class="codex-card-head">
            <span class="codex-mob-swatch" style="background: linear-gradient(135deg, ${skin.head}, ${skin.body});"></span>
            <div>
              <strong>${skin.name}</strong>
              <small>Form: ${skin.shape || "humanoid"}</small>
            </div>
          </div>
          ${renderDropList(table)}
        </div>
      `);
    }
    sectionHTML.push(`</div>`);
  }
  // Miniboss + Boss-Drops (generic)
  if (drops.miniboss) {
    sectionHTML.push(`
      <div class="codex-section"><h3>Miniboss</h3>
        <div class="codex-card">
          <div class="codex-card-head">
            <span class="codex-mob-swatch" style="background: #f97316;"></span>
            <div><strong>Miniboss (zufälliger Name)</strong><small>spawnt regelmäßig</small></div>
          </div>
          ${renderDropList(drops.miniboss)}
        </div>
      </div>
    `);
  }
  // Welt-Boss
  if (boss) {
    // Abilities pro Phase gruppieren
    const phaseGroups = { 1: [], 2: [], 3: [] };
    for (const [key, ab] of Object.entries(boss.abilities)) {
      const ph = ab.phase || 1;
      if (phaseGroups[ph]) phaseGroups[ph].push({ key, ...ab });
    }
    const phasesHTML = [1, 2, 3].map((p) => {
      const abs = phaseGroups[p];
      if (!abs.length) return "";
      const pctRange = p === 1 ? ">66%" : p === 2 ? "33-66%" : "<33%";
      const phaseColor = p === 3 ? "var(--red)" : p === 2 ? "var(--gold)" : "var(--green)";
      return `
        <div class="boss-phase">
          <div class="boss-phase-head">
            <span class="phase-pill" style="background: ${phaseColor}">Phase ${p}</span>
            <small>${pctRange} HP</small>
          </div>
          <ul class="boss-abilities">
            ${abs.map((a) => `
              <li>
                <strong>${a.hint || a.key}</strong>
                <small class="ab-cd">Cooldown: ${a.cooldown}s${a.telegraphDuration ? ` · ${a.telegraphDuration}s Lade-Zeit (Telegraph)` : ""}</small>
                ${a.counter ? `<small class="ab-counter">↳ Konter: ${a.counter}</small>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }).join("");
    sectionHTML.push(`
      <div class="codex-section"><h3>Welt-Boss</h3>
        <div class="codex-card codex-boss">
          <div class="codex-card-head">
            <span class="codex-mob-swatch" style="background: ${boss.appearance.body}; border: 2px solid ${boss.appearance.head};"></span>
            <div>
              <strong>${boss.name}</strong>
              <small>${boss.title}</small>
            </div>
          </div>
          <div class="boss-phases">${phasesHTML}</div>
          ${renderDropList({ rolls: boss.drops.rolls.concat((boss.drops.guaranteed || []).map((id) => ({ id, chance: 1 }))), goldRange: boss.drops.goldRange })}
          ${boss.pet ? `<small class="codex-pet">🐾 Pet beim Sieg: ${boss.pet.name}</small>` : ""}
        </div>
      </div>
    `);
  } else if (drops.boss) {
    sectionHTML.push(`
      <div class="codex-section"><h3>Welt-Boss</h3>
        <div class="codex-card">
          <div class="codex-card-head">
            <span class="codex-mob-swatch" style="background: #d946ef;"></span>
            <div><strong>Generischer Boss</strong><small>noch nicht ausgearbeitet</small></div>
          </div>
          ${renderDropList(drops.boss)}
        </div>
      </div>
    `);
  }
  // Metin-Stein
  if (drops.metin) {
    const style = getStoneStyle(codexWorldId);
    sectionHTML.push(`
      <div class="codex-section"><h3>Metin-Stein</h3>
        <div class="codex-card">
          <div class="codex-card-head">
            <span class="codex-mob-swatch" style="background: ${style.core};"></span>
            <div><strong>${style.name}</strong><small>Wächter spawnen bei 75/50/25% HP</small></div>
          </div>
          ${renderDropList(drops.metin)}
        </div>
      </div>
    `);
  }
  content.innerHTML = sectionHTML.join("");
}

function renderDropList(table) {
  if (!table) return "";
  const rolls = (table.rolls || []).map((entry) => {
    const def = itemDefs[entry.id];
    if (!def) return "";
    const pct = Math.round(entry.chance * 100);
    return `<li>
      <span class="dl-icon" style="color:${def.color || "#fff"}">${def.icon || "?"}</span>
      <span>${def.name}</span>
      <span class="dl-pct">${pct}%</span>
    </li>`;
  }).join("");
  const gold = table.goldRange ? `<li class="dl-gold"><span class="dl-icon">G</span><span>Gold</span><span class="dl-pct">${table.goldRange[0]}–${table.goldRange[1]}</span></li>` : "";
  return `<ul class="codex-drops">${gold}${rolls}</ul>`;
}

function applySmithMode(mode) {
  smithMode = mode;
  document.querySelectorAll("[data-smith-mode]").forEach((b) => b.classList.toggle("active", b.dataset.smithMode === mode));
  const upgradeBlock = document.querySelector("#smithUpgradeBlock");
  const mergeBlock = document.querySelector("#smithMergeBlock");
  if (mode === "merge") {
    upgradeBlock?.classList.add("hidden");
    mergeBlock?.classList.remove("hidden");
    inventoryFilter = "weapon"; // Common-Waffen sind verschmelzbar — Filter zeigt sie an
    // Reset Smith-Slot wenn vorher etwas drin war
    smithSelectedIndex = null;
    renderSmithSlot();
    renderMergeSlots();
  } else {
    upgradeBlock?.classList.remove("hidden");
    mergeBlock?.classList.add("hidden");
    inventoryFilter = mode; // "weapon" oder "armor"
    // Wenn aktueller Smith-Slot nicht zum Modus passt → leeren
    if (smithSelectedIndex !== null) {
      const inv = player.inventory[smithSelectedIndex];
      const def = inv ? itemDefs[inv.id] : null;
      if (!def || def.type !== mode) smithSelectedIndex = null;
    }
    const label = document.querySelector("#smithModeLabel");
    if (label) label.textContent = mode === "armor" ? "Rüstung legen" : "Waffe legen";
    renderSmithSlot();
  }
  renderInventory();
}

document.querySelectorAll("[data-smith-mode]").forEach((btn) => {
  btn.addEventListener("click", () => applySmithMode(btn.dataset.smithMode));
});

document.querySelector("#mergeClear")?.addEventListener("click", clearMergeSlots);
document.querySelector("#mergeConfirm")?.addEventListener("click", confirmMerge);
// Klick auf leeren Merge-Slot fuellt automatisch aus dem Inventar.
// Klick auf gefuellten Slot entfernt das Item.
// Wichtig: Stacks mit count>1 werden mehrfach genutzt (mehrere Slots → selber Index).
for (let i = 0; i < 3; i += 1) {
  document.querySelector(`#mergeSlot${i}`)?.addEventListener("click", () => {
    if (mergeSlots[i] !== null) {
      mergeSlots[i] = null;
      renderMergeSlots();
      renderInventory();
      return;
    }
    // Welche ID ist bereits in den Slots? Alle Slots müssen identisch sein.
    let existingId = null;
    for (const s of mergeSlots) {
      if (s !== null) { existingId = player.inventory[s]?.id; break; }
    }
    // Wie oft ist jeder Index schon belegt?
    const usageCount = new Map();
    for (const s of mergeSlots) {
      if (s !== null) usageCount.set(s, (usageCount.get(s) || 0) + 1);
    }
    // Finde Inventar-Eintrag dessen restliche count noch nicht aufgebraucht ist.
    for (let idx = 0; idx < player.inventory.length; idx += 1) {
      const inv = player.inventory[idx];
      if (!inv) continue;
      const def = itemDefs[inv.id];
      if (!def || !mergeMap[inv.id]) continue;
      if (existingId && inv.id !== existingId) continue;
      const alreadyUsed = usageCount.get(idx) || 0;
      const available = (inv.count || 1) - alreadyUsed;
      if (available <= 0) continue;
      mergeSlots[i] = idx;
      renderMergeSlots();
      renderInventory();
      return;
    }
    showToast(existingId
      ? `Kein weiteres ${itemDefs[existingId]?.name || "Item"} im Inventar.`
      : "Keine verschmelzbaren Items im Inventar (nur Common-Waffen/Rüstung).");
  });
}

document.querySelector("#traderBuyTab")?.addEventListener("click", () => { traderMode = "buy"; renderTrader(); });
document.querySelector("#traderSellTab")?.addEventListener("click", () => { traderMode = "sell"; renderTrader(); });
document.querySelector("#traderList")?.addEventListener("click", (event) => {
  const b = event.target.closest("button[data-buy]");
  const s = event.target.closest("button[data-sell]");
  if (b) traderBuy(b.dataset.buy, Number(b.dataset.price));
  if (s) traderSell(Number(s.dataset.sell));
});
document.querySelector("#trainerResetBtn")?.addEventListener("click", trainerReset);
document.querySelector("#petToggleBtn")?.addEventListener("click", togglePet);

ui.talentList?.addEventListener("click", (event) => {
  const node = event.target.closest(".talent-node");
  if (!node) return;
  spendTalent(node.dataset.nodeId);
});
ui.resetTalents?.addEventListener("click", resetTalentsAction);

ui.classChoices?.addEventListener("click", (event) => {
  const card = event.target.closest(".class-card");
  if (!card) return;
  renderClassSelect(card.dataset.classId);
});

ui.classConfirm?.addEventListener("click", () => {
  const classId = ui.classConfirm.dataset.classId || player.classId;
  if (charCreateMode && pendingCharName) {
    const newChar = createCharacter(pendingCharName, classId);
    charCreateMode = false;
    pendingCharName = null;
    ui.classOverlay.classList.add("hidden");
    enterGameWithCharacter(newChar);
    showToast(`${newChar.name} erstellt. ${getClassDef(classId).name} gewaehlt.`);
    return;
  }
  applyClass(classId, true);
  ui.classOverlay.classList.add("hidden");
  saveCurrentCharacter();
  showToast(`${getClassDef(player.classId).name} gewaehlt. Deine Skills sind bereit.`);
});

ui.classChange?.addEventListener("click", () => {
  charCreateMode = false;
  renderClassSelect(player.classId);
  closeAllOverlays();
  ui.classOverlay.classList.remove("hidden");
});

ui.pvpModeDuel?.addEventListener("click", () => selectPvpMode("duel"));
ui.pvpModeRace?.addEventListener("click", () => selectPvpMode("race"));

document.querySelectorAll("[data-bot-class]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pvpBotClass = btn.dataset.botClass;
    document.querySelectorAll("[data-bot-class]").forEach((b) => b.classList.toggle("active", b === btn));
  });
});
ui.pvpBotToggle?.addEventListener("click", () => togglePvpBot());

function togglePvpBot() {
  if (pvpBotActive) {
    pvpBotActive = false;
    pvpBotEntity = null;
    pvpBotRespawnTimer = 0;
    if (ui.pvpBotStatus) ui.pvpBotStatus.textContent = "Aus";
    if (ui.pvpBotToggle) ui.pvpBotToggle.textContent = "Bot starten";
    // Zurück zur vorherigen Welt
    if (currentWorldId === "arena") {
      travelToWorld(preArenaWorldId || "meadows", "south");
    }
    showToast("Bot-Training beendet.");
    return;
  }
  // Arena betreten
  if (currentWorldId !== "arena") preArenaWorldId = currentWorldId;
  travelToArena();
  pvpBotActive = true;
  spawnPvpBot();
  if (ui.pvpBotStatus) ui.pvpBotStatus.textContent = "Aktiv";
  if (ui.pvpBotToggle) ui.pvpBotToggle.textContent = "Bot stoppen";
  showToast(`Arena: ${getClassDef(pvpBotClass).name}-Bot wartet.`);
}

function travelToArena() {
  currentWorldId = "arena";
  applyWorldSize();
  mobs.length = 0;
  stones.length = 0;
  droppedItems.length = 0;
  projectiles.length = 0;
  seedWorld(); // im Race-Modus zentraler Stein
  player.x = world.w / 2 - 200;
  player.y = world.h / 2;
  player.invuln = 2;
  portalCooldown = 2.2;
  cameraShake = 0.3;
  skillFlashes.push({ color: "#7a6cf2", life: 0.3, maxLife: 0.3 });
}

function spawnPvpBot() {
  const classDef = getClassDef(pvpBotClass);
  const angle = Math.random() * Math.PI * 2;
  const r = 220;
  let bx = player.x + Math.cos(angle) * r;
  let by = player.y + Math.sin(angle) * r;
  if (inSafeZone(bx, by, 80)) {
    bx = player.x + 280;
    by = player.y;
  }
  bx = clamp(bx, 80, world.w - 80);
  by = clamp(by, 80, world.h - 80);
  pvpBotEntity = {
    x: bx, y: by,
    r: 22,
    hp: Math.round(classDef.stats.maxHp * 1.15),
    maxHp: Math.round(classDef.stats.maxHp * 1.15),
    speed: classDef.stats.speed * 0.78,
    damage: Math.round((classDef.stats.baseAttack + classDef.stats.attackBonus) * 2.4),
    classId: classDef.id,
    name: `${classDef.name}-Bot`,
    color: classDef.color,
    hitTimer: 0,
    attackCd: 0,
    isPvpBot: true,
  };
  pvpBotAttackCd = 0;
}

function nearestRaceStone() {
  let best = null;
  let bd = Infinity;
  for (const s of stones) {
    if (s.hp <= 0) continue;
    const d = Math.hypot(s.x - player.x, s.y - player.y);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function updatePvpBot(dt) {
  if (!pvpBotActive) return;
  if (!pvpBotEntity) {
    pvpBotRespawnTimer -= dt;
    if (pvpBotRespawnTimer <= 0) spawnPvpBot();
    return;
  }
  const b = pvpBotEntity;
  const raceMode = pvpMode === "race";
  const raceTarget = raceMode ? nearestRaceStone() : null;
  const targetX = raceTarget ? raceTarget.x : player.x;
  const targetY = raceTarget ? raceTarget.y : player.y;
  const dx = targetX - b.x;
  const dy = targetY - b.y;
  const d = Math.hypot(dx, dy) || 1;
  const isRanged = getClassDef(b.classId).weaponStyle === "staff";
  const targetDist = isRanged ? 240 : 50;
  // Move toward / away
  if (d > targetDist + 10) {
    b.x += (dx / d) * b.speed * dt;
    b.y += (dy / d) * b.speed * dt;
  } else if (d < targetDist - 30 && isRanged) {
    b.x -= (dx / d) * b.speed * dt * 0.6;
    b.y -= (dy / d) * b.speed * dt * 0.6;
  }
  // Respect safe zone — bot cannot enter
  if (inSafeZone(b.x, b.y)) {
    const ang = Math.atan2(b.y - blacksmith.y, b.x - blacksmith.x);
    b.x = blacksmith.x + Math.cos(ang) * (SAFE_ZONE_RADIUS + 4);
    b.y = blacksmith.y + Math.sin(ang) * (SAFE_ZONE_RADIUS + 4);
  }
  b.hitTimer = Math.max(0, b.hitTimer - dt);
  b.attackCd = Math.max(0, b.attackCd - dt);

  // Race mode: attack metin stone
  if (raceMode && raceTarget && b.attackCd <= 0 && d < (isRanged ? 320 : raceTarget.r + 30)) {
    damageStone(raceTarget, Math.round(b.damage * 0.35));
    b.attackCd = isRanged ? 0.9 : 0.7;
    return;
  }
  // Attack if in range and player not in safe zone
  if (!raceMode && !inSafeZone(player.x, player.y) && player.invuln <= 0 && b.attackCd <= 0) {
    if (isRanged && d < 360) {
      const ang = Math.atan2(dy, dx);
      projectiles.push({
        x: b.x + Math.cos(ang) * 24,
        y: b.y + Math.sin(ang) * 24,
        vx: Math.cos(ang) * 420,
        vy: Math.sin(ang) * 420,
        range: 380,
        travelled: 0,
        color: b.color,
        glow: "rgba(85,215,255,0.5)",
        damage: Math.round(b.damage * 0.55),
        owner: "bot",
        pierce: 1,
        hits: new Set(),
        life: 1.4,
      });
      b.attackCd = 1.2;
    } else if (!isRanged && d < 70) {
      const def = totalDefense();
      const dmg = Math.max(3, Math.round(b.damage * 0.55 - def * 0.5));
      player.hp -= dmg;
      player.invuln = 0.5;
      floatText(player.x, player.y - 36, `-${dmg}`, "#ff5d62");
      b.attackCd = 0.9;
    }
  }
  if (b.hp <= 0) {
    burstParticles(b.x, b.y, b.color, 30);
    skillFlashes.push({ color: b.color, life: 0.2, maxLife: 0.2 });
    pvpBotScore += 1;
    if (ui.pvpBotScore) ui.pvpBotScore.textContent = pvpBotScore;
    showToast(`Bot besiegt! +1 Sieg (${pvpBotScore} gesamt).`);
    pvpBotEntity = null;
    pvpBotRespawnTimer = 3.5;
  }
}

function damagePvpBot(amount) {
  if (!pvpBotEntity) return false;
  pvpBotEntity.hp -= amount;
  pvpBotEntity.hitTimer = 0.18;
  floatText(pvpBotEntity.x, pvpBotEntity.y - 42, `-${Math.round(amount)}`, "#ffd86b");
  return true;
}

function drawPvpBot() {
  if (!pvpBotEntity) return;
  const b = pvpBotEntity;
  const classDef = getClassDef(b.classId);
  drawBlockPerson(b.x, b.y, {
    head: "#f3c7a1",
    body: classDef.color,
    arms: "#f3c7a1",
    legs: classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : "#21513d",
  }, 1.05, 0, b.hitTimer > 0, classDef.bodyAccent, classDef.accent);
  drawHealth(b.x, b.y - 72, 60, b.hp / b.maxHp);
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff8d7a";
  ctx.fillText(b.name, b.x, b.y - 84);
}
ui.pvpReady?.addEventListener("click", () => togglePvpReady());

const typeOrder = { weapon: 0, armor: 1, potion: 2, material: 3 };
const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };

function sortInventoryBy(mode) {
  const equipWeapon = equippedWeaponItem();
  const equipArmor = equippedArmorItem();
  const list = player.inventory;
  const cmp = {
    power: (a, b) => itemPowerScore(b) - itemPowerScore(a),
    rarity: (a, b) => (rarityOrder[itemDefs[a.id]?.rarity] ?? 9) - (rarityOrder[itemDefs[b.id]?.rarity] ?? 9)
      || itemPowerScore(b) - itemPowerScore(a),
    type: (a, b) => (typeOrder[itemDefs[a.id]?.type] ?? 9) - (typeOrder[itemDefs[b.id]?.type] ?? 9)
      || (rarityOrder[itemDefs[a.id]?.rarity] ?? 9) - (rarityOrder[itemDefs[b.id]?.rarity] ?? 9),
    name: (a, b) => itemDefs[a.id].name.localeCompare(itemDefs[b.id].name),
  }[mode] || cmp.power;
  list.sort(cmp);
  player.weaponIndex = equipWeapon ? list.indexOf(equipWeapon) : -1;
  player.armorIndex = equipArmor ? list.indexOf(equipArmor) : -1;
  renderInventory();
  saveCurrentCharacter();
}

ui.sortInventory.addEventListener("change", (e) => sortInventoryBy(e.target.value));

function showItemTooltip(slot) {
  if (!ui.itemTooltip) return;
  const name = slot.dataset.tooltipName;
  if (!name) return;
  const rarity = slot.dataset.tooltipRarity || "";
  const stat = slot.dataset.tooltipStat || "";
  const action = slot.dataset.tooltipAction || "";
  const color = slot.style.getPropertyValue("--item-color") || "#f4f0df";
  const affixes = slot.dataset.tooltipAffixes || "";
  ui.itemTooltip.innerHTML = `
    <strong style="color:${color}">${name}</strong>
    <small class="tt-rarity">${rarity}</small>
    <span class="tt-stat">${stat}</span>
    ${affixes ? `<span class="tt-affixes">${affixes}</span>` : ""}
    ${action ? `<span class="tt-action">${action}</span>` : ""}
  `;
  const rect = slot.getBoundingClientRect();
  ui.itemTooltip.style.left = `${rect.left - 8}px`;
  ui.itemTooltip.style.top = `${rect.top - 8}px`;
  ui.itemTooltip.classList.add("show");
  ui.itemTooltip.setAttribute("aria-hidden", "false");
}

function hideItemTooltip() {
  if (!ui.itemTooltip) return;
  ui.itemTooltip.classList.remove("show");
  ui.itemTooltip.setAttribute("aria-hidden", "true");
}

ui.inventory.addEventListener("mouseover", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || slot.classList.contains("empty")) return hideItemTooltip();
  showItemTooltip(slot);
});
ui.inventory.addEventListener("mouseleave", hideItemTooltip);

const smithInventoryEl = document.querySelector("#smithInventory");
smithInventoryEl?.addEventListener("mouseover", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || slot.classList.contains("empty")) return hideItemTooltip();
  showItemTooltip(slot);
});
smithInventoryEl?.addEventListener("mouseleave", hideItemTooltip);
smithInventoryEl?.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || slot.classList.contains("empty")) return;
  const index = Number(slot.dataset.index);
  const invItem = player.inventory[index];
  if (!invItem) return;
  const def = itemDefs[invItem.id];
  if (smithMode === "merge") {
    if (slot.classList.contains("merge-disabled")) return;
    if (!mergeMap[invItem.id]) {
      showToast("Nur Common-Waffen/Rüstung sind verschmelzbar.");
      return;
    }
    tryAddToMerge(index);
    return;
  }
  // Upgrade-Modus
  if (def.type !== smithMode) {
    showToast(smithMode === "weapon" ? "Wähle eine Waffe." : "Wähle eine Rüstung.");
    return;
  }
  selectSmithItem(index);
});

document.querySelectorAll("[data-inv-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    inventoryFilter = btn.dataset.invFilter;
    document.querySelectorAll("[data-inv-filter]").forEach((b) => b.classList.toggle("active", b === btn));
    renderInventory();
  });
});

function showAbilityTooltip(btn) {
  if (!ui.itemTooltip) return;
  const name = btn.dataset.tooltipName;
  const hint = btn.dataset.tooltipHint;
  const key = btn.dataset.tooltipKey;
  if (!name) return;
  const color = getComputedStyle(btn).getPropertyValue("--ability-color") || "#f4c95d";
  ui.itemTooltip.innerHTML = `
    <strong style="color:${color}">${name}</strong>
    <small class="tt-rarity">Taste ${key}</small>
    <span class="tt-stat">${hint || ""}</span>
  `;
  const rect = btn.getBoundingClientRect();
  ui.itemTooltip.style.left = `${rect.left}px`;
  ui.itemTooltip.style.top = `${rect.top - 8}px`;
  ui.itemTooltip.classList.add("show");
}

document.querySelector(".action-bar")?.addEventListener("mouseover", (event) => {
  const btn = event.target.closest(".action-slot");
  if (!btn || !btn.dataset.tooltipName) return hideItemTooltip();
  showAbilityTooltip(btn);
});
document.querySelector(".action-bar")?.addEventListener("mouseleave", hideItemTooltip);

ui.inventory.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || slot.classList.contains("empty")) return;
  const index = Number(slot.dataset.index);
  const invItem = player.inventory[index];
  const def = itemDefs[invItem.id];
  // Wenn Schmied-Overlay offen → Item für Aufwertung waehlen statt equippen
  const smithOpen = ui.smithOverlay && !document.querySelector("#smithOverlay").classList.contains("hidden");
  if (smithOpen && (def.type === "weapon" || def.type === "armor")) {
    selectSmithItem(index);
    return;
  }
  if (def.type === "potion") usePotion();
  if (def.type === "weapon") equipWeapon(index);
  if (def.type === "armor") equipArmor(index);
});

ui.authUsername.value = localStorage.getItem("blocpugnaUser") || "";
ui.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginWithUsername();
});
ui.registerButton.addEventListener("click", registerWithUsername);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function colorMix(hex, alpha = 1) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) || 255;
  const g = parseInt(value.slice(2, 4), 16) || 255;
  const b = parseInt(value.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function firebaseApi() {
  return window.blocpugnaFirebase || null;
}

function waitForFirebase() {
  if (firebaseApi()) return Promise.resolve(firebaseApi());
  return new Promise((resolve) => {
    window.addEventListener("blocpugna-firebase-ready", () => resolve(firebaseApi()), { once: true });
  });
}

function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18);
}

async function hashPassword(username, password) {
  const data = new TextEncoder().encode(`blocpugna:${username}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setAuthMessage(text) {
  ui.authMessage.textContent = text;
}

async function registerWithUsername() {
  const api = await waitForFirebase();
  const username = normalizeUsername(ui.authUsername.value);
  const password = ui.authPassword.value;
  if (username.length < 3 || password.length < 4) {
    setAuthMessage("Username mindestens 3 Zeichen, Passwort mindestens 4 Zeichen.");
    return;
  }
  const userRef = api.ref(api.database, `blocpugna/users/${username}`);
  const existing = await api.get(userRef);
  if (existing.exists()) {
    setAuthMessage("Username ist schon vergeben.");
    return;
  }
  await api.set(userRef, {
    passwordHash: await hashPassword(username, password),
    createdAt: Date.now(),
  });
  await startMultiplayerSession(username);
}

async function loginWithUsername() {
  const api = await waitForFirebase();
  const username = normalizeUsername(ui.authUsername.value);
  const password = ui.authPassword.value;
  if (username.length < 3 || password.length < 4) {
    setAuthMessage("Username oder Passwort zu kurz.");
    return;
  }
  const userRef = api.ref(api.database, `blocpugna/users/${username}`);
  const existing = await api.get(userRef);
  if (!existing.exists()) {
    setAuthMessage("Username nicht gefunden. Erst registrieren.");
    return;
  }
  const passwordHash = await hashPassword(username, password);
  if (existing.val().passwordHash !== passwordHash) {
    setAuthMessage("Passwort stimmt nicht.");
    return;
  }
  await startMultiplayerSession(username);
}

async function startMultiplayerSession(username) {
  authUser = username;
  authColor = colorForName(username);
  localStorage.setItem("blocpugnaUser", username);
  ui.playerNameText.textContent = `${username}`;
  ui.authOverlay.classList.add("hidden");
  showCharacterSelect();
}

async function connectMultiplayer() {
  if (!authUser || multiplayerReady) return;
  const api = await waitForFirebase();
  ui.playerNameText.textContent = `${authUser} online`;
  playerRef = api.ref(api.database, `blocpugna/rooms/${multiplayerRoom}/players/${authUser}`);
  await api.onDisconnect(playerRef).remove();
  await syncPresence(true);
  const playersRef = api.ref(api.database, `blocpugna/rooms/${multiplayerRoom}/players`);
  unsubscribePlayers = api.onValue(playersRef, (snapshot) => {
    const value = snapshot.val() || {};
    delete value[authUser];
    remotePlayers = value;
  });
  multiplayerReady = true;
  showToast(`${authUser} ist verbunden. Freunde sehen dich jetzt auf der Map.`);
  await startWorldSync();
  startHostMaintenance();
}

// === CHARACTER SYSTEM ===
function charsKey(username) {
  return `blocpugnaChars:${username}`;
}

function loadCharacters(username = authUser) {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(charsKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCharacterList(list, username = authUser) {
  if (!username) return;
  localStorage.setItem(charsKey(username), JSON.stringify(list));
}

function serializeCurrentCharacter() {
  if (!currentCharId) return null;
  return {
    id: currentCharId,
    name: player.charName || "Held",
    classId: player.classId,
    level: player.level,
    xp: player.xp,
    nextXp: player.nextXp,
    gold: player.gold,
    hp: Math.max(1, Math.ceil(player.hp)),
    maxHp: player.maxHp,
    baseAttack: player.baseAttack,
    attackBonus: player.attackBonus,
    armorLevel: player.armorLevel,
    mobsKilled: player.mobsKilled,
    stonesKilled: player.stonesKilled,
    inventory: player.inventory.map((e) => ({ ...e })),
    weapon: player.weapon,
    weaponIndex: player.weaponIndex,
    armorIndex: player.armorIndex,
    talents: { ...(player.talents || {}) },
    talentPoints: player.talentPoints || 0,
    pets: { ...(player.pets || {}) },
    activePet: player.activePet || null,
    courierState: courierState ? { ...courierState } : null,
    trainerLastReset,
    lastPlayedAt: Date.now(),
  };
}

function saveCurrentCharacter() {
  if (!authUser || !currentCharId) return;
  const snap = serializeCurrentCharacter();
  if (!snap) return;
  const list = loadCharacters();
  const idx = list.findIndex((c) => c.id === currentCharId);
  if (idx >= 0) list[idx] = snap;
  else list.push(snap);
  saveCharacterList(list);
}

function applyCharacter(char) {
  currentCharId = char.id;
  player.charName = char.name;
  applyClass(char.classId, false);
  player.level = char.level || 1;
  player.xp = char.xp || 0;
  player.nextXp = char.nextXp || 50;
  player.gold = char.gold || 0;
  player.maxHp = char.maxHp || player.maxHp;
  player.hp = Math.min(player.maxHp, char.hp || player.maxHp);
  player.baseAttack = char.baseAttack ?? player.baseAttack;
  player.attackBonus = char.attackBonus ?? player.attackBonus;
  player.armorLevel = char.armorLevel ?? player.armorLevel;
  player.mobsKilled = char.mobsKilled || 0;
  player.stonesKilled = char.stonesKilled || 0;
  player.inventory = (char.inventory || []).map((e) => ({ ...e }));
  if (!player.inventory.length) {
    player.inventory = defaultPlayerState.inventory.map((e) => ({ ...e }));
  }
  player.weapon = char.weapon || defaultPlayerState.weapon;
  player.weaponIndex = char.weaponIndex ?? defaultPlayerState.weaponIndex;
  player.armorIndex = char.armorIndex ?? defaultPlayerState.armorIndex;
  player.talents = { ...(char.talents || {}) };
  player.talentPoints = char.talentPoints || 0;
  player.pets = { ...(char.pets || {}) };
  player.activePet = char.activePet || null;
  courierState = char.courierState || null;
  trainerLastReset = char.trainerLastReset || 0;
  if (player.activePet) initPetRuntime();
  renderTalents();
  player.x = blacksmith.x;
  player.y = blacksmith.y + 120;
  player.invuln = 2;
  renderInventory();
  updateUi();
  saveCurrentCharacter();
}

function createCharacter(name, classId) {
  const id = `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const classDef = getClassDef(classId);
  const stats = classDef.stats;
  const starterWeapon = classDef.starterWeapon || "rust_sword";
  const inventory = [
    item("health_potion", 3),
    item(starterWeapon, 1),
    item("leather_armor", 1),
  ].map((e) => ({ ...e, upgrade: 0 }));
  const char = {
    id,
    name,
    classId,
    level: 1,
    xp: 0,
    nextXp: 50,
    gold: 0,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    baseAttack: stats.baseAttack,
    attackBonus: stats.attackBonus,
    armorLevel: stats.armorLevel,
    mobsKilled: 0,
    stonesKilled: 0,
    inventory,
    weapon: starterWeapon,
    weaponIndex: 1,
    armorIndex: 2,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
  const list = loadCharacters();
  list.push(char);
  saveCharacterList(list);
  return char;
}

function deleteCharacter(charId) {
  const list = loadCharacters().filter((c) => c.id !== charId);
  saveCharacterList(list);
  if (currentCharId === charId) currentCharId = null;
  renderCharList();
}

function renderCharList() {
  if (!ui.charList) return;
  const list = loadCharacters().sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
  ui.charList.innerHTML = "";
  if (list.length === 0) {
    ui.charList.innerHTML = `<p class="char-empty">Noch keine Charaktere. Erstelle deinen ersten Helden.</p>`;
    return;
  }
  for (const c of list) {
    const classDef = getClassDef(c.classId);
    const card = document.createElement("div");
    card.className = "char-card";
    card.style.setProperty("--class-color", classDef.color);
    card.innerHTML = `
      <div class="char-card-head">
        <strong>${escapeHtml(c.name)}</strong>
        <span class="char-card-class">${classDef.name}</span>
      </div>
      <div class="char-card-stats">
        <span>LVL <strong>${c.level}</strong></span>
        <span>HP <strong>${c.maxHp}</strong></span>
        <span>Gold <strong>${c.gold}</strong></span>
      </div>
      <div class="char-card-actions">
        <button type="button" data-action="play" data-id="${c.id}" class="primary">Spielen</button>
        <button type="button" data-action="delete" data-id="${c.id}" class="danger">Loeschen</button>
      </div>
    `;
    ui.charList.append(card);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function showCharacterSelect() {
  if (!ui.charSelectOverlay) return;
  if (ui.charSelectUser) ui.charSelectUser.textContent = `Eingeloggt als ${authUser}`;
  renderCharList();
  ui.charSelectOverlay.classList.remove("hidden");
  ui.charCreateOverlay?.classList.add("hidden");
  ui.classOverlay?.classList.add("hidden");
}

function hideCharacterSelect() {
  ui.charSelectOverlay?.classList.add("hidden");
  ui.charCreateOverlay?.classList.add("hidden");
}

async function enterGameWithCharacter(char) {
  hideCharacterSelect();
  applyCharacter(char);
  await connectMultiplayer();
  scheduleTutorial(char);
}

const TUTORIAL_FLAG = "blocpugnaTutorialSeen";
function scheduleTutorial(char) {
  // Nur beim allerersten Char und nur einmal pro Browser zeigen
  if (localStorage.getItem(TUTORIAL_FLAG)) return;
  if ((char.level || 1) > 1) return;
  const steps = [
    { delay: 1500, text: "Willkommen in den Pugna-Wiesen! Bewegen mit WASD oder Pfeiltasten." },
    { delay: 8000, text: "Maus zielen, Linksklick oder Leertaste schlägt zu." },
    { delay: 16000, text: "Schmied steht in der Mitte. Drücke F um zu schmieden." },
    { delay: 24000, text: "G/H/J sprechen mit Händlerin, Trainerin und Kurier." },
    { delay: 32000, text: "Drücke B für den Codex — alle Mobs + Bosse + Drops." },
    { delay: 40000, text: "Geh durch ein Portal am Rand der Welt — die anderen Welten warten." },
  ];
  for (const s of steps) {
    setTimeout(() => {
      if (player.hp > 0) showToast(s.text);
    }, s.delay);
  }
  localStorage.setItem(TUTORIAL_FLAG, "1");
}

ui.charList?.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const char = loadCharacters().find((c) => c.id === id);
  if (!char) return;
  if (btn.dataset.action === "play") {
    enterGameWithCharacter(char);
  } else if (btn.dataset.action === "delete") {
    if (confirm(`${char.name} wirklich loeschen?`)) deleteCharacter(id);
  }
});

ui.charCreateBtn?.addEventListener("click", () => {
  pendingCharName = null;
  charCreateMode = true;
  if (ui.charNameInput) ui.charNameInput.value = "";
  if (ui.charCreateMessage) ui.charCreateMessage.textContent = "";
  ui.charSelectOverlay?.classList.add("hidden");
  ui.charCreateOverlay?.classList.remove("hidden");
  ui.charNameInput?.focus();
});

ui.charCreateCancel?.addEventListener("click", () => {
  charCreateMode = false;
  ui.charCreateOverlay?.classList.add("hidden");
  showCharacterSelect();
});

ui.charCreateNext?.addEventListener("click", () => {
  const name = (ui.charNameInput?.value || "").trim();
  if (name.length < 2) {
    if (ui.charCreateMessage) ui.charCreateMessage.textContent = "Name mindestens 2 Zeichen.";
    return;
  }
  if (loadCharacters().some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    if (ui.charCreateMessage) ui.charCreateMessage.textContent = "Name existiert bereits.";
    return;
  }
  pendingCharName = name;
  ui.charCreateOverlay?.classList.add("hidden");
  renderClassSelect();
  ui.classOverlay?.classList.remove("hidden");
});

ui.charLogoutBtn?.addEventListener("click", () => {
  saveCurrentCharacter();
  location.reload();
});

ui.switchCharBtn?.addEventListener("click", () => {
  saveCurrentCharacter();
  closeAllOverlays();
  showCharacterSelect();
});

window.addEventListener("beforeunload", () => saveCurrentCharacter());
setInterval(() => saveCurrentCharacter(), 10000);

function colorForName(name) {
  const colors = ["#55d7ff", "#f4c95d", "#51d37a", "#c084fc", "#ff8a65", "#7dd3fc"];
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return colors[sum % colors.length];
}

async function syncPresence(force = false) {
  if (!authUser || !playerRef) return;
  const now = performance.now();
  if (!force && now - lastPresenceSync < 120) return;
  lastPresenceSync = now;
  const api = firebaseApi();
  if (!api) return;
  const weapon = currentWeapon();
  await api.set(playerRef, {
    name: authUser,
    color: authColor,
    x: Math.round(player.x),
    y: Math.round(player.y),
    hp: Math.max(0, Math.ceil(player.hp)),
    maxHp: player.maxHp,
    level: player.level,
    classId: player.classId,
    worldId: currentWorldId,
    weapon: weapon.id,
    weaponUpgrade: equippedWeaponItem()?.upgrade || 0,
    armorLevel: player.armorLevel,
    updatedAt: Date.now(),
  });
}

// === SHARED WORLD ===
const HOST_HEARTBEAT_MS = 1800;
const HOST_TIMEOUT_MS = 5500;
const WORLD_TICK_MS = 150;

let isHost = false;
let currentHostName = null;
let currentHostTs = 0;
let worldRefs = null;
let worldUnsubscribers = [];
const lootClaimsInFlight = new Set();
const processedGrants = new Set();
let hostMaintenanceStarted = false;
let initialSnapshotApplied = false;

function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function buildWorldRefs(api) {
  const base = `blocpugna/rooms/${multiplayerRoom}/world`;
  return {
    host: api.ref(api.database, `${base}/host`),
    mobs: api.ref(api.database, `${base}/mobs`),
    stones: api.ref(api.database, `${base}/stones`),
    loot: api.ref(api.database, `${base}/loot`),
    hits: api.ref(api.database, `${base}/hits`),
    grants: api.ref(api.database, `${base}/grants`),
    pvp: api.ref(api.database, `${base}/pvp`),
    base,
  };
}

function serializeMob(m) {
  const out = {
    x: Math.round(m.x),
    y: Math.round(m.y),
    hp: Math.max(0, Math.ceil(m.hp)),
    maxHp: m.maxHp,
    r: m.r,
    rank: m.rank,
    name: m.name,
    color: m.color,
    scale: m.scale,
    speed: m.speed,
    damage: m.damage,
    xp: m.xp,
    elite: !!m.elite,
    dmgBy: m.dmgBy || null,
    ts: Date.now(),
  };
  if (m.bossDef) {
    out.bossDefId = m.bossDef.id;
    out.bossPhase = m.bossPhase || 1;
    if (m.novaCharge > 0) out.novaCharge = m.novaCharge;
    if (m.charges) {
      // Nur Telegraph-Zeit sync, nicht alle Daten
      out.charges = {};
      for (const k of Object.keys(m.charges)) {
        out.charges[k] = { t: m.charges[k].t, max: m.charges[k].max, x: m.charges[k].x, y: m.charges[k].y };
      }
    }
  }
  if (m.skin) out.skin = m.skin;
  if (m.level) out.level = m.level;
  if (m.passive) out.passive = true;
  return out;
}

function serializeStone(s) {
  return {
    x: Math.round(s.x),
    y: Math.round(s.y),
    hp: Math.max(0, Math.ceil(s.hp)),
    maxHp: s.maxHp,
    pvpTarget: !!s.pvpTarget,
    dmgBy: s.dmgBy || null,
    ts: Date.now(),
  };
}

function applyWorldMobs(map) {
  if (isHost) return;
  const seen = new Set();
  const byId = new Map();
  for (const m of mobs) if (m.serverId) byId.set(m.serverId, m);
  for (const [id, raw] of Object.entries(map || {})) {
    if (!raw) continue;
    seen.add(id);
    // bossDefId → echtes bossDef-Objekt (kommt aus Client-Daten)
    const enriched = { ...raw };
    if (raw.bossDefId) enriched.bossDef = bosses[raw.bossDefId] || null;
    const ex = byId.get(id);
    if (ex) {
      Object.assign(ex, enriched);
    } else {
      mobs.push({ serverId: id, hitTimer: 0, ...enriched });
    }
  }
  // remove ghosts: anything not present in the authoritative snapshot,
  // including locally-seeded mobs without a serverId
  for (let i = mobs.length - 1; i >= 0; i -= 1) {
    if (!mobs[i].serverId || !seen.has(mobs[i].serverId)) mobs.splice(i, 1);
  }
  initialSnapshotApplied = true;
}

function applyWorldStones(map) {
  if (isHost) return;
  const seen = new Set();
  const byId = new Map();
  for (const s of stones) if (s.serverId) byId.set(s.serverId, s);
  for (const [id, raw] of Object.entries(map || {})) {
    if (!raw) continue;
    seen.add(id);
    const ex = byId.get(id);
    if (ex) {
      Object.assign(ex, raw);
    } else {
      stones.push({ serverId: id, pulse: Math.random() * 10, hitTimer: 0, r: 38, ...raw });
    }
  }
  for (let i = stones.length - 1; i >= 0; i -= 1) {
    if (!stones[i].serverId || !seen.has(stones[i].serverId)) stones.splice(i, 1);
  }
}

function applyWorldLoot(map) {
  const seen = new Set();
  const byId = new Map();
  for (const d of droppedItems) if (d.serverId) byId.set(d.serverId, d);
  for (const [id, raw] of Object.entries(map || {})) {
    if (!raw) continue;
    seen.add(id);
    const ex = byId.get(id);
    if (ex) {
      ex.owner = raw.owner;
      ex.ownerLockUntil = raw.ownerLockUntil;
      ex.x = raw.x;
      ex.y = raw.y;
    } else {
      droppedItems.push({ serverId: id, ...raw, bob: Math.random() * 10 });
    }
  }
  for (let i = droppedItems.length - 1; i >= 0; i -= 1) {
    if (droppedItems[i].serverId && !seen.has(droppedItems[i].serverId)) droppedItems.splice(i, 1);
  }
}

function applyGrants(map) {
  const api = firebaseApi();
  for (const [id, grant] of Object.entries(map || {})) {
    if (!grant || processedGrants.has(id)) continue;
    if (grant.to === authUser) {
      if (grant.gold) player.gold += grant.gold;
      if (grant.xp) gainXp(grant.xp);
      if (grant.kill === "mob") player.mobsKilled += 1;
      if (grant.kill === "stone") player.stonesKilled += 1;
      processedGrants.add(id);
    }
    if (isHost && api && worldRefs && Date.now() - (grant.ts || 0) > 12000) {
      api.remove(api.ref(api.database, `${worldRefs.base}/grants/${id}`));
    }
  }
}

async function pushGrant(to, payload) {
  const api = firebaseApi();
  if (!api || !worldRefs) return;
  if (to === authUser) {
    if (payload.gold) player.gold += payload.gold;
    if (payload.xp) gainXp(payload.xp);
    if (payload.kill === "mob") player.mobsKilled += 1;
    if (payload.kill === "stone") player.stonesKilled += 1;
    return;
  }
  const id = nextId("g");
  await api.set(api.ref(api.database, `${worldRefs.base}/grants/${id}`), { to, ts: Date.now(), ...payload });
}

async function publishLoot(loot) {
  const api = firebaseApi();
  if (!api || !worldRefs) return;
  const id = nextId("l");
  await api.set(api.ref(api.database, `${worldRefs.base}/loot/${id}`), { ...loot, ts: Date.now() });
}

function topDamager(dmgBy) {
  if (!dmgBy) return null;
  let winner = null;
  let best = -1;
  for (const [name, dmg] of Object.entries(dmgBy)) {
    if (dmg > best) { best = dmg; winner = name; }
  }
  return winner;
}

function applyQueuedHit(hit) {
  const arr = hit.type === "mob" ? mobs : stones;
  const target = arr.find((t) => t.serverId === hit.id);
  if (!target) return;
  target.hp -= hit.dmg;
  target.hitTimer = 0.16;
  target.dmgBy = target.dmgBy || {};
  target.dmgBy[hit.by] = (target.dmgBy[hit.by] || 0) + hit.dmg;
  if (target.hp <= 0) {
    if (target.pvpTarget) {
      target.hp = target.maxHp;
      burst(target.x, target.y, "#f4c95d", 42);
      return;
    }
    if (hit.type === "mob") hostKillMob(target);
    else hostKillStone(target);
  }
}

function pushHit(target, dmg) {
  if (!multiplayerReady || !worldRefs) return false;
  const api = firebaseApi();
  if (!api || !target.serverId) return false;
  if (isHost) {
    applyQueuedHit({ type: target.kind, id: target.serverId, dmg, by: authUser, ts: Date.now() });
  } else {
    const id = nextId("h");
    api.set(api.ref(api.database, `${worldRefs.base}/hits/${id}`), {
      type: target.kind, id: target.serverId, dmg, by: authUser, ts: Date.now(),
    });
  }
  return true;
}

function hostKillMob(mob) {
  const idx = mobs.indexOf(mob);
  if (idx >= 0) mobs.splice(idx, 1);
  const api = firebaseApi();
  if (api && worldRefs && mob.serverId) {
    api.remove(api.ref(api.database, `${worldRefs.base}/mobs/${mob.serverId}`));
  }
  const owner = topDamager(mob.dmgBy);
  dropLoot(mob.x, mob.y, mob.rank || (mob.elite ? "elite" : "mob"), owner);
  pushGrant(owner || authUser, { xp: mob.xp, kill: "mob" });
  burst(mob.x, mob.y, mob.color || "#ff6b6b", mob.rank === "boss" ? 70 : mob.rank === "miniboss" ? 42 : 24);
  if (mob.rank === "boss") showToast(`${mob.name} besiegt: Boss-Loot liegt am Boden.`);
  else if (mob.rank === "miniboss") showToast(`${mob.name} besiegt: starker Loot liegt am Boden.`);
  setTimeout(() => {
    const point = randomPointAwayFromPlayer(680);
    spawnMob(point.x, point.y, Math.random() < 0.24 ? "elite" : "mob");
  }, 850);
}

function hostKillStone(stone) {
  const idx = stones.indexOf(stone);
  if (idx >= 0) stones.splice(idx, 1);
  const api = firebaseApi();
  if (api && worldRefs && stone.serverId) {
    api.remove(api.ref(api.database, `${worldRefs.base}/stones/${stone.serverId}`));
  }
  const owner = topDamager(stone.dmgBy);
  dropLoot(stone.x, stone.y, "metin", owner);
  pushGrant(owner || authUser, { xp: 90, kill: "stone" });
  burst(stone.x, stone.y, "#c084fc", 50);
  showToast("Metin-Stein zerstoert: seltener Loot liegt am Boden.");
  setTimeout(() => {
    spawnStone(180 + Math.random() * (world.w - 360), 160 + Math.random() * (world.h - 320));
  }, 7000);
}

async function claimLoot(entry) {
  if (!entry.serverId) return;
  if (lootClaimsInFlight.has(entry.serverId)) return;
  if (entry.ownerLockUntil && Date.now() < entry.ownerLockUntil && entry.owner && entry.owner !== authUser) return;
  lootClaimsInFlight.add(entry.serverId);
  const api = firebaseApi();
  try {
    const lootRef = api.ref(api.database, `${worldRefs.base}/loot/${entry.serverId}`);
    const result = await api.runTransaction(lootRef, (cur) => (cur ? null : undefined));
    if (result.committed) {
      addInventory(entry.id, entry.count);
      const idx = droppedItems.indexOf(entry);
      if (idx >= 0) droppedItems.splice(idx, 1);
    }
  } catch (err) {
    console.warn("claimLoot", err);
  } finally {
    lootClaimsInFlight.delete(entry.serverId);
  }
}

async function hostTick() {
  if (!isHost || !worldRefs) return;
  const api = firebaseApi();
  if (!api) return;
  const mobsOut = {};
  for (const m of mobs) {
    if (!m.serverId) m.serverId = nextId("m");
    mobsOut[m.serverId] = serializeMob(m);
  }
  const stonesOut = {};
  for (const s of stones) {
    if (!s.serverId) s.serverId = nextId("s");
    stonesOut[s.serverId] = serializeStone(s);
  }
  await Promise.all([
    api.set(worldRefs.mobs, mobsOut),
    api.set(worldRefs.stones, stonesOut),
  ]);
}

async function hostHeartbeat() {
  if (!isHost) return;
  const api = firebaseApi();
  if (!api || !worldRefs) return;
  await api.set(worldRefs.host, { name: authUser, ts: Date.now() });
}

async function tryBecomeHost() {
  const api = firebaseApi();
  if (!api || !worldRefs || !authUser) return;
  try {
    const result = await api.runTransaction(worldRefs.host, (cur) => {
      const now = Date.now();
      if (cur && cur.name && cur.ts && now - cur.ts < HOST_TIMEOUT_MS) return undefined;
      return { name: authUser, ts: now };
    });
    const val = result?.snapshot?.val();
    if (result.committed && val?.name === authUser) {
      isHost = true;
      currentHostName = authUser;
      showToast("Du bist Host: Welt wird von dir verwaltet.");
      const existing = await api.get(worldRefs.mobs);
      const empty = !existing.exists() || Object.keys(existing.val() || {}).length === 0;
      if (empty) {
        if (mobs.length === 0 && stones.length === 0) seedWorld();
        for (const m of mobs) if (!m.serverId) m.serverId = nextId("m");
        for (const s of stones) if (!s.serverId) s.serverId = nextId("s");
        await hostTick();
      }
      const hitsSnap = await api.get(worldRefs.hits);
      const queued = hitsSnap.val() || {};
      for (const [id, hit] of Object.entries(queued)) {
        if (!hit) continue;
        applyQueuedHit(hit);
        api.remove(api.ref(api.database, `${worldRefs.base}/hits/${id}`));
      }
    }
  } catch (err) {
    console.warn("tryBecomeHost", err);
  }
}

async function startWorldSync() {
  const api = firebaseApi();
  if (!api) return;
  worldRefs = buildWorldRefs(api);

  worldUnsubscribers.push(api.onValue(worldRefs.host, (snap) => {
    const val = snap.val();
    currentHostName = val?.name || null;
    currentHostTs = val?.ts || 0;
    if (isHost && currentHostName && currentHostName !== authUser) {
      isHost = false;
      showToast(`Host-Wechsel: ${currentHostName} verwaltet jetzt die Welt.`);
    }
  }));

  worldUnsubscribers.push(api.onValue(worldRefs.mobs, (snap) => applyWorldMobs(snap.val())));
  worldUnsubscribers.push(api.onValue(worldRefs.stones, (snap) => applyWorldStones(snap.val())));
  worldUnsubscribers.push(api.onValue(worldRefs.loot, (snap) => applyWorldLoot(snap.val())));
  worldUnsubscribers.push(api.onValue(worldRefs.grants, (snap) => applyGrants(snap.val())));
  worldUnsubscribers.push(api.onValue(worldRefs.pvp, (snap) => applyPvpSnapshot(snap.val() || {})));
  worldUnsubscribers.push(api.onValue(worldRefs.hits, (snap) => {
    if (!isHost) return;
    const all = snap.val() || {};
    for (const [id, hit] of Object.entries(all)) {
      if (!hit) continue;
      applyQueuedHit(hit);
      api.remove(api.ref(api.database, `${worldRefs.base}/hits/${id}`));
    }
  }));

  await tryBecomeHost();
}

function startHostMaintenance() {
  if (hostMaintenanceStarted) return;
  hostMaintenanceStarted = true;
  setInterval(async () => {
    if (!multiplayerReady) return;
    if (isHost) {
      await hostHeartbeat();
    } else if (!currentHostName || Date.now() - currentHostTs > HOST_TIMEOUT_MS) {
      await tryBecomeHost();
    }
  }, HOST_HEARTBEAT_MS);
  setInterval(() => {
    if (isHost) hostTick();
  }, WORLD_TICK_MS);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const camState = { x: 0, y: 0, lookX: 0, lookY: 0 };
function camera() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  // Lookahead in Maus-Richtung (max 80px)
  const aim = Math.atan2(mouse.y - h / 2, mouse.x - w / 2);
  const targetLookX = Math.cos(aim) * 80;
  const targetLookY = Math.sin(aim) * 80;
  camState.lookX += (targetLookX - camState.lookX) * 0.08;
  camState.lookY += (targetLookY - camState.lookY) * 0.08;
  const targetX = clamp(player.x + camState.lookX - w / 2, 0, world.w - w);
  const targetY = clamp(player.y + camState.lookY - h / 2, 0, world.h - h);
  // Lerp Camera-Position
  camState.x += (targetX - camState.x) * 0.12;
  camState.y += (targetY - camState.y) * 0.12;
  return {
    x: camState.x,
    y: camState.y,
    w,
    h,
  };
}

function breakInvisOnAttack() {
  if ((player.invisTimer || 0) > 0) {
    player.invisTimer = 0;
    skillFlashes.push({ color: "#c4b8ff", life: 0.15, maxLife: 0.15 });
    floatText(player.x, player.y - 50, "Sichtbar!", "#c4b8ff");
  }
}

function swing() {
  if (player.attackCooldown > 0 || player.hp <= 0) return;
  breakInvisOnAttack();
  // Swing-Animation auslösen
  const weaponNow = currentWeapon();
  player.swingAnim = { t: weaponNow.cooldown || 0.42, max: weaponNow.cooldown || 0.42 };
  const weapon = currentWeapon();
  const classDef = getClassDef(player.classId);
  player.attackCooldown = weapon.cooldown || 0.42;
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);

  // Ranged path (Magier / staff) — aber Bär-Form ist immer Melee
  const isRanged = (weapon.style === "staff" || classDef.weaponStyle === "staff") && !(player.bearForm > 0);
  if (isRanged) {
    fireProjectile(weapon, classDef, angle);
    return;
  }

  const reach = weapon.reach || 82;
  const arcX = player.x + Math.cos(angle) * reach;
  const arcY = player.y + Math.sin(angle) * reach;
  let hit = false;

  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - arcX, mob.y - arcY) < mob.r + 52 || dist(player, mob) < mob.r + reach - 28) {
      const { dmg, crit } = applyCritAndLifesteal(attackPower());
      damageMob(mob, dmg, crit ? { tag: "combo" } : {});
      if (crit) floatText(mob.x, mob.y - 50, "CRIT!", "#ff9540");
      hit = true;
    }
  }
  for (const stone of [...stones]) {
    if (Math.hypot(stone.x - arcX, stone.y - arcY) < stone.r + 56 || dist(player, stone) < stone.r + reach - 24) {
      damageStone(stone, attackPower());
      hit = true;
    }
  }
  if (pvpBotEntity) {
    const b = pvpBotEntity;
    if (Math.hypot(b.x - arcX, b.y - arcY) < 50 || dist(player, b) < b.r + reach - 24) {
      damagePvpBot(attackPower());
      hit = true;
    }
  }
  if (isPvpActive()) {
    for (const remote of Object.values(remotePlayers)) {
      if (Math.hypot(remote.x - arcX, remote.y - arcY) < 58 || Math.hypot(remote.x - player.x, remote.y - player.y) < reach + 10) {
        hit = damageRemotePlayer(remote, attackPower()) || hit;
      }
    }
  }
  weaponTrails.push({
    x: player.x,
    y: player.y - 12,
    angle,
    reach,
    color: weapon.color,
    glow: weapon.glow,
    rarity: weapon.rarity,
    life: 0.22,
    maxLife: 0.22,
  });
  for (let i = 0; i < 14; i += 1) {
    particles.push({
      x: player.x + Math.cos(angle) * (34 + Math.random() * 42),
      y: player.y + Math.sin(angle) * (34 + Math.random() * 42),
      vx: Math.cos(angle + (Math.random() - 0.5) * 1.2) * (80 + Math.random() * 160),
      vy: Math.sin(angle + (Math.random() - 0.5) * 1.2) * (80 + Math.random() * 160),
      life: 0.24,
      color: hit ? weapon.color : "#d9dee5",
      size: 4,
    });
  }
  if (weapon.rarity === "epic") {
    for (let i = 0; i < 10; i += 1) {
      particles.push({
        x: arcX + (Math.random() - 0.5) * 36,
        y: arcY + (Math.random() - 0.5) * 36,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        life: 0.32,
        color: weapon.color,
        size: 5,
      });
    }
  }
}

function fireProjectile(weapon, classDef, angle) {
  const proj = weapon.projectile || { speed: 480, color: weapon.color || "#9ee7ff", glow: weapon.glow || "rgba(85,215,255,0.4)" };
  const speed = proj.speed || 480;
  const range = weapon.reach || 360;
  const dmg = Math.round(attackPower() * 0.85);
  projectiles.push({
    x: player.x + Math.cos(angle) * 28,
    y: player.y - 6 + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    range,
    travelled: 0,
    color: proj.color,
    glow: proj.glow,
    damage: dmg,
    owner: "player",
    pierce: (weapon.rarity === "legendary" ? 5 : weapon.rarity === "epic" ? 4 : 3) + Math.floor(talentEffect("piercebonus")),
    hits: new Set(),
    life: 1.6,
  });
  // Cast partikel (kein Bildschirm-Flash bei Auto-Attack)
  for (let i = 0; i < 6; i += 1) {
    particles.push({
      x: player.x + Math.cos(angle) * 22,
      y: player.y + Math.sin(angle) * 22,
      vx: -Math.cos(angle) * (40 + Math.random() * 80),
      vy: -Math.sin(angle) * (40 + Math.random() * 80),
      life: 0.18,
      color: proj.color,
      size: 3,
    });
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    const dx = p.vx * dt;
    const dy = p.vy * dt;
    p.x += dx;
    p.y += dy;
    p.travelled += Math.hypot(dx, dy);
    p.life -= dt;
    let consumed = false;

    // Hit mobs
    for (const mob of [...mobs]) {
      if (p.hits.has(mob)) continue;
      if (Math.hypot(p.x - mob.x, p.y - mob.y) < mob.r + 14) {
        if (p.owner === "player") {
          const isStaff = p.color === "#9ee7ff" || (currentWeapon().style === "staff");
          const bossMult = isStaff && (mob.rank === "boss" || mob.rank === "miniboss") ? 1.5 : 1;
          const { dmg, crit } = applyCritAndLifesteal(p.damage * bossMult);
          damageMob(mob, dmg, crit ? { tag: "combo" } : {});
          if (crit) floatText(mob.x, mob.y - 50, "CRIT!", "#ff9540");
        } else if (p.owner === "pet") {
          damageMob(mob, p.damage);
        } else {
          damageMob(mob, p.damage);
        }
        p.hits.add(mob);
        p.pierce -= 1;
        if (p.pierce <= 0) consumed = true;
        burstParticles(p.x, p.y, p.color, 10);
        break;
      }
    }
    if (!consumed) {
      for (const stone of [...stones]) {
        if (p.hits.has(stone)) continue;
        if (Math.hypot(p.x - stone.x, p.y - stone.y) < stone.r + 14) {
          damageStone(stone, p.damage);
          p.hits.add(stone);
          p.pierce -= 1;
          if (p.pierce <= 0) consumed = true;
          burstParticles(p.x, p.y, p.color, 12);
          break;
        }
      }
    }
    if (!consumed && p.owner === "player" && pvpBotEntity) {
      if (Math.hypot(p.x - pvpBotEntity.x, p.y - pvpBotEntity.y) < 30) {
        damagePvpBot(p.damage);
        p.hits.add(pvpBotEntity);
        p.pierce -= 1;
        if (p.pierce <= 0) consumed = true;
        burstParticles(p.x, p.y, p.color, 10);
      }
    }
    if (!consumed && p.owner === "bot" && !inSafeZone(player.x, player.y)) {
      if (Math.hypot(p.x - player.x, p.y - player.y) < player.r + 12 && player.invuln <= 0) {
        const def = totalDefense();
        const dmg = Math.max(2, Math.round(p.damage - def * 0.4));
        player.hp -= dmg;
        player.invuln = 0.4;
        floatText(player.x, player.y - 36, `-${dmg}`, "#ff5d62");
        consumed = true;
        burstParticles(p.x, p.y, p.color, 8);
      }
    }
    if (!consumed && isPvpActive()) {
      for (const remote of Object.values(remotePlayers)) {
        if (Math.hypot(p.x - remote.x, p.y - remote.y) < 32) {
          damageRemotePlayer(remote, p.damage);
          consumed = true;
          burstParticles(p.x, p.y, p.color, 10);
          break;
        }
      }
    }
    if (consumed || p.travelled > p.range || p.life <= 0 || p.x < 0 || p.y < 0 || p.x > world.w || p.y > world.h) {
      projectiles.splice(i, 1);
    }
  }
}

function burstParticles(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.5) * 240,
      life: 0.3,
      color,
      size: 4,
    });
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    const angle = Math.atan2(p.vy, p.vx);
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    // Trail
    ctx.fillStyle = p.glow;
    ctx.fillRect(-26, -10, 32, 20);
    // Core
    ctx.fillStyle = p.color;
    ctx.fillRect(-8, -5, 16, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}

function drawSkillFlashes() {
  for (const f of skillFlashes) {
    const pct = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, pct) * 0.35;
    ctx.fillStyle = f.color;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawLowHpVignette() {
  const hpPct = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  if (hpPct > 0.3 || player.hp <= 0) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const intensity = (0.3 - hpPct) / 0.3; // 0..1
  const pulse = 0.55 + Math.sin(performance.now() / 220) * 0.45;
  const alpha = (0.18 + intensity * 0.35) * pulse;
  ctx.save();
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.65);
  grad.addColorStop(0, "rgba(255, 28, 40, 0)");
  grad.addColorStop(0.55, `rgba(255, 28, 40, ${alpha * 0.45})`);
  grad.addColorStop(1, `rgba(180, 0, 0, ${alpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function updateLavaPools(dt) {
  if ((player.poolTickAccum || 0) < 0) player.poolTickAccum = 0;
  player.poolTickAccum = (player.poolTickAccum || 0) + dt;
  const tick = player.poolTickAccum >= 0.5;
  if (tick) player.poolTickAccum = 0;
  for (let i = lavaPools.length - 1; i >= 0; i -= 1) {
    const p = lavaPools[i];
    p.life -= dt;
    if (p.life <= 0) { lavaPools.splice(i, 1); continue; }
    if (tick) {
      const inside = Math.hypot(player.x - p.x, player.y - p.y) < p.radius;
      if (inside && player.invuln <= 0) {
        const dmg = Math.max(2, Math.round(p.damage * 0.5 - totalDefense() * 0.3));
        player.hp -= dmg;
        floatText(player.x, player.y - 28, `-${dmg}`, p.color);
        if (p.isPoison) applyStatus(player, "poisoned", 2);
        if (p.slow) player.frostSlowTimer = Math.max(player.frostSlowTimer || 0, 1.2);
      }
    }
    // Whirlpool pull
    if (p.isWhirlpool) {
      const dx = p.centerX - player.x;
      const dy = p.centerY - player.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < p.radius) {
        player.x += (dx / d) * p.pull * dt;
        player.y += (dy / d) * p.pull * dt;
      }
    }
  }
}

function drawLavaPools() {
  for (const p of lavaPools) {
    const lifePct = p.life / 5;
    const flicker = 0.6 + Math.sin(performance.now() / 100 + p.x) * 0.2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(p.color, 0.22 * lifePct * flicker);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(p.color, 0.7 * lifePct);
    ctx.lineWidth = 2;
    ctx.stroke();
    // Innere Hitze-Funken
    ctx.fillStyle = hexToRgba(p.color, 0.55 * lifePct);
    for (let i = 0; i < 3; i += 1) {
      const a = (performance.now() / 200 + i * 2) % (Math.PI * 2);
      const r = p.radius * 0.6;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawComboHud() {
  if (comboCount < 2) return;
  const x = canvas.clientWidth / 2;
  const y = 60;
  const pct = comboTimer / 2.5;
  const tier = Math.min(5, Math.floor(comboCount / 3));
  const color = ["#86efac", "#fbbf24", "#fb923c", "#f97316", "#ef4444", "#d946ef"][tier];
  ctx.save();
  ctx.font = `bold ${28 + tier * 4}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillText(`${comboCount} COMBO`, x, y);
  ctx.shadowBlur = 0;
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`+${tier * 5}% Damage  |  Timer ${comboTimer.toFixed(1)}s`, x, y + 14);
  // Timer-Bar
  const bw = 160;
  ctx.fillStyle = "rgba(10,14,18,0.7)";
  ctx.fillRect(x - bw / 2, y + 20, bw, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - bw / 2, y + 20, bw * Math.max(0, pct), 4);
  ctx.restore();
}

function comboDamageMult() {
  const tier = Math.min(5, Math.floor(comboCount / 3));
  return 1 + tier * 0.05;
}

function drawMobAttackTelegraphs() {
  for (const mob of mobs) {
    if (!mob.attackTelegraph || mob.attackTelegraph <= 0) continue;
    if (mob.bossDef) continue; // Bosse haben eigene Telegraphs
    const pct = mob.attackTelegraph / 0.18;
    ctx.save();
    ctx.globalAlpha = 0.4 + pct * 0.4;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2 + pct * 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mob.x, mob.y);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawDyingMobs() {
  for (const d of dyingMobs) {
    const pct = d.life / d.maxLife;
    const scale = d.scale * pct;
    ctx.save();
    ctx.globalAlpha = Math.max(0, pct);
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot * (1 - pct));
    // Generischer Block-Person
    ctx.fillStyle = d.color;
    ctx.fillRect(-18 * scale, -22 * scale, 36 * scale, 34 * scale);
    ctx.fillStyle = "#f3c7a1";
    ctx.fillRect(-15 * scale, -54 * scale, 30 * scale, 30 * scale);
    ctx.restore();
    // Fading ring
    ctx.save();
    ctx.globalAlpha = pct * 0.5;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(d.x, d.y, (1 - pct) * 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBossCharges() {
  // Telegraph-Kreise für AoE-Bosses
  for (const mob of mobs) {
    if (!mob.charges || !mob.bossDef) continue;
    for (const key of Object.keys(mob.charges)) {
      const c = mob.charges[key];
      const ab = mob.bossDef.abilities[key];
      if (!ab) continue;
      const pct = 1 - c.t / c.max;
      ctx.save();
      const tx = c.x ?? mob.x;
      const ty = c.y ?? mob.y;
      ctx.beginPath();
      ctx.arc(tx, ty, ab.radius || 100, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(ab.color, 0.08 + pct * 0.2);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(ab.color, 0.6 + pct * 0.4);
      ctx.lineWidth = 3 + pct * 4;
      ctx.setLineDash([14, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = ab.color;
      ctx.fillText(`${(ab.hint || key).split(" ")[0]} ${c.t.toFixed(1)}s`, tx, ty - (ab.radius || 100) - 10);
      ctx.restore();
    }
  }
}

function updateSkillFlashes(dt) {
  for (let i = skillFlashes.length - 1; i >= 0; i -= 1) {
    skillFlashes[i].life -= dt;
    if (skillFlashes[i].life <= 0) skillFlashes.splice(i, 1);
  }
}

function useAbility(abilityId) {
  if (!abilityId || player.hp <= 0 || abilityCooldown(abilityId) > 0) return;
  const ability = getAbilityDef(abilityId);
  // Schatten-Doppel selbst bricht Invis nicht — alle anderen Offensive-Abilities schon
  if (abilityId !== "shadowDouble") breakInvisOnAttack();
  const handlers = {
    shieldBash,
    whirlwind,
    shadowStep,
    poisonMark,
    fireOrb,
    frostCircle,
    earthquake,
    shadowDouble,
    meteor,
    rootSnare,
    swarmCall,
    bearForm,
  };
  handlers[abilityId]?.();
  setAbilityCooldown(abilityId);
  skillFlashes.push({ color: ability.color || "#f4c95d", life: 0.18, maxLife: 0.18 });
  if (ability.ultimate) sfx.ulti(); else sfx.skill();
  const btn = abilityId === primaryAbilityId() ? ui.skillPrimary
    : abilityId === secondaryAbilityId() ? ui.skillSecondary
    : ui.skillUltimate;
  flashActionSlot(btn);
  showToast(`${ability.name} eingesetzt.`);
}

function flashActionSlot(el) {
  if (!el) return;
  el.classList.remove("firing");
  void el.offsetWidth;
  el.classList.add("firing");
  setTimeout(() => el.classList.remove("firing"), 380);
}

function shieldBash() {
  const m = mastery("shieldBash");
  const dmgMult = 0.8 * (1 + m * 0.20);
  const stunDur = 1.5 + m * 0.4;
  const angle = aimAngle();
  const impact = pointAhead(92, angle);
  let hit = false;
  for (const mob of [...mobs]) {
    if (!isInCone(mob, angle, 150, 56)) continue;
    applyStatus(mob, "stunned", stunDur);
    mob.x += Math.cos(angle) * 36;
    mob.y += Math.sin(angle) * 36;
    damageMob(mob, Math.floor(attackPower() * dmgMult), { tag: "stun" });
    hit = true;
  }
  for (const remote of Object.values(remotePlayers)) {
    if (isPointInCone(remote, angle, 150, 56)) {
      hit = damageRemotePlayer(remote, attackPower() * (dmgMult + 0.05), "stun") || hit;
    }
  }
  burst(impact.x, impact.y, "#f4c95d", hit ? 28 : 14);
}

function whirlwind() {
  const m = mastery("whirlwind");
  const radius = 154 * (1 + m * 0.12);
  const dmgMult = 1.18 * (1 + m * 0.15);
  let hit = false;
  for (const mob of [...mobs]) {
    const d = dist(player, mob);
    if (d > radius + mob.r) continue;
    const stunnedBonus = statusTime(mob, "stunned") > 0 ? 1.55 : 1;
    damageMob(mob, Math.floor(attackPower() * dmgMult * stunnedBonus), { tag: stunnedBonus > 1 ? "combo" : "sweep" });
    hit = true;
  }
  for (const stone of [...stones]) {
    if (dist(player, stone) < radius + stone.r) damageStone(stone, Math.floor(attackPower() * (dmgMult - 0.03)));
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - player.x, remote.y - player.y) < radius) {
      hit = damageRemotePlayer(remote, attackPower() * (dmgMult - 0.03), "combo") || hit;
    }
  }
  crescentWaves.push({ x: player.x, y: player.y - 12, angle: 0, range: radius, radius: radius, life: 0.34, maxLife: 0.34, color: "#f4c95d", radial: true });
  burst(player.x, player.y, hit ? "#f4c95d" : "#d9dee5", 28);
}

function shadowStep() {
  const m = mastery("shadowStep");
  const range = 280 + m * 40;
  const angle = aimAngle();
  player.x = clamp(player.x + Math.cos(angle) * range, player.r, world.w - player.r);
  player.y = clamp(player.y + Math.sin(angle) * range, player.r, world.h - player.r);
  player.dashCritWindow = 2.0;
  // 30% Heal + 5% pro Mastery
  const heal = Math.round(player.maxHp * (0.30 + m * 0.05));
  player.hp = Math.min(player.maxHp, player.hp + heal);
  floatText(player.x, player.y - 50, `+${heal} HP`, "#51d37a");
  for (let i = 0; i < 36; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: player.x + Math.cos(a) * 32,
      y: player.y - 18 + Math.sin(a) * 32,
      vx: Math.cos(a) * 110,
      vy: Math.sin(a) * 110,
      life: 0.6,
      color: i % 3 === 0 ? "#51d37a" : "#6f63ff",
      size: 5,
    });
  }
}

function spawnPoisonSpit(angle) {
  // Sprite-Projektil (rein visuell) — fliegt vom Spieler in Kegelmitte
  const count = 14;
  for (let i = 0; i < count; i += 1) {
    const spread = (Math.random() - 0.5) * 0.5;
    const a = angle + spread;
    const speed = 220 + Math.random() * 180;
    const offsetT = i * 0.012;
    setTimeout(() => {
      particles.push({
        x: player.x + Math.cos(angle) * 22,
        y: player.y - 14 + Math.sin(angle) * 22,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed + (Math.random() - 0.5) * 40,
        life: 0.6 + Math.random() * 0.3,
        color: i % 3 === 0 ? "#bbf7a0" : "#35d0a4",
        size: 4 + Math.random() * 3,
      });
    }, offsetT * 1000);
  }
  // Spuck-Tropfen-Trail kurz und dick
  for (let i = 0; i < 6; i += 1) {
    particles.push({
      x: player.x + Math.cos(angle) * (12 + i * 6),
      y: player.y - 10 + Math.sin(angle) * (12 + i * 6),
      vx: Math.cos(angle) * 60,
      vy: Math.sin(angle) * 60 - 20,
      life: 0.35,
      color: "#84a665",
      size: 6,
    });
  }
}

function poisonMark() {
  const m = mastery("poisonMark");
  const poisonDur = 5 + m;
  const dotMult = 1 + m * 0.10;
  const angle = aimAngle();
  let marked = 0;
  spawnPoisonSpit(angle);
  for (const mob of [...mobs]) {
    if (!isInCone(mob, angle, 260, 105)) continue;
    applyStatus(mob, "marked", 7);
    applyStatus(mob, "poisoned", poisonDur);
    mob.poisonDotMult = dotMult; // tickStatuses liest das
    damageMob(mob, Math.floor(attackPower() * 0.75), { tag: "mark" });
    marked += 1;
  }
  for (const remote of Object.values(remotePlayers)) {
    if (isPointInCone(remote, angle, 260, 105)) {
      marked += damageRemotePlayer(remote, attackPower() * 0.75, "mark") ? 1 : 0;
    }
  }
  const impact = pointAhead(170, angle);
  burst(impact.x, impact.y, marked ? "#35d0a4" : "#6f63ff", 18 + marked * 3);
}

function fireOrb() {
  const m = mastery("fireOrb");
  const angle = aimAngle();
  const impact = pointAhead(260, angle);
  const radius = 170 * (1 + m * 0.10);
  const dmgMult = 1 + m * 0.15;
  // Visuals: explosion ring + sparks + screen flash
  crescentWaves.push({
    x: impact.x, y: impact.y, angle: 0, range: radius * 1.2, radius: radius * 1.2,
    color: "#ff7a3d", life: 0.6, maxLife: 0.6,
  });
  for (let i = 0; i < 60; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * radius;
    particles.push({
      x: impact.x + Math.cos(a) * d * 0.3,
      y: impact.y + Math.sin(a) * d * 0.3,
      vx: Math.cos(a) * (220 + Math.random() * 280),
      vy: Math.sin(a) * (220 + Math.random() * 280),
      life: 0.5 + Math.random() * 0.3,
      color: i % 3 === 0 ? "#fff0a8" : i % 2 === 0 ? "#ff9540" : "#e84628",
      size: 4 + Math.random() * 3,
    });
  }
  skillFlashes.push({ color: "#ff7a3d", life: 0.25, maxLife: 0.25 });

  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - impact.x, mob.y - impact.y) > radius + mob.r) continue;
    const marked = statusTime(mob, "marked") > 0;
    damageMob(mob, Math.floor(attackPower() * (marked ? 2.1 : 1.4) * dmgMult), { tag: marked ? "detonate" : "fire" });
    if (marked) applyStatus(mob, "marked", 0);
    applyStatus(mob, "burning", 4);
  }
  for (const stone of [...stones]) {
    if (Math.hypot(stone.x - impact.x, stone.y - impact.y) < radius + stone.r) damageStone(stone, Math.floor(attackPower() * 1.3 * dmgMult));
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - impact.x, remote.y - impact.y) < radius) {
      damageRemotePlayer(remote, attackPower() * 1.4 * dmgMult, "detonate");
    }
  }
  if (pvpBotEntity && Math.hypot(pvpBotEntity.x - impact.x, pvpBotEntity.y - impact.y) < radius) {
    damagePvpBot(attackPower() * 1.5 * dmgMult);
  }
  burst(impact.x, impact.y, "#e86f36", 40);
}

// === ULTIS ===
function earthquake() {
  const m = mastery("earthquake");
  const radius = 280 * (1 + m * 0.10);
  const dmgMult = 1 + m * 0.20;
  // unten in damageMob-Call dmgMult anwenden
  // Big shockwave ring
  crescentWaves.push({
    x: player.x, y: player.y, angle: 0, range: radius, radius,
    color: "#f4c95d", life: 0.9, maxLife: 0.9,
  });
  for (let i = 0; i < 90; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * 0.4 + Math.random() * radius * 0.6;
    particles.push({
      x: player.x + Math.cos(a) * 30,
      y: player.y + Math.sin(a) * 30,
      vx: Math.cos(a) * (260 + Math.random() * 220),
      vy: Math.sin(a) * (260 + Math.random() * 220) - 60,
      life: 0.7 + Math.random() * 0.3,
      color: i % 2 === 0 ? "#f4c95d" : "#a87c2c",
      size: 5 + Math.random() * 3,
    });
  }
  skillFlashes.push({ color: "#f4c95d", life: 0.35, maxLife: 0.35 });
  cameraShake = 0.6;
  for (const mob of [...mobs]) {
    if (dist(player, mob) > radius + mob.r) continue;
    damageMob(mob, Math.floor(attackPower() * 2.4 * dmgMult), { tag: "combo" });
    applyStatus(mob, "stunned", 2.4);
    const ang = Math.atan2(mob.y - player.y, mob.x - player.x);
    mob.x += Math.cos(ang) * 60;
    mob.y += Math.sin(ang) * 60;
  }
  for (const stone of [...stones]) {
    if (dist(player, stone) < radius + stone.r) damageStone(stone, Math.floor(attackPower() * 1.8 * dmgMult));
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - player.x, remote.y - player.y) < radius) {
      damageRemotePlayer(remote, attackPower() * 1.9 * dmgMult, "combo");
    }
  }
  if (pvpBotEntity && dist(player, pvpBotEntity) < radius) {
    damagePvpBot(attackPower() * 2.4 * dmgMult);
  }
  showToast("Erdbeben! Alles fliegt.");
}

function shadowDouble() {
  const m = mastery("shadowDouble");
  const invisDur = 3.5 + m;
  const maxHp = Math.round(player.maxHp * 0.6);
  shadowDecoy = {
    x: player.x,
    y: player.y,
    hp: maxHp,
    maxHp,
    life: 6,
    maxLife: 6,
    classId: player.classId,
    detonateMult: 1 + m * 0.15,
  };
  const angle = aimAngle();
  player.x = clamp(player.x - Math.cos(angle) * 180, player.r, world.w - player.r);
  player.y = clamp(player.y - Math.sin(angle) * 180, player.r, world.h - player.r);
  player.invisTimer = invisDur;
  player.invuln = 0.5;
  // Visuelle Effekte
  skillFlashes.push({ color: "#7a6cf2", life: 0.35, maxLife: 0.35 });
  for (let i = 0; i < 36; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: shadowDecoy.x,
      y: shadowDecoy.y,
      vx: Math.cos(a) * 180,
      vy: Math.sin(a) * 180,
      life: 0.5,
      color: "#7a6cf2",
      size: 4,
    });
  }
  showToast("Schatten-Doppel: Du bist unsichtbar!");
}

function updateShadowDecoy(dt) {
  if (!shadowDecoy) return;
  shadowDecoy.life -= dt;
  // Mobs greifen den Decoy an statt den Spieler — wir nehmen Aggro über reduzierte Distanz weg
  for (const mob of mobs) {
    const dDecoy = Math.hypot(mob.x - shadowDecoy.x, mob.y - shadowDecoy.y);
    if (dDecoy < mob.r + 30) {
      // Decoy nimmt Schaden
      shadowDecoy.hp -= mob.damage * dt * 1.5;
      mob.hitTimer = 0.1;
    }
  }
  if (shadowDecoy.hp <= 0 || shadowDecoy.life <= 0) {
    detonateShadowDecoy();
  }
}

function detonateShadowDecoy() {
  if (!shadowDecoy) return;
  const radius = 220;
  const dmg = Math.round(attackPower() * 2.2 * (shadowDecoy.detonateMult || 1));
  crescentWaves.push({
    x: shadowDecoy.x, y: shadowDecoy.y, angle: 0,
    range: radius * 1.1, radius: radius * 1.1,
    color: "#7a6cf2", life: 0.7, maxLife: 0.7,
  });
  for (let i = 0; i < 70; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: shadowDecoy.x, y: shadowDecoy.y,
      vx: Math.cos(a) * (220 + Math.random() * 280),
      vy: Math.sin(a) * (220 + Math.random() * 280),
      life: 0.5,
      color: i % 2 === 0 ? "#c4b8ff" : "#7a6cf2",
      size: 4,
    });
  }
  cameraShake = 0.4;
  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - shadowDecoy.x, mob.y - shadowDecoy.y) < radius + mob.r) {
      damageMob(mob, dmg, { tag: "combo" });
    }
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - shadowDecoy.x, remote.y - shadowDecoy.y) < radius) {
      damageRemotePlayer(remote, dmg, "detonate");
    }
  }
  if (pvpBotEntity && Math.hypot(pvpBotEntity.x - shadowDecoy.x, pvpBotEntity.y - shadowDecoy.y) < radius) {
    damagePvpBot(dmg);
  }
  showToast("Doppelgänger detoniert!");
  shadowDecoy = null;
}

function drawShadowDecoy() {
  if (!shadowDecoy) return;
  const classDef = getClassDef(shadowDecoy.classId);
  const flicker = Math.sin(performance.now() / 90) * 0.3 + 0.7;
  ctx.save();
  ctx.globalAlpha = flicker;
  drawBlockPerson(shadowDecoy.x, shadowDecoy.y, {
    head: "#f3c7a1",
    body: classDef.color,
    arms: "#f3c7a1",
    legs: "#26214f",
  }, 1.05, 0, false, classDef.bodyAccent, classDef.accent);
  ctx.restore();
  // HP-Bar
  drawHealth(shadowDecoy.x, shadowDecoy.y - 72, 50, shadowDecoy.hp / shadowDecoy.maxHp);
  // Timer
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#c4b8ff";
  ctx.fillText(`${shadowDecoy.life.toFixed(1)}s`, shadowDecoy.x, shadowDecoy.y - 84);
}

function meteor() {
  const m = mastery("meteor");
  const angle = aimAngle();
  const impact = pointAhead(320, angle);
  const radius = 260 * (1 + m * 0.10);
  const dmgMult = 1 + m * 0.15;
  // Falling meteor visual (instant for now)
  for (let i = 0; i < 4; i += 1) {
    crescentWaves.push({
      x: impact.x, y: impact.y, angle: 0,
      range: radius * (0.6 + i * 0.18),
      radius: radius * (0.6 + i * 0.18),
      color: i === 0 ? "#ffe0a0" : "#ff5d62",
      life: 0.8 - i * 0.1, maxLife: 0.8 - i * 0.1,
    });
  }
  for (let i = 0; i < 120; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * radius;
    particles.push({
      x: impact.x + Math.cos(a) * d * 0.25,
      y: impact.y + Math.sin(a) * d * 0.25 - 80 + Math.random() * 60,
      vx: Math.cos(a) * (260 + Math.random() * 360),
      vy: Math.sin(a) * (180 + Math.random() * 320),
      life: 0.6 + Math.random() * 0.4,
      color: i % 3 === 0 ? "#ffe0a0" : i % 2 === 0 ? "#ff9540" : "#e82828",
      size: 5 + Math.random() * 4,
    });
  }
  skillFlashes.push({ color: "#ff5d62", life: 0.45, maxLife: 0.45 });
  cameraShake = 0.8;
  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - impact.x, mob.y - impact.y) > radius + mob.r) continue;
    damageMob(mob, Math.floor(attackPower() * 3.0 * dmgMult), { tag: "detonate" });
    applyStatus(mob, "burning", 5);
  }
  for (const stone of [...stones]) {
    if (Math.hypot(stone.x - impact.x, stone.y - impact.y) < radius + stone.r) damageStone(stone, Math.floor(attackPower() * 2.4 * dmgMult));
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - impact.x, remote.y - impact.y) < radius) {
      damageRemotePlayer(remote, attackPower() * 2.6 * dmgMult, "detonate");
    }
  }
  if (pvpBotEntity && Math.hypot(pvpBotEntity.x - impact.x, pvpBotEntity.y - impact.y) < radius) {
    damagePvpBot(attackPower() * 3.0 * dmgMult);
  }
  showToast("Meteor!");
}

function rootSnare() {
  const angle = aimAngle();
  let rooted = 0;
  for (const mob of [...mobs]) {
    if (!isInCone(mob, angle, 220, 95)) continue;
    applyStatus(mob, "stunned", 3);
    damageMob(mob, Math.floor(attackPower() * 0.5), { tag: "stun" });
    // Visualisierung
    for (let i = 0; i < 8; i += 1) {
      particles.push({
        x: mob.x + (Math.random() - 0.5) * 30,
        y: mob.y + 20,
        vx: 0,
        vy: -80 - Math.random() * 60,
        life: 0.6,
        color: "#3f7d35",
        size: 4,
      });
    }
    rooted += 1;
  }
  showToast(`${rooted} Gegner verwurzelt.`);
}

function swarmCall() {
  // 5 Insekten spawnen
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    insectSwarm.push({
      x: player.x + Math.cos(a) * 20,
      y: player.y + Math.sin(a) * 20,
      vx: 0, vy: 0,
      life: 4,
      target: null,
      damage: Math.round(attackPower() * 0.18),
    });
  }
}

function bearForm() {
  player.bearForm = 8;
  player.bearFormMaxHpBoost = Math.round(player.maxHp * 0.5);
  player.maxHp += player.bearFormMaxHpBoost;
  player.hp += player.bearFormMaxHpBoost;
  showToast("Bär-Form aktiv: +50% HP, +40% Schaden!");
  for (let i = 0; i < 30; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * 180,
      vy: Math.sin(a) * 180,
      life: 0.6,
      color: i % 2 === 0 ? "#92400e" : "#a3e635",
      size: 4,
    });
  }
}

function updateWeather(dt) {
  const w = getWeather(currentWorldId);
  if (!w) return;
  const cam = camera();
  // Spawn neue Partikel um sicherzustellen dass count erreicht ist
  while (weatherParticles.length < w.count) {
    spawnWeatherParticle(w, cam, true);
  }
  for (let i = weatherParticles.length - 1; i >= 0; i -= 1) {
    const p = weatherParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    // Off-screen oder tot → recyclen
    if (p.life <= 0 || p.x < cam.x - 100 || p.x > cam.x + cam.w + 100 || p.y > cam.y + cam.h + 100 || p.y < cam.y - 100) {
      weatherParticles.splice(i, 1);
    }
  }
}

function spawnWeatherParticle(w, cam, anyPos = false) {
  const x = anyPos
    ? cam.x + Math.random() * cam.w
    : cam.x + Math.random() * cam.w;
  const y = w.type === "rain" || w.type === "snow" || w.type === "pollen"
    ? cam.y - 20
    : w.type === "ash"
      ? cam.y + cam.h + 20
      : cam.y + Math.random() * cam.h;
  const startY = anyPos ? cam.y + Math.random() * cam.h : y;
  let vx = w.direction * 40 + (Math.random() - 0.5) * 20;
  let vy = w.speed;
  if (w.type === "firefly") {
    vx = (Math.random() - 0.5) * 30;
    vy = (Math.random() - 0.5) * 30;
  }
  weatherParticles.push({
    x, y: startY,
    vx, vy,
    life: w.type === "firefly" ? 5 + Math.random() * 3 : 4,
    type: w.type,
    color: w.color,
    size: w.type === "rain" ? 1.5 : w.type === "snow" ? 2.5 : w.type === "ash" ? 2 : w.type === "firefly" ? 3 : 1.8,
  });
}

function drawWeather() {
  const w = getWeather(currentWorldId);
  if (!w) return;
  for (const p of weatherParticles) {
    ctx.save();
    if (p.type === "rain") {
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
    } else if (p.type === "firefly") {
      const flicker = 0.4 + Math.sin(performance.now() / 200 + p.x) * 0.5;
      ctx.globalAlpha = flicker;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.type === "wind") {
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 18, p.y);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function updateInsectSwarm(dt) {
  for (let i = insectSwarm.length - 1; i >= 0; i -= 1) {
    const ins = insectSwarm[i];
    ins.life -= dt;
    if (ins.life <= 0) { insectSwarm.splice(i, 1); continue; }
    // Ziel suchen
    if (!ins.target || ins.target.hp <= 0 || !mobs.includes(ins.target)) {
      let best = null, bd = 400;
      for (const mob of mobs) {
        const d = Math.hypot(mob.x - ins.x, mob.y - ins.y);
        if (d < bd) { bd = d; best = mob; }
      }
      ins.target = best;
    }
    if (ins.target) {
      const dx = ins.target.x - ins.x;
      const dy = ins.target.y - ins.y;
      const d = Math.hypot(dx, dy) || 1;
      ins.vx = (dx / d) * 280;
      ins.vy = (dy / d) * 280;
      if (d < 14) {
        damageMob(ins.target, ins.damage);
        // Insekt geht zurück Richtung Spieler
        ins.target = null;
        ins.life = Math.max(0.4, ins.life - 0.4);
      }
    } else {
      // Idle: zum Spieler zurück
      const dx = player.x - ins.x, dy = player.y - ins.y;
      const d = Math.hypot(dx, dy) || 1;
      ins.vx = (dx / d) * 120;
      ins.vy = (dy / d) * 120;
    }
    ins.x += ins.vx * dt + Math.sin(performance.now() / 80 + i) * 4 * dt;
    ins.y += ins.vy * dt + Math.cos(performance.now() / 80 + i) * 4 * dt;
  }
}

function drawInsectSwarm() {
  for (const ins of insectSwarm) {
    ctx.save();
    ctx.fillStyle = "rgba(163, 230, 53, 0.5)";
    ctx.fillRect(ins.x - 5, ins.y - 5, 10, 10);
    ctx.fillStyle = "#a3e635";
    ctx.fillRect(ins.x - 3, ins.y - 3, 6, 6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(ins.x - 1, ins.y - 1, 2, 2);
    ctx.restore();
  }
}

function frostCircle() {
  const m = mastery("frostCircle");
  const slowDur = 4 + m;
  const dmgMult = 1 + m * 0.10;
  const angle = aimAngle();
  const impact = pointAhead(170, angle);
  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - impact.x, mob.y - impact.y) > 150 + mob.r) continue;
    applyStatus(mob, "frozen", slowDur);
    damageMob(mob, Math.floor(attackPower() * 0.72 * dmgMult), { tag: "frost" });
  }
  for (const remote of Object.values(remotePlayers)) {
    if (Math.hypot(remote.x - impact.x, remote.y - impact.y) < 150) {
      damageRemotePlayer(remote, attackPower() * 0.7, "frost");
    }
  }
  crescentWaves.push({ x: impact.x, y: impact.y, angle: 0, range: 142, radius: 142, life: 0.5, maxLife: 0.5, color: "#9ee7ff", radial: true });
  burst(impact.x, impact.y, "#9ee7ff", 30);
}

function crescentStrike() {
  const weapon = currentWeapon();
  const angle = aimAngle();
  const range = weapon.id === "fullmoon_sickle" ? 360 : weapon.rarity === "legendary" ? 340 : 260;
  const radius = weapon.id === "fullmoon_sickle" ? 130 : 95;
  const damage = Math.floor(attackPower() * (weapon.id === "fullmoon_sickle" ? 1.85 : 1.25));

  crescentWaves.push({
    x: player.x,
    y: player.y - 12,
    angle,
    range,
    radius,
    life: 0.34,
    maxLife: 0.34,
    color: weapon.id === "fullmoon_sickle" ? "#fff2a8" : "#ff343f",
  });

  const impact = { x: player.x + Math.cos(angle) * range * 0.62, y: player.y + Math.sin(angle) * range * 0.62 };
  for (const mob of [...mobs]) {
    if (isInCone(mob, angle, range, radius)) damageMob(mob, damage);
  }
  for (const stone of [...stones]) {
    if (isInCone(stone, angle, range, radius)) damageStone(stone, damage);
  }
  burst(impact.x, impact.y, weapon.id === "fullmoon_sickle" ? "#fff2a8" : "#ff343f", 24);
  showToast("Sichelhieb entfesselt.");
}

function aimAngle() {
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  return Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
}

function pointAhead(distance, angle = aimAngle()) {
  return {
    x: player.x + Math.cos(angle) * distance,
    y: player.y + Math.sin(angle) * distance,
  };
}

function statusTime(target, status) {
  return target.statusEffects?.[status] || 0;
}

function applyStatus(target, status, duration) {
  target.statusEffects = target.statusEffects || {};
  if (duration <= 0) {
    delete target.statusEffects[status];
    return;
  }
  target.statusEffects[status] = Math.max(statusTime(target, status), duration);
}

function tickStatuses(target, dt) {
  if (!target.statusEffects) return;
  target.dotAccum = target.dotAccum || {};
  for (const status of Object.keys(target.statusEffects)) {
    target.statusEffects[status] = Math.max(0, target.statusEffects[status] - dt);
    if (target.statusEffects[status] <= 0) {
      delete target.statusEffects[status];
      continue;
    }
    // DoT ticks
    if (status === "poisoned" || status === "burning") {
      target.dotAccum[status] = (target.dotAccum[status] || 0) + dt;
      if (target.dotAccum[status] >= 0.5) {
        target.dotAccum[status] -= 0.5;
        const poisonMult = target.poisonDotMult || 1;
        const tickDmg = status === "burning"
          ? Math.max(2, Math.round(attackPower() * 0.12))
          : Math.max(2, Math.round(attackPower() * 0.16 * poisonMult));
        const color = status === "burning" ? "#ff7a3d" : "#35d0a4";
        target.hp -= tickDmg;
        target.hitTimer = 0.08;
        floatText(target.x, target.y - 28 - Math.random() * 14, `-${tickDmg}`, color);
        if (target.hp <= 0) {
          // killed by DoT — credit to player
          target.dmgBy = target.dmgBy || {};
          target.dmgBy[authUser || "player"] = (target.dmgBy[authUser || "player"] || 0) + tickDmg;
        }
      }
    }
  }
}

function isInCone(target, angle, range, radius) {
  return isPointInCone(target, angle, range, radius, target.r * 0.6);
}

function isPointInCone(target, angle, range, radius, extraRadius = 18) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const forward = Math.cos(angle) * dx + Math.sin(angle) * dy;
  if (forward < 0 || forward > range) return false;
  const side = Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy);
  return side < radius + extraRadius;
}

function damageMob(mob, amount, options = {}) {
  const classDef = getClassDef(player.classId);
  if (mob.passive && !mob.aggroed) {
    mob.aggroed = true;
    floatText(mob.x, mob.y - 56, "!", "#fbbf24");
  }
  const combo = options.tag === "combo" || options.tag === "detonate";
  const color = combo ? classDef.accent : options.tag === "frost" ? "#9ee7ff" : options.tag === "mark" ? "#35d0a4" : classDef.color;
  floatText(mob.x, mob.y - 28 - mob.r * 0.35, combo ? `KOMBO -${amount}` : `-${amount}`, color);
  mob.hitTimer = 0.14;
  if (multiplayerReady && mob.serverId) {
    pushHit({ kind: "mob", serverId: mob.serverId }, amount);
    return;
  }
  mob.hp -= amount;
  if (mob.hp <= 0) {
    const index = mobs.indexOf(mob);
    if (index >= 0) mobs.splice(index, 1);
    // Sterbe-Animation
    dyingMobs.push({
      x: mob.x, y: mob.y,
      color: mob.color || "#b34d54",
      scale: mob.scale || 1,
      skin: mob.skin || null,
      bossDef: mob.bossDef || null,
      life: 0.5,
      maxLife: 0.5,
      rot: (Math.random() - 0.5) * 6,
    });
    // Combo
    comboCount += 1;
    comboTimer = 2.5;
    player.mobsKilled += 1;
    trackCourierKill();
    gainXp(mob.xp);
    if (mob.bossDef) {
      handleWorldBossDrop(mob);
      cameraShake = 0.7;
      skillFlashes.push({ color: "#ffe0a0", life: 0.5, maxLife: 0.5 });
      // Pet unlocken
      const petDef = mob.bossDef.pet;
      if (petDef) {
        player.pets = player.pets || {};
        if (!player.pets[mob.bossDef.id]) {
          player.pets[mob.bossDef.id] = { bossId: mob.bossDef.id, unlockedAt: Date.now() };
          showToast(`${petDef.name} folgt dir jetzt! Schalte ihn im Charakter-Menü an/aus.`);
        }
        player.activePet = mob.bossDef.id;
        initPetRuntime();
        saveCurrentCharacter();
      }
    } else {
      dropLoot(mob.x, mob.y, mob.rank || (mob.elite ? "elite" : "mob"));
    }
    burst(mob.x, mob.y, mob.color || (mob.elite ? "#c084fc" : "#ff6b6b"), mob.rank === "boss" ? 90 : mob.rank === "miniboss" ? 42 : 24);
    if (mob.bossDef) showToast(mob.bossDef.defeatToast || `${mob.name} besiegt.`);
    else if (mob.rank === "boss") showToast(`${mob.name} besiegt: Boss-Loot liegt am Boden.`);
    else if (mob.rank === "miniboss") showToast(`${mob.name} besiegt: starker Loot liegt am Boden.`);
    setTimeout(() => {
      const point = randomPointAwayFromPlayer(680);
      spawnMob(point.x, point.y, Math.random() < 0.24 ? "elite" : "mob");
    }, 850);
  }
}

function damageStone(stone, amount) {
  if (isPvpRace() && stone.pvpTarget) {
    addPvpScore(authUser, Math.min(amount, Math.max(0, stone.hp)));
  }
  floatText(stone.x, stone.y - 50, `-${amount}`, "#55d7ff");
  burst(stone.x, stone.y, "#55d7ff", 8);
  stone.hitTimer = 0.16;
  if (multiplayerReady && stone.serverId) {
    pushHit({ kind: "stone", serverId: stone.serverId }, amount);
    return;
  }
  stone.hp -= amount;
  // Spawn-Threshold-Check
  const pct = stone.hp / stone.maxHp;
  for (let i = 0; i < (stone.spawnThresholds || []).length; i += 1) {
    const t = stone.spawnThresholds[i];
    if (!stone.spawnedAt.includes(t) && pct <= t && pct > 0) {
      stone.spawnedAt.push(t);
      spawnStoneGuardians(stone);
      break;
    }
  }
  if (stone.pvpTarget && stone.hp <= 0) {
    stone.hp = stone.maxHp;
    burst(stone.x, stone.y, "#f4c95d", 42);
    showToast("PvP-Metin gebrochen: neuer Wertungszyklus startet.");
    return;
  }
  if (stone.hp <= 0) {
    const index = stones.indexOf(stone);
    if (index >= 0) stones.splice(index, 1);
    player.stonesKilled += 1;
    trackCourierStone();
    gainXp(70);
    dropLoot(stone.x, stone.y, "metin");
    burst(stone.x, stone.y, "#c084fc", 50);
    showToast("Metin-Stein zerstoert: seltener Loot liegt am Boden.");
    setTimeout(() => spawnStone(180 + Math.random() * (world.w - 360), 160 + Math.random() * (world.h - 320)), 7000);
  }
}

function armorDrop(source) {
  const roll = Math.random();
  if (source === "boss") {
    if (roll < 0.32) return "dragon_plate";
    if (roll < 0.68) return "steel_armor";
    return "iron_armor";
  }
  if (source === "miniboss") {
    if (roll < 0.12) return "dragon_plate";
    if (roll < 0.45) return "steel_armor";
    if (roll < 0.78) return "iron_armor";
    return "leather_armor";
  }
  if (source === "metin") {
    if (roll < 0.06) return "dragon_plate";
    if (roll < 0.28) return "steel_armor";
    if (roll < 0.58) return "iron_armor";
    return "leather_armor";
  }
  if (source === "elite") {
    if (roll < 0.10) return "steel_armor";
    if (roll < 0.40) return "iron_armor";
    return "leather_armor";
  }
  return "leather_armor";
}

function dropLoot(x, y, source, owner = null) {
  const { drops: dropIds, gold: goldAmount } = rollDrops(currentWorldId, source);
  // Aggregiere zu Inventar-Eintraegen
  const counts = {};
  for (const id of dropIds) counts[id] = (counts[id] || 0) + 1;
  const drops = Object.entries(counts).map(([id, count]) => ({ id, count }));

  return spawnDropEntries(x, y, drops, goldAmount, owner);
}

function spawnDropEntries(x, y, drops, goldAmount, owner) {
  if (multiplayerReady && isHost) {
    for (const drop of drops.filter((entry) => entry.count > 0)) {
      publishLoot({
        id: drop.id,
        count: drop.count,
        x: x + (Math.random() - 0.5) * 54,
        y: y + (Math.random() - 0.5) * 54,
        owner,
        ownerLockUntil: owner ? Date.now() + 6000 : 0,
      });
    }
    if (owner) {
      pushGrant(owner, { gold: goldAmount });
    } else {
      player.gold += goldAmount;
    }
  } else {
    for (const drop of drops.filter((entry) => entry.count > 0)) {
      droppedItems.push({
        ...drop,
        x: x + (Math.random() - 0.5) * 54,
        y: y + (Math.random() - 0.5) * 54,
        bob: Math.random() * 10,
      });
    }
    player.gold += goldAmount;
  }
}

function spawnStoneGuardians(stone) {
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const sx = stone.x + Math.cos(a) * (stone.r + 50);
    const sy = stone.y + Math.sin(a) * (stone.r + 50);
    spawnMob(sx, sy, Math.random() < 0.35 ? "elite" : "mob");
  }
  // Visueller Burst aus dem Stein
  const style = stone.style || getStoneStyle(currentWorldId);
  for (let i = 0; i < 24; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: stone.x, y: stone.y,
      vx: Math.cos(a) * (180 + Math.random() * 180),
      vy: Math.sin(a) * (180 + Math.random() * 180),
      life: 0.5,
      color: style.core,
      size: 4,
    });
  }
  cameraShake = 0.25;
  showToast(`${style.name} reißt auf — Wächter erscheinen!`);
}

function handleWorldBossDrop(mob) {
  const def = mob.bossDef;
  if (!def?.drops) return;
  const drops = [];
  for (const id of def.drops.guaranteed || []) drops.push({ id, count: 1 });
  for (const entry of def.drops.rolls || []) {
    if (Math.random() < entry.chance) drops.push({ id: entry.id, count: 1 });
  }
  const [gMin, gMax] = def.drops.goldRange || [50, 100];
  const gold = gMin + Math.floor(Math.random() * (gMax - gMin + 1));
  spawnDropEntries(mob.x, mob.y, drops, gold, null);
}

function metinWeaponDrop() {
  const roll = Math.random();
  if (roll < 0.08) return "fullmoon_sickle";
  if (roll < 0.22) return "pugna_cleaver";
  if (roll < 0.42) return "storm_saber";
  if (roll < 0.76) return "metin_glaive";
  return "iron_blade";
}

function bossWeaponDrop() {
  const roll = Math.random();
  if (roll < 0.45) return "fullmoon_sickle";
  if (roll < 0.72) return "pugna_cleaver";
  return "storm_saber";
}

function gainXp(amount) {
  player.xp += amount;
  let levelsGained = 0;
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.floor(player.nextXp * 1.35);
    const classDef = getClassDef(player.classId);
    player.maxHp += classDef.stats.hpPerLevel || 14;
    player.hp = player.maxHp;
    player.baseAttack += classDef.stats.attackPerLevel || 1.6;
    player.talentPoints = (player.talentPoints || 0) + 1;
    levelsGained += 1;
  }
  if (levelsGained > 0) {
    showToast(`Level ${player.level}! +${levelsGained} Talent-Punkt(e) (Taste T).`);
    sfx.levelUp();
    renderTalents();
    saveCurrentCharacter();
  }
}

function addInventory(id, count = 1) {
  const def = itemDefs[id];
  if (def?.type === "weapon" || def?.type === "armor") {
    // Common-Tier: stacken statt neue Instanz
    if (def.rarity === "common") {
      const stack = player.inventory.find((entry) => entry.id === id && itemDefs[entry.id]?.rarity === "common" && (entry.upgrade || 0) === 0 && !entry.affixes);
      if (stack) {
        stack.count = (stack.count || 1) + 1;
        showToast(`${def.name} (x${stack.count}) — kann beim Schmied verschmolzen werden.`);
        renderInventory();
        return;
      }
      player.inventory.push({ id, count: 1, upgrade: 0 });
      showToast(`${def.name} erhalten.`);
      renderInventory();
      return;
    }
    // Rare+ bekommen Affixe
    const affixes = rollAffixes(def.rarity);
    player.inventory.push({ id, count: 1, upgrade: 0, affixes });
    const affixText = Object.entries(affixes).map(([k, v]) => `+${Math.round(v * 100)}% ${affixCatalog[k].label}`).join(", ");
    showToast(`${def.name}${affixText ? " (" + affixText + ")" : ""} erhalten.`);
    renderInventory();
    return;
  }
  const found = player.inventory.find((entry) => entry.id === id);
  if (found) found.count += count;
  else player.inventory.push(item(id, count));
  showToast(`${def.name} erhalten.`);
  renderInventory();
}

function usePotion() {
  const potion = player.inventory.find((entry) => entry.id === "health_potion" && entry.count > 0);
  if (!potion || player.hp >= player.maxHp) return;
  potion.count -= 1;
  player.hp = Math.min(player.maxHp, player.hp + itemDefs.health_potion.heal);
  if (potion.count <= 0) player.inventory = player.inventory.filter((entry) => entry.count > 0);
  showToast("Roter Trank genutzt.");
  sfx.potion();
  flashActionSlot(ui.actionPotion);
  skillFlashes.push({ color: "#51d37a", life: 0.14, maxLife: 0.14 });
  renderInventory();
}

function equipWeapon(indexOrId) {
  const index = typeof indexOrId === "number"
    ? indexOrId
    : player.inventory.findIndex((entry) => entry.id === indexOrId && itemDefs[entry.id]?.type === "weapon");
  const invItem = player.inventory[index];
  if (!invItem) return;
  const id = invItem.id;
  const def = itemDefs[id];
  player.weapon = id;
  player.weaponIndex = index;
  player.attackBonus = def.attack || 0;
  const upgrade = invItem.upgrade || 0;
  showToast(`${def.name}${upgrade ? ` +${upgrade}` : ""} ausgeruestet.`);
  renderInventory();
}

function equipArmor(index) {
  const invItem = player.inventory[index];
  if (!invItem || itemDefs[invItem.id]?.type !== "armor") return;
  player.armorIndex = index;
  const def = itemDefs[invItem.id];
  const upgrade = invItem.upgrade || 0;
  showToast(`${def.name}${upgrade ? ` +${upgrade}` : ""} angelegt (+${def.defense + upgrade * 4} Verteidigung).`);
  renderInventory();
}

function isNearBlacksmith() {
  return Math.hypot(player.x - blacksmith.x, player.y - blacksmith.y) < 105;
}

function useBlacksmith() {
  if (!isNearBlacksmith()) {
    showToast("Der Schmied ist zu weit weg. Folge dem Amboss auf der Karte.");
    return;
  }
  closeAllOverlays();
  toggleOverlay("smithOverlay");
  applySmithMode(smithMode || "weapon");
}

function upgradeAtBlacksmith(kind) {
  if (!isNearBlacksmith()) {
    showToast("Gehe zum Schmied, um Upgrades durchzufuehren.");
    return;
  }
  const targetLevel = kind === "armor"
    ? (equippedArmorItem()?.upgrade ?? player.armorLevel)
    : (equippedWeaponItem()?.upgrade || 0);
  if (targetLevel >= 9) {
    showToast(kind === "armor" ? "Ruestung ist bereits +9." : "Waffe ist bereits +9.");
    return;
  }
  const cost = upgradeCost(targetLevel + 1, kind);
  if (!canPayUpgrade(cost)) {
    showToast(`Upgrade braucht ${cost.gold} Gold, ${cost.shards} Splitter, ${cost.gems} Kristalle.`);
    return;
  }
  payUpgrade(cost);
  if (kind === "armor") {
    const armor = equippedArmorItem();
    if (armor) {
      armor.upgrade = (armor.upgrade || 0) + 1;
      showToast(`${itemLabel(armor)} geschmiedet. Verteidigung steigt.`);
    } else {
      player.armorLevel += 1;
      showToast(`Basis-Ruestung auf +${player.armorLevel} verbessert (keine Rüstung ausgerüstet).`);
    }
  } else {
    const weapon = equippedWeaponItem();
    if (!weapon) return;
    weapon.upgrade = (weapon.upgrade || 0) + 1;
    showToast(`${itemLabel(weapon)} geschmiedet. Schaden steigt.`);
  }
  renderInventory();
}

const mergeMap = {
  // Common → Rare
  rust_sword: "iron_blade",
  twin_daggers: "iron_blade",
  apprentice_staff: "metin_glaive",
  leather_armor: "iron_armor",
  // Rare → Epic
  iron_blade: "pugna_cleaver",
  metin_glaive: "storm_saber",
  iron_armor: "steel_armor",
  // Epic → Legendary
  pugna_cleaver: "fullmoon_sickle",
  storm_saber: "fullmoon_sickle",
  steel_armor: "dragon_plate",
};

function tryAddToMerge(invIndex) {
  const inv = player.inventory[invIndex];
  if (!inv) return false;
  const def = itemDefs[inv.id];
  if (!def || (def.type !== "weapon" && def.type !== "armor")) return false;
  if (!mergeMap[inv.id]) return false;
  // freien Slot suchen
  for (let i = 0; i < 3; i += 1) {
    if (mergeSlots[i] === null) {
      // Konsistenz: alle Slots müssen dieselbe ID haben
      const existingId = mergeSlots.find((s) => s !== null);
      if (existingId !== undefined) {
        const existingInv = player.inventory[existingId];
        if (existingInv && existingInv.id !== inv.id) {
          showToast("Verschmelzen geht nur mit gleichen Items.");
          return false;
        }
      }
      mergeSlots[i] = invIndex;
      renderMergeSlots();
      renderInventory();
      return true;
    }
  }
  showToast("Alle 3 Slots belegt — leere zuerst.");
  return false;
}

function clearMergeSlots() {
  mergeSlots = [null, null, null];
  renderMergeSlots();
  renderInventory();
}

function renderMergeSlots() {
  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < 3; i += 1) {
    const idx = mergeSlots[i];
    const inv = idx !== null ? player.inventory[idx] : null;
    const el = document.querySelector(`#mergeSlot${i}`);
    if (!el) continue;
    if (!inv) {
      el.className = "merge-slot empty";
      el.innerHTML = `<span class="ms-num">${i + 1}</span>`;
      continue;
    }
    const score = itemPowerScore(inv);
    if (score > bestScore) { bestScore = score; best = i; }
    const def = itemDefs[inv.id];
    el.className = `merge-slot filled ${def.rarity || ""}`;
    el.dataset.score = score;
    const icon = svgIconFor(inv, def.color) || `<span class="icon" style="color:${def.color}">${def.icon}</span>`;
    el.innerHTML = `
      <span class="ms-num">${i + 1}</span>
      <div class="ms-icon">${icon}</div>
      <span class="ms-score">${score}</span>
    `;
  }
  // Best-Highlight
  for (let i = 0; i < 3; i += 1) {
    const el = document.querySelector(`#mergeSlot${i}`);
    if (el) el.classList.toggle("merge-best", i === best && mergeSlots[i] !== null);
  }
  // Preview + Confirm-Button
  const preview = document.querySelector("#mergePreview");
  const confirm = document.querySelector("#mergeConfirm");
  const filled = mergeSlots.filter((s) => s !== null).length;
  if (filled === 3) {
    const firstIdx = mergeSlots[0];
    const inv = player.inventory[firstIdx];
    const targetId = mergeMap[inv.id];
    const targetDef = itemDefs[targetId];
    if (preview && targetDef) {
      const targetIcon = svgIconFor({ id: targetId }, targetDef.color) || targetDef.icon;
      const baseChance = mergeSuccessChance(targetDef.rarity);
      const { boost, stoneId } = specialStoneBoost();
      const totalChance = Math.min(0.95, baseChance + boost);
      const chanceColor = totalChance >= 0.75 ? "var(--green)" : totalChance >= 0.5 ? "var(--gold)" : "var(--red)";
      const stoneNote = stoneId
        ? `<small class="mp-stone">+${Math.round(boost * 100)}% durch ${itemDefs[stoneId]?.name} (wird verbraucht)</small>`
        : "";
      preview.classList.remove("hidden");
      preview.innerHTML = `
        <div class="mp-arrow">⇣</div>
        <div class="mp-result ${targetDef.rarity}">
          <div class="mp-icon">${targetIcon}</div>
          <strong>${targetDef.name}</strong>
          <small>Rarität: ${rarityLabels[targetDef.rarity]} — Affixe werden gewürfelt</small>
          <div class="mp-chance" style="color: ${chanceColor}">
            <strong>Erfolgs-Chance: ${Math.round(totalChance * 100)}%</strong>
          </div>
          ${stoneNote}
          <small class="mp-fail">Bei Misserfolg: nur 1 der 3 Items überlebt</small>
        </div>
      `;
    }
    if (confirm) confirm.disabled = false;
  } else {
    if (preview) preview.classList.add("hidden");
    if (confirm) confirm.disabled = true;
  }
}

function mergeSuccessChance(targetRarity) {
  // Höhere Tiers schwerer
  if (targetRarity === "rare") return 0.85;
  if (targetRarity === "epic") return 0.60;
  if (targetRarity === "legendary") return 0.35;
  return 0.85;
}

function specialStoneBoost() {
  // Welt-Spezial-Stein im Inventar → +15% Chance (verbraucht)
  const map = { meadows: null, frostwastes: "frost_core", emberforge: "ember_spark", shadowfen: "shadow_essence", skyspire: "sky_shard" };
  const stoneId = map[currentWorldId];
  if (!stoneId) return { boost: 0, stoneId: null };
  if (inventoryCount(stoneId) > 0) return { boost: 0.15, stoneId };
  return { boost: 0, stoneId: null };
}

function confirmMerge() {
  if (mergeSlots.some((s) => s === null)) {
    showToast("Brauche 3 Items zum Verschmelzen.");
    return;
  }
  if (!isNearBlacksmith()) {
    showToast("Geh zum Schmied.");
    return;
  }
  const items = mergeSlots.map((idx) => player.inventory[idx]).filter(Boolean);
  if (items.length < 3 || !items.every((it) => it.id === items[0].id)) {
    showToast("Alle 3 Items müssen identisch sein.");
    return;
  }
  const targetId = mergeMap[items[0].id];
  if (!targetId) {
    showToast("Dieses Item kann nicht weiter verschmolzen werden.");
    return;
  }
  const targetDef = itemDefs[targetId];
  if (!targetDef) return;

  // Konsumiere alle 3 Items
  const consumeMap = new Map();
  for (const idx of mergeSlots) consumeMap.set(idx, (consumeMap.get(idx) || 0) + 1);
  const indices = [...consumeMap.keys()].sort((a, b) => b - a);
  for (const idx of indices) {
    const entry = player.inventory[idx];
    if (!entry) continue;
    entry.count -= consumeMap.get(idx);
    if (entry.count <= 0) {
      player.inventory.splice(idx, 1);
      if (player.weaponIndex === idx) player.weaponIndex = -1;
      if (player.armorIndex === idx) player.armorIndex = -1;
      if (player.weaponIndex > idx) player.weaponIndex -= 1;
      if (player.armorIndex > idx) player.armorIndex -= 1;
    }
  }

  // Success-Chance berechnen + Stein verbrauchen falls vorhanden
  const baseChance = mergeSuccessChance(targetDef.rarity);
  const { boost, stoneId } = specialStoneBoost();
  if (stoneId) removeInventory(stoneId, 1);
  const totalChance = Math.min(0.95, baseChance + boost);
  const roll = Math.random();
  const success = roll < totalChance;

  if (success) {
    const affixes = rollAffixes(targetDef.rarity);
    const newEntry = { id: targetId, count: 1, upgrade: 0, affixes, justMerged: Date.now() };
    player.inventory.push(newEntry);
    showToast(`✓ Erfolg (${Math.round(totalChance * 100)}%): ${targetDef.name} erschaffen!`);
    sfx.smithSuccess();
    skillFlashes.push({ color: targetDef.color, life: 0.35, maxLife: 0.35 });
    cameraShake = 0.3;
    // Funken-Burst beim Schmied
    for (let i = 0; i < 40; i += 1) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: blacksmith.x, y: blacksmith.y,
        vx: Math.cos(a) * (160 + Math.random() * 220),
        vy: Math.sin(a) * (160 + Math.random() * 220),
        life: 0.6,
        color: i % 2 === 0 ? targetDef.color : "#fff2a8",
        size: 4,
      });
    }
  } else {
    // Fail: 1 von 3 ursprünglichen Items überlebt
    const survivor = items[Math.floor(Math.random() * items.length)];
    player.inventory.push({ id: survivor.id, count: 1, upgrade: survivor.upgrade || 0, affixes: survivor.affixes ? { ...survivor.affixes } : undefined });
    showToast(`✗ Verschmelzen misslungen (${Math.round(totalChance * 100)}% Chance). 1 ${itemDefs[survivor.id]?.name} überlebt.`);
    sfx.smithFail();
    skillFlashes.push({ color: "#ff5d62", life: 0.35, maxLife: 0.35 });
    cameraShake = 0.4;
  }

  clearMergeSlots();
  renderInventory();
  saveCurrentCharacter();
}

function upgradeCost(nextLevel, kind) {
  return {
    gold: (kind === "armor" ? 18 : 24) * nextLevel,
    shards: Math.ceil(nextLevel / 2),
    gems: nextLevel >= 4 ? Math.ceil((nextLevel - 3) / 2) : 0,
    cores: nextLevel >= 7 ? 1 : 0,
  };
}

function breakChance(nextLevel, worldId = currentWorldId) {
  if (nextLevel <= 3) return 0;
  let base;
  if (nextLevel <= 6) base = 0.12 + (nextLevel - 4) * 0.065; // 12%, 18.5%, 25%
  else base = 0.50 + (nextLevel - 7) * 0.15;                  // +7=50%, +8=65%, +9=80%
  // Spezial-Stein der Welt reduziert die Chance
  const specialMap = { meadows: null, frostwastes: "frost_core", emberforge: "ember_spark", shadowfen: "shadow_essence", skyspire: "sky_shard" };
  const stoneId = specialMap[worldId];
  if (stoneId && inventoryCount(stoneId) > 0) {
    base = Math.max(0, base - (itemDefs[stoneId].breakReduce || 0));
  }
  return base;
}

function selectSmithItem(index) {
  const entry = player.inventory[index];
  if (!entry) return;
  const def = itemDefs[entry.id];
  if (!def || (def.type !== "weapon" && def.type !== "armor")) {
    showToast("Nur Waffen oder Rüstungen können aufgewertet werden.");
    return;
  }
  smithSelectedIndex = index;
  renderSmithSlot();
  closeAllOverlays();
  toggleOverlay("smithOverlay");
}

function renderSmithSlot() {
  const slot = ui.smithSlot;
  if (!slot) return;
  const entry = smithSelectedIndex !== null ? player.inventory[smithSelectedIndex] : null;
  if (ui.smithNear) {
    const near = isNearBlacksmith();
    ui.smithNear.textContent = near ? "Bereit" : "Geh zum Schmied (F)";
    ui.smithNear.style.color = near ? "var(--green)" : "var(--red)";
  }
  if (!entry) {
    slot.className = "smith-item-slot empty";
    slot.innerHTML = `<span class="smith-slot-hint">Klick im Inventar →</span>`;
    if (ui.smithCostList) ui.smithCostList.innerHTML = "<strong>Kein Item ausgewaehlt</strong>";
    ui.smithRiskBlock?.classList.add("hidden");
    if (ui.upgradeWeapon) {
      ui.upgradeWeapon.disabled = true;
      ui.upgradeWeapon.textContent = "Aufwerten +1";
    }
    return;
  }
  const def = itemDefs[entry.id];
  const kind = def.type === "armor" ? "armor" : "weapon";
  const curLvl = entry.upgrade || 0;
  const nextLvl = curLvl + 1;
  slot.className = `smith-item-slot ${def.rarity || ""}`;
  slot.innerHTML = `
    <span class="smith-item-icon" style="color:${def.color || "#f4f0df"}">${def.icon || "?"}</span>
    <strong>${def.name} +${curLvl}</strong>
    <small>${kind === "weapon" ? `${def.attack + curLvl * 3} Angriff` : `${def.defense + curLvl * 4} Verteidigung`}</small>
  `;
  if (nextLvl > 9) {
    if (ui.smithCostList) ui.smithCostList.innerHTML = "<strong>Max-Level erreicht (+9)</strong>";
    ui.smithRiskBlock?.classList.add("hidden");
    if (ui.upgradeWeapon) {
      ui.upgradeWeapon.disabled = true;
      ui.upgradeWeapon.textContent = "Max +9";
    }
    return;
  }
  const cost = upgradeCost(nextLvl, kind);
  const have = {
    gold: player.gold || 0,
    shards: inventoryCount("metin_shard"),
    gems: inventoryCount("gem"),
    cores: inventoryCount("pugna_core"),
  };
  const rows = [
    ["Gold", cost.gold, have.gold, "#f4c95d"],
    ["Metin-Splitter", cost.shards, have.shards, "#9ee7ff"],
    ["Kristall", cost.gems, have.gems, "#7dd3fc"],
    ["Pugna-Kern", cost.cores, have.cores, "#c084fc"],
  ];
  if (ui.smithCostList) {
    ui.smithCostList.innerHTML = `<strong>Kosten fuer +${nextLvl}</strong>` + rows.filter(([, need]) => need > 0).map(([label, need, has, color]) => {
      const ok = has >= need;
      return `<div class="cost-row ${ok ? "ok" : "miss"}"><span>${label}</span><span style="color:${color}">${has}/${need}</span></div>`;
    }).join("");
  }
  const risk = breakChance(nextLvl);
  if (ui.smithRiskBlock) {
    if (risk > 0) {
      ui.smithRiskBlock.classList.remove("hidden");
      if (ui.smithRiskFill) ui.smithRiskFill.style.width = `${Math.round(risk * 100)}%`;
      if (ui.smithRiskText) ui.smithRiskText.textContent = `${Math.round(risk * 100)}%`;
    } else {
      ui.smithRiskBlock.classList.add("hidden");
    }
  }
  const canPay = canPayUpgrade(cost);
  const nearBlacksmith = isNearBlacksmith();
  if (ui.upgradeWeapon) {
    ui.upgradeWeapon.disabled = !canPay || !nearBlacksmith;
    ui.upgradeWeapon.textContent = canPay ? `Aufwerten auf +${nextLvl}` : "Materialien fehlen";
  }
}

function smithUpgradeSelected() {
  if (smithSelectedIndex === null) return;
  if (!isNearBlacksmith()) {
    showToast("Geh zum Schmied auf der Karte.");
    return;
  }
  const entry = player.inventory[smithSelectedIndex];
  if (!entry) return;
  const def = itemDefs[entry.id];
  const kind = def.type === "armor" ? "armor" : "weapon";
  const curLvl = entry.upgrade || 0;
  const nextLvl = curLvl + 1;
  if (nextLvl > 9) {
    showToast("Max-Level erreicht.");
    return;
  }
  const cost = upgradeCost(nextLvl, kind);
  if (!canPayUpgrade(cost)) {
    showToast("Materialien fehlen.");
    return;
  }
  payUpgrade(cost);
  const risk = breakChance(nextLvl);
  if (Math.random() < risk) {
    // Bruch!
    const lost = entry;
    player.inventory.splice(smithSelectedIndex, 1);
    // Fix equipped indices
    if (player.weaponIndex === smithSelectedIndex) player.weaponIndex = -1;
    if (player.armorIndex === smithSelectedIndex) player.armorIndex = -1;
    if (player.weaponIndex > smithSelectedIndex) player.weaponIndex -= 1;
    if (player.armorIndex > smithSelectedIndex) player.armorIndex -= 1;
    smithSelectedIndex = null;
    skillFlashes.push({ color: "#ff5d62", life: 0.4, maxLife: 0.4 });
    cameraShake = 0.5;
    showToast(`${lost.id ? itemDefs[lost.id].name : "Item"} ist beim Schmieden zerbrochen!`);
  } else {
    entry.upgrade = nextLvl;
    showToast(`${def.name} auf +${nextLvl} aufgewertet!`);
    skillFlashes.push({ color: "#f4c95d", life: 0.2, maxLife: 0.2 });
  }
  renderInventory();
  renderSmithSlot();
  updateUi();
  saveCurrentCharacter();
}

function canPayUpgrade(cost) {
  return player.gold >= cost.gold
    && inventoryCount("metin_shard") >= cost.shards
    && inventoryCount("gem") >= cost.gems
    && inventoryCount("pugna_core") >= cost.cores;
}

function payUpgrade(cost) {
  player.gold -= cost.gold;
  removeInventory("metin_shard", cost.shards);
  removeInventory("gem", cost.gems);
  removeInventory("pugna_core", cost.cores);
}

function inventoryCount(id) {
  return player.inventory
    .filter((entry) => entry.id === id)
    .reduce((sum, entry) => sum + entry.count, 0);
}

function removeInventory(id, count) {
  let remaining = count;
  for (const entry of player.inventory) {
    if (entry.id !== id || remaining <= 0) continue;
    const used = Math.min(entry.count, remaining);
    entry.count -= used;
    remaining -= used;
  }
  player.inventory = player.inventory.filter((entry) => entry.count > 0);
}

function floatText(x, y, text, color) {
  const isImportant = text && (text.includes("CRIT") || text.includes("KOMBO"));
  floatingText.push({ x, y, text, color, life: isImportant ? 1.0 : 0.75, maxLife: isImportant ? 1.0 : 0.75 });
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = 50 + Math.random() * 190;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45 + Math.random() * 0.28, color, size: 3 + Math.random() * 5 });
  }
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  toastTimer = 2.2;
}

function selectPvpMode(mode) {
  if (!pvpModes[mode]) return;
  pvpMode = mode;
  pvpReady = false;
  localStorage.setItem("blocpugnaPvpMode", mode);
  ui.pvpModeDuel?.classList.toggle("active", mode === "duel");
  ui.pvpModeRace?.classList.toggle("active", mode === "race");
  if (currentWorldId === "arena") {
    stones.length = 0;
    seedWorld();
  }
  updatePvpUi();
  const api = firebaseApi();
  if (!api || !worldRefs) return;
  api.set(api.ref(api.database, `${worldRefs.base}/pvp/mode`), mode);
  api.remove(api.ref(api.database, `${worldRefs.base}/pvp/ready`));
  showToast(`${pvpModes[mode].name} gewaehlt. Beide Spieler muessen bereit sein.`);
}

function togglePvpReady() {
  if (!multiplayerReady || !authUser) {
    showToast("PvP braucht zwei eingeloggte Spieler.");
    return;
  }
  pvpReady = !pvpReady;
  publishPvpReady();
  updatePvpUi();
}

async function publishPvpReady() {
  const api = firebaseApi();
  if (!api || !worldRefs || !authUser) return;
  const readyRef = api.ref(api.database, `${worldRefs.base}/pvp/ready/${authUser}`);
  if (!pvpReady) {
    await api.remove(readyRef);
    return;
  }
  await api.set(readyRef, {
    name: authUser,
    mode: pvpMode,
    classId: player.classId,
    ts: Date.now(),
  });
}

function applyPvpSnapshot(snapshot) {
  pvpState = {
    mode: snapshot.mode || pvpMode,
    ready: snapshot.ready || {},
    match: snapshot.match || null,
    scores: snapshot.scores || {},
    hits: snapshot.hits || {},
  };
  pvpMode = pvpState.mode || pvpMode;
  processPvpHits();
  applyPvpMatch();
  updatePvpUi();
  if (isHost) maybeStartPvpMatch();
}

function pvpReadyPlayers() {
  const now = Date.now();
  return Object.values(pvpState.ready || {})
    .filter((entry) => entry && entry.mode === pvpMode && now - (entry.ts || 0) < 60000)
    .map((entry) => entry.name)
    .filter(Boolean)
    .sort();
}

function activePvpMatch() {
  const match = pvpState.match;
  if (!match || match.status !== "active") return null;
  if (!match.players?.includes(authUser)) return null;
  return match;
}

function isPvpActive() {
  return !!activePvpMatch();
}

function isPvpRace() {
  return activePvpMatch()?.mode === "race";
}

function pvpOpponentName() {
  const match = activePvpMatch();
  return match?.players?.find((name) => name !== authUser) || Object.keys(remotePlayers)[0] || null;
}

async function maybeStartPvpMatch() {
  if (!worldRefs || activePvpMatch()) return;
  const players = pvpReadyPlayers();
  if (players.length < 2) return;
  const api = firebaseApi();
  if (!api) return;
  const chosen = players.slice(0, 2);
  const mode = pvpMode;
  const startedAt = Date.now();
  const matchId = nextId("pvp");
  await Promise.all([
    api.set(api.ref(api.database, `${worldRefs.base}/pvp/match`), {
      id: matchId,
      mode,
      status: "active",
      players: chosen,
      startedAt,
      endsAt: startedAt + pvpModes[mode].duration * 1000,
    }),
    api.set(api.ref(api.database, `${worldRefs.base}/pvp/scores`), {
      [chosen[0]]: 0,
      [chosen[1]]: 0,
    }),
    api.remove(api.ref(api.database, `${worldRefs.base}/pvp/hits`)),
    api.remove(api.ref(api.database, `${worldRefs.base}/pvp/ready`)),
  ]);
}

function applyPvpMatch() {
  const match = activePvpMatch();
  if (!match) {
    if (pvpAppliedMatchId) restoreAfterPvp();
    pvpAppliedMatchId = null;
    return;
  }
  if (pvpAppliedMatchId === match.id) return;
  pvpAppliedMatchId = match.id;
  pvpReady = false;
  pvpSavedState.hp = player.hp;
  pvpSavedState.maxHp = player.maxHp;
  pvpSavedState.x = player.x;
  pvpSavedState.y = player.y;
  pvpSavedState.cooldowns = { ...player.abilityCooldowns };
  const index = match.players.indexOf(authUser);
  player.maxHp = match.mode === "duel" ? 150 : 135;
  player.hp = player.maxHp;
  player.invuln = 1.2;
  player.abilityCooldowns = {};
  player.x = index === 0 ? 520 : world.w - 520;
  player.y = match.mode === "race" ? world.h / 2 + 120 : world.h / 2;
  mobs.length = 0;
  droppedItems.length = 0;
  if (match.mode === "race") {
    stones.length = 0;
    stones.push({ x: world.w / 2, y: world.h / 2, r: 44, hp: 900, maxHp: 900, pulse: 0, hitTimer: 0, pvpTarget: true });
  } else {
    stones.length = 0;
  }
  if (isHost) hostTick();
  showToast(`${pvpModes[match.mode].name} startet. Viel Glueck.`);
}

function restoreAfterPvp() {
  player.maxHp = pvpSavedState.maxHp || getClassDef(player.classId).stats.maxHp;
  player.hp = Math.min(player.maxHp, pvpSavedState.hp || player.maxHp);
  player.x = pvpSavedState.x || player.x;
  player.y = pvpSavedState.y || player.y;
  player.abilityCooldowns = pvpSavedState.cooldowns || {};
  pvpReady = false;
}

function processPvpHits() {
  for (const [id, hit] of Object.entries(pvpState.hits || {})) {
    if (!hit || processedPvpHits.has(id) || hit.to !== authUser) continue;
    processedPvpHits.add(id);
    if (hit.matchId !== activePvpMatch()?.id) continue;
    player.hp = Math.max(0, player.hp - hit.dmg);
    player.invuln = Math.max(player.invuln, 0.22);
    floatText(player.x, player.y - 42, `-${hit.dmg}`, "#ff5d62");
    if (player.hp <= 0) finishPvp(hit.from);
  }
}

function pvpDamageAmount(base, tag = "") {
  const mode = activePvpMatch()?.mode;
  if (!mode) return 0;
  const classDef = getClassDef(player.classId);
  const combo = tag === "combo" || tag === "detonate";
  const raw = Math.max(8, Math.floor(base * 0.42 + classDef.stats.baseAttack * 1.15 + (combo ? 8 : 0)));
  return Math.floor(raw * pvpModes[mode].playerDamageScale);
}

function damageRemotePlayer(remote, amount, tag = "") {
  const match = activePvpMatch();
  if (!match || !remote?.name || !match.players.includes(remote.name)) return false;
  const dmg = pvpDamageAmount(amount, tag);
  if (dmg <= 0) return false;
  floatText(remote.x, remote.y - 40, tag === "combo" ? `PVP KOMBO -${dmg}` : `PVP -${dmg}`, getClassDef(player.classId).accent);
  pushPvpHit(remote.name, dmg);
  if (match.mode === "race") addPvpScore(authUser, Math.ceil(dmg * 0.35));
  return true;
}

async function pushPvpHit(to, dmg) {
  const api = firebaseApi();
  const match = activePvpMatch();
  if (!api || !worldRefs || !match || !authUser) return;
  const id = nextId("ph");
  await api.set(api.ref(api.database, `${worldRefs.base}/pvp/hits/${id}`), {
    from: authUser,
    to,
    dmg,
    matchId: match.id,
    ts: Date.now(),
  });
}

async function addPvpScore(name, amount) {
  const api = firebaseApi();
  const match = activePvpMatch();
  if (!api || !worldRefs || !match || !name || amount <= 0) return;
  const scoreRef = api.ref(api.database, `${worldRefs.base}/pvp/scores/${name}`);
  await api.runTransaction(scoreRef, (current) => Math.max(0, Math.floor(current || 0) + Math.floor(amount)));
}

async function finishPvp(winnerName = null) {
  const api = firebaseApi();
  const match = activePvpMatch();
  if (!api || !worldRefs || !match) return;
  if (!winnerName && match.mode === "race") {
    const scores = pvpState.scores || {};
    const [a, b] = match.players;
    winnerName = (scores[a] || 0) === (scores[b] || 0)
      ? "Unentschieden"
      : (scores[a] || 0) > (scores[b] || 0) ? a : b;
  }
  await api.set(api.ref(api.database, `${worldRefs.base}/pvp/match/status`), "ended");
  await api.set(api.ref(api.database, `${worldRefs.base}/pvp/match/winner`), winnerName || "Unentschieden");
  showToast(winnerName ? `PvP beendet. Sieger: ${winnerName}` : "PvP beendet.");
}

function updatePvpUi() {
  ui.pvpModeDuel?.classList.toggle("active", pvpMode === "duel");
  ui.pvpModeRace?.classList.toggle("active", pvpMode === "race");
  ui.pvpReady?.classList.toggle("ready", pvpReady);
  if (ui.pvpReady) ui.pvpReady.textContent = pvpReady ? "Bereit gesetzt" : "Bereit";
  const ready = pvpReadyPlayers();
  const match = activePvpMatch();
  const scores = pvpState.scores || {};
  const opponent = pvpOpponentName();
  if (ui.pvpStatus) {
    ui.pvpStatus.textContent = match ? `${pvpModes[match.mode].name} live` : `${ready.length}/2 bereit`;
  }
  if (ui.pvpText) {
    if (match) {
      const remaining = Math.max(0, Math.ceil((match.endsAt - Date.now()) / 1000));
      ui.pvpText.textContent = `${pvpModes[match.mode].text} Restzeit: ${remaining}s.`;
    } else {
      ui.pvpText.textContent = pvpModes[pvpMode].text;
    }
  }
  if (ui.pvpScoreLocal) ui.pvpScoreLocal.textContent = `Du: ${scores[authUser] || 0}`;
  if (ui.pvpScoreRemote) ui.pvpScoreRemote.textContent = `${opponent || "Rivale"}: ${scores[opponent] || 0}`;
}

function update(dt) {
  if (player.hp <= 0) {
    if (isPvpActive()) return;
    if (keys.has("r")) restart();
    return;
  }

  const match = activePvpMatch();
  if (match && Date.now() >= match.endsAt && isHost) {
    finishPvp(match.mode === "race" ? null : "Unentschieden");
  }

  const move = { x: 0, y: 0 };
  if (keys.has("w") || keys.has("arrowup")) move.y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) move.y += 1;
  if (keys.has("a") || keys.has("arrowleft")) move.x -= 1;
  if (keys.has("d") || keys.has("arrowright")) move.x += 1;
  const len = Math.hypot(move.x, move.y) || 1;
  const frostSlow = (player.frostSlowTimer || 0) > 0 ? 0.55 : 1;
  const speedMult = (1 + talentEffect("speedBonus")) * frostSlow;
  player.x = clamp(player.x + (move.x / len) * player.speed * speedMult * dt, player.r, world.w - player.r);
  player.y = clamp(player.y + (move.y / len) * player.speed * speedMult * dt, player.r, world.h - player.r);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.powerWindow = Math.max(0, player.powerWindow - dt);
  player.dashCritWindow = Math.max(0, player.dashCritWindow - dt);
  for (const abilityId of Object.keys(player.abilityCooldowns)) {
    player.abilityCooldowns[abilityId] = Math.max(0, player.abilityCooldowns[abilityId] - dt);
  }
  if (player.dashCritWindow > 0 && Math.random() < 0.38) {
    particles.push({
      x: player.x + 20 + Math.random() * 64,
      y: player.y - 36 + (Math.random() - 0.5) * 36,
      vx: (Math.random() - 0.5) * 70,
      vy: -45 - Math.random() * 55,
      life: 0.34,
      color: getClassDef(player.classId).accent,
      size: 3 + Math.random() * 4,
    });
  }
  const runHostSim = (!multiplayerReady || isHost) && !isPvpActive() && !currentWorld().noWildMobs && !currentWorld().passiveMobs;
  if (runHostSim) {
    waveTimer -= dt;
    minibossTimer -= dt;
    bossTimer -= dt;
    if (waveTimer <= 0) {
      spawnMobWave();
      waveTimer = 2.4 + Math.random() * 2.8;
    }
    if (minibossTimer <= 0) {
      spawnSpecialMob("miniboss");
      minibossTimer = 22 + Math.random() * 18;
    }
    if (bossTimer <= 0) {
      spawnSpecialMob("boss");
      bossTimer = 55 + Math.random() * 30;
    }
  }

  if (player.frostSlowTimer > 0) player.frostSlowTimer -= dt;
  // Safe-Zone Heal-Regen
  if (inSafeZone(player.x, player.y) && player.hp < player.maxHp && player.hp > 0) {
    const regen = 6; // HP pro Sekunde
    player.hp = Math.min(player.maxHp, player.hp + regen * dt);
  }
  for (const mob of mobs) {
    mob.hitTimer = Math.max(0, mob.hitTimer - dt);
    tickStatuses(mob, dt);
    if (mob.bossDef) updateWorldBoss(mob, dt);
    // Spieler in Safe-Zone? Mobs verlieren Aggro und entfernen sich.
    let tx = player.x, ty = player.y;
    if (inSafeZone(player.x, player.y) && currentWorldId === "meadows") {
      // Mob soll vom Schmied weg
      tx = mob.x + (mob.x - blacksmith.x);
      ty = mob.y + (mob.y - blacksmith.y);
      mob.aggroed = false;
    } else if (shadowDecoy) { tx = shadowDecoy.x; ty = shadowDecoy.y; }
    else if (player.invisTimer > 0) { tx = mob.x; ty = mob.y; }
    const dx = tx - mob.x;
    const dy = ty - mob.y;
    const d = Math.hypot(dx, dy) || 1;
    const frozen = statusTime(mob, "frozen") > 0;
    const stunned = statusTime(mob, "stunned") > 0;
    const speedFactor = stunned ? 0 : frozen ? 0.42 : 1;
    // Passive Mobs (Wiesen) wandern friedlich umher — bis sie provoziert werden
    const isPassiveIdle = mob.passive && !mob.aggroed;
    if (isPassiveIdle && speedFactor > 0) {
      // Wander-State initialisieren
      if (!mob.wander) {
        mob.wander = { angle: Math.random() * Math.PI * 2, t: 1 + Math.random() * 3, anchorX: mob.x, anchorY: mob.y };
      }
      mob.wander.t -= dt;
      if (mob.wander.t <= 0) {
        mob.wander.angle = Math.random() * Math.PI * 2;
        mob.wander.t = 2 + Math.random() * 4;
      }
      const wanderSpeed = mob.speed * 0.35;
      const wx = mob.x + Math.cos(mob.wander.angle) * wanderSpeed * dt;
      const wy = mob.y + Math.sin(mob.wander.angle) * wanderSpeed * dt;
      // In 250px Radius um Anchor bleiben
      if (Math.hypot(wx - mob.wander.anchorX, wy - mob.wander.anchorY) < 250 && !inSafeZone(wx, wy)) {
        mob.x = wx;
        mob.y = wy;
      } else {
        // Richtung umkehren
        mob.wander.angle = Math.atan2(mob.wander.anchorY - mob.y, mob.wander.anchorX - mob.x);
      }
    } else if (runHostSim && d < 520 && speedFactor > 0) {
      const nx = mob.x + (dx / d) * mob.speed * speedFactor * dt;
      const ny = mob.y + (dy / d) * mob.speed * speedFactor * dt;
      if (!inSafeZone(nx, ny)) {
        mob.x = nx;
        mob.y = ny;
      } else {
        const ang = Math.atan2(mob.y - blacksmith.y, mob.x - blacksmith.x);
        mob.x = blacksmith.x + Math.cos(ang) * (SAFE_ZONE_RADIUS + 4);
        mob.y = blacksmith.y + Math.sin(ang) * (SAFE_ZONE_RADIUS + 4);
      }
    }
    if (isPassiveIdle) continue;
    if (inSafeZone(player.x, player.y)) continue;
    if (player.invisTimer > 0) continue;
    // Distanz wieder zum Spieler für den Treffer-Check
    const pdx = player.x - mob.x;
    const pdy = player.y - mob.y;
    const pd = Math.hypot(pdx, pdy) || 1;
    // Telegraph zeigen wenn Mob in Schlag-Reichweite kommt
    if (pd < player.r + mob.r + 30) {
      mob.attackTelegraph = Math.max(mob.attackTelegraph || 0, 0.18);
    }
    if (mob.attackTelegraph > 0) mob.attackTelegraph = Math.max(0, mob.attackTelegraph - dt);
    if (pd < player.r + mob.r && player.invuln <= 0) {
      const def = totalDefense();
      const mitigatedDamage = Math.max(3, Math.ceil(mob.damage * 0.65 + mob.damage * 0.35 - def));
      player.hp -= mitigatedDamage;
      player.invuln = 0.5;
      // Player flash bei Treffer
      player.hitFlash = 0.2;
      floatText(player.x, player.y - 36, `-${mitigatedDamage}`, "#ff5d62");
      if (player.hp <= 0) { showToast("Du wurdest besiegt. Druecke R fuer Neustart."); sfx.death(); }
    }
  }

  for (const stone of stones) {
    stone.pulse += dt;
    stone.hitTimer = Math.max(0, stone.hitTimer - dt);
  }

  for (let i = droppedItems.length - 1; i >= 0; i -= 1) {
    const entry = droppedItems[i];
    entry.bob += dt * 5;
    const dx = player.x - entry.x;
    const dy = player.y - entry.y;
    const d = Math.hypot(dx, dy);
    // Loot-Magnet: ab 110px zieht es zum Spieler
    if (d < 110 && d > 0) {
      const lockedToOther = entry.ownerLockUntil && Date.now() < entry.ownerLockUntil && entry.owner && entry.owner !== authUser;
      if (!lockedToOther) {
        const pull = Math.min(280, 80 + (110 - d) * 6);
        entry.x += (dx / d) * pull * dt;
        entry.y += (dy / d) * pull * dt;
      }
    }
    if (Math.hypot(entry.x - player.x, entry.y - player.y) < 30) {
      if (multiplayerReady && entry.serverId) {
        if (entry.ownerLockUntil && Date.now() < entry.ownerLockUntil && entry.owner && entry.owner !== authUser) continue;
        claimLoot(entry);
        sfx.pickup();
      } else {
        addInventory(entry.id, entry.count);
        droppedItems.splice(i, 1);
        sfx.pickup();
      }
    }
  }

  updateParticles(dt);
  updateProjectiles(dt);
  updateSkillFlashes(dt);
  updateLavaPools(dt);
  updatePvpBot(dt);
  updatePet(dt);
  updateShadowDecoy(dt);
  // Dying mobs animieren
  for (let i = dyingMobs.length - 1; i >= 0; i -= 1) {
    dyingMobs[i].life -= dt;
    dyingMobs[i].rot += dt * 6;
    if (dyingMobs[i].life <= 0) dyingMobs.splice(i, 1);
  }
  if (player.swingAnim && player.swingAnim.t > 0) {
    player.swingAnim.t = Math.max(0, player.swingAnim.t - dt);
  }
  if (player.hitFlash > 0) player.hitFlash = Math.max(0, player.hitFlash - dt);
  updateInsectSwarm(dt);
  updateWeather(dt);
  // Bär-Form Tick
  if (player.bearForm > 0) {
    player.bearForm -= dt;
    if (player.bearForm <= 0) {
      // Boost wieder weg
      player.maxHp -= player.bearFormMaxHpBoost || 0;
      player.hp = Math.min(player.hp, player.maxHp);
      player.bearFormMaxHpBoost = 0;
      showToast("Bär-Form vorbei.");
    }
  }
  // Druid-Passive: Natur-Regen in Wiesen + Sumpf
  if (player.classId === "druid" && (currentWorldId === "meadows" || currentWorldId === "shadowfen") && player.hp < player.maxHp && player.hp > 0) {
    player.hp = Math.min(player.maxHp, player.hp + 2 * dt);
  }
  // Combo-Decay
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) { comboCount = 0; comboMaxDmg = 0; }
  }
  if (player.invisTimer > 0) player.invisTimer -= dt;
  if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - dt * 2.5);
  if (portalCooldown > 0) portalCooldown = Math.max(0, portalCooldown - dt);
  checkPortalTransition();
  updateQuest();
  uiThrottle += dt;
  if (uiThrottle >= 0.1) {
    updateUi();
    uiThrottle = 0;
  } else {
    // Nur Cooldowns + HP-Bar updaten jeden Frame (kritisch für Spielgefühl)
    updateAbilityButton(ui.skillPrimary, primaryAbilityId());
    updateAbilityButton(ui.skillSecondary, secondaryAbilityId());
    updateAbilityButton(ui.skillUltimate, ultimateAbilityId());
    if (ui.hpBar) ui.hpBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  }
  syncPresence();

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.remove("show");
  }
}

function spawnMobWave() {
  const playerCount = 1 + Object.keys(remotePlayers || {}).length;
  const maxMobs = 56 + Math.min(player.level * 2, 20) + playerCount * 8;
  if (mobs.length >= maxMobs) return;
  const amount = 3 + Math.floor(Math.random() * 4) + Math.floor(playerCount * 0.5);
  for (let i = 0; i < amount && mobs.length < maxMobs; i += 1) {
    const point = randomPointAwayFromPlayer(620);
    const roll = Math.random();
    const rank = roll < 0.06 ? "elite" : roll < 0.30 ? "elite" : "mob";
    spawnMob(point.x, point.y, rank);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.88;
    p.vy *= 0.88;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingText.length - 1; i >= 0; i -= 1) {
    const text = floatingText[i];
    text.y -= 34 * dt;
    text.life -= dt;
    if (text.life <= 0) floatingText.splice(i, 1);
  }
  for (let i = weaponTrails.length - 1; i >= 0; i -= 1) {
    weaponTrails[i].life -= dt;
    if (weaponTrails[i].life <= 0) weaponTrails.splice(i, 1);
  }
  for (let i = crescentWaves.length - 1; i >= 0; i -= 1) {
    crescentWaves[i].life -= dt;
    if (crescentWaves[i].life <= 0) crescentWaves.splice(i, 1);
  }
}

function updateQuest() {
  const mobsDone = Math.min(player.mobsKilled, 20);
  const stoneDone = Math.min(player.stonesKilled, 1);
  ui.questProgress.textContent = `${mobsDone + stoneDone} / 21`;
  if (mobsDone >= 20 && stoneDone >= 1) {
    ui.questText.textContent = "Quest abgeschlossen. Jage Minibosse, Bosse und die Vollmondsichel.";
  }
}

function updateUi() {
  ui.hpText.textContent = `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`;
  ui.hpBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  ui.xpText.textContent = `${player.xp} / ${player.nextXp}`;
  ui.xpBar.style.width = `${(player.xp / player.nextXp) * 100}%`;
  ui.levelText.textContent = player.level;
  ui.goldText.textContent = player.gold;
  ui.attackText.textContent = attackPower();
  const armor = equippedArmorItem();
  const totalDef = totalDefense();
  ui.armorText.textContent = armor ? `${itemDefs[armor.id].name.split(" ")[0]} +${armor.upgrade || 0} (${totalDef})` : `+${player.armorLevel} (${totalDef})`;
  const cdName = getClassDef(player.classId).name;
  if (ui.classNameText) ui.classNameText.textContent = cdName;
  if (ui.classNameTextStats) ui.classNameTextStats.textContent = cdName;
  if (ui.worldNameText) ui.worldNameText.textContent = currentWorld().name;
  updateBlacksmithUi();
  updateAbilityButton(ui.skillPrimary, primaryAbilityId());
  updateAbilityButton(ui.skillSecondary, secondaryAbilityId());
  updateAbilityButton(ui.skillUltimate, ultimateAbilityId());
  updatePotionAction();
  updateCharOverlay(totalDef);
  updatePvpUi();
}

function updatePotionAction() {
  const count = inventoryCount("health_potion");
  if (ui.potionCount) ui.potionCount.textContent = count;
  if (ui.potionStatus) ui.potionStatus.textContent = count > 0 ? "+32" : "leer";
  if (ui.actionPotion) {
    ui.actionPotion.classList.toggle("ready", count > 0);
    ui.actionPotion.classList.toggle("disabled", count <= 0);
  }
}

function updateCharOverlay(totalDef) {
  if (ui.charLevel) ui.charLevel.textContent = player.level;
  if (ui.charGold) ui.charGold.textContent = player.gold;
  if (ui.charAttack) ui.charAttack.textContent = attackPower();
  if (ui.charArmor) ui.charArmor.textContent = `+${player.armorLevel} (${totalDef})`;
  if (ui.charHp) ui.charHp.textContent = `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`;
  if (ui.charXp) ui.charXp.textContent = `${player.xp} / ${player.nextXp}`;
  if (ui.charCrit) ui.charCrit.textContent = `${Math.round(totalCritChance() * 100)}%`;
  if (ui.charLifesteal) ui.charLifesteal.textContent = `${Math.round(totalLifesteal() * 100)}%`;
  if (ui.charCdr) ui.charCdr.textContent = `${Math.round(totalCdr() * 100)}%`;
  updateEquipSlot(ui.equipWeaponSlot, equippedWeaponItem());
  updateEquipSlot(ui.equipArmorSlot, equippedArmorItem(), "armor");
  renderPetSlot();
}

function updateEquipSlot(slot, invItem, kind = "weapon") {
  if (!slot) return;
  slot.classList.remove("rare", "epic", "legendary");
  const iconEl = slot.querySelector(".ces-icon");
  const nameEl = slot.querySelector(".ces-name");
  if (!invItem) {
    if (iconEl) iconEl.textContent = "—";
    if (nameEl) nameEl.textContent = "leer";
    return;
  }
  const def = itemDefs[invItem.id];
  if (def?.rarity) slot.classList.add(def.rarity);
  if (iconEl) {
    iconEl.textContent = def?.icon || "?";
    iconEl.style.color = def?.color || "#f4f0df";
  }
  if (nameEl) {
    const stat = kind === "weapon"
      ? `+${(def.attack || 0) + (invItem.upgrade || 0) * 3} ATK`
      : `+${(def.defense || 0) + (invItem.upgrade || 0) * 4} DEF`;
    nameEl.textContent = `${def.name}${invItem.upgrade ? ` +${invItem.upgrade}` : ""} (${stat})`;
  }
}

function totalCritChance() {
  let crit = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.crit) crit += entry.affixes.crit;
  }
  if (player.classId === "shadow") crit += 0.08;
  crit += talentEffect("critBonus");
  return Math.min(0.65, crit);
}

function totalLifesteal() {
  let ls = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.lifesteal) ls += entry.affixes.lifesteal;
  }
  ls += talentEffect("lifestealBonus");
  return Math.min(0.35, ls);
}

function totalCdr() {
  let cdr = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.cdr) cdr += entry.affixes.cdr;
  }
  if (player.classId === "runemage") cdr += 0.08;
  cdr += talentEffect("cdrBonus");
  return Math.min(0.5, cdr);
}

function talentEffect(effectKey) {
  const points = player.talents || {};
  const tree = getTalentTree(player.classId);
  let total = 0;
  for (const node of tree) {
    if (node.effect === effectKey) {
      total += (points[node.id] || 0) * node.per;
    }
  }
  return total;
}

function mastery(abilityId) {
  return abilityMasteryLevel(player.talents, abilityId);
}

function spendTalent(nodeId) {
  if (!player.talentPoints || player.talentPoints <= 0) {
    showToast("Keine Talent-Punkte uebrig.");
    return;
  }
  const tree = getTalentTree(player.classId);
  const node = tree.find((n) => n.id === nodeId);
  if (!node) return;
  player.talents = player.talents || {};
  const cur = player.talents[nodeId] || 0;
  if (cur >= node.max) {
    showToast("Knoten ist bereits voll.");
    return;
  }
  player.talents[nodeId] = cur + 1;
  player.talentPoints -= 1;
  // Bei maxHpBonus direkt anwenden
  if (node.effect === "maxHpBonus") {
    player.maxHp += node.per;
    player.hp += node.per;
  }
  if (node.effect === "armorBonus") {
    player.armorLevel = (player.armorLevel || 0) + node.per;
  }
  renderTalents();
  updateUi();
  saveCurrentCharacter();
  showToast(`${node.name} +1`);
}

function resetTalentsAction() {
  if ((player.gold || 0) < 50) {
    showToast("Reset kostet 50 Gold.");
    return;
  }
  player.gold -= 50;
  const refunded = Object.values(player.talents || {}).reduce((s, n) => s + n, 0);
  // Direkt-Effekte zurueckrechnen
  const tree = getTalentTree(player.classId);
  for (const node of tree) {
    const cnt = (player.talents || {})[node.id] || 0;
    if (cnt === 0) continue;
    if (node.effect === "maxHpBonus") {
      player.maxHp = Math.max(20, player.maxHp - node.per * cnt);
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (node.effect === "armorBonus") {
      player.armorLevel = Math.max(0, (player.armorLevel || 0) - node.per * cnt);
    }
  }
  player.talents = {};
  player.talentPoints = (player.talentPoints || 0) + refunded;
  renderTalents();
  updateUi();
  saveCurrentCharacter();
  showToast(`${refunded} Punkte zurueckerstattet.`);
}

function renderTalents() {
  const pts = player.talentPoints || 0;
  if (ui.talentPts) ui.talentPts.textContent = pts;
  if (ui.talentPtsInline) ui.talentPtsInline.textContent = pts;
  if (!ui.talentList) return;
  const tree = getTalentTree(player.classId);
  const talents = player.talents || {};
  ui.talentList.innerHTML = "";
  for (const node of tree) {
    const cur = talents[node.id] || 0;
    const maxed = cur >= node.max;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `talent-node${maxed ? " maxed" : ""}${cur > 0 ? " active" : ""}`;
    card.dataset.nodeId = node.id;
    card.disabled = maxed || pts <= 0;
    card.innerHTML = `
      <span class="tn-icon">${node.icon}</span>
      <span class="tn-body">
        <strong>${node.name}</strong>
        <small>${node.desc}</small>
      </span>
      <span class="tn-rank">${cur}/${node.max}</span>
    `;
    ui.talentList.append(card);
  }
}

function updateBlacksmithUi() {
  const distance = Math.floor(Math.hypot(player.x - blacksmith.x, player.y - blacksmith.y));
  const near = isNearBlacksmith();
  ui.blacksmithDistance.textContent = near ? "Bereit" : `${distance}m`;
  ui.blacksmithText.textContent = near
    ? "Druecke F oder nutze die Buttons. Upgrades kosten Gold und Metin-Materialien."
    : "Gehe zum Schmied auf der Karte und druecke F fuer Upgrades bis +9.";
  if (ui.mergeStacks) ui.mergeStacks.disabled = !near;
  renderSmithSlot();
  if (ui.actionSmith) {
    ui.actionSmith.classList.toggle("ready", near);
    ui.actionSmith.classList.toggle("disabled", !near);
  }
}

function updateAbilityButton(button, abilityId) {
  const ability = getAbilityDef(abilityId);
  if (!button || !ability) return;
  const cooldown = abilityCooldown(abilityId);
  const maxCooldown = ability.cooldown;
  const pct = cooldown <= 0 ? 100 : Math.max(0, 100 - (cooldown / maxCooldown) * 100);
  button.style.setProperty("--cooldown", `${pct}%`);
  const ready = cooldown <= 0;
  button.classList.toggle("ready", ready);
  button.classList.toggle("on-cooldown", !ready);
  const strong = button.querySelector("strong");
  if (strong) strong.textContent = ability.name;
  const cdEl = button.querySelector(".ability-cooldown");
  if (cdEl) cdEl.textContent = ready ? "Bereit" : `${cooldown.toFixed(1)}s`;
}

let inventoryFilter = "all";

function renderInventory() {
  const targets = [ui.inventory, document.querySelector("#smithInventory")].filter(Boolean);
  for (const target of targets) renderInventoryInto(target);
}

function renderInventoryInto(target) {
  target.innerHTML = "";
  // Min 60 Slots damit's nicht leer wirkt, wächst dynamisch mit dem Inventar
  const slots = Math.max(60, player.inventory.length + 6);
  const bestPower = bestPowerInInventory();
  // Im Merge-Modus: welche ID ist bereits gewählt? Andere werden disabled.
  const isSmithInv = target.id === "smithInventory";
  const mergeMode = isSmithInv && smithMode === "merge";
  let mergeLockId = null;
  if (mergeMode) {
    for (const s of mergeSlots) {
      if (s !== null) { mergeLockId = player.inventory[s]?.id; break; }
    }
  }
  const filterFn = (entry) => {
    if (!entry) return inventoryFilter === "all";
    if (inventoryFilter === "all") return true;
    const def = itemDefs[entry.id];
    if (!def) return false;
    return def.type === inventoryFilter;
  };
  for (let i = 0; i < slots; i += 1) {
    const invItem = player.inventory[i];
    if (!filterFn(invItem)) continue;
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.dataset.index = i;
    if (!invItem) {
      slot.classList.add("empty");
      slot.setAttribute("aria-label", "Leerer Inventarplatz");
      target.append(slot);
      continue;
    }
    const def = itemDefs[invItem.id];
    slot.classList.add(def.rarity);
    slot.classList.add(`type-${def.type}`);
    if (def.type === "weapon" && player.weaponIndex === i) slot.classList.add("equipped");
    if (def.type === "armor" && player.armorIndex === i) slot.classList.add("equipped");
    // Merge-Modus: nicht-verschmelzbare ODER andere ID disablen
    if (mergeMode) {
      const mergeable = !!mergeMap[invItem.id];
      if (!mergeable) slot.classList.add("merge-disabled");
      else if (mergeLockId && invItem.id !== mergeLockId) slot.classList.add("merge-disabled");
      else slot.classList.add("merge-ok");
    }
    const attackVal = def.attack ? def.attack + (invItem.upgrade || 0) * 3 : 0;
    const defenseVal = def.defense ? def.defense + (invItem.upgrade || 0) * 4 : 0;
    const statLine = attackVal
      ? `+${attackVal} Angriff`
      : defenseVal
        ? `+${defenseVal} Verteidigung`
        : def.heal
          ? `+${def.heal} HP`
          : "Material";
    const action = def.type === "weapon" || def.type === "armor"
      ? "Klick zum ausruesten"
      : def.type === "potion"
        ? "Klick zum nutzen"
        : "";
    slot.title = `${itemLabel(invItem)} — ${statLine}${action ? " — " + action : ""}`;
    slot.setAttribute("aria-label", slot.title);
    slot.dataset.tooltipName = itemLabel(invItem);
    slot.dataset.tooltipRarity = rarityLabels[def.rarity] || def.rarity;
    slot.dataset.tooltipStat = statLine;
    slot.dataset.tooltipAction = action;
    const affixStr = invItem.affixes ? Object.entries(invItem.affixes).map(([k, v]) => `+${Math.round(v * 100)}% ${affixCatalog[k]?.label || k}`).join(" • ") : "";
    slot.dataset.tooltipAffixes = affixStr;
    const upgrade = invItem.upgrade ? `<span class="upgrade">+${invItem.upgrade}</span>` : "";
    const badge = `<span class="type-badge">${typeBadges[def.type] || ""}</span>`;
    const affix = invItem.affixes && Object.keys(invItem.affixes).length ? `<span class="affix-dot" title="${Object.keys(invItem.affixes).length} Affixe"></span>` : "";
    const iconColor = def.color || "#f4f0df";
    slot.style.setProperty("--item-color", iconColor);
    const power = itemPowerScore(invItem);
    const isBest = bestPower > 0 && power === bestPower && (def.type === "weapon" || def.type === "armor");
    if (isBest) slot.classList.add("is-best");
    // 5s lang als "neu verschmolzen" markieren
    if (invItem.justMerged && Date.now() - invItem.justMerged < 5000) {
      slot.classList.add("just-merged");
    } else if (invItem.justMerged) {
      delete invItem.justMerged;
    }
    const powerBadge = (def.type === "weapon" || def.type === "armor")
      ? `<span class="power-badge" title="Wert-Score: ${power}">${power}</span>` : "";
    const iconHtml = svgIconFor(invItem, iconColor) || `<span class="icon" style="color:${iconColor}">${def.icon}</span>`;
    slot.innerHTML = `${badge}${affix}${powerBadge}${iconHtml}${upgrade}<span class="count">${invItem.count}</span>`;
    target.append(slot);
  }
}

function draw() {
  const cam = camera();
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.save();
  if (cameraShake > 0) {
    const sx = (Math.random() - 0.5) * cameraShake * 24;
    const sy = (Math.random() - 0.5) * cameraShake * 24;
    ctx.translate(sx, sy);
  }
  ctx.translate(-cam.x, -cam.y);
  drawGround(cam);
  drawWeather();
  drawArenaPlatform();
  drawPortals();
  if (currentWorldId === "meadows") {
    drawSafeZone();
    drawBlacksmith();
    drawNpcs();
  }
  drawDroppedItems();
  const visPad = 80;
  for (const stone of stones) {
    if (stone.x < cam.x - visPad || stone.x > cam.x + cam.w + visPad || stone.y < cam.y - visPad || stone.y > cam.y + cam.h + visPad) continue;
    drawStone(stone);
  }
  for (const mob of mobs) {
    if (mob.x < cam.x - visPad || mob.x > cam.x + cam.w + visPad || mob.y < cam.y - visPad || mob.y > cam.y + cam.h + visPad) continue;
    drawMob(mob);
  }
  drawRemotePlayers();
  drawLavaPools();
  drawBossCharges();
  drawMobAttackTelegraphs();
  drawDyingMobs();
  drawCrescentWaves();
  drawWeaponTrails();
  drawProjectiles();
  drawPvpBot();
  drawPet();
  drawInsectSwarm();
  drawShadowDecoy();
  drawPlayer();
  drawParticles();
  drawFloatingText();
  ctx.restore();

  drawSkillFlashes();
  drawLowHpVignette();
  drawMinimap();
  drawComboHud();

  if (player.hp <= 0) drawDeathScreen();
}

function drawGround(cam) {
  const wDef = currentWorld();
  ctx.fillStyle = wDef.ground || "#2f4630";
  ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  ctx.strokeStyle = wDef.groundAccent || "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const grid = 80;
  const startX = Math.floor(cam.x / grid) * grid;
  const startY = Math.floor(cam.y / grid) * grid;
  for (let x = startX; x < cam.x + cam.w + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, cam.y);
    ctx.lineTo(x, cam.y + cam.h);
    ctx.stroke();
  }
  for (let y = startY; y < cam.y + cam.h + grid; y += grid) {
    ctx.beginPath();
    ctx.moveTo(cam.x, y);
    ctx.lineTo(cam.x + cam.w, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(20, 28, 20, 0.55)";
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 277) % world.w;
    const y = (i * 173) % world.h;
    ctx.fillRect(x, y, 28, 28);
    ctx.fillRect(x + 8, y - 18, 12, 18);
  }
}

function drawBlockPerson(x, y, colors, scale = 1, facing = 0, hurt = false, accent = null, accentColor = null, walkPhase = 0, breath = 0) {
  ctx.save();
  ctx.translate(x, y + breath);
  ctx.rotate(facing * 0.08);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(-20 * scale, 16 * scale, 40 * scale, 10 * scale);
  // Walking-Beine: alternierend hoch/runter
  const legA = Math.sin(walkPhase) * 4;
  const legB = -legA;
  ctx.fillStyle = hurt ? "#ffffff" : colors.legs;
  ctx.fillRect(-16 * scale, (8 + legA) * scale, 12 * scale, (24 - Math.abs(legA)) * scale);
  ctx.fillRect(4 * scale, (8 + legB) * scale, 12 * scale, (24 - Math.abs(legB)) * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.body;
  ctx.fillRect(-18 * scale, -22 * scale, 36 * scale, 34 * scale);
  // Cloak/hood drape for shadow
  if (accent === "hood") {
    ctx.fillStyle = hurt ? "#ffffff" : (accentColor || "#1a1830");
    ctx.fillRect(-22 * scale, -24 * scale, 44 * scale, 22 * scale);
    ctx.fillRect(-20 * scale, -4 * scale, 40 * scale, 18 * scale);
  }
  ctx.fillStyle = hurt ? "#ffffff" : colors.arms;
  // Arme schwingen gegenphasig zu Beinen
  const armA = Math.sin(walkPhase) * 3;
  ctx.fillRect(-32 * scale, (-18 - armA) * scale, 12 * scale, 32 * scale);
  ctx.fillRect(20 * scale, (-18 + armA) * scale, 12 * scale, 32 * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.head;
  ctx.fillRect(-15 * scale, -54 * scale, 30 * scale, 30 * scale);
  ctx.fillStyle = "#14181f";
  ctx.fillRect(-7 * scale, -43 * scale, 4 * scale, 4 * scale);
  ctx.fillRect(5 * scale, -43 * scale, 4 * scale, 4 * scale);
  // Class accessory on head
  if (accent === "horned-helm") {
    const ac = hurt ? "#ffffff" : (accentColor || "#c9ced8");
    ctx.fillStyle = ac;
    ctx.fillRect(-17 * scale, -60 * scale, 34 * scale, 10 * scale);
    ctx.fillRect(-20 * scale, -66 * scale, 6 * scale, 8 * scale);
    ctx.fillRect(14 * scale, -66 * scale, 6 * scale, 8 * scale);
  } else if (accent === "hood") {
    const ac = hurt ? "#ffffff" : (accentColor || "#1a1830");
    ctx.fillStyle = ac;
    ctx.fillRect(-17 * scale, -58 * scale, 34 * scale, 14 * scale);
    ctx.fillRect(-17 * scale, -54 * scale, 6 * scale, 26 * scale);
    ctx.fillRect(11 * scale, -54 * scale, 6 * scale, 26 * scale);
  } else if (accent === "wizard-hat") {
    const ac = hurt ? "#ffffff" : (accentColor || "#2c2a5e");
    ctx.fillStyle = ac;
    ctx.fillRect(-18 * scale, -60 * scale, 36 * scale, 8 * scale);
    ctx.fillRect(-12 * scale, -72 * scale, 24 * scale, 14 * scale);
    ctx.fillRect(-6 * scale, -82 * scale, 12 * scale, 12 * scale);
    ctx.fillStyle = hurt ? "#ffffff" : "#f4c95d";
    ctx.fillRect(-3 * scale, -86 * scale, 6 * scale, 6 * scale);
  }
  ctx.restore();
}

function drawArenaPlatform() {
  if (!currentWorld().arena) return;
  const cx = world.w / 2;
  const cy = world.h / 2;
  const r = 540;
  ctx.save();
  ctx.fillStyle = "rgba(122, 108, 242, 0.06)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(160, 145, 255, 0.4)";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 14]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(220, 215, 255, 0.5)";
  ctx.fillText("DUELL-ARENA", cx, cy - r + 24);
  ctx.restore();
}

function drawPortals() {
  const def = currentWorld();
  const portals = def.portals || {};
  const positions = {
    north: { x: world.w / 2, y: 90, dir: 0 },
    south: { x: world.w / 2, y: world.h - 90, dir: Math.PI },
    east: { x: world.w - 90, y: world.h / 2, dir: -Math.PI / 2 },
    west: { x: 90, y: world.h / 2, dir: Math.PI / 2 },
  };
  for (const [edge, portal] of Object.entries(portals)) {
    const pos = positions[edge];
    if (!pos) continue;
    const targetDef = getWorldDef(portal.to);
    const range = targetDef.levelRange || [1, 99];
    drawPortalGate(pos.x, pos.y, portal.label, getPortalColor(portal.to), range);
  }
}

function levelDiffColor(mobLevel) {
  const diff = mobLevel - (player.level || 1);
  if (diff <= -3) return "#6b7280"; // grau: trivial
  if (diff <= 0) return "#86efac";  // grün: leicht
  if (diff <= 2) return "#fbbf24";  // gelb: passend
  if (diff <= 4) return "#fb923c";  // orange: hart
  return "#ef4444";                  // rot: tödlich
}

function levelDiffLabel(mobLevel) {
  const diff = mobLevel - (player.level || 1);
  if (diff <= -3) return "trivial";
  if (diff <= 0) return "leicht";
  if (diff <= 2) return "passend";
  if (diff <= 4) return "hart";
  return "tödlich";
}

function drawPortalGate(cx, cy, label, color, levelRange = null) {
  const t = performance.now() / 1000;
  const rOuter = 80;
  const rInner = 40;
  ctx.save();
  ctx.translate(cx, cy);
  // Aussen-Glow
  const grad = ctx.createRadialGradient(0, 0, rInner * 0.3, 0, 0, rOuter * 1.5);
  grad.addColorStop(0, hexToRgba(color, 0.95));
  grad.addColorStop(0.4, hexToRgba(color, 0.45));
  grad.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(-rOuter * 1.6, -rOuter * 1.6, rOuter * 3.2, rOuter * 3.2);
  // Rotierender Strudel: 3 Ringe verschiedener Geschwindigkeit
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.save();
    ctx.rotate(t * (0.8 + ring * 0.6));
    const r = rInner + ring * 14;
    const segments = 14;
    for (let i = 0; i < segments; i += 1) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = a0 + Math.PI * 2 / segments * 0.55;
      ctx.fillStyle = hexToRgba(color, 0.35 - ring * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a1);
      ctx.lineTo(Math.cos(a1) * (r - 6), Math.sin(a1) * (r - 6));
      ctx.arc(0, 0, r - 6, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // Innerer Kern
  const corePulse = 0.7 + Math.sin(t * 2.4) * 0.3;
  ctx.fillStyle = hexToRgba("#ffffff", 0.85 * corePulse);
  ctx.beginPath();
  ctx.arc(0, 0, 14 + corePulse * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(color, 0.95);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  // Schwebende Partikel (sphärenartig)
  for (let i = 0; i < 8; i += 1) {
    const a = t * 1.2 + (i / 8) * Math.PI * 2;
    const orbit = rInner + 10 + Math.sin(t * 2 + i) * 8;
    const px = Math.cos(a) * orbit;
    const py = Math.sin(a) * orbit;
    ctx.fillStyle = hexToRgba("#ffffff", 0.7);
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }
  ctx.restore();
  // Label
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = hexToRgba("#ffffff", 0.95);
  ctx.fillText(label, cx, cy + rOuter + 4);
  // Level-Range mit Schwierigkeits-Farbe
  if (levelRange) {
    const [minL, maxL] = levelRange;
    const playerL = player.level || 1;
    const diffColor = playerL < minL - 1 ? "#ef4444"
      : playerL > maxL + 2 ? "#6b7280"
      : playerL >= minL && playerL <= maxL ? "#86efac"
      : "#fbbf24";
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = diffColor;
    ctx.fillText(`LVL ${minL}-${maxL}`, cx, cy + rOuter + 24);
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = hexToRgba(color, 0.85);
    ctx.fillText("→ BETRETEN", cx, cy + rOuter + 40);
  } else {
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = hexToRgba(color, 0.85);
    ctx.fillText("→ BETRETEN", cx, cy + rOuter + 20);
  }
}

function getActivePetDef() {
  if (!player.activePet) return null;
  return bosses[player.activePet]?.pet || null;
}

function initPetRuntime() {
  const def = getActivePetDef();
  if (!def) { petRuntime = null; return; }
  petRuntime = {
    x: player.x - 40,
    y: player.y + 30,
    attackCd: 0,
    bobPhase: Math.random() * Math.PI * 2,
  };
}

function renderPetSlot() {
  const nameEl = document.querySelector("#petName");
  const btn = document.querySelector("#petToggleBtn");
  if (!nameEl || !btn) return;
  const unlocked = Object.keys(player.pets || {});
  if (unlocked.length === 0) {
    nameEl.textContent = "Kein Pet freigeschaltet";
    btn.disabled = true;
    btn.textContent = "—";
    return;
  }
  btn.disabled = false;
  if (player.activePet) {
    const def = getActivePetDef();
    nameEl.textContent = def?.name || "Pet";
    btn.textContent = "Abrufen";
  } else {
    nameEl.textContent = `${unlocked.length} freigeschaltet`;
    btn.textContent = "Rufen";
  }
}

function togglePet() {
  if (!player.pets || Object.keys(player.pets).length === 0) {
    showToast("Du hast noch kein Pet. Besiege Welt-Bosse zum Freischalten.");
    return;
  }
  if (player.activePet) {
    player.activePet = null;
    petRuntime = null;
    showToast("Pet abgesetzt.");
  } else {
    const unlocked = Object.keys(player.pets);
    player.activePet = unlocked[0];
    initPetRuntime();
    showToast("Pet zurück an deiner Seite.");
  }
  renderPetSlot();
  saveCurrentCharacter();
}

function updatePet(dt) {
  const def = getActivePetDef();
  if (!def || !petRuntime) return;
  // Folgen mit Lag
  const targetX = player.x - 60;
  const targetY = player.y + 40;
  const dx = targetX - petRuntime.x;
  const dy = targetY - petRuntime.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d > 20) {
    petRuntime.x += (dx / d) * def.speed * dt;
    petRuntime.y += (dy / d) * def.speed * dt;
  }
  petRuntime.bobPhase += dt * 4;
  petRuntime.attackCd = Math.max(0, petRuntime.attackCd - dt);
  // Ziel suchen: nächstes Mob
  if (petRuntime.attackCd <= 0) {
    let bestMob = null, bestDist = def.attackRange;
    for (const mob of mobs) {
      const md = Math.hypot(mob.x - petRuntime.x, mob.y - petRuntime.y);
      if (md < bestDist) { bestDist = md; bestMob = mob; }
    }
    if (bestMob) {
      const dmg = Math.max(2, Math.round(attackPower() * def.damage));
      // Projektil vom Pet
      const a = Math.atan2(bestMob.y - petRuntime.y, bestMob.x - petRuntime.x);
      projectiles.push({
        x: petRuntime.x, y: petRuntime.y,
        vx: Math.cos(a) * 500,
        vy: Math.sin(a) * 500,
        range: def.attackRange + 30,
        travelled: 0,
        color: def.color,
        glow: def.glow,
        damage: dmg,
        owner: "pet",
        pierce: 1,
        hits: new Set(),
        life: 1.2,
      });
      petRuntime.attackCd = def.attackCooldown;
    }
  }
}

function drawPet() {
  const def = getActivePetDef();
  if (!def || !petRuntime) return;
  const bob = Math.sin(petRuntime.bobPhase) * 4;
  ctx.save();
  ctx.translate(petRuntime.x, petRuntime.y + bob);
  // Aura
  ctx.fillStyle = def.glow;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = def.color;
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();
}

function drawNpcs() {
  if (currentWorldId !== "meadows") return;
  for (const npc of npcs) {
    drawBlockPerson(npc.x, npc.y, npc.colors, 1.0, 0, false, npc.accent, npc.accentColor);
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f4c95d";
    ctx.fillText(npc.name, npc.x, npc.y - 80);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(npc.role, npc.x, npc.y - 64);
    if (Math.hypot(player.x - npc.x, player.y - npc.y) < npc.r + 50) {
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#fff2a8";
      ctx.fillText(`Druecke ${npc.interactKey}`, npc.x, npc.y - 96);
    }
  }
}

function nearestNpc() {
  if (currentWorldId !== "meadows") return null;
  for (const npc of npcs) {
    if (Math.hypot(player.x - npc.x, player.y - npc.y) < npc.r + 50) return npc;
  }
  return null;
}

function renderTrader() {
  const list = document.querySelector("#traderList");
  if (!list) return;
  list.innerHTML = "";
  if (traderMode === "buy") {
    document.querySelector("#traderBuyTab")?.classList.add("active");
    document.querySelector("#traderSellTab")?.classList.remove("active");
    for (const entry of shopItems) {
      const def = itemDefs[entry.id];
      const row = document.createElement("div");
      row.className = "trader-row";
      row.innerHTML = `
        <span class="tr-icon" style="color:${def?.color || "#fff"}">${def?.icon || "?"}</span>
        <span class="tr-label">${entry.label}</span>
        <span class="tr-price">${entry.price} G</span>
        <button data-buy="${entry.id}" data-price="${entry.price}">Kaufen</button>
      `;
      list.append(row);
    }
  } else {
    document.querySelector("#traderBuyTab")?.classList.remove("active");
    document.querySelector("#traderSellTab")?.classList.add("active");
    for (let i = 0; i < player.inventory.length; i += 1) {
      const inv = player.inventory[i];
      if (!inv) continue;
      const price = sellPrices[inv.id];
      if (!price) continue;
      const def = itemDefs[inv.id];
      const row = document.createElement("div");
      row.className = "trader-row";
      row.innerHTML = `
        <span class="tr-icon" style="color:${def?.color || "#fff"}">${def?.icon || "?"}</span>
        <span class="tr-label">${def?.name || inv.id} ×${inv.count}</span>
        <span class="tr-price">${price} G</span>
        <button data-sell="${i}">Verkaufen</button>
      `;
      list.append(row);
    }
    if (!list.children.length) {
      list.innerHTML = `<p class="trader-empty">Nichts Verkaufbares im Inventar.</p>`;
    }
  }
}

function traderBuy(id, price) {
  if ((player.gold || 0) < price) {
    showToast("Nicht genug Gold.");
    return;
  }
  player.gold -= price;
  addInventory(id, 1);
  renderTrader();
  updateUi();
  saveCurrentCharacter();
}

function traderSell(index) {
  const inv = player.inventory[index];
  if (!inv) return;
  const price = sellPrices[inv.id];
  if (!price) return;
  player.gold += price;
  inv.count -= 1;
  if (inv.count <= 0) {
    player.inventory.splice(index, 1);
    if (player.weaponIndex === index) player.weaponIndex = -1;
    if (player.armorIndex === index) player.armorIndex = -1;
    if (player.weaponIndex > index) player.weaponIndex -= 1;
    if (player.armorIndex > index) player.armorIndex -= 1;
  }
  showToast(`Verkauft für ${price} Gold.`);
  renderInventory();
  renderTrader();
  updateUi();
  saveCurrentCharacter();
}

function renderTrainer() {
  const cdMs = 5 * 60 * 1000;
  const remain = Math.max(0, trainerLastReset + cdMs - Date.now());
  const cdText = document.querySelector("#trainerCooldownText");
  const btn = document.querySelector("#trainerResetBtn");
  if (remain > 0) {
    const sec = Math.ceil(remain / 1000);
    const min = Math.floor(sec / 60);
    const r = sec % 60;
    if (cdText) cdText.textContent = `Cooldown: ${min}m ${r}s`;
    if (btn) btn.disabled = true;
  } else {
    if (cdText) cdText.textContent = "Bereit";
    if (btn) btn.disabled = false;
  }
}

function trainerReset() {
  const cdMs = 5 * 60 * 1000;
  if (Date.now() - trainerLastReset < cdMs) {
    showToast("Trainerin ruht noch. Komm später wieder.");
    return;
  }
  // Voller Refund — Talente werden zurückerstattet, MaxHp/Armor zurückgerechnet
  const tree = getTalentTree(player.classId);
  const talents = player.talents || {};
  let refunded = 0;
  for (const node of tree) {
    const cnt = talents[node.id] || 0;
    refunded += cnt;
    if (node.effect === "maxHpBonus") {
      player.maxHp = Math.max(20, player.maxHp - node.per * cnt);
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (node.effect === "armorBonus") {
      player.armorLevel = Math.max(0, (player.armorLevel || 0) - node.per * cnt);
    }
  }
  player.talents = {};
  player.talentPoints = (player.talentPoints || 0) + refunded;
  trainerLastReset = Date.now();
  showToast(`${refunded} Talent-Punkte zurückerstattet.`);
  renderTalents();
  renderTrainer();
  updateUi();
  saveCurrentCharacter();
}

function ensureCourierQuest() {
  const now = Date.now();
  if (!courierState || (courierState.resetAt && now > courierState.resetAt)) {
    const q = dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
    courierState = {
      questId: q.id,
      progress: 0,
      startedLevel: player.level,
      claimed: false,
      resetAt: now + 30 * 60 * 1000, // 30 Minuten
    };
    saveCurrentCharacter();
  }
  return courierState;
}

function renderCourier() {
  const block = document.querySelector("#courierQuestBlock");
  if (!block) return;
  const state = ensureCourierQuest();
  const q = dailyQuests.find((x) => x.id === state.questId);
  if (!q) { block.innerHTML = ""; return; }
  const goalText = q.goal.type === "kill" ? `${state.progress} / ${q.goal.count} Mobs in ${q.goal.world}` :
                   q.goal.type === "stone" ? `${state.progress} / ${q.goal.count} Steine` :
                   q.goal.type === "level" ? `Level ${player.level} (Start: ${state.startedLevel})` : "";
  const done = isCourierQuestDone(q, state);
  const reward = q.reward;
  const rewardItem = reward.item ? `${reward.count}× ${itemDefs[reward.item]?.name || reward.item}` : "";
  block.innerHTML = `
    <div class="courier-quest ${done ? "done" : ""}">
      <strong>${q.desc}</strong>
      <small class="courier-goal">${goalText}</small>
      <div class="courier-reward">
        Belohnung: <strong>${reward.gold} Gold${rewardItem ? " + " + rewardItem : ""}</strong>
      </div>
      <button id="courierClaim" type="button" ${done && !state.claimed ? "" : "disabled"}>
        ${state.claimed ? "Belohnung abgeholt" : done ? "Belohnung abholen" : "Noch nicht fertig"}
      </button>
    </div>
  `;
  document.querySelector("#courierClaim")?.addEventListener("click", claimCourier);
}

function isCourierQuestDone(q, state) {
  if (q.goal.type === "kill") return state.progress >= q.goal.count;
  if (q.goal.type === "stone") return state.progress >= q.goal.count;
  if (q.goal.type === "level") return (player.level - state.startedLevel) >= q.goal.count;
  return false;
}

function claimCourier() {
  if (!courierState || courierState.claimed) return;
  const q = dailyQuests.find((x) => x.id === courierState.questId);
  if (!q || !isCourierQuestDone(q, courierState)) return;
  player.gold += q.reward.gold;
  if (q.reward.item) addInventory(q.reward.item, q.reward.count || 1);
  courierState.claimed = true;
  showToast(`Quest abgeholt: +${q.reward.gold} Gold.`);
  renderCourier();
  updateUi();
  saveCurrentCharacter();
}

function trackCourierKill() {
  if (!courierState || courierState.claimed) return;
  const q = dailyQuests.find((x) => x.id === courierState.questId);
  if (!q) return;
  if (q.goal.type === "kill" && q.goal.world === currentWorldId) courierState.progress += 1;
}
function trackCourierStone() {
  if (!courierState || courierState.claimed) return;
  const q = dailyQuests.find((x) => x.id === courierState.questId);
  if (q?.goal.type === "stone") courierState.progress += 1;
}

function interactNpc(key) {
  if (currentWorldId !== "meadows") return false;
  for (const npc of npcs) {
    if (npc.interactKey.toLowerCase() !== key.toLowerCase()) continue;
    if (Math.hypot(player.x - npc.x, player.y - npc.y) < npc.r + 50) {
      closeAllOverlays();
      toggleOverlay(npc.overlayId);
      if (npc.id === "trader") renderTrader();
      if (npc.id === "trainer") renderTrainer();
      if (npc.id === "courier") renderCourier();
      return true;
    }
  }
  return false;
}

function drawSafeZone() {
  const pulse = 0.6 + Math.sin(performance.now() / 700) * 0.18;
  ctx.save();
  ctx.beginPath();
  ctx.arc(blacksmith.x, blacksmith.y, SAFE_ZONE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(81, 211, 122, ${0.06 + pulse * 0.04})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(81, 211, 122, ${0.4 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.setLineDash([]);
  // Inner runed ring
  ctx.beginPath();
  ctx.arc(blacksmith.x, blacksmith.y, SAFE_ZONE_RADIUS - 14, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(244, 201, 93, ${0.18 * pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = `rgba(180, 240, 200, 0.7)`;
  ctx.textAlign = "center";
  ctx.fillText("SAFE ZONE", blacksmith.x, blacksmith.y - SAFE_ZONE_RADIUS + 8);
  ctx.restore();
}

function drawBlacksmith() {
  ctx.save();
  ctx.translate(blacksmith.x, blacksmith.y);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(-44, 28, 88, 16);
  ctx.fillStyle = "rgba(244,201,93,0.18)";
  ctx.fillRect(-68, -84, 136, 136);

  ctx.fillStyle = "#303946";
  ctx.fillRect(-44, -2, 88, 46);
  ctx.fillStyle = "#667085";
  ctx.fillRect(-28, -18, 56, 18);
  ctx.fillStyle = "#f4c95d";
  ctx.fillRect(-8, -54, 16, 40);
  ctx.fillRect(-26, -48, 52, 12);
  ctx.fillStyle = "#d7a642";
  ctx.fillRect(20, -60, 18, 34);
  ctx.fillStyle = "#f3c7a1";
  ctx.fillRect(-18, -88, 36, 32);
  ctx.fillStyle = "#151a21";
  ctx.fillRect(-28, -96, 56, 14);
  ctx.fillRect(-14, -78, 5, 5);
  ctx.fillRect(9, -78, 5, 5);

  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4c95d";
  ctx.fillText("Schmied", 0, -112);
  if (isNearBlacksmith()) {
    ctx.fillStyle = "#f2f5f7";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("F", 0, -132);
  }
  ctx.restore();
}

function drawPlayer() {
  const classDef = getClassDef(player.classId);
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  const facing = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const invis = (player.invisTimer || 0) > 0;
  // Bewegungs-Phase berechnen
  if (player.lastX === undefined) { player.lastX = player.x; player.lastY = player.y; player.walkPhase = 0; }
  const moved = Math.hypot(player.x - player.lastX, player.y - player.lastY);
  player.lastX = player.x;
  player.lastY = player.y;
  if (moved > 0.5) {
    player.walkPhase = (player.walkPhase || 0) + moved * 0.05;
  } else {
    // Idle: walkPhase zurück Richtung 0
    player.walkPhase = (player.walkPhase || 0) * 0.92;
  }
  const breath = moved < 0.5 ? Math.sin(performance.now() / 700) * 1.2 : 0;
  ctx.save();
  if (invis) ctx.globalAlpha = 0.28;
  const bearActive = player.bearForm > 0;
  const bodyColor = bearActive ? "#7c3a1d" : classDef.color;
  const headColor = bearActive ? "#92400e" : "#f3c7a1";
  const armColor = bearActive ? "#7c3a1d" : "#f3c7a1";
  const legColor = bearActive ? "#5b2a13" : (classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : "#21513d");
  const playerScale = bearActive ? 1.35 : 1.05;
  drawBlockPerson(player.x, player.y, {
    head: headColor,
    body: bodyColor,
    arms: armColor,
    legs: legColor,
  }, playerScale, facing, (player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0) || player.hitFlash > 0,
    classDef.bodyAccent, classDef.accent, player.walkPhase, breath);
  if (!bearActive) drawEquippedWeapon(facing, classDef);
  ctx.restore();
  // Bear-Form-Aura
  if (bearActive) {
    ctx.save();
    ctx.strokeStyle = "rgba(146, 64, 14, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 22 + Math.sin(performance.now() / 100) * 4, 0, Math.PI * 2);
    ctx.stroke();
    // Sekunden-Anzeige
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`Bär ${player.bearForm.toFixed(1)}s`, player.x, player.y - 80);
    ctx.restore();
  }
  // Dash-Crit-Window-Aura
  if (classDef.id === "shadow" && player.dashCritWindow > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 14 + Math.sin(performance.now() / 80) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 149, 64, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawRemotePlayers() {
  const now = Date.now();
  for (const remote of Object.values(remotePlayers)) {
    if (!remote || now - (remote.updatedAt || 0) > 12000) continue;
    // Nur Remote-Spieler in derselben Welt rendern
    if (remote.worldId && remote.worldId !== currentWorldId) continue;
    const classDef = getClassDef(remote.classId);
    drawBlockPerson(remote.x, remote.y, {
      head: "#f3c7a1",
      body: classDef.color || remote.color || "#51d37a",
      arms: "#f3c7a1",
      legs: classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : "#21513d",
    }, 1.02, 0, false, classDef.bodyAccent, classDef.accent);
    drawRemoteWeapon(remote);
    drawHealth(remote.x, remote.y - 72, 54, (remote.hp || 0) / (remote.maxHp || 1));
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = remote.color || "#f2f5f7";
    ctx.fillText(`${remote.name} L${remote.level || 1}`, remote.x, remote.y - 84);
  }
}

function drawRemoteWeapon(remote) {
  const def = itemDefs[remote.weapon] || itemDefs.rust_sword;
  ctx.save();
  ctx.translate(remote.x, remote.y - 12);
  ctx.fillStyle = def.glow || "rgba(217,222,229,0.18)";
  ctx.fillRect(14, -16, 46, 32);
  ctx.fillStyle = def.color || "#d9dee5";
  ctx.fillRect(22, -4, Math.min(def.reach || 82, 82) - 18, 8);
  if (remote.weaponUpgrade) {
    ctx.fillStyle = "#51d37a";
    ctx.fillRect(56, -10, 8 + remote.weaponUpgrade, 20);
  }
  ctx.fillStyle = "#101419";
  ctx.fillRect(12, -6, 14, 12);
  ctx.restore();
}

function drawEquippedWeapon(facing, classDef = getClassDef(player.classId)) {
  const weapon = currentWeapon();
  const style = weapon.style || classDef.weaponStyle || "sword";
  const bob = Math.sin(performance.now() / 120) * 2;
  // Swing-Animation: 80ms Wind-Up zurück, dann schneller Hieb nach vorne, dann zurück in Idle
  let swingRot = 0;
  let swingOffset = 0;
  if (player.swingAnim && player.swingAnim.t > 0) {
    const pct = 1 - player.swingAnim.t / player.swingAnim.max;
    if (pct < 0.25) {
      // Wind-Up: leicht nach hinten
      swingRot = -0.7 * (pct / 0.25);
      swingOffset = -6 * (pct / 0.25);
    } else if (pct < 0.45) {
      // Hieb: schnell nach vorne
      const p = (pct - 0.25) / 0.20;
      swingRot = -0.7 + 1.6 * p;
      swingOffset = -6 + 18 * p;
    } else {
      // Recovery: zurück in Idle
      const p = (pct - 0.45) / 0.55;
      swingRot = 0.9 * (1 - p);
      swingOffset = 12 * (1 - p);
    }
  }
  ctx.save();
  ctx.translate(player.x, player.y - 12 + bob);
  ctx.rotate(facing + swingRot);
  ctx.translate(swingOffset, 0);

  if (style === "staff") {
    // Glow at tip
    const orbPulse = 0.6 + Math.sin(performance.now() / 220) * 0.3;
    ctx.fillStyle = weapon.glow || "rgba(85,215,255,0.5)";
    ctx.fillRect(36, -18, 36, 36);
    // Shaft
    ctx.fillStyle = "#5a3a26";
    ctx.fillRect(8, -3, 56, 6);
    // Grip wrap
    ctx.fillStyle = "#2d1b12";
    ctx.fillRect(14, -4, 10, 8);
    // Orb
    ctx.fillStyle = weapon.color || "#9ee7ff";
    ctx.fillRect(56, -10, 14, 20);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(60, -6 + orbPulse * 2, 6, 6);
    ctx.restore();
    return;
  }

  if (style === "dagger") {
    // Two short blades (one offset)
    ctx.fillStyle = weapon.glow || "rgba(168,179,199,0.22)";
    ctx.fillRect(14, -14, 28, 28);
    ctx.fillStyle = weapon.color || "#a8b3c7";
    ctx.fillRect(20, -4, 30, 8);
    ctx.fillStyle = "#101419";
    ctx.fillRect(12, -6, 10, 12);
    // Off-hand dagger (mirror, behind)
    ctx.fillStyle = weapon.color || "#a8b3c7";
    ctx.globalAlpha = 0.85;
    ctx.fillRect(18, 6, 24, 6);
    ctx.globalAlpha = 1;
    if (player.dashCritWindow > 0) {
      ctx.fillStyle = "rgba(111, 99, 255, 0.4)";
      ctx.fillRect(6, -18, 50, 36);
    }
    ctx.restore();
    return;
  }

  // Default: sword
  ctx.fillStyle = weapon.glow || "rgba(217,222,229,0.18)";
  ctx.fillRect(14, -16, 52, 32);
  if (player.dashCritWindow > 0) {
    ctx.fillStyle = "rgba(111, 99, 255, 0.32)";
    ctx.fillRect(10, -22, Math.min(weapon.reach || 82, 104), 44);
  }
  ctx.fillStyle = weapon.color || "#d9dee5";
  ctx.fillRect(22, -4, Math.min(weapon.reach || 82, 90) - 18, 8);
  if (weapon.id === "fullmoon_sickle") {
    ctx.fillStyle = "#fff2a8";
    ctx.fillRect(74, -20, 16, 8);
    ctx.fillRect(82, -28, 8, 16);
    ctx.fillRect(82, 12, 8, 16);
  }
  ctx.fillStyle = "#101419";
  ctx.fillRect(12, -6, 14, 12);
  if (weapon.rarity === "rare" || weapon.rarity === "epic") {
    ctx.fillStyle = weapon.color;
    ctx.fillRect(56, -10, 10, 20);
  }
  if (weapon.rarity === "epic") {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(36 + Math.sin(performance.now() / 90) * 10, -7, 8, 14);
  }
  ctx.restore();
}

function drawCrescentWaves() {
  for (const wave of crescentWaves) {
    const pct = wave.life / wave.maxLife;
    ctx.save();
    ctx.translate(wave.x, wave.y);
    if (wave.radial) {
      ctx.globalAlpha = clamp(pct, 0, 1);
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, wave.radius * (1.15 - pct * 0.18), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colorMix(wave.color, 0.16);
      ctx.fillRect(-wave.radius, -wave.radius, wave.radius * 2, wave.radius * 2);
      ctx.restore();
      continue;
    }
    ctx.rotate(wave.angle);
    ctx.globalAlpha = clamp(pct, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillRect(60, -8, wave.range * (1.05 - pct * 0.2), 16);
    ctx.fillStyle = wave.color === "#fff2a8" ? "rgba(244,201,93,0.32)" : "rgba(255,52,63,0.28)";
    ctx.fillRect(44, -wave.radius * (1 - pct * 0.35), wave.range, wave.radius * 2 * (1 - pct * 0.35));
    ctx.fillStyle = wave.color;
    ctx.fillRect(80, -34, wave.range * 0.75, 8);
    ctx.fillRect(96, 28, wave.range * 0.55, 7);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawWeaponTrails() {
  for (const trail of weaponTrails) {
    const pct = trail.life / trail.maxLife;
    ctx.save();
    ctx.translate(trail.x, trail.y);
    ctx.rotate(trail.angle);
    ctx.globalAlpha = clamp(pct, 0, 1);
    ctx.fillStyle = trail.glow;
    ctx.fillRect(36, -30 - (1 - pct) * 18, trail.reach, 60 + (1 - pct) * 36);
    ctx.fillStyle = trail.color;
    ctx.fillRect(24, -5, trail.reach, 10);
    if (trail.rarity === "epic") {
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillRect(52, -17, trail.reach * 0.65, 6);
      ctx.fillRect(62, 12, trail.reach * 0.45, 5);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawMob(mob) {
  const isBoss = mob.rank === "boss" || mob.rank === "miniboss";
  // Boss mit eigener Definition?
  if (mob.bossDef) {
    drawBossMob(mob);
  } else if (mob.skin) {
    drawSkinnedMob(mob);
  } else {
    drawBlockPerson(mob.x, mob.y, {
      head: mob.rank === "boss" ? "#f0abfc" : mob.rank === "miniboss" ? "#fdba74" : mob.elite ? "#c084fc" : "#b34d54",
      body: mob.rank === "boss" ? "#701a75" : mob.rank === "miniboss" ? "#7c2d12" : mob.elite ? "#65358f" : "#5b2229",
      arms: mob.rank === "boss" ? "#c026d3" : mob.rank === "miniboss" ? "#ea580c" : mob.elite ? "#8b5cc0" : "#7f2f37",
      legs: "#242936",
    }, mob.scale || (mob.elite ? 1.05 : 0.9), 0, mob.hitTimer > 0);
  }
  const barWidth = mob.rank === "boss" ? 130 : mob.rank === "miniboss" ? 86 : 48;
  const y = mob.y - 70 - mob.r * 0.55;
  drawHealth(mob.x, y, barWidth, mob.hp / mob.maxHp);
  // Level-Badge + Name
  if (mob.level) {
    const lvlColor = levelDiffColor(mob.level);
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    const txt = `Lv ${mob.level}`;
    const tw = ctx.measureText(txt).width + 8;
    ctx.fillStyle = "rgba(10, 14, 18, 0.85)";
    ctx.fillRect(mob.x - tw / 2, y - 26, tw, 14);
    ctx.fillStyle = lvlColor;
    ctx.fillRect(mob.x - tw / 2, y - 26, 3, 14);
    ctx.fillStyle = lvlColor;
    ctx.fillText(txt, mob.x, y - 16);
  }
  if (isBoss || mob.skin) {
    ctx.font = `bold ${isBoss ? 15 : 12}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = mob.rank === "boss" ? "#f0abfc" : mob.rank === "miniboss" ? "#fdba74" : "#e5e7eb";
    ctx.fillText(mob.name, mob.x, y - (mob.level ? 32 : 8));
  }
}

function updateMobAnimState(mob) {
  if (mob.lastX === undefined) { mob.lastX = mob.x; mob.lastY = mob.y; mob.walkPhase = 0; }
  const moved = Math.hypot(mob.x - mob.lastX, mob.y - mob.lastY);
  mob.lastX = mob.x;
  mob.lastY = mob.y;
  if (moved > 0.3) mob.walkPhase = (mob.walkPhase || 0) + moved * 0.06;
  else mob.walkPhase = (mob.walkPhase || 0) * 0.9;
  return { walkPhase: mob.walkPhase || 0, breath: moved < 0.3 ? Math.sin(performance.now() / 600 + mob.x * 0.01) * 1.5 : 0 };
}

function drawSkinnedMob(mob) {
  const s = mob.skin;
  const scale = mob.scale || (mob.elite ? 1.05 : 0.9);
  const anim = updateMobAnimState(mob);
  if (s.shape === "quad") {
    // Vierbeiner — flacher Body, längere Beine seitlich
    ctx.save();
    ctx.translate(mob.x, mob.y);
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(-26 * scale, 18 * scale, 52 * scale, 8 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.legs;
    for (const ox of [-22, -8, 8, 22]) ctx.fillRect(ox * scale, 4 * scale, 8 * scale, 22 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.body;
    ctx.fillRect(-26 * scale, -16 * scale, 52 * scale, 24 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.head;
    ctx.fillRect(18 * scale, -28 * scale, 22 * scale, 22 * scale);
    ctx.fillStyle = "#14181f";
    ctx.fillRect(32 * scale, -22 * scale, 4 * scale, 4 * scale);
    ctx.restore();
  } else if (s.shape === "slime") {
    // Schleim: ovaler Klumpen mit Pulsieren
    const pulse = Math.sin(performance.now() / 200) * 4;
    ctx.save();
    ctx.translate(mob.x, mob.y);
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(-26 * scale, 16 * scale, 52 * scale, 8 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.body;
    ctx.fillRect(-28 * scale, (-12 + pulse) * scale, 56 * scale, (32 - pulse) * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.head;
    ctx.fillRect(-18 * scale, (-22 + pulse) * scale, 36 * scale, 18 * scale);
    ctx.fillStyle = "#14181f";
    ctx.fillRect(-8 * scale, (-15 + pulse) * scale, 4 * scale, 4 * scale);
    ctx.fillRect(4 * scale, (-15 + pulse) * scale, 4 * scale, 4 * scale);
    ctx.restore();
  } else if (s.shape === "flyer") {
    // Fliegender Mob — Flügel-Wedeln
    const wave = Math.sin(performance.now() / 100) * 6;
    ctx.save();
    ctx.translate(mob.x, mob.y);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-20 * scale, 22 * scale, 40 * scale, 6 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.arms;
    ctx.fillRect((-40 - wave) * scale, -16 * scale, 22 * scale, 12 * scale);
    ctx.fillRect((18 + wave) * scale, -16 * scale, 22 * scale, 12 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.body;
    ctx.fillRect(-14 * scale, -14 * scale, 28 * scale, 24 * scale);
    ctx.fillStyle = mob.hitTimer > 0 ? "#ffffff" : s.head;
    ctx.fillRect(-12 * scale, -32 * scale, 24 * scale, 20 * scale);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-6 * scale, -24 * scale, 3 * scale, 3 * scale);
    ctx.fillRect(3 * scale, -24 * scale, 3 * scale, 3 * scale);
    ctx.restore();
  } else if (s.shape === "imp") {
    drawBlockPerson(mob.x, mob.y, { head: s.head, body: s.body, arms: s.arms, legs: s.legs }, scale * 0.78, 0, mob.hitTimer > 0, s.accent, s.accentColor, anim.walkPhase * 1.4, anim.breath);
  } else {
    drawBlockPerson(mob.x, mob.y, { head: s.head, body: s.body, arms: s.arms, legs: s.legs }, scale, 0, mob.hitTimer > 0, s.accent, s.accentColor, anim.walkPhase, anim.breath);
  }
}

function drawBossMob(mob) {
  const def = mob.bossDef;
  const app = def.appearance;
  // Frost-Nova Telegraph
  if (mob.novaCharge > 0) {
    const novaRadius = def.abilities.frostNova.radius;
    const pct = 1 - mob.novaCharge / (mob.novaChargeMax || 1.5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(mob.x, mob.y, novaRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(224, 240, 255, ${0.06 + pct * 0.18})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.6 + pct * 0.4})`;
    ctx.lineWidth = 3 + pct * 4;
    ctx.setLineDash([14, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Lade-Anzeige
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e0f0ff";
    ctx.fillText(`FROST-NOVA in ${mob.novaCharge.toFixed(1)}s`, mob.x, mob.y - mob.r - 40);
    ctx.restore();
  }
  // Aura
  const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.arc(mob.x, mob.y, mob.r + 22 + pulse * 8, 0, Math.PI * 2);
  ctx.fillStyle = app.aura || "rgba(255, 255, 255, 0.18)";
  ctx.fill();
  ctx.restore();
  const anim = updateMobAnimState(mob);
  // Bosse atmen deutlich sichtbar
  const bossBreath = Math.sin(performance.now() / 500 + mob.x * 0.005) * 3;
  drawBlockPerson(mob.x, mob.y, { head: app.head, body: app.body, arms: app.arms, legs: app.legs }, mob.scale || 1.6, 0, mob.hitTimer > 0, app.accent, app.accentColor, anim.walkPhase * 0.6, bossBreath);
  // Phasen-Indikator (Ring um Boss-Fuß)
  const phase = mob.bossPhase || 1;
  ctx.save();
  ctx.translate(mob.x, mob.y + mob.r * 0.55);
  ctx.fillStyle = phase === 3 ? "#ff5d62" : phase === 2 ? "#fbbf24" : "#86efac";
  for (let i = 0; i < phase; i += 1) {
    ctx.fillRect(-18 + i * 16, 18, 12, 4);
  }
  ctx.restore();
}

function drawStone(stone) {
  const glow = 0.5 + Math.sin(stone.pulse * 4) * 0.18;
  const style = stone.pvpTarget
    ? { core: "#f4c95d", shine: "#fff2a8", facets: "#7c5817", shape: "shard" }
    : (stone.style || getStoneStyle(currentWorldId));
  ctx.save();
  ctx.translate(stone.x, stone.y);
  // Aura
  ctx.fillStyle = `${hexToRgba(style.core, 0.12 + glow * 0.16)}`;
  ctx.fillRect(-58, -62, 116, 120);

  const hit = stone.hitTimer > 0;
  const cFill = hit ? "#ffffff" : style.core;
  const sFill = hit ? "#ffffff" : style.shine;
  const fFill = style.facets;

  if (style.shape === "crystal") {
    // Frost: vertikales Kristall, gezackt
    ctx.fillStyle = cFill;
    ctx.beginPath();
    ctx.moveTo(0, -70); ctx.lineTo(28, -10); ctx.lineTo(18, 50); ctx.lineTo(-18, 50); ctx.lineTo(-28, -10); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sFill;
    ctx.beginPath();
    ctx.moveTo(0, -70); ctx.lineTo(28, -10); ctx.lineTo(0, -16); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fFill;
    ctx.fillRect(-6, 12, 12, 18);
  } else if (style.shape === "molten") {
    // Glut: bauchig, mit Lava-Rissen
    ctx.fillStyle = cFill;
    ctx.fillRect(-36, -44, 72, 88);
    ctx.fillStyle = sFill;
    ctx.fillRect(-22, -54, 44, 22);
    ctx.fillStyle = fFill;
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(-30 + i * 16, -10 + (i % 2) * 14, 4, 16);
    }
    ctx.fillStyle = "rgba(255, 220, 120, 0.8)";
    ctx.fillRect(-10 + Math.sin(stone.pulse * 6) * 6, -6, 4, 12);
  } else if (style.shape === "totem") {
    // Schatten/Sumpf: 3 gestapelte Blöcke
    ctx.fillStyle = fFill;
    ctx.fillRect(-32, 26, 64, 24);
    ctx.fillStyle = cFill;
    ctx.fillRect(-28, -8, 56, 36);
    ctx.fillStyle = sFill;
    ctx.fillRect(-24, -44, 48, 36);
    ctx.fillStyle = "#14181f";
    ctx.fillRect(-8, -32, 5, 6); ctx.fillRect(3, -32, 5, 6);
  } else if (style.shape === "spire") {
    // Himmel: schlanker Turm
    ctx.fillStyle = cFill;
    ctx.beginPath();
    ctx.moveTo(0, -76); ctx.lineTo(22, 20); ctx.lineTo(0, 50); ctx.lineTo(-22, 20); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sFill;
    ctx.fillRect(-4, -60, 8, 50);
    ctx.fillStyle = fFill;
    ctx.fillRect(-10, 30, 20, 14);
  } else {
    // shard (default Pugna)
    ctx.fillStyle = cFill;
    ctx.fillRect(-34, -46, 68, 92);
    ctx.fillStyle = sFill;
    ctx.fillRect(-18, -64, 36, 28);
    ctx.fillStyle = fFill;
    ctx.fillRect(-22, -20, 44, 20);
    ctx.fillStyle = "#c084fc";
    ctx.fillRect(-10, -12, 20, 20);
  }
  ctx.restore();
  // Name + HP
  if (style.name && !stone.pvpTarget) {
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = style.core;
    ctx.fillText(style.name, stone.x, stone.y - 90);
  }
  drawHealth(stone.x, stone.y - 78, 70, stone.hp / stone.maxHp);
}

function hexToRgba(hex, alpha) {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16) || 255;
  const g = parseInt(v.slice(2, 4), 16) || 255;
  const b = parseInt(v.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawHealth(x, y, w, pct) {
  ctx.fillStyle = "#111820";
  ctx.fillRect(x - w / 2, y, w, 7);
  ctx.fillStyle = pct < 0.35 ? "#ff5d62" : "#51d37a";
  ctx.fillRect(x - w / 2, y, w * clamp(pct, 0, 1), 7);
}

function drawDroppedItems() {
  const now = Date.now();
  for (const entry of droppedItems) {
    const def = itemDefs[entry.id];
    const y = entry.y + Math.sin(entry.bob) * 5;
    const locked = entry.ownerLockUntil && now < entry.ownerLockUntil && entry.owner;
    const minePriority = locked && entry.owner === authUser;
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(entry.x - 14, y + 15, 28, 8);
    if (locked) {
      ctx.strokeStyle = minePriority ? "#51d37a" : "#ff5d62";
      ctx.lineWidth = 2;
      ctx.strokeRect(entry.x - 17, y - 17, 34, 34);
    }
    ctx.fillStyle = def.rarity === "legendary" ? "#fff2a8" : def.rarity === "epic" ? "#c084fc" : def.rarity === "rare" ? "#55d7ff" : "#f4c95d";
    ctx.fillRect(entry.x - 13, y - 13, 26, 26);
    ctx.fillStyle = "#101419";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(def.icon, entry.x, y + 5);
    if (locked) {
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = minePriority ? "#51d37a" : "#ff5d62";
      ctx.fillText(minePriority ? "DEIN" : entry.owner.slice(0, 8), entry.x, y + 28);
    }
  }
}

function drawMinimap() {
  const w = 180;
  const h = 120;
  const px = canvas.clientWidth - w - 18;
  const py = 18;
  ctx.save();
  ctx.fillStyle = "rgba(10, 14, 18, 0.82)";
  ctx.fillRect(px, py, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
  // Welt-Name oben
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff2a8";
  ctx.fillText(currentWorld().name, px + w / 2, py + 11);
  const sx = w / world.w;
  const sy = (h - 18) / world.h;
  const mapY = py + 14;
  // Portal-Marker
  const portals = currentWorld().portals || {};
  const portalPos = {
    north: { x: world.w / 2, y: 90 },
    south: { x: world.w / 2, y: world.h - 90 },
    east: { x: world.w - 90, y: world.h / 2 },
    west: { x: 90, y: world.h / 2 },
  };
  for (const [edge, portal] of Object.entries(portals)) {
    const pos = portalPos[edge];
    if (!pos) continue;
    const color = getPortalColor(portal.to);
    ctx.fillStyle = color;
    const mx = px + pos.x * sx;
    const my = mapY + pos.y * sy;
    ctx.fillRect(mx - 3, my - 3, 7, 7);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 5, my - 5, 10, 10);
  }
  // Schmied nur in Meadows
  if (currentWorldId === "meadows") {
    ctx.fillStyle = "#f4c95d";
    ctx.fillRect(px + blacksmith.x * sx - 3, mapY + blacksmith.y * sy - 3, 6, 6);
  }
  ctx.fillStyle = "#55d7ff";
  for (const stone of stones) ctx.fillRect(px + stone.x * sx - 2, mapY + stone.y * sy - 2, 4, 4);
  let bossOnMap = null;
  for (const mob of mobs) {
    if (mob.rank === "boss") {
      ctx.fillStyle = mob.bossDef ? "#fff2a8" : "#d946ef";
      ctx.fillRect(px + mob.x * sx - 3, mapY + mob.y * sy - 3, 7, 7);
      // Pulsing ring
      const r = 4 + Math.sin(performance.now() / 200) * 2;
      ctx.strokeStyle = "#fff2a8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + mob.x * sx, mapY + mob.y * sy, r + 3, 0, Math.PI * 2);
      ctx.stroke();
      if (mob.bossDef) bossOnMap = mob.bossDef.name;
    } else if (mob.rank === "miniboss") {
      ctx.fillStyle = "#f97316";
      ctx.fillRect(px + mob.x * sx - 2, mapY + mob.y * sy - 2, 5, 5);
    } else {
      ctx.fillStyle = mob.elite ? "#c084fc" : "#ff6b6b";
      ctx.fillRect(px + mob.x * sx - 1, mapY + mob.y * sy - 1, 2, 2);
    }
  }
  for (const remote of Object.values(remotePlayers)) {
    if (!remote) continue;
    ctx.fillStyle = remote.color || "#51d37a";
    ctx.fillRect(px + remote.x * sx - 2, mapY + remote.y * sy - 2, 4, 4);
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px + player.x * sx - 2, mapY + player.y * sy - 2, 5, 5);
  // Boss-Banner
  if (bossOnMap) {
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff2a8";
    ctx.fillText(`▼ ${bossOnMap}`, px + w / 2, py + h + 12);
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life * 2.5, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloatingText() {
  ctx.textAlign = "center";
  for (const text of floatingText) {
    const t = text.life;
    const max = text.maxLife || 1.2;
    const pct = t / max;
    // Pop-Animation: schnell groß werden, dann normalisieren
    const popPhase = Math.min(1, (max - t) / 0.15);
    const scale = 0.6 + popPhase * 0.7;
    const wobble = Math.sin((max - t) * 18) * 2 * pct;
    const isImportant = text.text && (text.text.includes("CRIT") || text.text.includes("KOMBO"));
    const baseSize = isImportant ? 22 : 16;
    ctx.font = `bold ${baseSize * scale}px sans-serif`;
    ctx.globalAlpha = clamp(pct * 1.6, 0, 1);
    if (isImportant) {
      ctx.shadowColor = text.color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x + wobble, text.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawDeathScreen() {
  ctx.fillStyle = "rgba(10, 14, 18, 0.76)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.fillStyle = "#f2f5f7";
  ctx.textAlign = "center";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("Besiegt", canvas.clientWidth / 2, canvas.clientHeight / 2 - 20);
  ctx.font = "18px sans-serif";
  ctx.fillText("Druecke R: Stats und Inventar werden zurueckgesetzt.", canvas.clientWidth / 2, canvas.clientHeight / 2 + 22);
}

function restart() {
  const oldLevel = player.level;
  resetProgressAfterDeath();
  // Respawn IMMER in Pugna-Wiesen (Heimat-Welt) bei Schmied
  if (currentWorldId !== "meadows") {
    currentWorldId = "meadows";
  }
  player.x = blacksmith.x;
  player.y = blacksmith.y + 120;
  player.hp = player.maxHp;
  player.invuln = 3;
  mobs.length = 0;
  stones.length = 0;
  droppedItems.length = 0;
  weaponTrails.length = 0;
  crescentWaves.length = 0;
  projectiles.length = 0;
  waveTimer = 3.5;
  minibossTimer = 18;
  bossTimer = 48;
  player.powerWindow = 0;
  player.dashCritWindow = 0;
  player.abilityCooldowns = {};
  player.frostSlowTimer = 0;
  seedWorld();
  renderInventory();
  const newLevel = player.level;
  if (oldLevel > newLevel) {
    showToast(`Tod: Level ${oldLevel} → ${newLevel}. Inventar bleibt. Respawn in Pugna-Wiesen.`);
  } else {
    showToast(`Respawn in Pugna-Wiesen.`);
  }
}

function resetProgressAfterDeath() {
  const classId = player.classId;
  const classDef = getClassDef(classId);
  const previousLevel = player.level || 1;
  const previousTalents = { ...(player.talents || {}) };
  const previousTalentPoints = player.talentPoints || 0;
  const previousInventory = (player.inventory || []).map((e) => ({ ...e }));
  const previousWeaponIndex = player.weaponIndex;
  const previousArmorIndex = player.armorIndex;
  const previousWeapon = player.weapon;
  // Nur 1 Level verlieren (min 1)
  const newLevel = Math.max(1, previousLevel - 1);
  // Gold halbiert
  const keptGold = Math.floor((player.gold || 0) * 0.5);
  applyClass(classId, false);
  for (let i = 1; i < newLevel; i += 1) {
    player.maxHp += classDef.stats.hpPerLevel || 14;
    player.baseAttack += classDef.stats.attackPerLevel || 1.6;
  }
  player.level = newLevel;
  player.xp = 0;
  player.nextXp = Math.floor(50 * Math.pow(1.35, newLevel - 1));
  player.gold = keptGold;
  // Talente komplett erhalten
  player.talents = previousTalents;
  player.talentPoints = previousTalentPoints;
  const tree = getTalentTree(classId);
  for (const node of tree) {
    const cnt = previousTalents[node.id] || 0;
    if (!cnt) continue;
    if (node.effect === "maxHpBonus") player.maxHp += node.per * cnt;
    if (node.effect === "armorBonus") player.armorLevel = (player.armorLevel || 0) + node.per * cnt;
  }
  // Inventar bleibt komplett
  player.inventory = previousInventory;
  player.weapon = previousWeapon;
  player.weaponIndex = previousWeaponIndex;
  player.armorIndex = previousArmorIndex;
  saveCurrentCharacter();
}

function loop(now) {
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (hitStopTimer > 0) {
    hitStopTimer -= dt;
    dt = dt * 0.05; // Hit-Stop: 95% Slowdown
  }
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

renderInventory();
updateUi();
requestAnimationFrame(loop);
