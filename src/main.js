import { DEFAULT_CLASS_ID, classDefs, getClassDef } from "./data/classes.js";
import { abilityDefs, getAbilityDef } from "./data/abilities.js";
import { MAX_STACK, item, itemDefs, typeBadges, rarityLabels, affixCatalog, rollAffixes, weaponClassMatch, weaponSocketCount, signatureDefs, armorTypeMods, classArmorType, armorClassMatch } from "./data/items.js";
import { runeTypes, runeTiers, parseRune, runeValue, runeLabel, runeColor, activeRuneWord, runeId, tierOrder } from "./data/runes.js";
import { getTalentTree, abilityMasteryLevel } from "./data/talents.js";
import { worldDefs, getWorldDef, PORTAL_EDGE_THRESHOLD, getStoneStyle, getPortalColor, getWeather } from "./data/worlds.js";
import { rollMobSkin } from "./data/mobs.js";
import { bossForWorld, petForBossId, bosses } from "./data/bosses/index.js";
import { rollDrops, dropTables, getDropTable } from "./data/drops.js";
import { mobPools } from "./data/mobs.js";
import { sfx, setSoundEnabled, isSoundEnabled } from "./audio.js";
import { npcs, shopItems, sellPrices, dailyQuests } from "./data/npcs.js";
import { groundEffects, updateGroundEffects, drawGroundEffects, clearGroundEffects } from "./effects/groundEffects.js";
import * as anim from "./effects/animHelpers.js";

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
  equipBootsSlot: document.querySelector("#equipBootsSlot"),
  equipHatSlot: document.querySelector("#equipHatSlot"),
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
let smithProtectIndices = [];   // Opfer-Items (gleiche Item-ID wie das Hauptitem) — senken die Bruch-Chance
let smithPickProtect = false;   // true = naechster Inventar-Klick waehlt ein Schutz-Opfer
let currentWorldId = "meadows";
let portalCooldown = 0;
let preArenaWorldId = "meadows";
let uiThrottle = 0;
let hitStopTimer = 0;
let bossDefeatCinematic = null; // { name, life, maxLife }
let splashScreen = { life: 2.5, shown: localStorage.getItem("blocpugnaSplashSeen") === "1" };
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

// === AUTO-UPDATE-DETECTION ===
// Liest beim Start die aktuell geladene Version aus dem ?v=-Cache-Param,
// pollt dann alle 60s version.json. Wenn anders → Reload-Banner.
let loadedVersion = null;
let updateBannerShown = false;
function getLoadedVersion() {
  if (loadedVersion) return loadedVersion;
  const scripts = document.querySelectorAll("script[src*='?v=']");
  for (const s of scripts) {
    const m = s.src.match(/[?&]v=([^&]+)/);
    if (m) { loadedVersion = m[1]; return loadedVersion; }
  }
  return null;
}
async function checkForUpdate() {
  if (updateBannerShown) return;
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.version) return;
    const loaded = getLoadedVersion();
    if (loaded && data.version !== loaded) showUpdateBanner(data.version);
  } catch {}
}
function showUpdateBanner(newVersion) {
  if (updateBannerShown) return;
  updateBannerShown = true;
  const banner = document.createElement("div");
  banner.id = "updateBanner";
  banner.innerHTML = `
    <div class="ub-content">
      <span class="ub-icon">⟳</span>
      <span class="ub-text">Neue Version verfügbar: <strong>${newVersion}</strong></span>
      <button id="ubReload" type="button">Neu laden</button>
      <button id="ubDismiss" type="button" class="ub-dismiss">×</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.querySelector("#ubReload").addEventListener("click", () => location.reload());
  document.querySelector("#ubDismiss").addEventListener("click", () => banner.remove());
}
// Initialer Check + alle 60s pollen
setTimeout(checkForUpdate, 10000);
setInterval(checkForUpdate, 60000);
let mouse = { x: canvas.width / 2, y: canvas.height / 2, worldX: 0, worldY: 0 };
let toastTimer = 0;
let waveTimer = 3.5;
let minibossTimer = 18;
let bossTimer = 48;
let raid = null; // Eisbrecher-Flucht Raid-Zustand (nur in Welt frost_raid)
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
  bootsIndex: -1,
  hatIndex: -1,
  // Combo + Klassen-Resourcen
  comboMeter: 0,        // 0-100, fuellt sich durch Skill+Auto-Combos
  comboTimer: 0,        // > 0 = Combo aktiv, faellt sonst
  rage: 0,              // Krieger 0-100
  markCount: 0,         // Schatten — Live-count markierter Mobs
  fireCharges: 0,       // Magier 0-3
  frostCharges: 0,      // Magier 0-3
  formEnergy: 0,        // Druidin 0-100 (laedt im Stab-Modus)
  charmStacksDecayTimer: 0, // Lyra Stack-Decay (8s)
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
  bootsIndex: -1,
  hatIndex: -1,
};

function attackPower() {
  const classDef = getClassDef(player.classId);
  const classBonus = 0;
  const powerBonus = player.powerWindow > 0 ? 10 + Math.floor(player.level * 0.7) : 0;
  const talentBonus = talentEffect("attackBonusFlat");
  const bearMult = player.bearForm > 0 ? 1.4 : 1;
  // Rage-Bonus (Krieger): ab 50 Rage +10%, ab 100 +25%
  let rageMult = 1;
  if (player.classId === "warrior") {
    if ((player.rage || 0) >= 100) rageMult = 1.25;
    else if ((player.rage || 0) >= 50) rageMult = 1.10;
  }
  // Steam-Buff (Magier Element-Fusion): +50%
  const steamMult = (player.steamBuff || 0) > 0 ? 1.5 : 1;
  // Muse-Buff (Lyra): +12% wenn min. 1 charmed/confused
  const museMult = (player.museActive || 0) > 0 ? 1.12 : 1;
  // Boss-Spotlight-Buff
  const spotlightMult = (player.spotlightBuff || 0) > 0 ? 1.30 : 1;
  // Klassen-Waffen-Match (die "eine Regel": passt = 100%, sonst 75%)
  const matchMult = weaponClassMatch(currentWeapon(), player.classId);
  // Runen + Runen-Wort
  const rs = equippedRuneStats();
  let runeMult = 1;
  if (rs.word?.effect.flatDamagePct) runeMult += rs.word.effect.flatDamagePct;
  if (rs.word?.effect.lowHpDamage && player.hp / player.maxHp < 0.30) runeMult += rs.word.effect.lowHpDamage;
  const base = player.baseAttack + player.attackBonus + weaponUpgradeBonus() + classBonus + powerBonus + talentBonus + Math.floor(player.level * 1.5) + (rs.flatAttack || 0) + hatBonusAttack();
  return Math.round(base * bearMult * rageMult * steamMult * museMult * spotlightMult * matchMult * runeMult);
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

// One-Shot-Sperre: keine einzelne Boss-/Mob-Faehigkeit darf mehr als 30% maxHP machen.
function capBossDmg(dmg) {
  return Math.min(dmg, Math.round(player.maxHp * 0.30));
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
  let base = armor ? (itemDefs[armor.id].defense + (armor.upgrade || 0) * 4) : 0;
  // Rüstungstyp-Modifikator + Klassen-Affinität
  if (armor) {
    const aDef = itemDefs[armor.id];
    const typeMod = armorTypeMods[aDef.armorType]?.defMult || 1;
    base = base * typeMod * armorClassMatch(aDef, player.classId);
  }
  return Math.round(base + player.armorLevel * 3 + ironSkin);
}

// Tempo-Modifikator aus dem Rüstungstyp (schwer langsamer, Leder schneller)
function armorSpeedMult() {
  const armor = equippedArmorItem();
  if (!armor) return 1;
  return armorTypeMods[itemDefs[armor.id]?.armorType]?.speedMult || 1;
}

function equippedBootsItem() {
  if (typeof player.bootsIndex !== "number" || player.bootsIndex < 0) return null;
  const entry = player.inventory[player.bootsIndex];
  if (entry && itemDefs[entry.id]?.type === "boots") return entry;
  return null;
}

function equippedHatItem() {
  if (typeof player.hatIndex !== "number" || player.hatIndex < 0) return null;
  const entry = player.inventory[player.hatIndex];
  if (entry && itemDefs[entry.id]?.type === "hat") return entry;
  return null;
}

// Schuhe: zusaetzlicher Tempo-Bonus (1 + speed + upgrade)
function bootsSpeedMult() {
  const boots = equippedBootsItem();
  if (!boots) return 1;
  return 1 + (itemDefs[boots.id].speed || 0) + (boots.upgrade || 0) * 0.02;
}

// Hut: flacher Angriffs-Bonus
function hatBonusAttack() {
  const hat = equippedHatItem();
  if (!hat) return 0;
  return (itemDefs[hat.id].bonusAttack || 0) + (hat.upgrade || 0) * 2;
}

// Hut: zusaetzliche Krit-Chance
function hatBonusCrit() {
  const hat = equippedHatItem();
  if (!hat) return 0;
  return itemDefs[hat.id].bonusCrit || 0;
}

// Beim Entfernen eines Inventar-Items alle Equip-Indizes nachziehen.
// Funktioniert unabhaengig davon, ob vor oder nach splice() aufgerufen.
function shiftEquipIndices(removedIdx) {
  for (const key of ["weaponIndex", "armorIndex", "bootsIndex", "hatIndex"]) {
    if (player[key] === removedIdx) player[key] = -1;
    else if (player[key] > removedIdx) player[key] -= 1;
  }
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
  } else if (def.type === "rune") {
    // Runenstein: facettierter Edelstein in Runen-Farbe + Tier-Glanz
    const rim = def.runeTier === "perfekt" ? "#fde047" : def.runeTier === "strahlend" ? "#c084fc" : def.runeTier === "klar" ? "#60a5fa" : "#94a3b8";
    body = `
      <path d="M24 4 L40 16 L34 42 L14 42 L8 16 Z" fill="${c}" stroke="${rim}" stroke-width="2"/>
      <path d="M24 4 L40 16 L24 22 L8 16 Z" fill="${shine}" opacity="0.35"/>
      <path d="M24 22 L34 42 L14 42 Z" fill="${dark}" opacity="0.25"/>
      <circle cx="24" cy="26" r="4" fill="${shine}" opacity="0.7"/>
    `;
  } else if (def.type === "boots") {
    // Stiefel mit Fluegel-Akzent (Tempo)
    body = `
      <path d="M16 8 L24 8 L24 30 L38 30 L40 40 L16 40 Z" fill="${c}"/>
      <path d="M16 32 L38 32 L38 36 L16 36 Z" fill="${dark}" opacity="0.5"/>
      <path d="M24 14 L34 18 L24 20 Z" fill="${shine}" opacity="0.7"/>
    `;
  } else if (def.type === "hat") {
    // Helm/Krone
    body = `
      <path d="M10 30 Q24 10 38 30 Z" fill="${c}"/>
      <rect x="8" y="30" width="32" height="5" rx="2" fill="${dark}"/>
      <circle cx="24" cy="16" r="3" fill="${shine}" opacity="0.85"/>
      <path d="M16 30 L18 22 L24 30 L30 22 L32 30 Z" fill="${shine}" opacity="0.3"/>
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
    const rw = equippedRuneStats().word;
    const critMult = 1.85 + (rw?.effect.critMult || 0); // "Meuchler" +0.5
    dmg = Math.round(dmg * critMult);
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

// ===== EISBRECHER-FLUCHT (Raid) =====
const RAID_SEGMENTS = [1500, 3000, 4500]; // x-Positionen der Eis-Blockaden
const RAID_BOSS_X = 6000;
const RAID_LAWINE_SPEED = 62; // px/s — Grundtempo der Lawine

function startRaid() {
  raid = {
    lawineX: -400,
    segs: RAID_SEGMENTS.map((x) => ({ x, spawned: false, cleared: false })),
    bossSpawned: false,
    done: false,
    dmgTimer: 0,
    pauseGlow: 0,
  };
  player.x = 240; player.y = world.h / 2;
  player.invuln = 3;
  showToast("❄ EISBRECHER-FLUCHT! Renne nach rechts — räum die Blockaden, die Lawine kommt!");
  sfx.bossIntro?.();
}

function raidActiveBlockade() {
  return raid ? raid.segs.find((s) => !s.cleared) : null;
}

function spawnRaidMobs(seg) {
  if (multiplayerReady && !isHost) return; // im MP nur der Host spawnt
  const n = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i += 1) {
    spawnMob(seg.x + 50 + Math.random() * 200, world.h / 2 + (Math.random() - 0.5) * 360, i === 0 ? "elite" : "mob");
    const m = mobs[mobs.length - 1];
    if (m) m.raidSeg = seg.x;
  }
}

function spawnRaidBoss() {
  if (multiplayerReady && !isHost) return;
  const bossDef = bossForWorld("frostwastes");
  if (!bossDef) return;
  spawnWorldBoss(bossDef);
  const boss = mobs[mobs.length - 1];
  if (boss) {
    boss.isRaidBoss = true;
    boss.x = RAID_BOSS_X + 250;
    boss.y = world.h / 2;
  }
}

function completeRaid() {
  // Belohnung: Gold, Relikt + garantierte legendäre Rüstung passend zur Klasse
  player.gold += 600;
  addInventory("ancient_relic", 2);
  const armorByClass = { warrior: "dragon_plate", shadow: "shadow_leather", runemage: "silk_garb", druid: "shadow_leather", charmer: "silk_garb" };
  addInventory(armorByClass[player.classId] || "dragon_plate", 1);
  showToast("🏆 RAID GESCHAFFT! 600 Gold + 2 Relikte + legendäre Belohnung!");
  cameraShake = 0.8;
  skillFlashes.push({ color: "#fde047", life: 0.8, maxLife: 0.8 });
  sfx.gambleJackpot?.();
  saveCurrentCharacter();
  // Zurück in die Frost-Öden nach kurzer Pause
  setTimeout(() => { if (currentWorldId === "frost_raid") travelToWorld("frostwastes", "east"); }, 4000);
}

function updateRaid(dt) {
  if (!raid || currentWorldId !== "frost_raid" || player.hp <= 0) return;
  const bl = raidActiveBlockade();
  if (bl) {
    // Mobs spawnen wenn der Spieler sich naehert
    if (!bl.spawned && player.x > bl.x - 640) {
      spawnRaidMobs(bl);
      bl.spawned = true;
      showToast("🧊 Eis-Blockade! Räum die Wächter weg, um durchzukommen.");
    }
    // Eis-Wand: blockiert bis geraeumt
    if (bl.spawned && player.x > bl.x - 46) player.x = bl.x - 46;
    // Geraeumt?
    if (bl.spawned && !mobs.some((m) => m.raidSeg === bl.x && m.hp > 0)) {
      bl.cleared = true;
      raid.pauseGlow = 2.5;
      raid.lawineX = Math.min(raid.lawineX, bl.x - 1100); // Atempause: Lawine zurueckgeworfen
      showToast("✓ Blockade zerstört! Weiter, schnell!");
      sfx.smithSuccess?.();
    }
  }
  // Boss-Phase
  if (!bl && !raid.bossSpawned && player.x > RAID_BOSS_X - 650) {
    spawnRaidBoss();
    raid.bossSpawned = true;
    showToast("❄ Der FROST-WYRM versperrt den Ausgang!");
  }
  // Lawine vorruecken — stoppt am Arena-Eingang sobald der Boss da ist
  const lawineTarget = raid.bossSpawned ? RAID_BOSS_X - 750 : world.w;
  if (raid.lawineX < lawineTarget) raid.lawineX += RAID_LAWINE_SPEED * dt;
  raid.pauseGlow = Math.max(0, raid.pauseGlow - dt);
  // Schaden, wenn von der Lawine erfasst (nicht tödlich auf einen Schlag)
  raid.dmgTimer -= dt;
  if (player.x < raid.lawineX + 22 && player.invuln <= 0 && raid.dmgTimer <= 0) {
    player.hp -= Math.max(6, Math.round(player.maxHp * 0.07));
    player.x = raid.lawineX + 64;
    raid.dmgTimer = 0.45;
    cameraShake = 0.4;
    floatText(player.x, player.y - 44, "LAWINE!", "#bae6fd");
    sfx.hit?.();
  }
  // Sieg
  if (raid.bossSpawned && !raid.done && !mobs.some((m) => m.isRaidBoss && m.hp > 0)) {
    raid.done = true;
    completeRaid();
  }
}

function drawRaid(cam) {
  if (!raid || currentWorldId !== "frost_raid") return;
  const t = performance.now() / 1000;
  // Lawinen-Wand links
  const lx = raid.lawineX;
  const g = ctx.createLinearGradient(lx - 400, 0, lx + 30, 0);
  g.addColorStop(0, "rgba(220,240,255,0.95)");
  g.addColorStop(0.7, "rgba(160,200,235,0.85)");
  g.addColorStop(1, "rgba(120,170,210,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(lx - 800, -200, 830, world.h + 400);
  // wirbelnde Schnee-Brocken an der Front
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 14; i += 1) {
    const yy = ((i * 97 + t * 120) % (world.h + 80)) - 40;
    const xx = lx - 20 - (i % 4) * 26 + Math.sin(t * 3 + i) * 10;
    ctx.fillRect(xx, yy, 10 + (i % 3) * 6, 10 + (i % 3) * 6);
  }
  // "LAWINE →" Warnpfeil an der Front
  ctx.fillStyle = "#0b2a3a"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "left";
  ctx.fillText("LAWINE →", lx - 150, cam.y + 50);
  // Eis-Blockaden (ungeraeumte, gespawnte)
  for (const s of raid.segs) {
    if (s.cleared || !s.spawned) continue;
    ctx.fillStyle = "rgba(190,230,255,0.85)";
    ctx.fillRect(s.x - 10, -100, 20, world.h + 200);
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
    ctx.strokeRect(s.x - 10, -100, 20, world.h + 200);
    ctx.fillStyle = "#dff3ff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("🧊 Wächter besiegen", s.x, cam.y + 30);
  }
  // Ziel-Markierung
  ctx.fillStyle = "rgba(253,224,71,0.5)";
  ctx.fillRect(RAID_BOSS_X - 4, -100, 8, world.h + 200);
}

function triggerClassSpotlight(boss) {
  const cls = player.classId;
  player.spotlightBuff = 4;
  if (cls === "warrior") {
    floatText(player.x, player.y - 60, "✦ EISENWUT! +30% DMG ✦", "#f4c95d", { big: true });
    gainRage(50);
  } else if (cls === "shadow") {
    floatText(player.x, player.y - 60, "✦ JAEGER! Marken ewig 4s ✦", "#35d0a4", { big: true });
    player.markEternalTimer = 4;
  } else if (cls === "runemage") {
    floatText(player.x, player.y - 60, "✦ ELEMENTAR-FLUSS! ✦", "#67e8f9", { big: true });
    gainFireCharge(); gainFireCharge(); gainFireCharge();
    gainFrostCharge(); gainFrostCharge(); gainFrostCharge();
  } else if (cls === "druid") {
    floatText(player.x, player.y - 60, "✦ NATURGEWALT! ✦", "#a3e635", { big: true });
    if (!(player.bearForm > 0)) bearForm(); // Boss-Phase startet Baerform
    else player.bearForm = Math.max(player.bearForm, 6);
  } else if (cls === "charmer") {
    // Boss kurz charm-vulnerable (2s)
    applyStatus(boss, "charmed", 2);
    boss.aggroed = false;
    anim.applyCharmAura(boss);
    floatText(player.x, player.y - 60, "✦ VERZAUBERT! Boss 2s charm! ✦", "#ec4899", { big: true });
    player.charmStacks = 5;
  }
}

function updateWorldBoss(mob, dt) {
  if (!mob.bossDef) return;
  const def = mob.bossDef;
  if (!def.abilities) return; // defensiv: Boss ohne Abilities (z.B. unvollstaendiger Snapshot)
  // Bosse aus Firebase-Snapshot haben kein abilityCds-Objekt → crashte vorher
  mob.abilityCds = mob.abilityCds || {};
  const pct = mob.hp / mob.maxHp;
  const newPhase = pct < 0.33 ? 3 : pct < 0.66 ? 2 : 1;
  if (newPhase !== mob.bossPhase) {
    mob.bossPhase = newPhase;
    cameraShake = 0.4;
    skillFlashes.push({ color: def.appearance.head, life: 0.3, maxLife: 0.3 });
    showToast(`${def.name} — Phase ${newPhase}!`);
    sfx.bossPhase();
    // Klassen-Spotlight: jeder Phase-Wechsel triggert klassen-spezifischen Buff (4s)
    triggerClassSpotlight(mob);
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
      const dmg = capBossDmg(Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4)));
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
    const dmg = capBossDmg(Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4)));
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
    const dmg = capBossDmg(Math.max(5, Math.round(mob.damage * ab.damage - totalDefense() * 0.5)));
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
      const dmg = capBossDmg(Math.max(6, Math.round(mob.damage * ab.damage - totalDefense() * 0.4)));
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
    const dmg = capBossDmg(Math.max(5, Math.round(mob.damage * ab.damage - totalDefense() * 0.4)));
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
    const dmg = capBossDmg(Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.4)));
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
    const dmg = capBossDmg(Math.max(8, Math.round(mob.damage * ab.damage - totalDefense() * 0.5)));
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
  // Raid-Welt startet die Eisbrecher-Flucht; sonst Raid-Zustand zuruecksetzen
  if (def.raid) startRaid(); else raid = null;
  portalCooldown = 2.2;
  showToast(`Du betrittst: ${def.name}`);
  sfx.portal();
  cameraShake = 0.3;
  skillFlashes.push({ color: "#9ee7ff", life: 0.3, maxLife: 0.3 });
  // Multiplayer: auf die neue Welt umsteigen (eigener Firebase-Pfad)
  if (multiplayerReady) resubscribeWorld();
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
  if (!event.key) return; // manche synthetische Events haben keine key
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
  if (key === "z") triggerPetActive();
  if (event.key === "1") usePotion();
  if (key === "g" || key === "h" || key === "j" || key === "k") interactNpc(key);
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
    document.getElementById("hudToggles")?.classList.add("collapsed"); // nach Auswahl zuklappen
  });
});

// Desktop-Menu-Toggle (☰ Menü) — klappt die hud-toggles auf/zu
const hudMenuToggle = document.getElementById("hudMenuToggle");
const hudTogglesEl = document.getElementById("hudToggles");
hudMenuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  hudTogglesEl?.classList.toggle("collapsed");
});
document.addEventListener("click", (e) => {
  if (!hudTogglesEl || hudTogglesEl.classList.contains("collapsed")) return;
  if (e.target.closest("#hudToggles") || e.target.closest("#hudMenuToggle")) return;
  hudTogglesEl.classList.add("collapsed");
});
document.querySelectorAll(".overlay-close").forEach((btn) => {
  btn.addEventListener("click", closeAllOverlays);
});
ui.overlayBackdrop?.addEventListener("click", closeAllOverlays);

ui.actionPotion?.addEventListener("click", () => usePotion());
ui.actionSmith?.addEventListener("click", () => useBlacksmith());

window.addEventListener("keyup", (event) => { if (event.key) keys.delete(event.key.toLowerCase()); });

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

canvas.addEventListener("mousedown", swing);

// ===== Mobile / Touch Controls =====
const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
if (isTouchDevice) document.body.classList.add("is-touch");

// Virtuelle Tasten-Map fuer den Joystick (faked WASD)
const joyKeys = { w: false, a: false, s: false, d: false };
function applyJoyKeys() {
  for (const k of Object.keys(joyKeys)) {
    if (joyKeys[k]) keys.add(k);
    else keys.delete(k);
  }
}

const joyEl = document.getElementById("touchJoystick");
const joyKnob = document.getElementById("touchJoyKnob");
let joyActive = false;
let joyStartX = 0, joyStartY = 0;
let joyDirX = 0, joyDirY = 0;        // Live analog-Richtung (normiert -1..1)
let joyLastDirX = 0, joyLastDirY = 0; // Letzte aktive Richtung (haelt fuer Skills)
let joyLastTime = 0;                  // Wann der Joystick zuletzt aktiv war
const JOY_RADIUS = 50;

function setJoyKnob(dx, dy) {
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function joyUpdateDir(dx, dy) {
  const len = Math.hypot(dx, dy);
  const clampedX = len > JOY_RADIUS ? (dx / len) * JOY_RADIUS : dx;
  const clampedY = len > JOY_RADIUS ? (dy / len) * JOY_RADIUS : dy;
  setJoyKnob(clampedX, clampedY);
  // Analog-Direction (normiert auf -1..1)
  if (len > 12) {
    joyDirX = clampedX / JOY_RADIUS;
    joyDirY = clampedY / JOY_RADIUS;
    joyLastDirX = joyDirX;
    joyLastDirY = joyDirY;
    joyLastTime = performance.now();
  } else {
    joyDirX = 0; joyDirY = 0;
  }
  // Threshold um Wackeln zu vermeiden
  const thresh = 12;
  joyKeys.w = clampedY < -thresh;
  joyKeys.s = clampedY > thresh;
  joyKeys.a = clampedX < -thresh;
  joyKeys.d = clampedX > thresh;
  applyJoyKeys();
}

if (joyEl) {
  joyEl.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const rect = joyEl.getBoundingClientRect();
    joyStartX = rect.left + rect.width / 2;
    joyStartY = rect.top + rect.height / 2;
    joyActive = true;
    joyUpdateDir(t.clientX - joyStartX, t.clientY - joyStartY);
  }, { passive: false });
  joyEl.addEventListener("touchmove", (e) => {
    if (!joyActive) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    joyUpdateDir(t.clientX - joyStartX, t.clientY - joyStartY);
  }, { passive: false });
  const endJoy = (e) => {
    if (!joyActive) return;
    e.preventDefault();
    joyActive = false;
    joyKeys.w = joyKeys.a = joyKeys.s = joyKeys.d = false;
    applyJoyKeys();
    setJoyKnob(0, 0);
  };
  joyEl.addEventListener("touchend", endJoy, { passive: false });
  joyEl.addEventListener("touchcancel", endJoy, { passive: false });
}

// Touch-Skill-Buttons
function bindTouchSkill(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("touchstart", (e) => { e.preventDefault(); handler(); }, { passive: false });
  el.addEventListener("click", handler);
}
bindTouchSkill("touchAttack", () => swing({}));
bindTouchSkill("touchSkillQ", () => useAbility(primaryAbilityId()));
bindTouchSkill("touchSkillE", () => useAbility(secondaryAbilityId()));
bindTouchSkill("touchSkillR", () => {
  // Bei Tod als Restart nutzen — sonst Ulti
  if (player.hp <= 0) { restart(); return; }
  useAbility(ultimateAbilityId());
});
bindTouchSkill("touchPotion", () => usePotion());

// Fullscreen-Toggle
function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el).catch(() => {});
    document.body.classList.add("fullscreen-active");
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
    document.body.classList.remove("fullscreen-active");
  }
  // Canvas neu sizen
  setTimeout(() => { if (typeof resizeCanvas === "function") resizeCanvas(); }, 200);
}
document.getElementById("touchFullscreen")?.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("fullscreen-active", !!document.fullscreenElement);
  if (typeof resizeCanvas === "function") resizeCanvas();
});

// Touch-Menu (ersetzt die hud-toggles auf Mobile)
const touchMenuPanel = document.getElementById("touchMenuPanel");
document.getElementById("touchMenu")?.addEventListener("click", (e) => {
  e.stopPropagation();
  touchMenuPanel?.classList.toggle("hidden");
});
document.body.addEventListener("click", (e) => {
  if (!touchMenuPanel || touchMenuPanel.classList.contains("hidden")) return;
  if (e.target.closest("#touchMenuPanel") || e.target.closest("#touchMenu")) return;
  touchMenuPanel.classList.add("hidden");
});
// Menu-Buttons triggern die original-Overlays per data-overlay
touchMenuPanel?.querySelectorAll("button[data-overlay]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.overlay;
    touchMenuPanel.classList.add("hidden");
    document.getElementById(id)?.classList.remove("hidden");
    document.getElementById("overlayBackdrop")?.classList.remove("hidden");
  });
});
// Death-Restart-Button (Mobile + Desktop)
const deathRestartBtn = document.getElementById("deathRestart");
if (deathRestartBtn) {
  const fire = (e) => { e.preventDefault(); if (player.hp <= 0) restart(); };
  deathRestartBtn.addEventListener("click", fire);
  deathRestartBtn.addEventListener("touchstart", fire, { passive: false });
}

document.getElementById("touchSwitchChar")?.addEventListener("click", () => {
  touchMenuPanel?.classList.add("hidden");
  document.getElementById("switchCharBtn")?.click();
});

// Canvas-Tap: setzt manuelles Aim-Target (haelt fuer 2.5s)
canvas.addEventListener("touchstart", (e) => {
  if (!isTouchDevice) return;
  const t = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  // Nur rechte Bildschirmhaelfte: bestimme Aim
  if (x > rect.width * 0.4) {
    e.preventDefault();
    mouse.x = x;
    mouse.y = y;
    manualAimUntil = performance.now() + 2500; // Manuelles Aim ueberschreibt Joystick/Auto 2.5s
  }
}, { passive: false });
let manualAimUntil = 0;

// Doppel-Tap zum Angreifen (anywhere ausser ueber UI)
let lastTap = 0;
canvas.addEventListener("touchend", (e) => {
  if (!isTouchDevice) return;
  const now = performance.now();
  if (now - lastTap < 280) swing({});
  lastTap = now;
}, { passive: false });

// Verhindere Browser-Gesten (Zoom, Pull-to-Refresh) waehrend des Spiels
document.body.addEventListener("touchmove", (e) => {
  // Overlays/Panels sollen scrollen koennen
  const el = e.target;
  if (el && (el.closest("[class*='overlay']") || el.closest(".inv-grid") || el.closest(".codex-body") || el.closest(".talents-list"))) return;
  e.preventDefault();
}, { passive: false });
ui.skillPrimary.addEventListener("click", () => useAbility(primaryAbilityId()));
ui.skillSecondary.addEventListener("click", () => useAbility(secondaryAbilityId()));
ui.skillUltimate?.addEventListener("click", () => useAbility(ultimateAbilityId()));
ui.upgradeWeapon.addEventListener("click", () => smithUpgradeSelected());
ui.smithReturn?.addEventListener("click", () => {
  smithSelectedIndex = null;
  smithProtectIndices = [];
  smithPickProtect = false;
  renderSmithSlot();
});
document.querySelector("#smithProtectPick")?.addEventListener("click", () => {
  smithPickProtect = !smithPickProtect;
  showToast(smithPickProtect ? "Klicke gleiche Items im Inventar als Schutz-Opfer (mehrere moeglich)." : "Auswahl beendet.");
  renderSmithSlot();
});
document.querySelector("#smithProtectClear")?.addEventListener("click", () => {
  smithProtectIndices = [];
  smithPickProtect = false;
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
    const dlIcon = svgIconFor({ id: entry.id }, def.color) || `${def.icon || "?"}`;
    return `<li>
      <span class="dl-icon" style="color:${def.color || "#fff"}">${dlIcon}</span>
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
  const socketBlock = document.querySelector("#smithSocketBlock");
  upgradeBlock?.classList.add("hidden");
  mergeBlock?.classList.add("hidden");
  socketBlock?.classList.add("hidden");
  if (mode === "merge") {
    mergeBlock?.classList.remove("hidden");
    inventoryFilter = "weapon";
    smithSelectedIndex = null;
    renderSmithSlot();
    renderMergeSlots();
  } else if (mode === "socket") {
    socketBlock?.classList.remove("hidden");
    // Waffe noch nicht gewaehlt → Waffen zeigen; sonst nur Runen (sortiert)
    inventoryFilter = socketSelectedIndex !== null ? "rune" : "weapon";
    renderSocketBlock();
  } else {
    upgradeBlock?.classList.remove("hidden");
    inventoryFilter = mode; // "weapon", "armor" oder "gear"
    if (smithSelectedIndex !== null) {
      const inv = player.inventory[smithSelectedIndex];
      const def = inv ? itemDefs[inv.id] : null;
      if (!matchesSmithMode(def, mode)) smithSelectedIndex = null;
    }
    const label = document.querySelector("#smithModeLabel");
    if (label) label.textContent = mode === "armor" ? "Rüstung legen" : mode === "gear" ? "Schuhe/Hut legen" : "Waffe legen";
    renderSmithSlot();
  }
  renderInventory();
}

// === Sockel-Tab Logik ===
let socketSelectedIndex = null; // Inventar-Index der zu sockelnden Waffe

function renderSocketBlock() {
  const slotEl = document.querySelector("#socketWeaponSlot");
  const slotsEl = document.querySelector("#socketSlots");
  const wordEl = document.querySelector("#socketWord");
  if (!slotEl || !slotsEl) return;
  const entry = socketSelectedIndex !== null ? player.inventory[socketSelectedIndex] : null;
  const def = entry ? itemDefs[entry.id] : null;
  if (!entry || !def || def.type !== "weapon") {
    socketSelectedIndex = null;
    slotEl.className = "smith-item-slot empty";
    slotEl.innerHTML = `<span class="smith-slot-hint">Waffe legen →</span>`;
    slotsEl.innerHTML = "";
    wordEl?.classList.add("hidden");
    return;
  }
  // Waffe anzeigen
  const iconHtml = svgIconFor(entry, def.color) || `<span class="icon" style="color:${def.color}">${def.icon}</span>`;
  slotEl.className = `smith-item-slot filled ${def.rarity}`;
  slotEl.innerHTML = `${iconHtml}<span class="smith-slot-name">${itemLabel(entry)}</span>`;
  // Sockel rendern
  const maxS = weaponSocketCount(entry);
  entry.sockets = entry.sockets || [];
  slotsEl.innerHTML = "";
  if (maxS === 0) {
    slotsEl.innerHTML = `<small style="color:var(--muted)">Diese Waffe hat keine Sockel (Selten+ nötig).</small>`;
  }
  for (let i = 0; i < maxS; i += 1) {
    const rid = entry.sockets[i];
    const slot = document.createElement("div");
    slot.className = "socket-slot " + (rid ? "filled" : "empty");
    if (rid) {
      const col = runeColor(rid);
      const r = parseRune(rid);
      slot.style.color = col;
      slot.style.borderColor = col;
      slot.innerHTML = `<span>${r?.def.icon || "💎"}</span><span class="rune-remove" title="Rune entfernen">×</span>`;
      slot.title = runeLabel(rid);
      slot.querySelector(".rune-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removeRuneFromSocket(socketSelectedIndex, i);
      });
    } else {
      slot.title = "Leerer Sockel — Rune im Inventar anklicken";
    }
    slotsEl.append(slot);
  }
  // Runen-Wort anzeigen
  const word = activeRuneWord(entry.sockets);
  if (word && wordEl) {
    wordEl.classList.remove("hidden");
    wordEl.innerHTML = `★ ${word.name}<br><small>${word.desc}</small>`;
  } else {
    wordEl?.classList.add("hidden");
  }
}

function selectSocketWeapon(index) {
  const entry = player.inventory[index];
  if (!entry || itemDefs[entry.id]?.type !== "weapon") return;
  socketSelectedIndex = index;
  inventoryFilter = "rune"; // jetzt nur noch Runen zeigen
  renderSocketBlock();
  renderInventory();
}

function socketRuneIntoSelected(runeIndex) {
  if (socketSelectedIndex === null) { showToast("Erst eine Waffe legen."); return; }
  const weapon = player.inventory[socketSelectedIndex];
  const rune = player.inventory[runeIndex];
  if (!weapon || !rune) return;
  const maxS = weaponSocketCount(weapon);
  if (maxS <= 0) { showToast("Diese Waffe hat keine Sockel (Selten+ nötig)."); return; }
  weapon.sockets = weapon.sockets || [];
  if (weapon.sockets.length >= maxS) { showToast(`Alle ${maxS} Sockel belegt.`); return; }
  weapon.sockets.push(rune.id);
  rune.count = (rune.count || 1) - 1;
  if (rune.count <= 0) {
    player.inventory.splice(runeIndex, 1);
    if (runeIndex < socketSelectedIndex) socketSelectedIndex -= 1; // Index nachziehen
  }
  sfx.pickup?.();
  const word = activeRuneWord(weapon.sockets);
  showToast(word ? `Rune gesockelt! Runen-Wort aktiv: ${word.name}!` : `Rune gesockelt (${weapon.sockets.length}/${maxS}).`);
  saveCurrentCharacter();
  renderSocketBlock();
  renderInventory();
}

function removeRuneFromSocket(weaponIndex, socketIdx) {
  const weapon = player.inventory[weaponIndex];
  if (!weapon || !weapon.sockets) return;
  const rid = weapon.sockets[socketIdx];
  if (!rid) return;
  weapon.sockets.splice(socketIdx, 1);
  // Rune zurueck ins Inventar
  const existing = player.inventory.find((e) => e.id === rid);
  if (existing) existing.count = (existing.count || 1) + 1;
  else player.inventory.push(item(rid, 1));
  showToast("Rune entfernt — zurueck im Inventar.");
  saveCurrentCharacter();
  renderSocketBlock();
  renderInventory();
}

document.querySelector("#socketReturn")?.addEventListener("click", () => {
  socketSelectedIndex = null;
  inventoryFilter = "weapon"; // zurueck zur Waffen-Auswahl
  renderSocketBlock();
  renderInventory();
});

// Handels-System Buttons
document.getElementById("tradeButton")?.addEventListener("click", (e) => {
  const partner = e.currentTarget.dataset.partner;
  if (partner) startTrade(partner);
});
document.getElementById("tradeReady")?.addEventListener("click", setTradeReady);
document.getElementById("tradeCancel")?.addEventListener("click", cancelTrade);
document.getElementById("tradeCancelBtn")?.addEventListener("click", cancelTrade);
document.getElementById("tradeMyGold")?.addEventListener("change", () => { if (activeTrade) resetReadyAndSync(); });

// Glücksspiel-Buttons
document.getElementById("gambleRoll")?.addEventListener("click", rollGamble);
document.getElementById("gambleClear")?.addEventListener("click", () => { gamblePot.clear(); renderGamble(); });

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
document.querySelector("#petSelect")?.addEventListener("change", (e) => setActivePet(e.target.value));
document.querySelector("#petActiveBtn")?.addEventListener("click", triggerPetActive);

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
  if (multiplayerReady) resubscribeWorld();
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
  const sockets = slot.dataset.tooltipSockets || "";
  ui.itemTooltip.innerHTML = `
    <strong style="color:${color}">${name}</strong>
    <small class="tt-rarity">${rarity}</small>
    <span class="tt-stat">${stat}</span>
    ${affixes ? `<span class="tt-affixes">${affixes}</span>` : ""}
    ${sockets ? `<span class="tt-sockets">${sockets}</span>` : ""}
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
  // Schutz-Opfer waehlen: nur GLEICHE Item-ID wie das Hauptitem; mehrere moeglich (Toggle)
  if (smithPickProtect) {
    const mainItem = smithSelectedIndex !== null ? player.inventory[smithSelectedIndex] : null;
    if (!mainItem) { showToast("Erst ein Item zum Aufwerten waehlen."); return; }
    if (index === smithSelectedIndex) { showToast("Das aufzuwertende Item kann sich nicht selbst schuetzen."); return; }
    if (invItem.id !== mainItem.id) { showToast("Nur die GLEICHE Waffe/Rüstung kann als Schutz dienen."); return; }
    if (index === player.weaponIndex || index === player.armorIndex || index === player.bootsIndex || index === player.hatIndex) { showToast("Ausgeruestete Items koennen nicht geopfert werden."); return; }
    const at = smithProtectIndices.indexOf(index);
    if (at >= 0) smithProtectIndices.splice(at, 1); // schon gewaehlt → abwaehlen
    else smithProtectIndices.push(index);
    renderSmithSlot();
    return;
  }
  if (smithMode === "merge") {
    if (slot.classList.contains("merge-disabled")) return;
    if (!mergeMap[invItem.id]) {
      showToast("Nur Common-Waffen/Rüstung sind verschmelzbar.");
      return;
    }
    tryAddToMerge(index);
    return;
  }
  if (smithMode === "socket") {
    if (def.type === "weapon") { selectSocketWeapon(index); return; }
    if (def.type === "rune") { socketRuneIntoSelected(index); return; }
    showToast("Lege eine Waffe und klicke dann Runen.");
    return;
  }
  // Upgrade-Modus
  if (!matchesSmithMode(def, smithMode)) {
    showToast(smithMode === "weapon" ? "Wähle eine Waffe." : smithMode === "gear" ? "Wähle Schuhe oder einen Hut." : "Wähle eine Rüstung.");
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
  // Wenn Schmied-Overlay offen → mode-abhaengig
  const smithOpen = ui.smithOverlay && !document.querySelector("#smithOverlay").classList.contains("hidden");
  if (smithOpen && smithMode === "socket") {
    if (def.type === "weapon") { selectSocketWeapon(index); return; }
    if (def.type === "rune") { socketRuneIntoSelected(index); return; }
    return; // andere Items im Sockel-Modus ignorieren
  }
  if (smithOpen && isUpgradable(def)) {
    selectSmithItem(index);
    return;
  }
  if (def.type === "potion") usePotion(index);
  if (def.type === "weapon") equipWeapon(index);
  if (def.type === "armor") equipArmor(index);
  if (def.type === "boots") equipBoots(index);
  if (def.type === "hat") equipHat(index);
  if (def.type === "rune") socketRuneFromInventory(index);
});

// Rune aus Inventar in die ausgeruestete Waffe sockeln (naechster freier Slot)
function socketRuneFromInventory(index) {
  const entry = player.inventory[index];
  if (!entry) return;
  const weapon = equippedWeaponItem();
  if (!weapon) { showToast("Keine Waffe ausgeruestet."); return; }
  const maxSockets = weaponSocketCount(weapon);
  if (maxSockets <= 0) { showToast("Diese Waffe hat keine Sockel (braucht Selten+)."); return; }
  weapon.sockets = weapon.sockets || [];
  if (weapon.sockets.length >= maxSockets) { showToast(`Alle ${maxSockets} Sockel belegt.`); return; }
  weapon.sockets.push(entry.id);
  // Rune aus Inventar entfernen (1 Stueck)
  entry.count = (entry.count || 1) - 1;
  if (entry.count <= 0) player.inventory.splice(index, 1);
  sfx.pickup?.();
  const word = activeRuneWord(weapon.sockets);
  showToast(word ? `Rune gesockelt! Runen-Wort aktiv: ${word.name}!` : `Rune gesockelt (${weapon.sockets.length}/${maxSockets}).`);
  saveCurrentCharacter();
  renderInventory();
  if (typeof updateCharOverlay === "function") updateCharOverlay(totalDefense());
}

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
    // Merge statt Ersetzen — bewahrt clientseitigen Animations-State (_walk, _face, ...)
    for (const [name, data] of Object.entries(value)) {
      const existing = remotePlayers[name];
      if (existing) {
        // Action erkennen (neue act-Zeichenkette) → Effekt abspielen
        if (data.act && data.act !== existing._lastAct) {
          handleRemoteAction(existing, data.act);
          existing._lastAct = data.act;
        }
        Object.assign(existing, data);
      } else {
        data._lastAct = data.act || null;
        remotePlayers[name] = data;
      }
    }
    // Entfernte Spieler rauswerfen
    for (const name of Object.keys(remotePlayers)) {
      if (!value[name]) delete remotePlayers[name];
    }
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

// Cloud-Sync: lädt alle Chars für den eingeloggten User aus Firebase
async function fetchCharactersFromCloud(username = authUser) {
  if (!username) return [];
  const api = firebaseApi();
  if (!api) return [];
  try {
    const ref = api.ref(api.database, `blocpugna/users/${username}/characters`);
    const snap = await api.get(ref);
    const val = snap.val();
    if (!val) return [];
    return Object.values(val).map((c) => ({ ...c, inventory: c.inventory || [] }));
  } catch (e) {
    console.warn("fetchCharactersFromCloud failed", e);
    return [];
  }
}

// Cloud-Sync: lädt + merged mit localStorage (cloud gewinnt bei lastPlayedAt-Konflikt)
async function syncCharactersFromCloud(username = authUser) {
  if (!username) return loadCharacters(username);
  const cloud = await fetchCharactersFromCloud(username);
  const local = loadCharacters(username);
  // Merge: für jeden charId nehme die neuere Version
  const byId = new Map();
  for (const c of local) byId.set(c.id, c);
  for (const c of cloud) {
    const ex = byId.get(c.id);
    if (!ex) { byId.set(c.id, c); continue; }
    // Niemals einen Starter-Stand einen fortgeschrittenen Charakter verdraengen lassen.
    if (isStarterLoadout(c) && !isStarterLoadout(ex)) continue;
    if (isStarterLoadout(ex) && !isStarterLoadout(c)) { byId.set(c.id, c); continue; }
    // Sonst: neuere Version gewinnt (Cloud bei Gleichstand).
    if ((c.lastPlayedAt || 0) >= (ex.lastPlayedAt || 0)) byId.set(c.id, c);
  }
  const merged = [...byId.values()];
  saveCharacterList(merged, username);
  return merged;
}

// Save zu Cloud + localStorage
async function saveCharacterToCloud(char, username = authUser) {
  if (!username || !char?.id) return;
  const api = firebaseApi();
  if (!api) return;
  try {
    const ref = api.ref(api.database, `blocpugna/users/${username}/characters/${char.id}`);
    // Sanitize: Firebase mag keine undefined values
    const clean = JSON.parse(JSON.stringify(char));
    await api.set(ref, clean);
  } catch (e) {
    console.warn("saveCharacterToCloud failed", e);
  }
}

async function deleteCharacterFromCloud(charId, username = authUser) {
  if (!username || !charId) return;
  const api = firebaseApi();
  if (!api) return;
  try {
    await api.remove(api.ref(api.database, `blocpugna/users/${username}/characters/${charId}`));
  } catch (e) {
    console.warn("deleteCharacterFromCloud failed", e);
  }
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
    bootsIndex: player.bootsIndex,
    hatIndex: player.hatIndex,
    talents: { ...(player.talents || {}) },
    talentPoints: player.talentPoints || 0,
    pets: { ...(player.pets || {}) },
    activePet: player.activePet || null,
    courierState: courierState ? { ...courierState } : null,
    trainerLastReset,
    lastPlayedAt: Date.now(),
  };
}

// Erkennt den blanken Starter-Stand (3 Tränke + Starterwaffe + Lederweste, Level 1).
// Dient als Schutz: ein solcher Stand darf NIE einen fortgeschrittenen Charakter ueberschreiben.
function isStarterLoadout(snap) {
  if (!snap) return false;
  if ((snap.level || 1) > 1) return false;
  const inv = snap.inventory || [];
  if (inv.length > 3) return false;
  const hasPotion = inv.some((e) => e.id === "health_potion");
  const hasArmor = inv.some((e) => e.id === "leather_armor");
  return hasPotion && hasArmor;
}

// Plausibilitaets-Check: wuerde der neue Snapshot einen klar reicheren Stand zerstoeren?
function wouldDestroyProgress(snap, existing) {
  if (!existing) return false;
  const exLvl = existing.level || 1;
  const exItems = (existing.inventory || []).length;
  const snLvl = snap.level || 1;
  const snItems = (snap.inventory || []).length;
  // Starter-Stand ueber fortgeschrittenen Charakter = blockieren
  if (isStarterLoadout(snap) && !isStarterLoadout(existing) && (exLvl > 1 || exItems > 3)) return true;
  // Mehr als 1 Level Verlust ist nur durch Bug moeglich (Tod kostet genau 1)
  if (snLvl < exLvl - 1) return true;
  // Inventar von >=3 Items auf 0 geschrumpft = verdaechtig
  if (exItems >= 3 && snItems === 0) return true;
  return false;
}

function saveCurrentCharacter() {
  if (!authUser || !currentCharId) return;
  const snap = serializeCurrentCharacter();
  if (!snap) return;
  const list = loadCharacters();
  const idx = list.findIndex((c) => c.id === currentCharId);
  if (idx >= 0 && wouldDestroyProgress(snap, list[idx])) {
    console.warn("Save blockiert: Snapshot wuerde Fortschritt zerstoeren", currentCharId, { snapLvl: snap.level, snapItems: snap.inventory.length, exLvl: list[idx].level, exItems: (list[idx].inventory || []).length });
    return;
  }
  if (idx >= 0) list[idx] = snap;
  else list.push(snap);
  saveCharacterList(list);
  // Fire-and-forget Cloud-Save
  saveCharacterToCloud(snap);
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
  player.bootsIndex = char.bootsIndex ?? -1;
  player.hatIndex = char.hatIndex ?? -1;
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
    bootsIndex: -1,
    hatIndex: -1,
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
  deleteCharacterFromCloud(charId);
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
  if (ui.charSelectUser) ui.charSelectUser.textContent = `Eingeloggt als ${authUser} · synce...`;
  renderCharList();
  ui.charSelectOverlay.classList.remove("hidden");
  ui.charCreateOverlay?.classList.add("hidden");
  ui.classOverlay?.classList.add("hidden");
  // Cloud-Sync nachladen — wenn das durch ist, Liste neu rendern
  syncCharactersFromCloud(authUser).then(() => {
    if (ui.charSelectUser) ui.charSelectUser.textContent = `Eingeloggt als ${authUser}`;
    renderCharList();
  });
}

function hideCharacterSelect() {
  ui.charSelectOverlay?.classList.add("hidden");
  ui.charCreateOverlay?.classList.add("hidden");
}

async function enterGameWithCharacter(char) {
  hideCharacterSelect();
  // Vor dem Anwenden die frischeste Version aus der Cloud holen, damit ein
  // veralteter lokaler Stand niemals einen volleren Cloud-Stand verdraengt.
  let best = char;
  try {
    const cloud = await fetchCharactersFromCloud(authUser);
    const cloudChar = cloud.find((c) => c.id === char.id);
    if (cloudChar) {
      const cLvl = cloudChar.level || 1, cItems = (cloudChar.inventory || []).length;
      const lLvl = char.level || 1, lItems = (char.inventory || []).length;
      // Cloud bevorzugen wenn neuer ODER klar reicher (Level/Items)
      const cloudNewer = (cloudChar.lastPlayedAt || 0) >= (char.lastPlayedAt || 0);
      const cloudRicher = cLvl > lLvl || cItems > lItems;
      if (cloudNewer || cloudRicher) best = cloudChar;
    }
  } catch {}
  applyCharacter(best);
  await connectMultiplayer();
  scheduleTutorial(best);
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
    act: player._lastAction || "",
    updatedAt: Date.now(),
  });
}

// Lokale Aktion fuer andere Spieler broadcasten (kompakte Zeichenkette)
let lastActionBroadcast = 0;
function broadcastAction(kind, abilityId) {
  const ang = (typeof aimAngle === "function") ? aimAngle() : 0;
  player._lastAction = `${kind}|${abilityId || ""}|${ang.toFixed(2)}|${Date.now()}`;
  // Skills sofort senden; schnelle Auto-Attacks throttlen (max alle 140ms forcen)
  const now = performance.now();
  if (kind === "skill" || now - lastActionBroadcast > 140) {
    lastActionBroadcast = now;
    syncPresence(true);
  }
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

function buildWorldRefs(api, worldId = currentWorldId) {
  // Pro-Welt-Pfad: jede Welt hat eigene Mobs/Steine/Host → keine Überlappung mehr
  const base = `blocpugna/rooms/${multiplayerRoom}/worlds/${worldId}`;
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
      // Ziel-Position fuer Interpolation merken, x/y NICHT hart ueberschreiben
      const tx = enriched.x, ty = enriched.y;
      Object.assign(ex, enriched);
      ex.tx = tx; ex.ty = ty;
      ex.x = ex._cx !== undefined ? ex._cx : tx; // aktuelle (gelerpte) Position halten
      ex.y = ex._cy !== undefined ? ex._cy : ty;
    } else {
      const m = { serverId: id, hitTimer: 0, ...enriched, tx: enriched.x, ty: enriched.y, _cx: enriched.x, _cy: enriched.y };
      mobs.push(m);
    }
  }
  // remove ghosts: anything not present in the authoritative snapshot,
  // including locally-seeded mobs without a serverId
  for (let i = mobs.length - 1; i >= 0; i -= 1) {
    if (!mobs[i].serverId || !seen.has(mobs[i].serverId)) mobs.splice(i, 1);
  }
  initialSnapshotApplied = true;
}

// Non-Host: Mobs sanft zur Ziel-Position interpolieren (glaettet 150ms-Snapshots)
function interpolateRemoteMobs(dt) {
  if (isHost) return;
  const k = Math.min(1, dt * 12); // Lerp-Faktor
  for (const m of mobs) {
    if (m.tx === undefined) continue;
    m._cx = (m._cx ?? m.x) + (m.tx - (m._cx ?? m.x)) * k;
    m._cy = (m._cy ?? m.y) + (m.ty - (m._cy ?? m.y)) * k;
    m.x = m._cx;
    m.y = m._cy;
  }
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

// ===== HANDELS-SYSTEM =====
let activeTrade = null; // { partner, ref, side, offerIdx:Set, gold, theirOffer, theirGold, theirReady, myReady, applied }
let tradeUnsub = null;

function tradePairId(a, b) {
  return [a, b].sort().join("__");
}

// Naechster Remote-Spieler in Handels-Reichweite (gleiche Welt)
function nearestTradePartner() {
  if (!multiplayerReady || player.hp <= 0) return null;
  let best = null, bd = 90;
  for (const [name, r] of Object.entries(remotePlayers)) {
    if (!r || (r.worldId && r.worldId !== currentWorldId)) continue;
    const d = Math.hypot((r.x || 0) - player.x, (r.y || 0) - player.y);
    if (d < bd) { bd = d; best = name; }
  }
  return best;
}

function updateTradeButton() {
  const btn = document.getElementById("tradeButton");
  if (!btn) return;
  if (activeTrade) { btn.classList.add("hidden"); return; }
  const partner = nearestTradePartner();
  if (partner) {
    btn.classList.remove("hidden");
    const nameEl = document.getElementById("tradePartnerName");
    if (nameEl) nameEl.textContent = partner;
    btn.dataset.partner = partner;
  } else {
    btn.classList.add("hidden");
  }
}

function startTrade(partner) {
  const api = firebaseApi();
  if (!api || !worldRefs || !partner) return;
  const pairId = tradePairId(authUser, partner);
  const ref = api.ref(api.database, `${worldRefs.base}/trades/${pairId}`);
  const side = authUser < partner ? "A" : "B";
  activeTrade = { partner, ref, side, offerIdx: new Set(), gold: 0, theirOffer: [], theirGold: 0, theirReady: false, myReady: false, applied: false };
  // Eigene Seite initialisieren
  writeMyTrade();
  tradeUnsub = api.onValue(ref, (snap) => onTradeUpdate(snap.val()));
  document.getElementById("tradeOverlay")?.classList.remove("hidden");
  document.getElementById("overlayBackdrop")?.classList.remove("hidden");
  const nameTags = [document.getElementById("tradeWithName"), document.getElementById("tradePartnerHead")];
  nameTags.forEach((e) => { if (e) e.textContent = partner; });
  renderTradeOverlay();
}

function offerEntryFor(idx) {
  const e = player.inventory[idx];
  if (!e) return null;
  return { id: e.id, count: e.count || 1, upgrade: e.upgrade || 0, affixes: e.affixes || null, sockets: e.sockets || null };
}

function writeMyTrade() {
  if (!activeTrade) return;
  const items = [...activeTrade.offerIdx].map(offerEntryFor).filter(Boolean);
  const payload = { items, gold: Math.max(0, Math.min(player.gold, activeTrade.gold || 0)), ready: activeTrade.myReady };
  const key = activeTrade.side === "A" ? "offerA" : "offerB";
  const readyKey = activeTrade.side === "A" ? "readyA" : "readyB";
  const api = firebaseApi();
  // Nur die eigenen Felder aktualisieren (Partner schreibt seine)
  api.update(activeTrade.ref, { a: tradePartnerA(), b: tradePartnerB(), [key]: payload, [readyKey]: activeTrade.myReady, ts: Date.now() });
}

function tradePartnerA() { return activeTrade.side === "A" ? authUser : activeTrade.partner; }
function tradePartnerB() { return activeTrade.side === "A" ? activeTrade.partner : authUser; }

function onTradeUpdate(data) {
  if (!activeTrade || !data) { return; }
  const theirKey = activeTrade.side === "A" ? "offerB" : "offerA";
  const theirReadyKey = activeTrade.side === "A" ? "readyB" : "readyA";
  const theirs = data[theirKey] || { items: [], gold: 0 };
  activeTrade.theirOffer = theirs.items || [];
  activeTrade.theirGold = theirs.gold || 0;
  activeTrade.theirReady = !!data[theirReadyKey];
  // Beide bereit + noch nicht angewendet → Tausch ausfuehren
  if (data.readyA && data.readyB && !activeTrade.applied) {
    activeTrade.applied = true;
    executeTrade();
    return;
  }
  renderTradeOverlay();
}

function executeTrade() {
  // Eigene angebotene Items entfernen (hohe Indizes zuerst)
  const indices = [...activeTrade.offerIdx].sort((a, b) => b - a);
  for (const idx of indices) {
    player.inventory.splice(idx, 1);
    shiftEquipIndices(idx);
  }
  player.gold = Math.max(0, player.gold - (activeTrade.gold || 0));
  // Erhaltene Items einbuchen
  for (const it of activeTrade.theirOffer) {
    player.inventory.push({ id: it.id, count: it.count || 1, upgrade: it.upgrade || 0, ...(it.affixes ? { affixes: it.affixes } : {}), ...(it.sockets ? { sockets: it.sockets } : {}) });
  }
  player.gold += activeTrade.theirGold || 0;
  showToast(`Handel mit ${activeTrade.partner} abgeschlossen!`);
  sfx.pickup?.();
  saveCurrentCharacter();
  // Trade-Knoten aufraeumen (eine Seite genuegt)
  const api = firebaseApi();
  if (activeTrade.side === "A") setTimeout(() => api.set(activeTrade.ref, null), 600);
  closeTrade();
  renderInventory();
  updateUi();
}

function renderTradeOverlay() {
  if (!activeTrade) return;
  // Mein Angebot
  const myEl = document.getElementById("tradeMyOffer");
  if (myEl) {
    myEl.innerHTML = "";
    for (const idx of activeTrade.offerIdx) {
      const e = player.inventory[idx];
      if (!e) continue;
      const def = itemDefs[e.id];
      const d = document.createElement("div");
      d.className = "trade-item";
      d.style.color = def?.color || "#fff";
      const myIcon = svgIconFor(e, def?.color) || `<span>${def?.icon || "?"}</span>`;
      d.innerHTML = `${myIcon}<span class="tcount">${e.count > 1 ? e.count : ""}</span>`;
      d.title = "Klick: zurueck ins Inventar";
      d.addEventListener("click", () => { activeTrade.offerIdx.delete(idx); resetReadyAndSync(); });
      myEl.append(d);
    }
  }
  // Partner-Angebot
  const theirEl = document.getElementById("tradeTheirOffer");
  if (theirEl) {
    theirEl.innerHTML = "";
    for (const it of activeTrade.theirOffer) {
      const def = itemDefs[it.id];
      const d = document.createElement("div");
      d.className = "trade-item";
      d.style.color = def?.color || "#fff";
      const theirIcon = svgIconFor(it, def?.color) || `<span>${def?.icon || "?"}</span>`;
      d.innerHTML = `${theirIcon}<span class="tcount">${it.count > 1 ? it.count : ""}</span>`;
      d.title = `${def?.name || it.id}${it.upgrade ? " +" + it.upgrade : ""}`;
      theirEl.append(d);
    }
  }
  const tg = document.getElementById("tradeTheirGold");
  if (tg) tg.textContent = `Gold: ${activeTrade.theirGold || 0}`;
  const myTag = document.getElementById("tradeMyReadyTag");
  if (myTag) { myTag.textContent = activeTrade.myReady ? "bereit ✓" : "nicht bereit"; myTag.classList.toggle("ready", activeTrade.myReady); }
  const theirTag = document.getElementById("tradeTheirReadyTag");
  if (theirTag) { theirTag.textContent = activeTrade.theirReady ? "bereit ✓" : "nicht bereit"; theirTag.classList.toggle("ready", activeTrade.theirReady); }
  // Inventar (klickbar)
  const inv = document.getElementById("tradeInventory");
  if (inv) {
    inv.innerHTML = "";
    const partnerClass = remotePlayers[activeTrade.partner]?.classId || null;
    // Inventar nach Nuetzlichkeit fuer den Partner sortieren (nuetzlich oben, Muell unten)
    const entries = player.inventory
      .map((e, idx) => ({ e, idx }))
      .filter(({ e, idx }) => e && !activeTrade.offerIdx.has(idx) && itemDefs[e.id] && idx !== player.weaponIndex && idx !== player.armorIndex && idx !== player.bootsIndex && idx !== player.hatIndex)
      .sort((a, b) => partnerUsefulness(b.e, partnerClass) - partnerUsefulness(a.e, partnerClass));
    for (const { e, idx } of entries) {
      const def = itemDefs[e.id];
      const useful = partnerUsefulness(e, partnerClass) >= 100;
      const row = document.createElement("button");
      row.type = "button";
      row.className = `trade-inv-row ${def.rarity || ""}${useful ? " useful" : ""}`;
      row.style.setProperty("--item-color", def.color || "#fff");
      const sub = tradeItemSubtitle(e, def, partnerClass);
      const rowIcon = svgIconFor(e, def.color) || `${def.icon || "?"}`;
      row.innerHTML = `<span class="tir-icon" style="color:${def.color || "#fff"}">${rowIcon}</span>`
        + `<span class="tir-text"><strong>${itemLabel(e)}</strong><small>${sub}</small></span>`
        + `${e.count > 1 ? `<span class="tir-count">x${e.count}</span>` : ""}`;
      row.addEventListener("click", () => { activeTrade.offerIdx.add(idx); resetReadyAndSync(); });
      inv.append(row);
    }
  }
}

// Nuetzlichkeits-Score eines Items fuer die Partner-Klasse (hoeher = oben)
function partnerUsefulness(entry, partnerClass) {
  const def = itemDefs[entry.id];
  if (!def) return 0;
  const rarityW = { common: 0, rare: 20, epic: 45, legendary: 90 }[def.rarity] || 0;
  let score = rarityW;
  if (def.type === "weapon") {
    score += 200;
    if (partnerClass && weaponClassMatch(def, partnerClass) === 1) score += 400; // passende Waffe ganz oben
    score += (def.attack || 0);
  } else if (def.type === "armor") {
    score += 150;
    if (partnerClass && armorClassMatch(def, partnerClass) >= 1) score += 300;
    score += (def.defense || 0);
  } else if (def.type === "rune") {
    const r = parseRune(entry.id);
    score += 120 + (r ? runeValue(r.type, r.tier) * 4 : 0);
  } else if (def.type === "boots" || def.type === "hat") {
    score += 140;
  } else if (def.type === "material") {
    score += def.rarity === "legendary" ? 110 : 40;
  } else if (def.type === "potion") {
    score += 15;
  }
  return score;
}

// Kurzbeschreibung was das Item ist (fuer die Trade-Liste)
function tradeItemSubtitle(entry, def, partnerClass) {
  if (def.type === "weapon") {
    const atk = (def.attack || 0) + (entry.upgrade || 0) * 3;
    const fit = partnerClass && weaponClassMatch(def, partnerClass) === 1 ? " ✓ ideal" : "";
    return `Waffe · ${atk} ATK${fit}`;
  }
  if (def.type === "armor") {
    const d = (def.defense || 0) + (entry.upgrade || 0) * 4;
    const fit = partnerClass && armorClassMatch(def, partnerClass) >= 1 ? " ✓ ideal" : "";
    return `Rüstung · ${d} DEF${fit}`;
  }
  if (def.type === "rune") { const r = parseRune(entry.id); return r ? `Rune · ${r.def.desc}` : "Rune"; }
  if (def.type === "boots") return `Schuhe · +${Math.round((def.speed || 0) * 100)}% Tempo`;
  if (def.type === "hat") {
    const parts = [];
    if (def.bonusAttack) parts.push(`+${def.bonusAttack} ATK`);
    if (def.bonusCrit) parts.push(`+${Math.round(def.bonusCrit * 100)}% Krit`);
    return `Hut · ${parts.join(", ")}`;
  }
  if (def.type === "material") return "Material";
  if (def.type === "potion") return `Trank · +${def.heal} HP`;
  return def.type;
}

function resetReadyAndSync() {
  if (!activeTrade) return;
  activeTrade.myReady = false; // Angebots-Aenderung setzt Bereitschaft zurueck
  const gInput = document.getElementById("tradeMyGold");
  if (gInput) activeTrade.gold = Math.max(0, parseInt(gInput.value, 10) || 0);
  writeMyTrade();
  renderTradeOverlay();
}

function setTradeReady() {
  if (!activeTrade) return;
  const gInput = document.getElementById("tradeMyGold");
  if (gInput) activeTrade.gold = Math.max(0, Math.min(player.gold, parseInt(gInput.value, 10) || 0));
  activeTrade.myReady = !activeTrade.myReady;
  writeMyTrade();
  renderTradeOverlay();
}

function closeTrade() {
  if (tradeUnsub) { try { tradeUnsub(); } catch {} tradeUnsub = null; }
  activeTrade = null;
  document.getElementById("tradeOverlay")?.classList.add("hidden");
  document.getElementById("overlayBackdrop")?.classList.add("hidden");
}

function cancelTrade() {
  if (activeTrade) {
    const api = firebaseApi();
    try { api.set(activeTrade.ref, null); } catch {}
  }
  closeTrade();
}

// ===== GLÜCKSSPIEL-GUNTER =====
const gamblePot = new Set(); // Inventar-Indizes im Einsatz

// Glücks-Wert eines Items (mehr Wert = bessere Chancen)
function itemGambleValue(entry) {
  const def = itemDefs[entry.id];
  if (!def) return 0;
  const rarW = { common: 4, rare: 14, epic: 40, legendary: 100 }[def.rarity] || 4;
  let v = rarW * (entry.count || 1);
  if (entry.upgrade) v += entry.upgrade * 6;
  if (def.type === "rune") { const r = parseRune(entry.id); if (r) v += runeValue(r.type, r.tier) * 3; }
  return Math.round(v);
}

function gamblePotValue() {
  let v = 0;
  for (const idx of gamblePot) { const e = player.inventory[idx]; if (e) v += itemGambleValue(e); }
  return v;
}

function openGamble() {
  gamblePot.clear();
  document.getElementById("gambleResult")?.classList.add("hidden");
  renderGamble();
}

function renderGamble() {
  const potEl = document.getElementById("gamblePot");
  const invEl = document.getElementById("gambleInventory");
  const val = gamblePotValue();
  const valEl = document.getElementById("gambleValue");
  if (valEl) valEl.textContent = val;
  // Chance-Balken (Jackpot-Chance) + beste Stufe
  const jackpot = Math.min(0.5, val / 320);
  const c = gambleChances(val);
  const fill = document.getElementById("gambleChanceFill");
  // Balken = Chance auf mind. Episch (oder besser)
  if (fill) fill.style.width = `${Math.round((c.epic + c.legendary + c.ultra))}%`;
  const tierEl = document.getElementById("gambleTier");
  if (tierEl) {
    const parts = [];
    if (c.ultra > 0) parts.push(`💎 Ultra ${c.ultra}%`);
    if (c.legendary > 0) parts.push(`★ Legendär ${c.legendary}%`);
    if (c.epic > 0) parts.push(`✦ Episch ${c.epic}%`);
    if (c.rare > 0) parts.push(`◆ Selten ${c.rare}%`);
    tierEl.innerHTML = parts.length ? parts.join(" · ") : "— zu wenig Einsatz";
  }
  const rollBtn = document.getElementById("gambleRoll");
  if (rollBtn) rollBtn.disabled = gamblePot.size === 0;
  // Pot
  if (potEl) {
    potEl.innerHTML = "";
    for (const idx of gamblePot) {
      const e = player.inventory[idx];
      if (!e) continue;
      const def = itemDefs[e.id];
      const d = document.createElement("div");
      d.className = "trade-item";
      d.style.color = def?.color || "#fff";
      const potIcon = svgIconFor(e, def?.color) || `<span>${def?.icon || "?"}</span>`;
      d.innerHTML = `${potIcon}<span class="tcount">${e.count > 1 ? e.count : ""}</span>`;
      d.title = `${itemLabel(e)} — Klick: zurueck`;
      d.addEventListener("click", () => { gamblePot.delete(idx); renderGamble(); });
      potEl.append(d);
    }
  }
  // Inventar — nach Wertigkeit sortiert (legendär oben, Trash unten)
  if (invEl) {
    invEl.innerHTML = "";
    const rarityRank = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const gambleTypes = ["weapon", "armor", "boots", "hat"]; // nur Ausruestung — keine Tränke/Edelsteine/Materialien
    const entries = player.inventory
      .map((e, idx) => ({ e, idx }))
      .filter(({ e, idx }) => e && !gamblePot.has(idx)
        && idx !== player.weaponIndex && idx !== player.armorIndex && idx !== player.bootsIndex && idx !== player.hatIndex
        && itemDefs[e.id] && gambleTypes.includes(itemDefs[e.id].type))
      .sort((a, b) => {
        const ra = rarityRank[itemDefs[a.e.id].rarity] || 0;
        const rb = rarityRank[itemDefs[b.e.id].rarity] || 0;
        if (rb !== ra) return rb - ra;
        return itemGambleValue(b.e) - itemGambleValue(a.e);
      });
    entries.forEach(({ e, idx }) => {
      const def = itemDefs[e.id];
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = `slot ${def.rarity || ""}`;
      slot.style.setProperty("--item-color", def.color || "#fff");
      const slotIcon = svgIconFor(e, def.color) || `${def.icon || "?"}`;
      slot.innerHTML = `<span class="icon" style="color:${def.color || "#fff"}">${slotIcon}</span><span class="count">${e.count}</span>`;
      slot.title = `${itemLabel(e)} (Wert ${itemGambleValue(e)}) — Klick: einsetzen`;
      slot.addEventListener("click", () => { gamblePot.add(idx); renderGamble(); });
      invEl.append(slot);
    });
  }
}

let gambleSpinning = false;

// Tier-Bestimmung mit Caps: niedriger Wert kann hoechstens "epic", erst hoher
// Wert schaltet legendary/ultra frei. (Balance nach Wunsch)
// Einzel-Wahrscheinlichkeiten je Stufe (vor der sequentiellen Verkettung)
function tierProbs(val) {
  return {
    ultra: val >= 350 ? Math.min(0.12, 0.04 + (val - 350) / 3000) : 0,
    legendary: val >= 120 ? Math.min(0.38, val / 480) : 0,
    epic: val >= 40 ? Math.min(0.62, val / 120) : 0,
    rare: val >= 12 ? 0.82 : 0,
  };
}

function rollGambleTier(val) {
  const p = tierProbs(val);
  if (p.ultra && Math.random() < p.ultra) return "ultra";
  if (p.legendary && Math.random() < p.legendary) return "legendary";
  if (p.epic && Math.random() < p.epic) return "epic";
  if (p.rare && Math.random() < p.rare) return "rare";
  return "trash";
}

// Tatsaechliche End-Chancen (in %) unter Beruecksichtigung der Verkettung
function gambleChances(val) {
  const p = tierProbs(val);
  let rem = 1;
  const ultra = rem * p.ultra; rem -= ultra;
  const legendary = rem * p.legendary; rem -= legendary;
  const epic = rem * p.epic; rem -= epic;
  const rare = rem * p.rare; rem -= rare;
  const pct = (x) => Math.round(x * 100);
  return { ultra: pct(ultra), legendary: pct(legendary), epic: pct(epic), rare: pct(rare), trash: pct(rem) };
}

function rollGamble() {
  if (gamblePot.size === 0 || gambleSpinning) return;
  const val = gamblePotValue();
  // Einsatz verbrauchen (hohe Indizes zuerst)
  const indices = [...gamblePot].sort((a, b) => b - a);
  for (const idx of indices) {
    player.inventory.splice(idx, 1);
    shiftEquipIndices(idx);
  }
  gamblePot.clear();
  const tier = rollGambleTier(val);
  const reward = gambleReward(tier);
  // Glücksrad-Animation → danach Belohnung einbuchen
  playGambleReel(reward, () => grantGambleReward(reward));
  renderGamble();
  renderInventory();
}

function grantGambleReward(reward) {
  if (reward.gold) player.gold += reward.gold;
  if (reward.itemId) addInventory(reward.itemId, reward.count || 1);
  if (reward.petId && specialPets[reward.petId]) {
    player.pets = player.pets || {};
    if (!player.pets[reward.petId]) {
      player.pets[reward.petId] = { bossId: reward.petId, unlockedAt: Date.now(), level: 1 };
    }
    player.activePet = reward.petId;
    initPetRuntime();
    renderPetSlot();
  }
  const resEl = document.getElementById("gambleResult");
  if (resEl) {
    resEl.className = `gamble-result ${reward.cls}`;
    resEl.classList.remove("hidden");
    const resSvg = reward.itemId ? svgIconFor({ id: reward.itemId }, itemDefs[reward.itemId]?.color) : null;
    const got = reward.petId ? "✓ Pet freigeschaltet" : reward.gold ? "✓ Gold gutgeschrieben" : "✓ ins Inventar gelegt";
    resEl.innerHTML = (resSvg ? `<span class="gamble-result-icon">${resSvg}</span>` : "")
      + `<span>${reward.label}<br><small class="gamble-got">${got}</small></span>`;
  }
  // Klartext-Toast als zusaetzliche Bestaetigung
  if (reward.itemId && itemDefs[reward.itemId]) showToast(`Gewonnen: ${itemDefs[reward.itemId].name}${reward.count > 1 ? ` x${reward.count}` : ""} — im Inventar!`);
  else if (reward.petId && specialPets[reward.petId]) showToast(`Gewonnen: ${specialPets[reward.petId].name} — Pet freigeschaltet!`);
  else if (reward.gold) showToast(`Gewonnen: ${reward.gold} Gold!`);
  // Immer ein positives Geraeusch — Jackpot gross, Gewinn Fanfare, Trostpreis freundlicher Pickup
  if (reward.cls === "jackpot") sfx.gambleJackpot?.();
  else if (reward.cls === "win") sfx.gambleWin?.();
  else sfx.pickup?.();
  if (reward.cls === "jackpot") { cameraShake = 0.5; skillFlashes.push({ color: "#ec4899", life: 0.6, maxLife: 0.6 }); }
  saveCurrentCharacter();
  renderInventory();
  updateUi();
}

// CS:GO-artiges Glücksrad: horizontaler Streifen scrollt und stoppt auf der Belohnung
function playGambleReel(reward, onDone) {
  const reel = document.getElementById("gambleReel");
  const strip = document.getElementById("gambleReelStrip");
  document.getElementById("gambleResult")?.classList.add("hidden");
  if (!reel || !strip) { onDone(); return; }
  gambleSpinning = true;
  const rollBtn = document.getElementById("gambleRoll");
  if (rollBtn) rollBtn.disabled = true;
  reel.classList.remove("hidden");
  // Zufalls-Füll-Icons (gewichtet nach Raritaet fuer Optik)
  const fillerIcons = ["🗡","🛡","🪄","💎","🔴","🔵","🟢","🟡","🟣","⚪","💃","🌿","⚔","🏆","🌹","💔"];
  const rarities = ["common","common","rare","rare","epic","legendary"];
  const fancyIcons = ["⚔","🌙","🪄","💎","🏆","🌹","💔","⚡"];
  const cellCount = 50;
  const winIndex = 44; // Gewinn-Zelle (weiter hinten → laengerer Lauf)
  // Near-Miss-Spannung: direkt VOR der Gewinn-Zelle stehen high-tier Zellen,
  // sodass das Rad knapp an einer Legendären/Ultra vorbeibremst.
  const teaseTiers = { [winIndex - 1]: "legendary", [winIndex - 2]: "ultra", [winIndex + 1]: "legendary" };
  strip.innerHTML = "";
  const cellW = 82; // 76 + 6 gap
  for (let i = 0; i < cellCount; i += 1) {
    const cell = document.createElement("div");
    if (i === winIndex) {
      cell.className = `gamble-reel-cell ${reward.cls === "jackpot" ? "legendary" : reward.cls === "ultra" ? "ultra" : reward.tierClass || "rare"}`;
      const winSvg = reward.itemId ? svgIconFor({ id: reward.itemId }, itemDefs[reward.itemId]?.color) : null;
      if (winSvg) cell.innerHTML = winSvg; else cell.textContent = reward.icon || "🎁";
    } else if (teaseTiers[i]) {
      cell.className = `gamble-reel-cell ${teaseTiers[i]}`;
      cell.textContent = fancyIcons[Math.floor(Math.random() * fancyIcons.length)];
    } else {
      cell.className = `gamble-reel-cell ${rarities[Math.floor(Math.random() * rarities.length)]}`;
      cell.textContent = fillerIcons[Math.floor(Math.random() * fillerIcons.length)];
    }
    strip.append(cell);
  }
  // Startposition zuruecksetzen
  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  // Ziel: Gewinn-Zelle knapp unter dem Marker (leichter Versatz → "knapp daneben"-Gefuehl)
  const reelW = reel.clientWidth || 360;
  const target = -(winIndex * cellW + cellW / 2 - reelW / 2) - (Math.random() * 18 - 4);
  // Langsamer + staerkeres Ausbremsen am Ende (mehr Spannung)
  requestAnimationFrame(() => {
    strip.style.transition = "transform 5.2s cubic-bezier(0.08, 0.62, 0.04, 1)";
    strip.style.transform = `translateX(${target}px)`;
  });
  // Tick-Sounds synchron zur Verzoegerung: dicht am Anfang, immer langsamer.
  // Zeitpunkt jeder vorbeiziehenden Zelle ueber die Umkehrung der Ease-Out-Kurve.
  const DUR = 5200, TICKS = 46;
  for (let i = 1; i <= TICKS; i += 1) {
    const t = DUR * (1 - Math.pow(1 - i / TICKS, 1 / 3));
    setTimeout(() => { if (gambleSpinning) sfx.gambleTick?.(); }, t);
  }
  // Spannungs-Toene in der Schluss-Phase (das Rad bremst an Legendären/Ultra vorbei)
  [3700, 4250, 4700, 5000].forEach((t) => setTimeout(() => { if (gambleSpinning) sfx.gambleTension?.(); }, t));
  setTimeout(() => {
    gambleSpinning = false;
    if (rollBtn) rollBtn.disabled = gamblePot.size === 0;
    onDone();
  }, 5300);
}

function gambleReward(tier) {
  const all = Object.entries(itemDefs);
  const pickWeapon = (rarity) => {
    const pool = all.filter(([, d]) => d.type === "weapon" && d.rarity === rarity);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)][0] : null;
  };
  const pickSignature = () => {
    const sigs = ["earthsplitter", "shadowbite", "tempest_rod", "worldtree_staff", "heartbreaker"];
    return sigs[Math.floor(Math.random() * sigs.length)];
  };
  const pickRune = (tierName) => {
    const types = ["ruby", "sapphire", "emerald", "topaz", "amethyst", "diamond"];
    return runeId(types[Math.floor(Math.random() * types.length)], tierName);
  };
  const rareEarths = ["frost_core", "ember_spark", "shadow_essence", "sky_shard", "tide_pearl"];
  const icon = (id) => itemDefs[id]?.icon || "🎁";

  if (tier === "ultra") {
    // Ultra-Rare: Legendaeres Tier, Signatur-Waffe, Relikt-Bündel oder Perfekt-Rune
    const r = Math.random();
    if (r < 0.22) {
      const petIds = Object.keys(specialPets);
      const pid = petIds[Math.floor(Math.random() * petIds.length)];
      return { petId: pid, icon: "🐉", cls: "jackpot", tierClass: "ultra", label: `💎🎉 ULTRA! Legendäres Tier: ${specialPets[pid].name}!` };
    }
    if (r < 0.55) { const id = pickSignature(); return { itemId: id, icon: icon(id), cls: "jackpot", tierClass: "ultra", label: `💎🎉 ULTRA-RARE! Signatur-Waffe: ${itemDefs[id].name}!` }; }
    if (r < 0.82) return { itemId: "ancient_relic", count: 3, icon: "🏆", cls: "jackpot", tierClass: "ultra", label: "💎🎉 ULTRA! 3× Uraltes Relikt!" };
    return { itemId: pickRune("perfekt"), icon: "⚪", cls: "jackpot", tierClass: "ultra", label: "💎🎉 ULTRA! Perfekte Rune!" };
  }
  if (tier === "legendary") {
    if (Math.random() < 0.5) { const id = pickWeapon("legendary"); if (id) return { itemId: id, icon: icon(id), cls: "jackpot", tierClass: "legendary", label: `🎉 JACKPOT! Legendär: ${itemDefs[id].name}!` }; }
    return { itemId: pickRune("perfekt"), icon: "⚪", cls: "jackpot", tierClass: "legendary", label: "🎉 JACKPOT! Perfekte Rune!" };
  }
  if (tier === "epic") {
    const r = Math.random();
    if (r < 0.45) { const id = pickWeapon("epic"); if (id) return { itemId: id, icon: icon(id), cls: "win", tierClass: "epic", label: `✦ Episch: ${itemDefs[id].name}!` }; }
    if (r < 0.75) return { itemId: pickRune("strahlend"), icon: "✦", cls: "win", tierClass: "epic", label: "✦ Strahlende Rune!" };
    const earth = rareEarths[Math.floor(Math.random() * rareEarths.length)];
    return { itemId: earth, count: 2, icon: icon(earth), cls: "win", tierClass: "epic", label: `✦ Seltene Erden: 2× ${itemDefs[earth].name}!` };
  }
  if (tier === "rare") {
    const r = Math.random();
    if (r < 0.35) { const id = pickWeapon("rare"); if (id) return { itemId: id, icon: icon(id), cls: "win", tierClass: "rare", label: `◆ Selten: ${itemDefs[id].name}` }; }
    if (r < 0.6) return { itemId: pickRune("klar"), icon: "◆", cls: "win", tierClass: "rare", label: "◆ Klare Rune" };
    if (r < 0.85) { const earth = rareEarths[Math.floor(Math.random() * rareEarths.length)]; return { itemId: earth, count: 1, icon: icon(earth), cls: "win", tierClass: "rare", label: `◆ Seltene Erde: ${itemDefs[earth].name}` }; }
    return { itemId: "gem", count: 2, icon: "◆", cls: "win", tierClass: "rare", label: "◆ 2× Kristall" };
  }
  // trash → Trostpreis
  const r = Math.random();
  if (r < 0.4) return { gold: 30, icon: "🪙", cls: "meh", tierClass: "common", label: "Naja… 30 Gold zurück." };
  if (r < 0.7) return { itemId: "metin_shard", count: 1, icon: "✦", cls: "meh", tierClass: "common", label: "Ein Metin-Splitter. Besser als nichts." };
  return { itemId: pickRune("rissig"), icon: "◇", cls: "meh", tierClass: "common", label: "Eine rissige Rune. Pech gehabt!" };
}

function applyQueuedHit(hit) {
  const arr = hit.type === "mob" ? mobs : stones;
  const target = arr.find((t) => t.serverId === hit.id);
  if (!target) return;
  target.hp -= hit.dmg;
  target.hitTimer = 0.16;
  target.dmgBy = target.dmgBy || {};
  target.dmgBy[hit.by] = (target.dmgBy[hit.by] || 0) + hit.dmg;
  // Stein-Wächter spawnen bei HP-Schwellen (lief vorher nur im Single-Player-Pfad)
  if (hit.type === "stone" && target.hp > 0 && target.spawnThresholds) {
    const pct = target.hp / target.maxHp;
    target.spawnedAt = target.spawnedAt || [];
    for (const t of target.spawnThresholds) {
      if (!target.spawnedAt.includes(t) && pct <= t) {
        target.spawnedAt.push(t);
        spawnStoneGuardians(target);
        break;
      }
    }
  }
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
  // Boss/Miniboss: Loot teilt sich auf alle Beiträger; normale Mobs → Top-Damager
  const splitDmg = (mob.rank === "boss" || mob.rank === "miniboss") ? mob.dmgBy : null;
  dropLoot(mob.x, mob.y, mob.rank || (mob.elite ? "elite" : "mob"), owner, splitDmg);
  const xpReward = mob.xp || (mob.rank === "boss" ? 400 : mob.rank === "miniboss" ? 120 : mob.elite ? 30 : 12);
  // XP bei Boss/Miniboss an ALLE Beiträger (geteilt), sonst Top-Damager
  if (splitDmg) {
    const list = contributorList(splitDmg);
    if (list.length > 1) {
      const share = Math.max(1, Math.round(xpReward / list.length));
      for (const name of list) pushGrant(name, { xp: share, kill: "mob" });
    } else {
      pushGrant(owner || authUser, { xp: xpReward, kill: "mob" });
    }
  } else {
    pushGrant(owner || authUser, { xp: xpReward, kill: "mob" });
  }
  burst(mob.x, mob.y, mob.color || "#ff6b6b", mob.rank === "boss" ? 70 : mob.rank === "miniboss" ? 42 : 24);
  // Boss: Pet-Unlock + Cinematic auch im Multiplayer (loot=false, dropLoot lief schon oben)
  if (mob.bossDef) {
    handleBossDefeat(mob, false);
  } else if (mob.rank === "boss") showToast(`${mob.name} besiegt: Boss-Loot liegt am Boden.`);
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
  // Metin-Stein: Loot + XP teilen sich auf alle Beiträger
  dropLoot(stone.x, stone.y, "metin", owner, stone.dmgBy);
  const stoneList = contributorList(stone.dmgBy);
  if (stoneList.length > 1) {
    const share = Math.max(1, Math.round(90 / stoneList.length));
    for (const name of stoneList) pushGrant(name, { xp: share, kill: "stone" });
  } else {
    pushGrant(owner || authUser, { xp: 90, kill: "stone" });
  }
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
      // Stale-State-Recovery: wenn Welt passiveMobs hat aber lokale mobs aggressive Klötze enthalten → reset
      const wDef = currentWorld();
      const hasStaleAggressive = wDef.passiveMobs && mobs.some((m) => !m.passive);
      if (hasStaleAggressive) {
        mobs.length = 0;
        stones.length = 0;
        droppedItems.length = 0;
        showToast("Welt zurueckgesetzt (stale state gefunden).");
      }
      if (empty || hasStaleAggressive) {
        if (mobs.length === 0 && stones.length === 0) seedWorld();
        for (const m of mobs) if (!m.serverId) m.serverId = nextId("m");
        for (const s of stones) if (!s.serverId) s.serverId = nextId("s");
        // Stale-Cleanup: lösche auch in Firebase die alten serverIds bevor neue geschrieben werden
        if (hasStaleAggressive) {
          await api.set(worldRefs.mobs, null);
          await api.set(worldRefs.stones, null);
        }
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

// Beim Welt-Wechsel: alte Listener abmelden, fuer neue Welt neu subscriben.
async function resubscribeWorld() {
  // Alte Listener trennen
  for (const unsub of worldUnsubscribers) { try { unsub(); } catch {} }
  worldUnsubscribers = [];
  // Host-Status zuruecksetzen (Host ist pro Welt)
  isHost = false;
  currentHostName = null;
  currentHostTs = 0;
  await startWorldSync();
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
  // Aim ueber aimAngle() — beruecksichtigt Joystick / Auto-Aim / Manual-Tap
  const angle = aimAngle();
  if (multiplayerReady) broadcastAction("swing");

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

  const sig = weapon.signature;
  let firstHitMob = null;
  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - arcX, mob.y - arcY) < mob.r + 52 || dist(player, mob) < mob.r + reach - 28) {
      const { dmg, crit } = applyCritAndLifesteal(attackPower());
      damageMob(mob, dmg, crit ? { tag: "combo" } : {});
      if (crit) floatText(mob.x, mob.y - 50, "CRIT!", "#ff9540");
      if (!firstHitMob) firstHitMob = mob;
      // Signatur: Schattenbiss — Crit teleportiert hinter das Ziel
      if (sig === "shadowbite" && crit && mobs.includes(mob)) {
        player.x = clamp(mob.x + Math.cos(angle) * (mob.r + 30), player.r, world.w - player.r);
        player.y = clamp(mob.y + Math.sin(angle) * (mob.r + 30), player.r, world.h - player.r);
        anim.spawnDustPuff(particles, player.x, player.y, "#6f63ff", 14);
      }
      hit = true;
    }
  }
  // Signatur: Erdspalter — jeder 3. Schlag = Schockwelle
  if (sig === "earthsplitter") {
    player.sigHitCount = (player.sigHitCount || 0) + 1;
    if (player.sigHitCount % 3 === 0) {
      anim.spawnRoar(arcX, arcY, "#f59e0b");
      cameraShake = Math.max(cameraShake, 0.3);
      for (const mob of [...mobs]) {
        if (Math.hypot(mob.x - arcX, mob.y - arcY) < 140) {
          damageMob(mob, Math.round(attackPower() * 1.2), { tag: "combo" });
          applyStatus(mob, "stunned", 0.8);
        }
      }
      floatText(arcX, arcY - 40, "SCHOCKWELLE!", "#f59e0b", { big: true });
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

function fireProjectile(weapon, classDef, angle, isChain = false) {
  const proj = weapon.projectile || { speed: 480, color: weapon.color || "#9ee7ff", glow: weapon.glow || "rgba(85,215,255,0.4)" };
  const speed = proj.speed || 480;
  const range = weapon.reach || 360;
  const dmg = Math.round(attackPower() * 0.85 * (isChain ? 0.6 : 1));
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
  // Signatur: Sturmrute/Sturmzepter — Auto-Attack ketten zu 2. Gegner
  if (!isChain && (weapon.signature === "tempest") ) {
    const second = mobs.filter((m) => !m.passive || m.aggroed)
      .map((m) => ({ m, a: Math.atan2(m.y - player.y, m.x - player.x) }))
      .filter((o) => Math.abs(((o.a - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > 0.35)
      .sort((p, q) => Math.hypot(p.m.x - player.x, p.m.y - player.y) - Math.hypot(q.m.x - player.x, q.m.y - player.y))[0];
    if (second) fireProjectile(weapon, classDef, second.a, true);
  }
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
          if (typeof p.onHit === "function") p.onHit(mob);
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

function triggerBossDefeatCinematic(mob) {
  bossDefeatCinematic = {
    name: mob.bossDef.name,
    title: mob.bossDef.title || "Welt-Boss",
    life: 2.8,
    maxLife: 2.8,
    color: mob.bossDef.appearance.head,
    x: mob.x, y: mob.y,
  };
  hitStopTimer = Math.max(hitStopTimer, 0.4);
}

function drawBossDefeatCinematic() {
  if (!bossDefeatCinematic) return;
  const c = bossDefeatCinematic;
  const pct = c.life / c.maxLife;
  const phase = 1 - pct; // 0..1
  // Dunkle Vignette
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.55, phase * 0.7)})`;
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  // Goldener Banner-Effekt
  const cy = canvas.clientHeight / 2;
  ctx.fillStyle = `rgba(244, 201, 93, ${Math.min(0.18, phase * 0.4)})`;
  ctx.fillRect(0, cy - 80, canvas.clientWidth, 160);
  // Text
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = c.color;
  ctx.shadowColor = c.color;
  ctx.shadowBlur = 30;
  const slide = phase < 0.5 ? phase * 2 : 1 - (phase - 0.5) * 2;
  const offsetX = (1 - slide) * 200;
  ctx.fillText("BESIEGT", canvas.clientWidth / 2 + offsetX, cy - 8);
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#fff2a8";
  ctx.shadowBlur = 16;
  ctx.fillText(c.name, canvas.clientWidth / 2 - offsetX, cy + 32);
  ctx.shadowBlur = 0;
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(c.title, canvas.clientWidth / 2 - offsetX, cy + 56);
  ctx.restore();
}

function drawSplashScreen() {
  if (splashScreen.shown || splashScreen.life <= 0) return;
  const t = splashScreen.life / 2.5;
  ctx.save();
  ctx.fillStyle = `rgba(8, 11, 15, ${Math.min(1, t * 1.2)})`;
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  // Logo: BLOCPUGNA
  const cx = canvas.clientWidth / 2;
  const cy = canvas.clientHeight / 2;
  const phase = 1 - t;
  const scale = 0.7 + Math.min(1, phase * 2) * 0.5;
  ctx.font = `bold ${64 * scale}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4c95d";
  ctx.shadowColor = "#f4c95d";
  ctx.shadowBlur = 30;
  ctx.fillText("BLOCPUGNA", cx, cy);
  ctx.shadowBlur = 0;
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Blockig. Tödlich. Episch.", cx, cy + 36);
  // Partikel-Aura um Logo
  for (let i = 0; i < 5; i += 1) {
    const a = (performance.now() / 600 + i * Math.PI * 2 / 5) % (Math.PI * 2);
    const r = 120 + phase * 40;
    ctx.fillStyle = `rgba(244, 201, 93, ${0.6 - phase * 0.6})`;
    ctx.fillRect(cx + Math.cos(a) * r - 3, cy + Math.sin(a) * r - 3, 6, 6);
  }
  ctx.restore();
}

function drawWorldBossBar() {
  // Suche lebenden Boss (geteilt ueber Firebase-Mob-Sync)
  const boss = mobs.find((m) => m.bossDef && m.hp > 0);
  if (!boss) return;
  const cw = canvas.clientWidth;
  const w = Math.min(560, cw - 40);
  const x = (cw - w) / 2;
  const y = 14;
  const pct = Math.max(0, boss.hp / boss.maxHp);
  ctx.save();
  // Name
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 4;
  const phase = boss.bossPhase || 1;
  ctx.fillText(`${boss.name}  —  Phase ${phase}`, cw / 2, y + 2);
  ctx.shadowBlur = 0;
  // Rahmen
  ctx.fillStyle = "rgba(10,14,18,0.85)";
  ctx.fillRect(x - 2, y + 8, w + 4, 18);
  // HP-Fuellung (Farbe je Phase)
  const col = phase === 3 ? "#ef4444" : phase === 2 ? "#fb923c" : "#a855f7";
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, col);
  grad.addColorStop(1, "#fde047");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + 10, w * pct, 14);
  // Rahmen-Linie
  ctx.strokeStyle = "rgba(253,224,71,0.6)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 10, w, 14);
  // HP-Zahl
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, cw / 2, y + 21);
  ctx.restore();
}

function drawComboHud() {
  drawWorldBossBar();
  drawComboMeterBar();
  drawClassResource();
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

function drawComboMeterBar() {
  const meter = player.comboMeter || 0;
  if (meter <= 0) return;
  const x = canvas.clientWidth / 2;
  const w = 220;
  const y = canvas.clientHeight - 120;
  const ready = meter >= 100;
  ctx.save();
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = ready ? "#fde047" : "#94a3b8";
  ctx.fillText(ready ? "✦ FLOW BEREIT ✦" : `Flow ${Math.floor(meter)}%`, x, y - 4);
  ctx.fillStyle = "rgba(10,14,18,0.7)";
  ctx.fillRect(x - w / 2, y, w, 6);
  const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
  grad.addColorStop(0, "#a78bfa");
  grad.addColorStop(0.5, "#ec4899");
  grad.addColorStop(1, "#fde047");
  ctx.fillStyle = ready ? "#fde047" : grad;
  ctx.fillRect(x - w / 2, y, w * (meter / 100), 6);
  if (ready) {
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - w / 2, y, w, 6);
  }
  ctx.restore();
}

function drawClassResource() {
  const cls = player.classId;
  const x = canvas.clientWidth / 2;
  const w = 220;
  const y = canvas.clientHeight - 100;
  ctx.save();
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";

  if (cls === "warrior") {
    const r = player.rage || 0;
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`Wut ${Math.floor(r)}/100 ${r >= 100 ? "✦ MAX ✦" : r >= 50 ? "✦" : ""}`, x, y - 4);
    ctx.fillStyle = "rgba(10,14,18,0.7)";
    ctx.fillRect(x - w / 2, y, w, 5);
    ctx.fillStyle = r >= 100 ? "#fbbf24" : r >= 50 ? "#fb923c" : "#ef4444";
    ctx.fillRect(x - w / 2, y, w * (r / 100), 5);
  } else if (cls === "shadow") {
    const n = player.markCount || 0;
    ctx.fillStyle = "#35d0a4";
    ctx.fillText(`Marken aktiv: ${n}`, x, y - 4);
    // Icon-Reihe
    for (let i = 0; i < Math.min(8, n); i += 1) {
      ctx.fillStyle = "#35d0a4";
      ctx.fillRect(x - 50 + i * 14, y, 10, 6);
    }
  } else if (cls === "runemage") {
    const fc = player.fireCharges || 0;
    const ic = player.frostCharges || 0;
    ctx.fillStyle = "#ff7a3d";
    ctx.fillText(`🔥 ${fc}/3   ❄ ${ic}/3   ${(player.steamBuff || 0) > 0 ? "✦ DAMPF ✦" : ""}`, x, y);
    // Charge-Icons
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < fc ? "#ff7a3d" : "rgba(255,122,61,0.18)";
      ctx.fillRect(x - 60 + i * 14, y + 8, 10, 6);
      ctx.fillStyle = i < ic ? "#9ee7ff" : "rgba(158,231,255,0.18)";
      ctx.fillRect(x + 24 + i * 14, y + 8, 10, 6);
    }
  } else if (cls === "druid") {
    const fe = player.formEnergy || 0;
    ctx.fillStyle = "#65a30d";
    const inBear = (player.bearForm || 0) > 0;
    const inWolf = (player.wolfForm || 0) > 0;
    ctx.fillText(inWolf ? `🐺 Wolfsform ${player.wolfForm.toFixed(1)}s` : inBear ? `🐻 Baerform ${player.bearForm.toFixed(1)}s` : `Wildkraft ${Math.floor(fe)}/100`, x, y - 4);
    ctx.fillStyle = "rgba(10,14,18,0.7)";
    ctx.fillRect(x - w / 2, y, w, 5);
    ctx.fillStyle = inBear ? "#92400e" : inWolf ? "#5c5c8a" : "#a3e635";
    const pct = inBear ? (player.bearForm / 8) : inWolf ? (player.wolfForm / 5) : (fe / 100);
    ctx.fillRect(x - w / 2, y, w * pct, 5);
  } else if (cls === "charmer") {
    const s = player.charmStacks || 0;
    const muse = (player.museActive || 0) > 0;
    ctx.fillStyle = muse ? "#fde047" : "#ec4899";
    ctx.fillText(`Charme ${s}/5${muse ? "  ✦ MUSE ✦" : ""}`, x, y - 4);
    // 5 Herz-Icons
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i < s ? "#ec4899" : "rgba(236, 72, 153, 0.18)";
      const cx = x - 40 + i * 20;
      const cy = y + 4;
      const sz = 3;
      ctx.fillRect(cx - sz, cy - sz, sz, sz);
      ctx.fillRect(cx, cy - sz, sz, sz);
      ctx.fillRect(cx - sz * 2, cy, sz, sz);
      ctx.fillRect(cx - sz, cy, sz, sz);
      ctx.fillRect(cx, cy, sz, sz);
      ctx.fillRect(cx + sz, cy, sz, sz);
      ctx.fillRect(cx - sz, cy + sz, sz, sz);
      ctx.fillRect(cx, cy + sz, sz, sz);
    }
  }
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

function addCombo(amount = 8) {
  player.comboMeter = Math.min(100, (player.comboMeter || 0) + amount);
  player.comboTimer = 3.5; // hat 3.5s Zeit, sonst Decay
}

function updateClassResources(dt) {
  // Combo-Meter Decay nach Idle
  if ((player.comboTimer || 0) > 0) {
    player.comboTimer -= dt;
  } else {
    player.comboMeter = Math.max(0, (player.comboMeter || 0) - 18 * dt);
  }
  // Globale Buff-Decays
  if ((player.steamBuff || 0) > 0) player.steamBuff -= dt;
  if ((player.spotlightBuff || 0) > 0) player.spotlightBuff -= dt;
  if ((player.markEternalTimer || 0) > 0) player.markEternalTimer -= dt;
  if ((player.wolfForm || 0) > 0) player.wolfForm -= dt;
  if ((player.spinAnim || 0) > 0) player.spinAnim = Math.max(0, player.spinAnim - dt);
  // Klassen-spezifisch
  const cls = player.classId;
  if (cls === "warrior") {
    // Rage faellt langsam ab wenn nicht im Kampf
    if ((player.rage || 0) > 0 && !mobs.some((m) => Math.hypot(m.x - player.x, m.y - player.y) < 220)) {
      player.rage = Math.max(0, player.rage - 6 * dt);
    }
  } else if (cls === "shadow") {
    // Mark-Count live aus mobs
    player.markCount = mobs.reduce((n, m) => n + (statusTime(m, "marked") > 0 ? 1 : 0), 0);
  } else if (cls === "runemage") {
    // Charges decay nach 12s ungenutzt
    player.fireChargesDecay = Math.max(0, (player.fireChargesDecay || 0) - dt);
    player.frostChargesDecay = Math.max(0, (player.frostChargesDecay || 0) - dt);
    if (player.fireChargesDecay <= 0) player.fireCharges = 0;
    if (player.frostChargesDecay <= 0) player.frostCharges = 0;
  } else if (cls === "druid") {
    // Form-Energy laedt nur ausserhalb Baer-Form
    if (!(player.bearForm > 0)) {
      player.formEnergy = Math.min(100, (player.formEnergy || 0) + 12 * dt);
    } else {
      player.formEnergy = Math.max(0, (player.formEnergy || 0) - 14 * dt);
    }
  } else if (cls === "charmer") {
    // Charme-Stacks Decay
    if ((player.charmStacks || 0) > 0) {
      player.charmStacksDecayTimer = Math.max(0, (player.charmStacksDecayTimer || 0) - dt);
      if (player.charmStacksDecayTimer <= 0) {
        player.charmStacks = Math.max(0, player.charmStacks - 1);
        player.charmStacksDecayTimer = 8;
      }
    }
    // Muse: wenn min. 1 charmed/confused → Buff
    const charmedMobs = mobs.reduce((n, m) => n + ((statusTime(m, "charmed") > 0 || statusTime(m, "confused") > 0) ? 1 : 0), 0);
    if (charmedMobs > 0) {
      player.museActive = Math.max(player.museActive || 0, 0.5); // refresht jeden tick
      player.hp = Math.min(player.maxHp, player.hp + 1 * dt);
    } else {
      player.museActive = Math.max(0, (player.museActive || 0) - dt);
    }
  }
}

function gainRage(amount) {
  if (player.classId !== "warrior") return;
  player.rage = Math.min(100, (player.rage || 0) + amount);
}

function gainFireCharge() {
  if (player.classId !== "runemage") return;
  player.fireCharges = Math.min(3, (player.fireCharges || 0) + 1);
  player.fireChargesDecay = 12;
}
function gainFrostCharge() {
  if (player.classId !== "runemage") return;
  player.frostCharges = Math.min(3, (player.frostCharges || 0) + 1);
  player.frostChargesDecay = 12;
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
    poleSpin,
    blowKiss,
    charmDance,
  };
  handlers[abilityId]?.();
  setAbilityCooldown(abilityId);
  if (multiplayerReady) broadcastAction("skill", abilityId);
  addCombo(ability.ultimate ? 25 : 12);
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
    // Knockback als Particle-Trail
    const kbX = Math.cos(angle) * 36;
    const kbY = Math.sin(angle) * 36;
    for (let k = 0; k < 5; k += 1) {
      particles.push({
        x: mob.x - kbX * (k * 0.2),
        y: mob.y - kbY * (k * 0.2),
        vx: -kbX * 2,
        vy: -kbY * 2,
        life: 0.3,
        color: "#f4c95d",
        size: 4,
      });
    }
    mob.x += kbX;
    mob.y += kbY;
    damageMob(mob, Math.floor(attackPower() * dmgMult), { tag: "stun" });
    hit = true;
  }
  for (const remote of Object.values(remotePlayers)) {
    if (isPointInCone(remote, angle, 150, 56)) {
      hit = damageRemotePlayer(remote, attackPower() * (dmgMult + 0.05), "stun") || hit;
    }
  }
  // Schockwelle (expandierender Ring)
  anim.spawnRoar(impact.x, impact.y, "#f4c95d");
  // Schild-Schein als kurzlebige Gold-Wolke
  anim.spawnDustPuff(particles, impact.x, impact.y, "#f4c95d", 18);
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
  // Player visuell drehen + Spin-Trail-Ringe + Klingen-Bogen
  player.spinAnim = Math.max(player.spinAnim || 0, 0.6);
  anim.spawnSpinAura(player.x, player.y, radius, "#f4c95d", 4, 0.08);
  // Klingen-Funken am Rand
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2;
    particles.push({
      x: player.x + Math.cos(a) * radius * 0.8,
      y: player.y + Math.sin(a) * radius * 0.8,
      vx: Math.cos(a + Math.PI / 2) * 120,
      vy: Math.sin(a + Math.PI / 2) * 120,
      life: 0.4,
      color: i % 2 === 0 ? "#f4c95d" : "#ff9f67",
      size: 4,
    });
  }
  burst(player.x, player.y, hit ? "#f4c95d" : "#d9dee5", 28);
}

function shadowStep() {
  const m = mastery("shadowStep");
  const range = 280 + m * 40;
  const angle = aimAngle();
  const startX = player.x;
  const startY = player.y;
  player.x = clamp(player.x + Math.cos(angle) * range, player.r, world.w - player.r);
  player.y = clamp(player.y + Math.sin(angle) * range, player.r, world.h - player.r);
  player.dashCritWindow = 2.0;
  // 30% Heal + 5% pro Mastery
  const heal = Math.round(player.maxHp * (0.30 + m * 0.05));
  player.hp = Math.min(player.maxHp, player.hp + heal);
  floatText(player.x, player.y - 50, `+${heal} HP`, "#51d37a");
  // Rauch-Wolke am Start + Ziel
  anim.spawnDustPuff(particles, startX, startY, "#26214f", 22);
  anim.spawnDustPuff(particles, player.x, player.y, "#7a6cf2", 22);
  // Geister-Trail: 6 Phantome zwischen Start und Ziel
  const phantomCount = 6;
  for (let i = 1; i <= phantomCount; i += 1) {
    const t = i / (phantomCount + 1);
    const px = startX + (player.x - startX) * t;
    const py = startY + (player.y - startY) * t;
    setTimeout(() => {
      // Vertikale Tinten-Streifen die kurz aufblitzen
      for (let j = -10; j <= 10; j += 5) {
        particles.push({
          x: px + j,
          y: py - 20,
          vx: 0, vy: -20,
          life: 0.35 - i * 0.04,
          color: "#7a6cf2",
          size: 3,
        });
      }
    }, i * 35);
  }
  // Heal-Funken am Ziel
  for (let i = 0; i < 12; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: player.x + Math.cos(a) * 32,
      y: player.y - 18 + Math.sin(a) * 32,
      vx: Math.cos(a) * 110,
      vy: Math.sin(a) * 110,
      life: 0.6,
      color: "#51d37a",
      size: 4,
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
  const markDur = (player.markEternalTimer || 0) > 0 ? 60 : 7;
  for (const mob of [...mobs]) {
    if (!isInCone(mob, angle, 260, 105)) continue;
    applyStatus(mob, "marked", markDur);
    applyStatus(mob, "poisoned", poisonDur);
    mob.poisonDotMult = dotMult; // tickStatuses liest das
    damageMob(mob, Math.floor(attackPower() * 0.75), { tag: "mark" });
    // Persistente Gift-Wolke unter dem Mob — bleibt so lange wie Gift wirkt
    anim.spawnPoisonCloud(mob.x, mob.y + 8, 38, poisonDur);
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
  // Persistenter Lava-Pool 2s am Einschlag
  anim.spawnLavaPool(impact.x, impact.y, radius * 0.55, 2);
  gainFireCharge();
  // Schockwelle-Ringe
  anim.spawnRoar(impact.x, impact.y, "#ff7a3d");
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
  // Persistente Crater + 3 expandierende Ringe + Erd-Crack-Linien als Wurzel-Effekt
  anim.spawnCrater(player.x, player.y, radius * 0.7, 8);
  for (let i = 0; i < 3; i += 1) {
    setTimeout(() => {
      groundEffects.push({ kind: "expanding_ring", x: player.x, y: player.y, maxRadius: radius * (0.4 + i * 0.3), life: 0.7, maxLife: 0.7, color: "#f4c95d" });
    }, i * 100);
  }
  // Steine fliegen aus dem Boden
  for (let i = 0; i < 20; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * radius * 0.6;
    particles.push({
      x: player.x + Math.cos(a) * d,
      y: player.y + Math.sin(a) * d,
      vx: (Math.random() - 0.5) * 80,
      vy: -250 - Math.random() * 150,
      life: 0.9,
      color: "#78716c",
      size: 5 + Math.random() * 4,
    });
  }
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
  // Tinten-Pool unter dem Decoy als persistente "Schatten-Lache"
  groundEffects.push({ kind: "lava_pool", x: shadowDecoy.x, y: shadowDecoy.y, radius: 38, life: 6, maxLife: 6 });
  // Vertikale Tinten-Streifen am Spieler (Auflöse-Effekt)
  for (let j = -15; j <= 15; j += 4) {
    for (let i = 0; i < 4; i += 1) {
      particles.push({
        x: player.x + j,
        y: player.y - 40 + i * 12,
        vx: 0, vy: -50 - Math.random() * 30,
        life: 0.5,
        color: "#1a1830",
        size: 4,
      });
    }
  }
  // Schatten-Funken um den Doppelganger
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
  // Telegraph-Pulse: roter pulsierender Ring (0.6s vor Impact - sichtbar als Warnung)
  groundEffects.push({ kind: "expanding_ring", x: impact.x, y: impact.y, maxRadius: radius * 1.05, life: 0.6, maxLife: 0.6, color: "#ff5d62" });
  groundEffects.push({ kind: "expanding_ring", x: impact.x, y: impact.y, maxRadius: radius * 0.7, life: 0.6, maxLife: 0.6, color: "#ffe0a0" });
  // Sturzflug-Trail: 12 Frames Feuer von oben rechts zum Impact
  for (let i = 0; i < 12; i += 1) {
    setTimeout(() => {
      const sx = impact.x + 280 - i * 26;
      const sy = impact.y - 380 + i * 32;
      for (let j = 0; j < 6; j += 1) {
        particles.push({
          x: sx + (Math.random() - 0.5) * 20,
          y: sy + (Math.random() - 0.5) * 20,
          vx: -200 + Math.random() * 40,
          vy: 300 + Math.random() * 80,
          life: 0.5,
          color: j % 2 === 0 ? "#ffe0a0" : "#ff5d62",
          size: 5 + Math.random() * 4,
        });
      }
    }, i * 35);
  }
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
  // Persistenter Krater + Lava-Pool
  anim.spawnCrater(impact.x, impact.y, radius * 0.7, 10);
  anim.spawnLavaPool(impact.x, impact.y, radius * 0.55, 3);
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
  const m = mastery("rootSnare");
  const angle = aimAngle();
  const range = 220 + m * 20;
  const dur = 3 + m * 0.4;
  let rooted = 0;
  for (const mob of [...mobs]) {
    if (!isInCone(mob, angle, range, 95)) continue;
    applyStatus(mob, "stunned", dur);
    damageMob(mob, Math.floor(attackPower() * 0.5), { tag: "stun" });
    // Persistente Wurzeln am Boden um den Mob — bleiben so lange wie der Stun
    anim.spawnRootsAt(mob.x, mob.y, 45, dur);
    // Erd-Puff
    anim.spawnDustPuff(particles, mob.x, mob.y + 14, "#65a30d", 10);
    rooted += 1;
  }
  // Erd-Wurzeln in Linie zum Cone (Telegraph wo Skill hingeht)
  for (let i = 0; i < 3; i += 1) {
    const dist = 60 + i * 60;
    anim.spawnRootsAt(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, 35, 1.2);
  }
  // Signatur Weltenwurzel: Wurzeln breiten sich auf ALLE Gegner in 260px aus
  if (equippedSignature() === "worldtree") {
    for (const mob of [...mobs]) {
      if (statusTime(mob, "stunned") > 0) continue;
      if (Math.hypot(mob.x - player.x, mob.y - player.y) > 260) continue;
      applyStatus(mob, "stunned", dur * 0.7);
      anim.spawnRootsAt(mob.x, mob.y, 40, dur * 0.7);
      rooted += 1;
    }
    floatText(player.x, player.y - 60, "WELTENWURZEL!", "#84cc16", { big: true });
  }
  showToast(`${rooted} Gegner verwurzelt.`);
}

function swarmCall() {
  // 5 Insekten spawnen (Original-Logik) + dichte Pixel-Wolke fuer Visual
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    insectSwarm.push({
      x: player.x + Math.cos(a) * 20,
      y: player.y + Math.sin(a) * 20,
      vx: 0, vy: 0,
      life: 4,
      target: null,
      damage: Math.max(2, Math.round(attackPower() * 0.10)),
      hitCd: 0,
    });
  }
  // Initialer Schwarm-Burst (Wolke vom Spieler)
  anim.spawnSwarmCloud(particles, player.x, player.y, "#a3e635");
  // Summen-Schockwelle
  anim.spawnRoar(player.x, player.y, "#65a30d");
  showToast("Insekten-Schwarm beschworen!");
}

function bearForm() {
  player.bearForm = 8;
  player.bearFormMaxHpBoost = Math.round(player.maxHp * 0.5);
  player.maxHp += player.bearFormMaxHpBoost;
  player.hp += player.bearFormMaxHpBoost;
  showToast("Bär-Form aktiv: +50% HP, +40% Schaden!");
  // Bruell-Schockwelle (2 expandierende Ringe)
  anim.spawnRoar(player.x, player.y, "#92400e");
  // Erd-Puff (Bärin landet hart)
  anim.spawnDustPuff(particles, player.x, player.y + 20, "#a16207", 18);
  // Krater-Spur unter den Pranken
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

// ===== Lyra / Verfuehrerin =====
function addCharmStack() {
  player.charmStacks = Math.min(5, (player.charmStacks || 0) + 1);
}

function consumeCharmStacksIfFull() {
  if ((player.charmStacks || 0) >= 5) {
    player.charmStacks = 0;
    return true; // garantierter Crit + Heilung
  }
  return false;
}

function spawnHearts(x, y, n, color = "#ec4899") {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (40 + Math.random() * 80),
      vy: Math.sin(a) * (40 + Math.random() * 80) - 30,
      life: 0.6 + Math.random() * 0.3,
      color,
      size: 5 + Math.random() * 3,
      heart: true,
    });
  }
}

function poleSpin() {
  const m = mastery ? mastery("poleSpin") : 0;
  const radius = 110 * (1 + m * 0.12);
  const dmgMult = 0.55 * (1 + m * 0.12);
  const crit = consumeCharmStacksIfFull();
  // Visuell: Spieler sichtbar drehen (3 Frames)
  player.spinAnim = 0.6;
  // Mehrere Spin-Trail-Ringe versetzt → wirbelnder Effekt
  anim.spawnSpinAura(player.x, player.y, radius, "#ec4899", 5, 0.08);
  // Bogen-Trail: helle Linie laeuft 3x um den Spieler
  for (let i = 0; i < 3; i += 1) {
    setTimeout(() => {
      // Schaden austeilen
      for (const mob of [...mobs]) {
        if (Math.hypot(mob.x - player.x, mob.y - player.y) > radius) continue;
        const base = Math.floor(attackPower() * dmgMult);
        damageMob(mob, crit ? base * 2 : base, { tag: crit ? "crit" : "spin" });
      }
      // Herz-Spirale in Spin-Richtung
      for (let j = 0; j < 12; j += 1) {
        const a = (j / 12) * Math.PI * 2 + i * 0.4;
        particles.push({
          x: player.x + Math.cos(a) * radius * 0.7,
          y: player.y + Math.sin(a) * radius * 0.7,
          vx: Math.cos(a + Math.PI / 2) * 80,
          vy: Math.sin(a + Math.PI / 2) * 80,
          life: 0.5,
          color: i % 2 === 0 ? "#ec4899" : "#f472b6",
          size: 4,
          heart: true,
        });
      }
    }, i * 180);
  }
  addCharmStack();
  if (crit) {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.08));
    anim.spawnHearts(particles, player.x, player.y, 8, "#f5d042");
  }
  showToast(crit ? "Anmut! Krit-Wirbel!" : "Wirbelschlag!");
}

function blowKiss() {
  const angle = aimAngle();
  const speed = 520;
  const dmg = Math.floor(attackPower() * 0.4);
  const crit = consumeCharmStacksIfFull();
  projectiles.push({
    x: player.x + Math.cos(angle) * 28,
    y: player.y - 6 + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    range: 520,
    travelled: 0,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.6)",
    damage: crit ? dmg * 2 : dmg,
    owner: "player",
    pierce: 1,
    hits: new Set(),
    life: 1.4,
    isHeart: true,
    onHit(target) {
      if (!target) return;
      // Bosse + Minibosse sind immun gegen Luftkuss-Verzauberung
      if (target.bossDef || target.rank === "boss" || target.rank === "miniboss") {
        floatText(target.x, target.y - 40, "immun", "#fbbf24");
        return;
      }
      const mLevel = mastery ? mastery("blowKiss") : 0;
      applyStatus(target, "confused", 4 + mLevel);
      target.confusedBy = authUser || "lyra";
      anim.spawnHearts(particles, target.x, target.y, 12, "#ec4899");
      anim.applyCharmAura(target); // dauerhafte Herz-Aura ueber Kopf
      floatText(target.x, target.y - 40, "verliebt!", "#f472b6");
    },
  });
  // Visueller Kuss-Wurf: Wind-up Herzen vom Spieler weg
  anim.spawnHeartTrail(particles, player.x, player.y - 20, player.x + Math.cos(angle) * 40, player.y + Math.sin(angle) * 40 - 10, 6, "#f472b6");
  if (crit) player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.08));
  addCharmStack();
  showToast("Luftkuss!");
}

function charmDance() {
  const m = mastery ? mastery("charmDance") : 0;
  const radius = 220 + m * 30;
  const charmDur = 5 + m;
  let charmed = 0;
  // Spielerin wird 1.5s unverwundbar während Tanz
  player.invuln = Math.max(player.invuln || 0, 1.5);
  player.charmDanceTimer = 1.6;
  player.spinAnim = 1.6;
  // Polstange erscheint aus dem Boden mit Gold-Funken + Rosen-Bluetenblaetter
  anim.spawnPoleDance(player.x, player.y);
  // Verzoegerte Charm-Welle (0.4s nach Stangen-Spawn)
  setTimeout(() => {
    for (const mob of mobs) {
      if (mob.bossDef) {
        applyStatus(mob, "stunned", 1.5);
        floatText(mob.x, mob.y - 48, "immun", "#fbbf24");
        continue;
      }
      if (Math.hypot(mob.x - player.x, mob.y - player.y) > radius) continue;
      applyStatus(mob, "charmed", charmDur);
      mob.aggroed = false;
      mob.confusedBy = authUser || "lyra"; // optional, falls spaeter Kills gezaehlt werden
      anim.applyCharmAura(mob);
      charmed += 1;
    }
    // Herz-Schockwelle
    anim.spawnHearts(particles, player.x, player.y, 40, "#ec4899");
    showToast(`Tanz der Verfuehrung: ${charmed} Gegner verliebt!`);
  }, 400);
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
    ins.hitCd = Math.max(0, (ins.hitCd || 0) - dt);
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
      // Treffer am Rand des Mobs, nur wenn Hit-Cooldown abgelaufen (gegen Rapid-Fire)
      if (d < ins.target.r + 8 && ins.hitCd <= 0) {
        // Gegen Bosse zusaetzlich gedrosselt — Schwarm war viel zu stark
        const dmg = ins.target.bossDef ? Math.max(1, Math.round(ins.damage * 0.45)) : ins.damage;
        damageMob(ins.target, dmg);
        ins.hitCd = 0.6; // max ~1.6 Treffer/s pro Insekt
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
  // Persistenter Eis-Ring (Frost-Hexagon bleibt 6s sichtbar)
  anim.spawnFrostRing(impact.x, impact.y, 142, slowDur + 1);
  gainFrostCharge();
  // Element-Fusion: wenn beide 3 Charges → "Dampf"-Bonus (next Skill +50% DMG, gleicher Effekt wie combo)
  if (player.fireCharges >= 3 && player.frostCharges >= 3) {
    player.steamBuff = 6;
    player.fireCharges = 0;
    player.frostCharges = 0;
    floatText(player.x, player.y - 60, "✦ DAMPF! +50% DMG ✦", "#67e8f9", { big: true });
  }
  // Schneeflocken die hineinfallen
  for (let i = 0; i < 16; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: impact.x + Math.cos(a) * 142,
      y: impact.y - 80 + Math.sin(a) * 30,
      vx: 0,
      vy: 30 + Math.random() * 30,
      life: 1.2,
      color: "#e0f2fe",
      size: 3,
    });
  }
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

function drawAimIndicator() {
  const angle = aimAngle();
  const target = findNearestMob();
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  // Pfeil-Spitze (3 Pixel-Rects)
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 8;
  ctx.fillRect(38, -3, 14, 6);
  ctx.fillRect(48, -6, 6, 12);
  ctx.fillRect(54, -3, 4, 6);
  ctx.restore();
  // Aim-Reticle ueber dem Auto-Target (wenn Auto-Aim aktiv)
  if (target && !joyActive && performance.now() >= manualAimUntil) {
    ctx.save();
    const r = target.r + 18 + Math.sin(performance.now() / 200) * 3;
    ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function findNearestMob(maxDist = 480) {
  let best = null;
  let bestD = maxDist;
  for (const m of mobs) {
    if (m.passive && !m.aggroed) continue; // ignoriere passive Wanderer
    const d = Math.hypot(m.x - player.x, m.y - player.y);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}

function aimAngle() {
  if (isTouchDevice) {
    // Prioritaet 1: aktiver Joystick → Skills folgen Bewegungsrichtung
    if (joyActive && (joyDirX !== 0 || joyDirY !== 0)) {
      return Math.atan2(joyDirY, joyDirX);
    }
    // Prioritaet 2: manuelles Tap-Aim (haelt 2.5s)
    if (performance.now() < manualAimUntil) {
      const cam = camera();
      return Math.atan2((mouse.y + cam.y) - player.y, (mouse.x + cam.x) - player.x);
    }
    // Prioritaet 3: kuerzlich aktiver Joystick (haelt 1s nach Loslassen)
    if (performance.now() - joyLastTime < 1000 && (joyLastDirX !== 0 || joyLastDirY !== 0)) {
      return Math.atan2(joyLastDirY, joyLastDirX);
    }
    // Prioritaet 4: Auto-Aim auf naechstes Mob
    const target = findNearestMob();
    if (target) {
      return Math.atan2(target.y - player.y, target.x - player.x);
    }
    // Fallback: blicke nach rechts
    return 0;
  }
  // Desktop: Maus
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
          // Mob auch wirklich sterben lassen (sofern es ein Mob ist, nicht der Spieler)
          if (mobs.includes(target)) {
            if (multiplayerReady && isHost) hostKillMob(target);
            else if (!multiplayerReady) killMob(target);
            // Non-host clients: warten auf Snapshot vom Host — sonst Duplikate
          }
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
  // Synergie-FloatText (gross, eye-catching)
  if (options.tag === "detonate") {
    floatText(mob.x, mob.y - 72, "✦ DETONATE ✦", "#ff9540", { big: true });
    addCombo(20);
  } else if (options.tag === "combo") {
    floatText(mob.x, mob.y - 72, "✦ KOMBO ✦", "#fde047", { big: true });
    addCombo(15);
  } else if (options.tag === "crit") {
    addCombo(10);
  } else if (options.tag === "stun" || options.tag === "frost") {
    addCombo(6);
  }
  mob.hitTimer = 0.14;
  if (multiplayerReady && mob.serverId) {
    pushHit({ kind: "mob", serverId: mob.serverId }, amount);
    return;
  }
  mob.hp -= amount;
  if (mob.hp <= 0) killMob(mob);
}

// Zentralisiert die Mob-Sterbe-Logik. Wird aus damageMob() UND aus DoT-Ticks
// (tickStatuses) UND confusion-Attacks gerufen, damit Mobs auch durch Gift,
// Brand und Charm-vs-Mob-Schaden korrekt sterben (vorher Bug: hp blieb auf 0).
// Boss-Defeat: Pet-Unlock + Cinematic + Drop. Wird aus killMob (single) UND
// hostKillMob (multiplayer) gerufen, damit Pets in JEDEM Modus freigeschaltet
// werden. Nur ausfuehren wenn der lokale Spieler am Boss mitgewirkt hat.
function handleBossDefeat(mob, loot = true) {
  if (loot) handleWorldBossDrop(mob);
  cameraShake = 0.7;
  skillFlashes.push({ color: "#ffe0a0", life: 0.5, maxLife: 0.5 });
  triggerBossDefeatCinematic(mob);
  const petDef = mob.bossDef.pet;
  // Pet nur freischalten wenn lokaler Spieler Schaden gemacht hat (oder solo)
  const contributed = !mob.dmgBy || !authUser || (mob.dmgBy[authUser] || 0) > 0 || Object.keys(mob.dmgBy).length === 0;
  if (petDef && contributed) {
    player.pets = player.pets || {};
    if (!player.pets[mob.bossDef.id]) {
      player.pets[mob.bossDef.id] = { bossId: mob.bossDef.id, unlockedAt: Date.now() };
      showToast(`${petDef.name} folgt dir jetzt! Schalte ihn im Charakter-Menü an/aus.`);
    }
    player.activePet = mob.bossDef.id;
    initPetRuntime();
    saveCurrentCharacter();
  }
  // Seltene Chance auf ein legendaeres Spezial-Tier (nur wer Schaden gemacht hat)
  if (contributed) {
    const missing = LEGENDARY_PET_IDS.filter((id) => !player.pets?.[id]);
    if (missing.length && Math.random() < 0.12) {
      const pid = missing[Math.floor(Math.random() * missing.length)];
      player.pets = player.pets || {};
      player.pets[pid] = { bossId: pid, unlockedAt: Date.now(), level: 1 };
      player.activePet = pid;
      initPetRuntime();
      renderPetSlot();
      saveCurrentCharacter();
      showToast(`💎 LEGENDÄRES TIER! ${specialPets[pid].name} schliesst sich dir an!`);
      cameraShake = 0.8; skillFlashes.push({ color: "#fde047", life: 0.7, maxLife: 0.7 });
      sfx.ulti?.();
    }
  }
  if (mob.bossDef.defeatToast) showToast(mob.bossDef.defeatToast);
}

function killMob(mob) {
  if (!mob || mob._dead) return;
  mob._dead = true;
  // Signatur Herzbrecher: charmter/confuster Mob stirbt → Charme springt zum naechsten
  if (equippedSignature() === "heartbreaker" && (statusTime(mob, "charmed") > 0 || statusTime(mob, "confused") > 0)) {
    let best = null, bd = 300;
    for (const o of mobs) {
      if (o === mob || o.bossDef || o.rank === "boss" || o.rank === "miniboss") continue;
      const d = Math.hypot(o.x - mob.x, o.y - mob.y);
      if (d < bd) { bd = d; best = o; }
    }
    if (best) {
      applyStatus(best, "confused", 4);
      best.confusedBy = authUser || "lyra";
      anim.applyCharmAura(best);
      anim.spawnHearts(particles, best.x, best.y, 8, "#f5d042");
      floatText(best.x, best.y - 40, "💔 Charme springt!", "#f5d042");
    }
  }
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
    handleBossDefeat(mob, true);
  } else {
    dropLoot(mob.x, mob.y, mob.rank || (mob.elite ? "elite" : "mob"));
  }
  burst(mob.x, mob.y, mob.color || (mob.elite ? "#c084fc" : "#ff6b6b"), mob.rank === "boss" ? 90 : mob.rank === "miniboss" ? 42 : 24);
  if (!mob.bossDef && mob.rank === "boss") showToast(`${mob.name} besiegt: Boss-Loot liegt am Boden.`);
  else if (!mob.bossDef && mob.rank === "miniboss") showToast(`${mob.name} besiegt: starker Loot liegt am Boden.`);
  setTimeout(() => {
    const point = randomPointAwayFromPlayer(680);
    spawnMob(point.x, point.y, Math.random() < 0.24 ? "elite" : "mob");
  }, 850);
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

function dropLoot(x, y, source, owner = null, dmgBy = null) {
  const { drops: dropIds, gold: goldAmount } = rollDrops(currentWorldId, source, player.classId);
  // Aggregiere zu Inventar-Eintraegen
  const counts = {};
  for (const id of dropIds) counts[id] = (counts[id] || 0) + 1;
  const drops = Object.entries(counts).map(([id, count]) => ({ id, count }));

  // Runen-Drop: Metin-Steine + Bosse droppen mit Chance eine Rune
  const runeDrop = rollRuneDrop(source);
  if (runeDrop) drops.push({ id: runeDrop, count: 1 });

  // Uraltes Relikt (legendäres Upgrade-Material): Bosse + Metin höherer Welten
  const order = ["meadows", "frostwastes", "emberforge", "shadowfen", "skyspire", "tideklippen"];
  const wi = Math.max(0, order.indexOf(currentWorldId));
  let relicChance = 0;
  if (source === "boss") relicChance = wi >= 3 ? 1.0 : 0.6;
  else if (source === "miniboss") relicChance = wi >= 2 ? 0.4 : 0.15;
  else if (source === "metin") relicChance = wi >= 2 ? 0.12 : 0.03;
  if (relicChance > 0 && Math.random() < relicChance) {
    const amount = source === "boss" ? (1 + Math.floor(Math.random() * 2)) : 1;
    drops.push({ id: "ancient_relic", count: amount });
  }

  // Beitrags-Liste: bei Boss/Metin teilt sich der Loot auf alle Schadens-Beiträger
  const contributors = contributorList(dmgBy);
  return spawnDropEntries(x, y, drops, goldAmount, owner, contributors);
}

// Sortierte Liste der Schadens-Beiträger (höchster zuerst). Leer = Solo.
function contributorList(dmgBy) {
  if (!dmgBy) return [];
  return Object.entries(dmgBy)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

// Runen-Drop-Logik: Quelle + Welt bestimmen Chance + Tier-Verteilung.
function rollRuneDrop(source) {
  const isBoss = source === "boss";
  const isMini = source === "miniboss";
  const isMetin = source === "metin";
  let chance = 0;
  if (isBoss) chance = 1.0;       // Boss garantiert Rune
  else if (isMini) chance = 0.5;
  else if (isMetin) chance = 0.35;
  else if (source === "elite") chance = 0.10;
  if (Math.random() > chance) return null;
  // Welt-Index bestimmt Tier-Pool (spaetere Welten = hoehere Tiers)
  const order = ["meadows", "frostwastes", "emberforge", "shadowfen", "skyspire", "tideklippen"];
  const wi = Math.max(0, order.indexOf(currentWorldId));
  // Tier-Gewichte verschieben sich mit Welt + Quelle
  let weights;
  if (isBoss) weights = wi >= 3 ? { perfekt: 0.4, strahlend: 0.5, klar: 0.1 } : { strahlend: 0.45, klar: 0.4, rissig: 0.15 };
  else if (isMini) weights = { strahlend: 0.2, klar: 0.5, rissig: 0.3 };
  else weights = wi >= 3 ? { strahlend: 0.12, klar: 0.43, rissig: 0.45 } : wi >= 1 ? { klar: 0.35, rissig: 0.65 } : { klar: 0.18, rissig: 0.82 };
  // Tier per gewichtetem Zufall
  const roll = Math.random();
  let acc = 0, tier = "rissig";
  for (const [t, w] of Object.entries(weights)) { acc += w; if (roll <= acc) { tier = t; break; } }
  // Typ zufaellig (Diamant seltener)
  const types = ["ruby", "sapphire", "emerald", "topaz", "amethyst", "ruby", "sapphire", "diamond"];
  const type = types[Math.floor(Math.random() * types.length)];
  return runeId(type, tier);
}

function spawnDropEntries(x, y, drops, goldAmount, owner, contributors = []) {
  if (multiplayerReady && isHost) {
    const list = drops.filter((entry) => entry.count > 0);
    // Loot-Split: mehrere Beiträger → Items reihum verteilen, jeder kriegt eigene reservierte Drops
    const splitOwners = contributors.length > 1 ? contributors : null;
    list.forEach((drop, idx) => {
      const dropOwner = splitOwners ? splitOwners[idx % splitOwners.length] : owner;
      publishLoot({
        id: drop.id,
        count: drop.count,
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        owner: dropOwner,
        ownerLockUntil: dropOwner ? Date.now() + 6000 : 0,
      });
    });
    // Gold gleichmäßig auf alle Beiträger aufteilen
    if (splitOwners) {
      const share = Math.max(1, Math.floor(goldAmount / splitOwners.length));
      for (const name of splitOwners) pushGrant(name, { gold: share });
    } else if (owner) {
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
  gainPetXp(Math.max(1, Math.round(amount * 0.5))); // Pet bekommt halbe XP
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

function usePotion(preferIndex = null) {
  if (player.hp >= player.maxHp) { showToast("HP bereits voll."); return; }
  let potion = null;
  // Bestimmter Trank angeklickt → den nehmen; sonst staerksten verfuegbaren
  if (preferIndex !== null && player.inventory[preferIndex]?.count > 0 && itemDefs[player.inventory[preferIndex].id]?.type === "potion") {
    potion = player.inventory[preferIndex];
  } else {
    for (const id of ["super_potion", "greater_potion", "health_potion"]) {
      const p = player.inventory.find((e) => e.id === id && e.count > 0);
      if (p) { potion = p; break; }
    }
  }
  if (!potion) return;
  const def = itemDefs[potion.id];
  potion.count -= 1;
  player.hp = Math.min(player.maxHp, player.hp + (def.heal || 0));
  if (potion.count <= 0) player.inventory = player.inventory.filter((entry) => entry.count > 0);
  showToast(`${def.name} genutzt (+${def.heal} HP).`);
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

function equipBoots(index) {
  const invItem = player.inventory[index];
  if (!invItem || itemDefs[invItem.id]?.type !== "boots") return;
  player.bootsIndex = index;
  const def = itemDefs[invItem.id];
  showToast(`${def.name} angezogen (+${Math.round((def.speed || 0) * 100)}% Tempo).`);
  renderInventory();
}

function equipHat(index) {
  const invItem = player.inventory[index];
  if (!invItem || itemDefs[invItem.id]?.type !== "hat") return;
  player.hatIndex = index;
  const def = itemDefs[invItem.id];
  const parts = [];
  if (def.bonusAttack) parts.push(`+${def.bonusAttack} Angriff`);
  if (def.bonusCrit) parts.push(`+${Math.round(def.bonusCrit * 100)}% Krit`);
  showToast(`${def.name} aufgesetzt (${parts.join(", ")}).`);
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
  // Schwert (Krieger)
  rust_sword: "iron_blade", iron_blade: "pugna_cleaver", pugna_cleaver: "fullmoon_sickle",
  // Dolche (Schatten)
  twin_daggers: "fang_daggers", fang_daggers: "venom_kris", venom_kris: "nightfang",
  // Zauberstab (Magier)
  apprentice_staff: "crystal_staff", crystal_staff: "rune_staff", rune_staff: "storm_scepter",
  // Naturstab (Druidin)
  sprout_staff: "oak_staff", oak_staff: "thorn_staff", thorn_staff: "worldtree_staff",
  // Polstange (Lyra)
  dancer_pole: "silk_pole", silk_pole: "rose_pole", rose_pole: "heartbreaker",
  // Rüstung — Leder
  leather_armor: "hunter_leather", hunter_leather: "shadow_leather",
  // Rüstung — Leicht
  mage_robe: "iron_armor", iron_armor: "silk_garb",
  // Rüstung — Schwer
  knight_plate: "steel_armor", steel_armor: "dragon_plate",
  // Tränke — kleine zu groesseren mischen
  health_potion: "greater_potion", greater_potion: "super_potion",
};

function tryAddToMerge(invIndex) {
  const inv = player.inventory[invIndex];
  if (!inv) return false;
  const def = itemDefs[inv.id];
  if (!def || (def.type !== "weapon" && def.type !== "armor" && def.type !== "potion")) return false;
  if (!mergeMap[inv.id]) return false;
  // Anti-Dupe: derselbe Inventar-Slot darf nur so oft rein wie sein Stapel gross ist
  const alreadyUsed = mergeSlots.filter((s) => s === invIndex).length;
  if (alreadyUsed >= (inv.count || 1)) {
    showToast("Du hast nicht genug Exemplare dieses Items.");
    return false;
  }
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
      shiftEquipIndices(idx);
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
    const isGear = targetDef.type === "weapon" || targetDef.type === "armor";
    const affixes = isGear ? rollAffixes(targetDef.rarity) : undefined;
    const newEntry = { id: targetId, count: 1, upgrade: 0, justMerged: Date.now() };
    if (affixes) newEntry.affixes = affixes;
    // Tränke stapeln statt Einzel-Slots zu erzeugen
    if (targetDef.type === "potion") {
      const stack = player.inventory.find((e) => e.id === targetId);
      if (stack) { stack.count = (stack.count || 1) + 1; stack.justMerged = Date.now(); }
      else player.inventory.push(newEntry);
    } else {
      player.inventory.push(newEntry);
    }
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

// Kann der aktuelle Charakter dieses Item ueberhaupt sinnvoll nutzen?
function usableByPlayerClass(def) {
  if (!def) return false;
  if (def.type === "weapon") return weaponClassMatch(def, player.classId) === 1;
  if (def.type === "armor") return armorClassMatch(def, player.classId) >= 1;
  return true; // Schuhe/Hüte/Runen/Material sind klassenneutral
}

// Welche Item-Typen koennen aufgewertet werden
function isUpgradable(def) {
  return !!def && (def.type === "weapon" || def.type === "armor" || def.type === "boots" || def.type === "hat");
}
// Kosten-Klasse: Waffe teurer, Ruestung/Schuhe/Huete guenstiger
function upgradeKindOf(def) {
  return def?.type === "weapon" ? "weapon" : "armor";
}
// Passt das Item zum aktuellen Schmied-Tab?
function matchesSmithMode(def, mode) {
  if (!def) return false;
  if (mode === "gear") return def.type === "boots" || def.type === "hat";
  return def.type === mode;
}
// Bruch-Risiko-Senkung: 10% je geopfertes identisches Item, max 50%
function protectReductionForCount(count) {
  return Math.min(0.5, 0.10 * (count || 0));
}
// Gueltige Schutz-Opfer-Indizes (gleiche ID, existiert noch, nicht das Hauptitem)
function validProtectIndices() {
  const main = smithSelectedIndex !== null ? player.inventory[smithSelectedIndex] : null;
  if (!main) return [];
  return smithProtectIndices.filter((i) => i !== smithSelectedIndex && player.inventory[i] && player.inventory[i].id === main.id);
}

// Stat-Zeile fuer die Schmied-Vorschau (inkl. Upgrade-Level)
function smithStatLine(def, lvl) {
  if (def.type === "boots") return `+${Math.round(((def.speed || 0) + lvl * 0.02) * 100)}% Tempo`;
  if (def.type === "hat") {
    const parts = [];
    if (def.bonusAttack) parts.push(`+${def.bonusAttack + lvl * 2} Angriff`);
    if (def.bonusCrit) parts.push(`+${Math.round(def.bonusCrit * 100)}% Krit`);
    return parts.join(", ");
  }
  if (def.type === "armor") return `${def.defense + lvl * 4} Verteidigung`;
  return `${def.attack + lvl * 3} Angriff`;
}

function upgradeCost(nextLevel, kind, rarity = "common") {
  // Legendäre Items: deutlich teurer + brauchen Uralte Relikte (Boss-Material)
  const legendary = rarity === "legendary";
  const goldBase = kind === "armor" ? 18 : 24;
  return {
    gold: Math.round(goldBase * nextLevel * (legendary ? 2.5 : 1)),
    shards: Math.ceil(nextLevel / 2) * (legendary ? 2 : 1),
    gems: nextLevel >= 4 ? Math.ceil((nextLevel - 3) / 2) : 0,
    cores: nextLevel >= 7 ? 1 : 0,
    // Relikte ab +4 bei Legendären (1 pro Stufe ab +4, 2 ab +7)
    relics: legendary && nextLevel >= 4 ? (nextLevel >= 7 ? 2 : 1) : 0,
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
  if (!isUpgradable(def)) {
    showToast("Nur Waffen, Rüstung, Schuhe oder Hüte können aufgewertet werden.");
    return;
  }
  smithSelectedIndex = index;
  smithProtectIndices = [];
  smithPickProtect = false;
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
    smithProtectIndices = []; smithPickProtect = false;
    renderProtectBlock(null);
    if (ui.upgradeWeapon) {
      ui.upgradeWeapon.disabled = true;
      ui.upgradeWeapon.textContent = "Aufwerten +1";
    }
    return;
  }
  const def = itemDefs[entry.id];
  const kind = upgradeKindOf(def);
  const curLvl = entry.upgrade || 0;
  const nextLvl = curLvl + 1;
  slot.className = `smith-item-slot ${def.rarity || ""}`;
  const smithIcon = svgIconFor(entry, def.color) || `${def.icon || "?"}`;
  slot.innerHTML = `
    <span class="smith-item-icon" style="color:${def.color || "#f4f0df"}">${smithIcon}</span>
    <strong>${def.name} +${curLvl}</strong>
    <small>${smithStatLine(def, curLvl)}</small>
  `;
  if (nextLvl > 9) {
    if (ui.smithCostList) ui.smithCostList.innerHTML = "<strong>Max-Level erreicht (+9)</strong>";
    ui.smithRiskBlock?.classList.add("hidden");
    renderProtectBlock(null);
    if (ui.upgradeWeapon) {
      ui.upgradeWeapon.disabled = true;
      ui.upgradeWeapon.textContent = "Max +9";
    }
    return;
  }
  const cost = upgradeCost(nextLvl, kind, def.rarity);
  const have = {
    gold: player.gold || 0,
    shards: inventoryCount("metin_shard"),
    gems: inventoryCount("gem"),
    cores: inventoryCount("pugna_core"),
    relics: inventoryCount("ancient_relic"),
  };
  const rows = [
    ["Gold", cost.gold, have.gold, "#f4c95d"],
    ["Metin-Splitter", cost.shards, have.shards, "#9ee7ff"],
    ["Kristall", cost.gems, have.gems, "#7dd3fc"],
    ["Pugna-Kern", cost.cores, have.cores, "#c084fc"],
    ["Uraltes Relikt", cost.relics || 0, have.relics, "#fde047"],
  ];
  if (ui.smithCostList) {
    ui.smithCostList.innerHTML = `<strong>Kosten fuer +${nextLvl}</strong>` + rows.filter(([, need]) => need > 0).map(([label, need, has, color]) => {
      const ok = has >= need;
      return `<div class="cost-row ${ok ? "ok" : "miss"}"><span>${label}</span><span style="color:${color}">${has}/${need}</span></div>`;
    }).join("");
  }
  const baseRisk = breakChance(nextLvl);
  // Schutz-Opfer: gleiche Item-ID, 10% je Stueck
  const protectCount = validProtectIndices().length;
  const reduction = protectReductionForCount(protectCount);
  const risk = Math.max(0, baseRisk - reduction);
  if (ui.smithRiskBlock) {
    if (baseRisk > 0) {
      ui.smithRiskBlock.classList.remove("hidden");
      if (ui.smithRiskFill) ui.smithRiskFill.style.width = `${Math.round(risk * 100)}%`;
      if (ui.smithRiskText) ui.smithRiskText.textContent = reduction > 0
        ? `${Math.round(risk * 100)}% (−${Math.round(reduction * 100)}%)`
        : `${Math.round(risk * 100)}%`;
    } else {
      ui.smithRiskBlock.classList.add("hidden");
    }
  }
  renderProtectBlock(def, entry);
  const canPay = canPayUpgrade(cost);
  const nearBlacksmith = isNearBlacksmith();
  if (ui.upgradeWeapon) {
    ui.upgradeWeapon.disabled = !canPay || !nearBlacksmith;
    ui.upgradeWeapon.textContent = canPay ? `Aufwerten auf +${nextLvl}` : "Materialien fehlen";
  }
}

// Schutz-Opfer-Block: nutzbar wenn es identische Kopien des Hauptitems gibt
function renderProtectBlock(mainDef, mainEntry) {
  const block = document.getElementById("smithProtectBlock");
  const slot = document.getElementById("smithProtectSlot");
  const pickBtn = document.getElementById("smithProtectPick");
  const clearBtn = document.getElementById("smithProtectClear");
  if (!block || !slot) return;
  // verfuegbare identische Kopien (gleiche ID, nicht Hauptitem, nicht ausgeruestet)
  const spares = mainEntry ? player.inventory.filter((e, i) =>
    e && e.id === mainEntry.id && i !== smithSelectedIndex
    && i !== player.weaponIndex && i !== player.armorIndex && i !== player.bootsIndex && i !== player.hatIndex
  ).length : 0;
  if (!mainEntry || spares === 0) {
    block.classList.add("hidden");
    smithProtectIndices = []; smithPickProtect = false;
    return;
  }
  block.classList.remove("hidden");
  // ungueltige (z.B. nachgerutschte) Auswahl bereinigen
  smithProtectIndices = validProtectIndices();
  const count = smithProtectIndices.length;
  const helpEl = block.querySelector("small");
  if (helpEl) helpEl.textContent = `🛡 Gleiche Items opfern — je −10% Bruch-Risiko (${spares} verfügbar)`;
  if (count > 0) {
    const d = mainDef;
    const icon = svgIconFor(mainEntry, d.color) || `${d.icon || "?"}`;
    slot.className = `smith-item-slot ${d.rarity || ""}`;
    slot.innerHTML = `<span class="smith-item-icon" style="color:${d.color || "#fff"}">${icon}</span><strong>${count}× ${d.name}</strong><small>−${Math.round(protectReductionForCount(count) * 100)}% Bruch-Risiko</small>`;
    clearBtn?.classList.remove("hidden");
    if (pickBtn) pickBtn.textContent = smithPickProtect ? "Fertig" : "Mehr wählen";
  } else {
    slot.className = "smith-item-slot empty";
    slot.innerHTML = smithPickProtect
      ? `<span class="smith-slot-hint">Gleiche Items im Inventar anklicken…</span>`
      : `<span class="smith-slot-hint">Gleiche Items als Schutz wählen →</span>`;
    clearBtn?.classList.add("hidden");
    if (pickBtn) pickBtn.textContent = smithPickProtect ? "Abbrechen" : "Schutz wählen";
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
  const kind = upgradeKindOf(def);
  const curLvl = entry.upgrade || 0;
  const nextLvl = curLvl + 1;
  if (nextLvl > 9) {
    showToast("Max-Level erreicht.");
    return;
  }
  const cost = upgradeCost(nextLvl, kind, def.rarity);
  if (!canPayUpgrade(cost)) {
    showToast(cost.relics > 0 && inventoryCount("ancient_relic") < cost.relics
      ? `Brauchst ${cost.relics}× Uraltes Relikt (von Bossen/Metin-Steinen).`
      : "Materialien fehlen.");
    return;
  }
  payUpgrade(cost);
  // Schutz-Opfer: identische Items senken das Risiko (10% je Stueck) und werden verbraucht
  const protectIdxs = validProtectIndices();
  const reduction = protectReductionForCount(protectIdxs.length);
  const risk = Math.max(0, breakChance(nextLvl) - reduction);
  const broke = Math.random() < risk;
  if (broke) {
    skillFlashes.push({ color: "#ff5d62", life: 0.4, maxLife: 0.4 });
    cameraShake = 0.5;
    showToast(`${def.name} ist beim Schmieden zerbrochen!`);
  } else {
    entry.upgrade = nextLvl;
    showToast(`${def.name} auf +${nextLvl} aufgewertet!`);
    skillFlashes.push({ color: "#f4c95d", life: 0.2, maxLife: 0.2 });
  }
  // Items entfernen: alle Schutz-Opfer immer, Hauptitem nur bei Bruch.
  // Hohe Indizes zuerst splicen, damit niedrigere Indizes gueltig bleiben.
  const mainIdx = smithSelectedIndex;
  const toRemove = [...protectIdxs];
  if (broke) toRemove.push(mainIdx);
  // doppelte vermeiden + absteigend sortieren
  [...new Set(toRemove)].sort((a, b) => b - a).forEach((idx) => { player.inventory.splice(idx, 1); shiftEquipIndices(idx); });
  if (broke) {
    smithSelectedIndex = null;
  } else {
    // Hauptitem ist um die Anzahl der davor entfernten Opfer nachgerutscht
    const removedBelow = protectIdxs.filter((i) => i < mainIdx).length;
    smithSelectedIndex = mainIdx - removedBelow;
  }
  if (protectIdxs.length) showToast(`🛡 ${protectIdxs.length}× Schutz-Opfer verbraucht.`);
  smithProtectIndices = []; smithPickProtect = false;
  renderInventory();
  renderSmithSlot();
  updateUi();
  saveCurrentCharacter();
}

function canPayUpgrade(cost) {
  return player.gold >= cost.gold
    && inventoryCount("metin_shard") >= cost.shards
    && inventoryCount("gem") >= cost.gems
    && inventoryCount("pugna_core") >= cost.cores
    && inventoryCount("ancient_relic") >= (cost.relics || 0);
}

function payUpgrade(cost) {
  player.gold -= cost.gold;
  removeInventory("metin_shard", cost.shards);
  removeInventory("gem", cost.gems);
  removeInventory("pugna_core", cost.cores);
  if (cost.relics) removeInventory("ancient_relic", cost.relics);
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

function floatText(x, y, text, color, opts = {}) {
  const isImportant = (text && (text.includes("CRIT") || text.includes("KOMBO"))) || opts.big;
  floatingText.push({
    x, y, text, color,
    life: isImportant ? 1.2 : 0.75,
    maxLife: isImportant ? 1.2 : 0.75,
    big: !!opts.big,
  });
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
  const wolfBoost = (player.wolfForm || 0) > 0 ? 1.6 : 1;
  const museSpeed = (player.museActive || 0) > 0 ? 1.08 : 1;
  const petSurge = (player.petSurge || 0) > 0 ? 1.65 : 1;
  const rooted = (player.petRoot || 0) > 0; // Golem-Bollwerk: wurzelt dich fest
  const speedMult = rooted ? 0 : (1 + talentEffect("speedBonus")) * frostSlow * wolfBoost * museSpeed * petSurge * armorSpeedMult() * bootsSpeedMult();
  player.x = clamp(player.x + (move.x / len) * player.speed * speedMult * dt, player.r, world.w - player.r);
  player.y = clamp(player.y + (move.y / len) * player.speed * speedMult * dt, player.r, world.h - player.r);
  // Sturmlauf beschleunigt auch die Angriffe (Cooldown laeuft schneller ab)
  player.attackCooldown = Math.max(0, player.attackCooldown - dt * ((player.petSurge || 0) > 0 ? 1.6 : 1));
  player.invuln = Math.max(0, player.invuln - dt);
  player.petActiveCd = Math.max(0, (player.petActiveCd || 0) - dt);
  player.petSurge = Math.max(0, (player.petSurge || 0) - dt);
  player.petRoot = Math.max(0, (player.petRoot || 0) - dt);
  player.petShield = Math.max(0, (player.petShield || 0) - dt);
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
  const iAmAuthoritative = (!multiplayerReady || isHost) && !isPvpActive();
  const runHostSim = iAmAuthoritative; // jetzt nur Mob-AI / movement
  const runWaves = iAmAuthoritative && !currentWorld().noWildMobs && !currentWorld().passiveMobs;
  if (runWaves) {
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
    const charmed = statusTime(mob, "charmed") > 0;
    const confused = statusTime(mob, "confused") > 0;
    if (mob.slowTimer > 0) mob.slowTimer = Math.max(0, mob.slowTimer - dt);
    const petSlow = mob.slowTimer > 0 ? 0.45 : 1;
    const speedFactor = (stunned ? 0 : frozen ? 0.42 : charmed ? 0.5 : 1) * petSlow;
    // Charm: Mob folgt Spielerin verträumt, greift nicht an
    if (charmed) {
      const ang = Math.atan2(player.y - mob.y, player.x - mob.x) + (Math.sin(performance.now() / 250 + mob.x * 0.01) * 0.4);
      const dist = Math.hypot(player.x - mob.x, player.y - mob.y);
      if (dist > 60) {
        mob.x += Math.cos(ang) * mob.speed * 0.5 * dt;
        mob.y += Math.sin(ang) * mob.speed * 0.5 * dt;
      }
      // Herzchen über'm Kopf
      if (Math.random() < dt * 4) {
        particles.push({
          x: mob.x + (Math.random() - 0.5) * 20,
          y: mob.y - 50,
          vx: 0, vy: -40,
          life: 0.6,
          color: "#ec4899",
          size: 5,
          heart: true,
        });
      }
      continue; // kein Angriff, kein normaler Move
    }
    // Confused: Mob greift naechsten anderen Mob an (Verbündeter wird zum Feind)
    if (confused) {
      let bestTarget = null;
      let bestD = Infinity;
      for (const other of mobs) {
        if (other === mob) continue;
        if (statusTime(other, "confused") > 0) continue;
        const d2 = Math.hypot(other.x - mob.x, other.y - mob.y);
        if (d2 < bestD && d2 < 400) { bestD = d2; bestTarget = other; }
      }
      mob.confHitCd = Math.max(0, (mob.confHitCd || 0) - dt);
      if (bestTarget) {
        const ang = Math.atan2(bestTarget.y - mob.y, bestTarget.x - mob.x);
        mob.x += Math.cos(ang) * mob.speed * dt;
        mob.y += Math.sin(ang) * mob.speed * dt;
        if (bestD < mob.r + bestTarget.r + 8 && mob.confHitCd <= 0) {
          mob.confHitCd = 0.7; // kein Rapid-Fire
          // Schaden gedeckelt: niedriger Multiplikator + max 25% der Ziel-maxHP (kein One-Shot)
          let dmg = Math.max(2, Math.round(mob.damage * 0.35));
          dmg = Math.min(dmg, Math.round((bestTarget.maxHp || 40) * 0.25));
          bestTarget.hp -= dmg;
          bestTarget.hitTimer = 0.08;
          floatText(bestTarget.x, bestTarget.y - 30, `-${dmg}`, "#f472b6");
          // Ziel wehrt sich: verzauberter Mob bekommt auch Schaden zurueck
          const retal = Math.max(1, Math.round((bestTarget.damage || 8) * 0.4));
          mob.hp -= retal;
          mob.hitTimer = 0.08;
          floatText(mob.x, mob.y - 30, `-${retal}`, "#fca5a5");
          // Kill-Credit dem Lyra-Spieler + tatsaechlich sterben lassen
          if (bestTarget.hp <= 0) {
            if (mob.confusedBy) {
              bestTarget.dmgBy = bestTarget.dmgBy || {};
              bestTarget.dmgBy[mob.confusedBy] = (bestTarget.dmgBy[mob.confusedBy] || 0) + dmg;
            }
            if (multiplayerReady && isHost) hostKillMob(bestTarget);
            else if (!multiplayerReady) killMob(bestTarget);
          }
          // Verzauberter Mob selbst kann durch Gegenwehr sterben
          if (mob.hp <= 0) {
            if (mob.confusedBy) { mob.dmgBy = mob.dmgBy || {}; mob.dmgBy[mob.confusedBy] = (mob.dmgBy[mob.confusedBy] || 0) + retal; }
            if (multiplayerReady && isHost) hostKillMob(mob);
            else if (!multiplayerReady) killMob(mob);
            continue;
          }
          mob.attackTelegraph = 0.18;
        }
        // Herzchen
        if (Math.random() < dt * 3) spawnHearts(mob.x, mob.y - 30, 1, "#f472b6");
      }
      continue;
    }
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
      // Bosse machen bei reiner Beruehrung deutlich weniger Schaden (ihr Threat
      // sind die telegraphierten Faehigkeiten, nicht das Anrempeln) — sonst ist
      // Nahkampf gegen Bosse besonders auf Mobile fast unmoeglich.
      const contactMult = mob.bossDef ? 0.35 : 1;
      const mitigatedDamage = Math.max(3, Math.ceil((mob.damage * 0.65 + mob.damage * 0.35) * contactMult - def));
      player.hp -= mitigatedDamage;
      gainRage(8); // Krieger laedt Rage durch eingesteckte Treffer
      player.invuln = mob.bossDef ? 0.8 : 0.5; // laengeres i-frame nach Boss-Beruehrung
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

  interpolateRemoteMobs(dt);
  updateTradeButton();
  updateParticles(dt);
  updateProjectiles(dt);
  updateSkillFlashes(dt);
  updateClassResources(dt);
  updateGroundEffects(dt);
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
  if (bossDefeatCinematic) {
    bossDefeatCinematic.life -= dt;
    if (bossDefeatCinematic.life <= 0) bossDefeatCinematic = null;
  }
  if (!splashScreen.shown && splashScreen.life > 0) {
    splashScreen.life -= dt;
    if (splashScreen.life <= 0) {
      splashScreen.shown = true;
      localStorage.setItem("blocpugnaSplashSeen", "1");
    }
  }
  // Bär-Form Tick
  if (player.bearForm > 0) {
    player.bearForm -= dt;
    if (player.bearForm <= 0) {
      // Wolfsform-Chain wenn Bear-Mastery >= 3
      const bm = mastery("bearForm");
      if (bm >= 3 && player.classId === "druid") {
        player.wolfForm = 3 + (bm - 2); // 3s base, +1s pro Punkt ueber 3
        floatText(player.x, player.y - 60, "🐺 WOLFSFORM!", "#a3e635", { big: true });
        anim.spawnRoar(player.x, player.y, "#5c5c8a");
      }
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
  updateRaid(dt);
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
  // Hard-Cap gegen Lag: bei Überlauf älteste Partikel verwerfen
  if (particles.length > 600) particles.splice(0, particles.length - 600);
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

function updateTouchCooldown(btnId, abilityId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const cdTime = btn.querySelector(".cd-time");
  const lblEl = btn.querySelector(".lbl");
  if (!abilityId) {
    btn.style.setProperty("--cd-pct", "0");
    if (cdTime) cdTime.textContent = "";
    if (lblEl) lblEl.style.opacity = "0.4";
    btn.classList.remove("ready-glow");
    return;
  }
  const def = getAbilityDef(abilityId);
  const remaining = abilityCooldown(abilityId);
  const maxCd = def ? def.cooldown * (1 - totalCdr()) : 1;
  if (remaining > 0) {
    const pct = Math.min(100, (remaining / maxCd) * 100);
    btn.style.setProperty("--cd-pct", pct.toString());
    if (cdTime) cdTime.textContent = remaining >= 10 ? Math.ceil(remaining) : remaining.toFixed(1);
    if (lblEl) lblEl.style.opacity = "0.35";
    btn.classList.remove("ready-glow");
  } else {
    btn.style.setProperty("--cd-pct", "0");
    if (cdTime) cdTime.textContent = "";
    if (lblEl) lblEl.style.opacity = "1";
    // Ulti-Ready bekommt Glow
    if (def && def.ultimate) btn.classList.add("ready-glow");
    else btn.classList.remove("ready-glow");
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
  // Mobile HUD spiegeln
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
  const mobHpBar = document.getElementById("mobHpBar");
  if (mobHpBar) mobHpBar.style.width = hpPct + "%";
  const mobHpText = document.getElementById("mobHpText");
  if (mobHpText) mobHpText.textContent = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
  const mobXpBar = document.getElementById("mobXpBar");
  if (mobXpBar) mobXpBar.style.width = ((player.xp / player.nextXp) * 100) + "%";
  const mobLvl = document.getElementById("mobLvl");
  if (mobLvl) mobLvl.textContent = `Lv ${player.level}`;
  const mobGold = document.getElementById("mobGold");
  if (mobGold) mobGold.textContent = player.gold;
  const mobAtk = document.getElementById("mobAtk");
  if (mobAtk) mobAtk.textContent = attackPower();
  const mobDef = document.getElementById("mobDef");
  if (mobDef) mobDef.textContent = totalDefense();
  // Touch-Skill-Cooldowns mit Kreis-Sektor + Sekunden-Text
  updateTouchCooldown("touchSkillQ", primaryAbilityId());
  updateTouchCooldown("touchSkillE", secondaryAbilityId());
  updateTouchCooldown("touchSkillR", ultimateAbilityId());
  // Death-Overlay anzeigen wenn tot
  const deathOv = document.getElementById("deathOverlay");
  if (deathOv) {
    if (player.hp <= 0 && !isPvpActive()) deathOv.classList.remove("hidden");
    else deathOv.classList.add("hidden");
  }
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
  updateEquipSlot(ui.equipBootsSlot, equippedBootsItem(), "boots");
  updateEquipSlot(ui.equipHatSlot, equippedHatItem(), "hat");
  renderPetSlot();
  renderCharPreview();
}

// Charakter-Vorschau im Charakter-Menü: Spieler-Modell + ausgeruestete Waffe
function renderCharPreview() {
  const cv = document.getElementById("charPreview");
  if (!cv) return;
  const p = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  p.clearRect(0, 0, W, H);
  const classDef = getClassDef(player.classId);
  const cx = W / 2, cy = H * 0.58;
  const s = 1.7; // Skalierung
  // Schatten
  p.fillStyle = "rgba(0,0,0,0.3)";
  p.beginPath(); p.ellipse(cx, cy + 34 * s, 24 * s, 6 * s, 0, 0, Math.PI * 2); p.fill();
  const legColor = classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : classDef.id === "charmer" ? "#1a1830" : "#21513d";
  // Beine
  p.fillStyle = legColor;
  p.fillRect(cx - 16 * s, cy + 8 * s, 12 * s, 24 * s);
  p.fillRect(cx + 4 * s, cy + 8 * s, 12 * s, 24 * s);
  // Ausgeruestete Schuhe (ueber den Fuessen)
  const bootsDef = equippedBootsItem();
  if (bootsDef) {
    p.fillStyle = itemDefs[bootsDef.id].color || "#a98056";
    p.fillRect(cx - 17 * s, cy + 26 * s, 14 * s, 8 * s);
    p.fillRect(cx + 3 * s, cy + 26 * s, 14 * s, 8 * s);
  }
  // Körper — Farbe + Form spiegeln die ausgeruestete Rüstung wider
  const armorDef = equippedArmorItem();
  const aDef = armorDef ? itemDefs[armorDef.id] : null;
  const bodyColor = aDef?.color || classDef.color;
  p.fillStyle = bodyColor;
  p.fillRect(cx - 18 * s, cy - 22 * s, 36 * s, 34 * s);
  // Rüstungs-Typ-Details
  if (aDef) {
    const aType = aDef.armorType;
    if (aType === "schwer") {
      // Platten-Trim + Brustplatte
      p.fillStyle = "rgba(255,255,255,0.25)";
      p.fillRect(cx - 18 * s, cy - 22 * s, 36 * s, 4 * s);
      p.fillRect(cx - 4 * s, cy - 18 * s, 8 * s, 28 * s);
      p.strokeStyle = "rgba(0,0,0,0.3)"; p.lineWidth = 2;
      p.strokeRect(cx - 18 * s, cy - 22 * s, 36 * s, 34 * s);
    } else if (aType === "leicht") {
      // Robe/Stoff mit V-Kragen
      p.fillStyle = "rgba(255,255,255,0.18)";
      p.beginPath(); p.moveTo(cx - 10 * s, cy - 22 * s); p.lineTo(cx, cy - 8 * s); p.lineTo(cx + 10 * s, cy - 22 * s); p.closePath(); p.fill();
    } else {
      // Leder — Riemen
      p.strokeStyle = "rgba(0,0,0,0.28)"; p.lineWidth = 2;
      p.beginPath(); p.moveTo(cx - 14 * s, cy - 18 * s); p.lineTo(cx + 14 * s, cy + 6 * s); p.stroke();
    }
    // Upgrade-Glanz bei +Stufen
    if ((armorDef.upgrade || 0) > 0) {
      p.fillStyle = "#fde047"; p.font = `bold ${9 * (s / 1.7)}px sans-serif`; p.textAlign = "center";
      p.fillText(`+${armorDef.upgrade}`, cx, cy - 26 * s);
    }
  }
  // Schulterpolster bei schwerer Rüstung
  if (aDef?.armorType === "schwer") {
    p.fillStyle = bodyColor;
    p.fillRect(cx - 34 * s, cy - 22 * s, 14 * s, 8 * s);
    p.fillRect(cx + 20 * s, cy - 22 * s, 14 * s, 8 * s);
  }
  // Arme
  p.fillStyle = "#f3c7a1";
  p.fillRect(cx - 32 * s, cy - 18 * s, 12 * s, 32 * s);
  p.fillRect(cx + 20 * s, cy - 18 * s, 12 * s, 32 * s);
  // Kopf
  p.fillStyle = "#f3c7a1";
  p.fillRect(cx - 15 * s, cy - 54 * s, 30 * s, 30 * s);
  // Augen
  p.fillStyle = "#14181f";
  p.fillRect(cx - 7 * s, cy - 43 * s, 4 * s, 4 * s);
  p.fillRect(cx + 3 * s, cy - 43 * s, 4 * s, 4 * s);
  // Klassen-Accessoire
  const acc = classDef.bodyAccent, ac = classDef.accent || "#c9ced8";
  p.fillStyle = ac;
  if (acc === "horned-helm") { p.fillRect(cx - 17 * s, cy - 60 * s, 34 * s, 10 * s); p.fillRect(cx - 20 * s, cy - 66 * s, 6 * s, 8 * s); p.fillRect(cx + 14 * s, cy - 66 * s, 6 * s, 8 * s); }
  else if (acc === "hood") { p.fillRect(cx - 17 * s, cy - 58 * s, 34 * s, 14 * s); }
  else if (acc === "wizard-hat") { p.fillRect(cx - 18 * s, cy - 60 * s, 36 * s, 8 * s); p.fillRect(cx - 12 * s, cy - 72 * s, 24 * s, 14 * s); p.fillRect(cx - 6 * s, cy - 82 * s, 12 * s, 12 * s); }
  else if (acc === "diadem") { p.fillRect(cx - 14 * s, cy - 58 * s, 28 * s, 4 * s); p.fillStyle = "#ec4899"; p.fillRect(cx - 2 * s, cy - 60 * s, 4 * s, 3 * s); p.fillStyle = "#1a1830"; p.fillRect(cx - 22 * s, cy - 46 * s, 6 * s, 14 * s); p.fillRect(cx + 16 * s, cy - 46 * s, 6 * s, 14 * s); }
  // Ausgeruesteter Hut (ueber dem Kopf)
  const hatDef = equippedHatItem();
  if (hatDef) {
    const hc = itemDefs[hatDef.id].color || "#c9ced8";
    p.fillStyle = hc;
    p.fillRect(cx - 18 * s, cy - 58 * s, 36 * s, 6 * s); // Krempe
    p.beginPath();
    p.moveTo(cx - 13 * s, cy - 58 * s);
    p.lineTo(cx, cy - 72 * s);
    p.lineTo(cx + 13 * s, cy - 58 * s);
    p.closePath(); p.fill();
    p.fillStyle = "#fff"; p.globalAlpha = 0.7;
    p.beginPath(); p.arc(cx, cy - 70 * s, 2.5 * s, 0, Math.PI * 2); p.fill();
    p.globalAlpha = 1;
  }
  // Ausgeruestete Waffe (rechts neben dem Charakter)
  const w = currentWeapon();
  const wx = cx + 30 * s, wy = cy - 6 * s;
  p.save();
  p.translate(wx, wy);
  const style = w.style || classDef.weaponStyle;
  if (style === "staff") {
    p.fillStyle = w.color || "#9ee7ff"; p.fillRect(-3, -34, 6, 60);
    p.fillStyle = w.glow || "rgba(85,215,255,0.5)"; p.beginPath(); p.arc(0, -38, 10, 0, Math.PI * 2); p.fill();
  } else if (style === "dagger") {
    p.fillStyle = w.color || "#a8b3c7"; p.fillRect(-4, -8, 8, 30); p.fillStyle = "#101419"; p.fillRect(-5, 18, 10, 8);
  } else if (style === "pole") {
    p.fillStyle = "#d9dee5"; p.fillRect(-3, -36, 6, 64); p.fillStyle = w.color || "#ec4899"; p.fillRect(-6, -42, 12, 8);
  } else {
    p.fillStyle = w.color || "#d9dee5"; p.fillRect(-4, -30, 8, 44); p.fillStyle = "#5a3a26"; p.fillRect(-6, 12, 12, 8);
  }
  p.restore();
  // Name + Klasse unten
  p.fillStyle = classDef.accent || "#f4f0df";
  p.font = "bold 12px sans-serif"; p.textAlign = "center";
  p.fillText(classDef.name, cx, H - 6);
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
    const svg = svgIconFor(invItem, def?.color);
    if (svg) iconEl.innerHTML = svg; else iconEl.textContent = def?.icon || "?";
    iconEl.style.color = def?.color || "#f4f0df";
  }
  if (nameEl) {
    let stat;
    if (kind === "weapon") stat = `+${(def.attack || 0) + (invItem.upgrade || 0) * 3} ATK`;
    else if (kind === "boots") stat = `+${Math.round((def.speed || 0) * 100)}% Tempo`;
    else if (kind === "hat") {
      const parts = [];
      if (def.bonusAttack) parts.push(`+${def.bonusAttack} ATK`);
      if (def.bonusCrit) parts.push(`+${Math.round(def.bonusCrit * 100)}% Krit`);
      stat = parts.join(", ");
    } else stat = `+${(def.defense || 0) + (invItem.upgrade || 0) * 4} DEF`;
    nameEl.textContent = `${def.name}${invItem.upgrade ? ` +${invItem.upgrade}` : ""} (${stat})`;
  }
}

// Aggregiert alle Runen-Boni der aktuell ausgeruesteten Waffe + aktives Runen-Wort.
function equippedRuneStats() {
  const out = { flatAttack: 0, crit: 0, lifesteal: 0, cdr: 0, skillDamage: 0, allStats: 0, word: null };
  const w = equippedWeaponItem();
  if (!w || !Array.isArray(w.sockets)) return out;
  for (const rid of w.sockets) {
    const r = parseRune(rid);
    if (!r) continue;
    const v = runeValue(r.type, r.tier);
    const stat = r.def.stat;
    if (stat === "allStats") out.allStats += v;
    else out[stat] = (out[stat] || 0) + v;
  }
  // allStats verteilt sich auf alle relevanten Werte
  if (out.allStats > 0) {
    out.crit += out.allStats;
    out.lifesteal += out.allStats;
    out.cdr += out.allStats;
    out.skillDamage += out.allStats;
    out.flatAttack += Math.round(out.allStats * 100); // 0.015 → ~1.5 flat
  }
  out.word = activeRuneWord(w.sockets);
  return out;
}

function equippedSignature() {
  const w = currentWeapon();
  return w ? w.signature || null : null;
}

function totalCritChance() {
  let crit = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.crit) crit += entry.affixes.crit;
  }
  if (player.classId === "shadow") crit += 0.08;
  crit += talentEffect("critBonus");
  crit += equippedRuneStats().crit;
  crit += hatBonusCrit();
  return Math.min(0.75, crit);
}

function totalLifesteal() {
  let ls = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.lifesteal) ls += entry.affixes.lifesteal;
  }
  ls += talentEffect("lifestealBonus");
  const rs = equippedRuneStats();
  ls += rs.lifesteal;
  if (rs.word?.effect.bonusLifesteal) ls += rs.word.effect.bonusLifesteal;
  return Math.min(0.5, ls);
}

function totalCdr() {
  let cdr = 0;
  for (const entry of player.inventory || []) {
    if (entry.affixes?.cdr) cdr += entry.affixes.cdr;
  }
  if (player.classId === "runemage") cdr += 0.08;
  cdr += talentEffect("cdrBonus");
  const rs = equippedRuneStats();
  cdr += rs.cdr;
  if (rs.word?.effect.cdr) cdr += rs.word.effect.cdr;
  return Math.min(0.6, cdr);
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
    // Verschmelzen: nur verschmelzbare UND fuer die eigene Klasse nutzbare Items zeigen
    if (mergeMode) {
      if (!entry) return false;
      const def = itemDefs[entry.id];
      if (!def || !mergeMap[entry.id]) return false;
      return usableByPlayerClass(def);
    }
    if (!entry) return inventoryFilter === "all";
    if (inventoryFilter === "all") return true;
    const def = itemDefs[entry.id];
    if (!def) return false;
    if (inventoryFilter === "gear") return def.type === "boots" || def.type === "hat";
    return def.type === inventoryFilter;
  };
  // Reihenfolge: bei Runen-Filter nach Wert sortiert (wertvoll → unwertvoll)
  let order = Array.from({ length: slots }, (_, i) => i);
  if (inventoryFilter === "rune") {
    order = player.inventory
      .map((entry, i) => ({ i, entry }))
      .filter(({ entry }) => entry && itemDefs[entry.id]?.type === "rune")
      .sort((a, b) => {
        const ra = parseRune(a.entry.id), rb = parseRune(b.entry.id);
        const va = ra ? runeValue(ra.type, ra.tier) : 0;
        const vb = rb ? runeValue(rb.type, rb.tier) : 0;
        return vb - va;
      })
      .map(({ i }) => i);
  }
  for (const i of order) {
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
    if (def.type === "boots" && player.bootsIndex === i) slot.classList.add("equipped");
    if (def.type === "hat" && player.hatIndex === i) slot.classList.add("equipped");
    // Merge-Modus: nicht-verschmelzbare ODER andere ID disablen
    if (mergeMode) {
      const mergeable = !!mergeMap[invItem.id];
      if (!mergeable) slot.classList.add("merge-disabled");
      else if (mergeLockId && invItem.id !== mergeLockId) slot.classList.add("merge-disabled");
      else slot.classList.add("merge-ok");
    }
    const attackVal = def.attack ? def.attack + (invItem.upgrade || 0) * 3 : 0;
    const defenseVal = def.defense ? def.defense + (invItem.upgrade || 0) * 4 : 0;
    let statLine;
    if (def.type === "rune") {
      const r = parseRune(invItem.id);
      const v = r ? runeValue(r.type, r.tier) : 0;
      const valStr = r && r.def.suffix === "%" ? `+${Math.round(v * 100)}%` : `+${Math.round(v)}`;
      statLine = r ? `${valStr} ${r.def.desc.replace("+", "")}` : "Rune";
    } else {
      statLine = attackVal
        ? `+${attackVal} Angriff`
        : defenseVal
          ? `+${defenseVal} Verteidigung`
          : def.heal
            ? `+${def.heal} HP`
            : "Material";
    }
    const action = def.type === "weapon" || def.type === "armor"
      ? "Klick: ausruesten"
      : def.type === "potion"
        ? "Klick: nutzen"
        : def.type === "rune"
          ? "Klick: in Waffe sockeln"
          : "";
    slot.title = `${itemLabel(invItem)} — ${statLine}${action ? " — " + action : ""}`;
    slot.setAttribute("aria-label", slot.title);
    slot.dataset.tooltipName = itemLabel(invItem);
    slot.dataset.tooltipRarity = rarityLabels[def.rarity] || def.rarity;
    slot.dataset.tooltipStat = statLine;
    slot.dataset.tooltipAction = action;
    const affixStr = invItem.affixes ? Object.entries(invItem.affixes).map(([k, v]) => `+${Math.round(v * 100)}% ${affixCatalog[k]?.label || k}`).join(" • ") : "";
    slot.dataset.tooltipAffixes = affixStr;
    // Waffen: Sockel-Status + Runen + aktives Runen-Wort + Signatur + Klassen-Match
    if (def.type === "weapon") {
      const maxS = weaponSocketCount(invItem);
      const socks = invItem.sockets || [];
      let sockText = "";
      if (maxS > 0) {
        const filled = socks.map((rid) => runeLabel(rid)).join(", ");
        sockText = `Sockel ${socks.length}/${maxS}${filled ? ": " + filled : " (leer)"}`;
      }
      const word = activeRuneWord(socks);
      const wordText = word ? `★ ${word.name}: ${word.desc}` : "";
      const sig = def.signature && signatureDefs[def.signature] ? `⭐ ${signatureDefs[def.signature].desc}` : "";
      const match = weaponClassMatch(def, player.classId) === 1 ? "✓ passt zu deiner Klasse" : "⚠ Fremd-Waffe (75% Schaden)";
      slot.dataset.tooltipSockets = [sockText, wordText, sig, match].filter(Boolean).join(" | ");
    } else if (def.type === "armor" && def.armorType) {
      const mod = armorTypeMods[def.armorType];
      const aMatch = armorClassMatch(def, player.classId) >= 1 ? "✓ ideal für deine Klasse" : "⚠ nicht ideal (-10% Verteidigung)";
      slot.dataset.tooltipSockets = `${mod?.label || def.armorType} — ${mod?.desc || ""} | ${aMatch}`;
    } else if (def.type === "boots") {
      slot.dataset.tooltipSockets = `Schuhe — +${Math.round((def.speed || 0) * 100)}% Lauftempo`;
    } else if (def.type === "hat") {
      const parts = [];
      if (def.bonusAttack) parts.push(`+${def.bonusAttack} Angriff`);
      if (def.bonusCrit) parts.push(`+${Math.round(def.bonusCrit * 100)}% Krit`);
      slot.dataset.tooltipSockets = `Hut — ${parts.join(", ")}`;
    } else {
      slot.dataset.tooltipSockets = "";
    }
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
    // Klassen-Eignungs-Badge: ✓ wenn Waffe/Ruestung zur eigenen Klasse passt
    let classBadge = "";
    if (def.type === "weapon") {
      const fit = weaponClassMatch(def, player.classId) === 1;
      classBadge = `<span class="class-fit ${fit ? "yes" : "no"}" title="${fit ? "passt zu deiner Klasse" : "Fremd-Waffe (75% Schaden)"}">${fit ? "✓" : "✕"}</span>`;
      if (fit) slot.classList.add("class-match");
    } else if (def.type === "armor" && def.armorType) {
      const fit = armorClassMatch(def, player.classId) >= 1;
      classBadge = `<span class="class-fit ${fit ? "yes" : "no"}" title="${fit ? "ideal fuer deine Klasse" : "nicht ideal"}">${fit ? "✓" : "✕"}</span>`;
      if (fit) slot.classList.add("class-match");
    }
    const iconHtml = svgIconFor(invItem, iconColor) || `<span class="icon" style="color:${iconColor}">${def.icon}</span>`;
    slot.innerHTML = `${badge}${affix}${classBadge}${powerBadge}${iconHtml}${upgrade}<span class="count">${invItem.count}</span>`;
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
  drawRaid(cam);
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
  drawGroundEffects(ctx);
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
  drawBossDefeatCinematic();
  drawSplashScreen();

  if (player.hp <= 0) drawDeathScreen();
}

function drawGround(cam) {
  const wDef = currentWorld();
  // Radialer Gradient als Boden — heller in der Mitte, dunkler aussen (Atmosphaere)
  const baseColor = wDef.ground || "#2f4630";
  ctx.fillStyle = baseColor;
  ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  // Subtiles Gras/Stein-Pattern: kleine Pixel-Wolken zufaellig verteilt (deterministisch)
  ctx.fillStyle = wDef.groundDetail || "rgba(255, 255, 255, 0.04)";
  const tile = 160;
  const sx = Math.floor(cam.x / tile) * tile;
  const sy = Math.floor(cam.y / tile) * tile;
  for (let x = sx; x < cam.x + cam.w + tile; x += tile) {
    for (let y = sy; y < cam.y + cam.h + tile; y += tile) {
      // Pseudo-Zufall basierend auf Position fuer stabiles Muster
      const seed = (x * 73856093) ^ (y * 19349663);
      for (let i = 0; i < 4; i += 1) {
        const px = x + ((seed >> (i * 4)) & 0x7F) + 8;
        const py = y + ((seed >> (i * 4 + 8)) & 0x7F) + 8;
        ctx.fillRect(px, py, 3, 3);
      }
    }
  }
  // Hellere Grid-Linien
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
  // Welt-spezifische Boden-Dekoration (Buesche / Steine je nach Welt)
  ctx.fillStyle = "rgba(20, 28, 20, 0.55)";
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 277) % world.w;
    const y = (i * 173) % world.h;
    ctx.fillRect(x, y, 28, 28);
    ctx.fillRect(x + 8, y - 18, 12, 18);
  }
  // Vignette: dunkler Ring am Bildschirmrand fuer Atmosphaere
  const vignette = ctx.createRadialGradient(
    cam.x + cam.w / 2, cam.y + cam.h / 2, cam.w * 0.35,
    cam.x + cam.w / 2, cam.y + cam.h / 2, cam.w * 0.75
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  // Ambient-Partikel: 2-3 sanfte Pollen/Glueh-Punkte im sichtbaren Bereich
  drawAmbientParticles(cam, wDef);
}

let ambientParticles = [];
function drawAmbientParticles(cam, wDef) {
  // Initialisiere bis zu 12 ambient-Partikel die in der Welt rumtreiben
  while (ambientParticles.length < 14) {
    ambientParticles.push({
      x: cam.x + Math.random() * cam.w,
      y: cam.y + Math.random() * cam.h,
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 2,
    });
  }
  // Welt-spezifische Farbe (Pollen-Gold in Wiesen, Schnee-Weiss in Frost, Glueh-Orange in Glut)
  const color = wDef.ambientColor || (currentWorldId === "frostwastes" ? "#e0f2fe" : currentWorldId === "emberforge" ? "#fb923c" : currentWorldId === "shadowfen" ? "#84a665" : currentWorldId === "skyspire" ? "#ddd6fe" : currentWorldId === "tideklippen" ? "#22d3ee" : "#fde047");
  const dt = 0.016;
  for (let i = ambientParticles.length - 1; i >= 0; i -= 1) {
    const p = ambientParticles[i];
    p.x += p.vx * dt + Math.sin(p.phase + performance.now() / 1200) * 0.3;
    p.y += p.vy * dt;
    p.phase += dt * 1.4;
    // Out of view? respawn
    if (p.y < cam.y - 20 || p.x < cam.x - 20 || p.x > cam.x + cam.w + 20) {
      ambientParticles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(p.phase) * 0.25;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

function drawBlockPerson(x, y, colors, scale = 1, facing = 0, hurt = false, accent = null, accentColor = null, walkPhase = 0, breath = 0, gear = null) {
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
  } else if (accent === "diadem") {
    // === Weiblicher Look: lange Haare, Kleid, rote Lippen, Diadem ===
    const hairColor = hurt ? "#ffffff" : "#1a1830";
    const dressColor = hurt ? "#ffffff" : "#ec4899";
    const dressTrim = hurt ? "#ffffff" : "#f5d042";
    const lipColor = hurt ? "#ffffff" : "#dc2626";

    // Lange wallende Haare hinten (deckt Ruecken + reicht bis Hueftbereich)
    ctx.fillStyle = hairColor;
    // Haar-Schicht hinter dem Kopf (breiter als Kopf)
    ctx.fillRect(-19 * scale, -56 * scale, 38 * scale, 6 * scale);
    // Haare seitlich am Kopf herunter
    ctx.fillRect(-19 * scale, -50 * scale, 5 * scale, 28 * scale);
    ctx.fillRect(14 * scale, -50 * scale, 5 * scale, 28 * scale);
    // Lange Haare ueber Schultern bis zu Hueftbereich
    ctx.fillRect(-22 * scale, -22 * scale, 5 * scale, 28 * scale);
    ctx.fillRect(17 * scale, -22 * scale, 5 * scale, 28 * scale);
    // Haar-Spitze (V-Form unten)
    ctx.fillRect(-20 * scale, 6 * scale, 4 * scale, 6 * scale);
    ctx.fillRect(16 * scale, 6 * scale, 4 * scale, 6 * scale);

    // Kleid: Trapezform die Beine umhuellt, breit unten
    ctx.fillStyle = dressColor;
    // Oberteil (Korsage) ueber dem Koerper
    ctx.fillRect(-16 * scale, -10 * scale, 32 * scale, 22 * scale);
    // Rock (Trapez): mehrere Reihen die nach unten breiter werden
    ctx.fillRect(-18 * scale, 12 * scale, 36 * scale, 6 * scale);
    ctx.fillRect(-22 * scale, 18 * scale, 44 * scale, 6 * scale);
    ctx.fillRect(-26 * scale, 24 * scale, 52 * scale, 8 * scale);
    // Goldener Saum unten
    ctx.fillStyle = dressTrim;
    ctx.fillRect(-26 * scale, 30 * scale, 52 * scale, 2 * scale);
    // Goldener Guertel ueber dem Rock
    ctx.fillRect(-16 * scale, 10 * scale, 32 * scale, 2 * scale);
    // Goldener Korsage-Akzent vorne
    ctx.fillRect(-2 * scale, -8 * scale, 4 * scale, 18 * scale);

    // Rote Lippen
    ctx.fillStyle = lipColor;
    ctx.fillRect(-3 * scale, -34 * scale, 6 * scale, 2 * scale);
    ctx.fillRect(-2 * scale, -32 * scale, 4 * scale, 1.5 * scale);

    // Roetlicher Wangen-Hauch
    ctx.fillStyle = hurt ? "#ffffff" : "rgba(236, 72, 153, 0.55)";
    ctx.fillRect(-12 * scale, -38 * scale, 4 * scale, 3 * scale);
    ctx.fillRect(8 * scale, -38 * scale, 4 * scale, 3 * scale);

    // Goldenes Diadem oben mit pinkem Edelstein
    const gold = hurt ? "#ffffff" : (accentColor || "#f5d042");
    ctx.fillStyle = gold;
    ctx.fillRect(-14 * scale, -58 * scale, 28 * scale, 4 * scale);
    ctx.fillRect(-2 * scale, -62 * scale, 4 * scale, 6 * scale);
    ctx.fillStyle = hurt ? "#ffffff" : "#ec4899";
    ctx.fillRect(-2 * scale, -60 * scale, 4 * scale, 3 * scale);

    // Pony / Haar-Strang vorne (kleiner Strang ueber der Stirn)
    ctx.fillStyle = hairColor;
    ctx.fillRect(-12 * scale, -54 * scale, 5 * scale, 4 * scale);
    ctx.fillRect(7 * scale, -54 * scale, 5 * scale, 4 * scale);
  }
  // Ausgeruestete Schuhe: Farbe ueber die Fuesse
  if (gear?.boots) {
    ctx.fillStyle = hurt ? "#ffffff" : gear.boots;
    ctx.fillRect(-17 * scale, (28 + legA) * scale, 13 * scale, 6 * scale);
    ctx.fillRect(4 * scale, (28 + legB) * scale, 13 * scale, 6 * scale);
  }
  // Ausgeruesteter Hut: Krempe + Spitze ueber dem Kopf
  if (gear?.hat) {
    const hc = hurt ? "#ffffff" : gear.hat;
    ctx.fillStyle = hc;
    ctx.fillRect(-18 * scale, -58 * scale, 36 * scale, 5 * scale);
    ctx.beginPath();
    ctx.moveTo(-12 * scale, -58 * scale);
    ctx.lineTo(0, -72 * scale);
    ctx.lineTo(12 * scale, -58 * scale);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = hurt ? "#ffffff" : "rgba(255,255,255,0.7)";
    ctx.fillRect(-2 * scale, -70 * scale, 4 * scale, 4 * scale);
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

// Legendaere Spezial-Pets — gross, stark, mit aktiv ausloesbaren Faehigkeiten (Taste T).
// drawStyle steuert das aufwendige Rendering, active das Spezial.
const specialPets = {
  gunter_phoenix: {
    id: "gunter_phoenix", name: "Glut-Phönix", legendary: true, drawStyle: "phoenix",
    scale: 0.62, hp: 160, damage: 0.42, attackRange: 320, attackCooldown: 0.85, speed: 340,
    color: "#fb923c", glow: "rgba(251,146,60,0.7)",
    active: { name: "Phönix-Segen", effect: "phoenix", cooldown: 26, healPct: 0.45, novaRadius: 220, novaDmg: 1.4, desc: "Heilt 45% HP + Feuer-Nova" },
  },
  gunter_drake: {
    id: "gunter_drake", name: "Schatten-Drake", legendary: true, drawStyle: "drake",
    scale: 0.7, hp: 200, damage: 0.46, attackRange: 300, attackCooldown: 1.0, speed: 320,
    color: "#a855f7", glow: "rgba(168,85,247,0.7)",
    active: { name: "Drachenhaut", effect: "invuln", cooldown: 30, duration: 4, desc: "4s Unverwundbarkeit" },
  },
  titan_golem: {
    id: "titan_golem", name: "Titan-Golem", legendary: true, drawStyle: "golem",
    scale: 0.8, hp: 320, damage: 0.34, attackRange: 230, attackCooldown: 1.4, speed: 250,
    color: "#94a3b8", glow: "rgba(148,163,184,0.6)",
    active: { name: "Bollwerk", effect: "bulwark", cooldown: 28, duration: 5, knockback: 260, slow: 3, desc: "5s Fels-Wall: unverwundbar, wurzelt dich, schleudert Gegner weg" },
  },
  storm_lynx: {
    id: "storm_lynx", name: "Sturm-Luchs", legendary: true, drawStyle: "lynx",
    scale: 0.6, hp: 150, damage: 0.40, attackRange: 300, attackCooldown: 0.8, speed: 420,
    color: "#38bdf8", glow: "rgba(56,189,248,0.7)",
    active: { name: "Sturmlauf", effect: "surge", cooldown: 22, duration: 6, desc: "6s +65% Tempo + schnellere Angriffe" },
  },
};

const LEGENDARY_PET_IDS = Object.keys(specialPets);

function getActivePetDef() {
  if (!player.activePet) return null;
  return bosses[player.activePet]?.pet || specialPets[player.activePet] || null;
}

// Anzeigename eines Pets per ID (Boss-Pet oder legendäres Spezial-Pet)
function petDisplayName(id) {
  return bosses[id]?.pet?.name || specialPets[id]?.name || "Pet";
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
  const sel = document.querySelector("#petSelect");
  if (!nameEl || !btn) return;
  const unlocked = Object.keys(player.pets || {});
  if (sel) {
    if (unlocked.length === 0) {
      sel.classList.add("hidden");
    } else {
      sel.classList.remove("hidden");
      sel.innerHTML = `<option value="">— kein Pet —</option>` +
        unlocked.map((id) => `<option value="${id}"${id === player.activePet ? " selected" : ""}>${petDisplayName(id)}</option>`).join("");
    }
  }
  if (unlocked.length === 0) {
    nameEl.textContent = "Kein Pet freigeschaltet";
    btn.disabled = true;
    btn.textContent = "—";
    return;
  }
  btn.disabled = false;
  const actBtn = document.querySelector("#petActiveBtn");
  if (player.activePet) {
    const def = getActivePetDef();
    nameEl.textContent = def?.name || "Pet";
    btn.textContent = "Abrufen";
    if (actBtn) {
      if (def?.active) {
        actBtn.classList.remove("hidden");
        const cd = Math.ceil(player.petActiveCd || 0);
        actBtn.textContent = cd > 0 ? `${def.active.name} (${cd}s)` : `${def.active.name} (Z)`;
        actBtn.title = def.active.desc || "";
        actBtn.disabled = cd > 0;
      } else {
        actBtn.classList.add("hidden");
      }
    }
  } else {
    nameEl.textContent = `${unlocked.length} freigeschaltet`;
    btn.textContent = "Rufen";
    if (actBtn) actBtn.classList.add("hidden");
  }
}

// Pet per ID aktivieren ("" oder null = absetzen)
function setActivePet(id) {
  if (!id) {
    player.activePet = null;
    petRuntime = null;
    showToast("Pet abgesetzt.");
  } else if (player.pets?.[id]) {
    player.activePet = id;
    initPetRuntime();
    showToast(`${petDisplayName(id)} folgt dir.`);
  }
  renderPetSlot();
  saveCurrentCharacter();
}

function togglePet() {
  if (!player.pets || Object.keys(player.pets).length === 0) {
    showToast("Du hast noch kein Pet. Besiege Welt-Bosse zum Freischalten.");
    return;
  }
  if (player.activePet) {
    setActivePet(null);
  } else {
    // Im Dropdown gewaehltes Pet rufen, sonst das erste freigeschaltete
    const sel = document.querySelector("#petSelect");
    const pick = (sel && sel.value) ? sel.value : Object.keys(player.pets)[0];
    setActivePet(pick);
  }
}

// Aktive Pet-Faehigkeit ausloesen (Taste T / Pet-Button). Nur legendaere Pets haben eine.
function triggerPetActive() {
  const def = getActivePetDef();
  if (!def || !petRuntime) { showToast("Kein Pet aktiv."); return; }
  const act = def.active;
  if (!act) { showToast(`${def.name} hat keine aktive Faehigkeit.`); return; }
  if ((player.petActiveCd || 0) > 0) { showToast(`${act.name} bereit in ${Math.ceil(player.petActiveCd)}s`); return; }
  player.petActiveCd = act.cooldown;
  if (act.effect === "phoenix") {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * act.healPct));
    const dmg = Math.round(attackPower() * act.novaDmg);
    for (const mob of [...mobs]) {
      if (Math.hypot(mob.x - player.x, mob.y - player.y) < act.novaRadius) damageMob(mob, dmg, { tag: "crit" });
    }
    anim.spawnRoar?.(player.x, player.y, "#fb923c");
    for (let i = 0; i < 40; i += 1) {
      const a = (i / 40) * Math.PI * 2;
      particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, life: 0.6, color: i % 2 ? "#fb923c" : "#fde047", size: 5 + Math.random() * 4 });
    }
    cameraShake = 0.4; skillFlashes.push({ color: "#fb923c", life: 0.5, maxLife: 0.5 });
    sfx.ulti?.();
  } else if (act.effect === "invuln") {
    player.invuln = Math.max(player.invuln, act.duration);
    player.petShield = act.duration;
    anim.spawnRoar?.(player.x, player.y, def.color);
    sfx.ulti?.();
  } else if (act.effect === "bulwark") {
    player.invuln = Math.max(player.invuln, act.duration);
    player.petShield = act.duration;
    player.petRoot = act.duration;
    for (const mob of [...mobs]) {
      const dd = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (dd < 360) {
        const a = Math.atan2(mob.y - player.y, mob.x - player.x);
        mob.x += Math.cos(a) * act.knockback;
        mob.y += Math.sin(a) * act.knockback;
        mob.slowTimer = Math.max(mob.slowTimer || 0, act.slow);
      }
    }
    anim.spawnRoar?.(player.x, player.y, "#cbd5e1");
    cameraShake = 0.6; skillFlashes.push({ color: "#cbd5e1", life: 0.5, maxLife: 0.5 });
    sfx.ulti?.();
  } else if (act.effect === "surge") {
    player.petSurge = act.duration;
    sfx.levelUp?.();
  }
  showToast(`${def.name}: ${act.name}!`);
  renderPetSlot();
}

// === Pet-Evolution ===
const PET_MAX_LEVEL = 5;
function petLevel() {
  if (!player.activePet || !player.pets?.[player.activePet]) return 1;
  return player.pets[player.activePet].level || 1;
}
function petStageName(def, lvl) {
  const stages = ["", "", " (gestaerkt)", " (Elite)", " (Meister)", " ★ Titan"];
  return (def?.name || "Pet") + (stages[lvl] || "");
}
function gainPetXp(amount) {
  if (!player.activePet) return;
  const pet = player.pets?.[player.activePet];
  if (!pet) return;
  pet.level = pet.level || 1;
  if (pet.level >= PET_MAX_LEVEL) return;
  pet.xp = (pet.xp || 0) + amount;
  const need = pet.level * 120;
  if (pet.xp >= need) {
    pet.xp -= need;
    pet.level += 1;
    const def = getActivePetDef();
    showToast(`${def?.name || "Pet"} steigt auf Stufe ${pet.level}!`);
    anim.spawnHearts?.(particles, petRuntime?.x || player.x, petRuntime?.y || player.y, 8, "#fde047");
    if (pet.level === PET_MAX_LEVEL) showToast(`${def?.name} hat die Titan-Form erreicht — Spezial-Faehigkeit freigeschaltet!`);
    saveCurrentCharacter();
  }
}

function updatePet(dt) {
  const def = getActivePetDef();
  if (!def || !petRuntime) return;
  const lvl = petLevel();
  const dmgMult = 1 + (lvl - 1) * 0.30; // +30% Schaden pro Stufe
  // Stufe-5 Pet-Skill: alle 8s ein AoE-Burst um das Pet
  petRuntime.skillCd = Math.max(0, (petRuntime.skillCd || 0) - dt);
  if (lvl >= PET_MAX_LEVEL && petRuntime.skillCd <= 0) {
    let anyHit = false;
    for (const mob of [...mobs]) {
      if (Math.hypot(mob.x - petRuntime.x, mob.y - petRuntime.y) < 130) {
        damageMob(mob, Math.round(attackPower() * 0.8), { tag: "combo" });
        anyHit = true;
      }
    }
    if (anyHit) {
      anim.spawnRoar?.(petRuntime.x, petRuntime.y, def.color);
      petRuntime.skillCd = 8;
    } else {
      petRuntime.skillCd = 1;
    }
  }
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
      const dmg = Math.max(2, Math.round(attackPower() * def.damage * dmgMult));
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
  const lvl = petLevel();
  const baseScale = (def.legendary ? 1.7 : 1) + (lvl - 1) * 0.18; // legendaere Pets deutlich groesser
  const bob = Math.sin(petRuntime.bobPhase) * (def.legendary ? 6 : 4);
  const t = performance.now() / 1000;
  ctx.save();
  ctx.translate(petRuntime.x, petRuntime.y + bob);
  ctx.scale(baseScale, baseScale);
  // Pulsierende Aura
  const auraR = 16 + Math.sin(t * 3) * (def.legendary ? 5 : 2);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, auraR + 8);
  g.addColorStop(0, def.glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, auraR + 8, 0, Math.PI * 2); ctx.fill();

  if (def.drawStyle === "phoenix") drawPhoenixPet(t, def);
  else if (def.drawStyle === "drake") drawDrakePet(t, def);
  else if (def.drawStyle === "golem") drawGolemPet(t, def);
  else if (def.drawStyle === "lynx") drawLynxPet(t, def);
  else {
    ctx.fillStyle = def.color; ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = "#fff"; ctx.fillRect(-3, -3, 6, 6);
  }
  // Schild-Glanz waehrend Unverwundbarkeit/Bollwerk
  if ((player.petShield || 0) > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 20 + Math.sin(t * 10) * 2, 0, Math.PI * 2); ctx.stroke();
  }
  // Titan-Krone bei Max-Stufe
  if (lvl >= PET_MAX_LEVEL) {
    ctx.fillStyle = "#fde047";
    ctx.fillRect(-9, -22, 18, 3);
    ctx.fillRect(-7, -27, 3, 5); ctx.fillRect(-1, -28, 3, 6); ctx.fillRect(5, -27, 3, 5);
  }
  ctx.restore();
  // Name + Stufe
  ctx.save();
  ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
  ctx.fillStyle = def.legendary ? "#fde047" : "#e5e7eb";
  if (def.legendary || lvl > 1) ctx.fillText(`${def.name}${lvl > 1 ? ` Lv${lvl}` : ""}`, petRuntime.x, petRuntime.y - 26 * baseScale);
  ctx.restore();
}

// Glut-Phönix: Flügel aus Flammen, glühender Körper, Funken
function drawPhoenixPet(t, def) {
  const flap = Math.sin(t * 8) * 0.5;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.rotate(side * (0.5 + flap));
    ctx.fillStyle = "#fb923c";
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(side * 26, -14, side * 34, 2); ctx.quadraticCurveTo(side * 22, 6, 0, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fde047";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 18, -6, side * 26, 2); ctx.quadraticCurveTo(side * 16, 4, 0, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#fff7ed"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fb923c"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-4, -8); ctx.lineTo(4, -8); ctx.closePath(); ctx.fill(); // Federkamm
  ctx.fillStyle = "#1f2937"; ctx.fillRect(-3, -3, 2, 2); ctx.fillRect(2, -3, 2, 2); // Augen
  // Schweif-Funken
  if (Math.random() < 0.5) particles.push({ x: petRuntime.x, y: petRuntime.y + 10, vx: (Math.random() - 0.5) * 40, vy: 30 + Math.random() * 30, life: 0.5, color: Math.random() < 0.5 ? "#fb923c" : "#fde047", size: 3 });
}

// Schatten-Drake: Drachenkopf, Hörner, Fledermausflügel
function drawDrakePet(t, def) {
  const flap = Math.sin(t * 6) * 0.4;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.rotate(side * (0.6 + flap));
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * 30, -10); ctx.lineTo(side * 28, 4); ctx.lineTo(side * 16, 0); ctx.lineTo(side * 20, 10); ctx.lineTo(side * 8, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = def.color; ctx.beginPath(); ctx.ellipse(0, 2, 9, 8, 0, 0, Math.PI * 2); ctx.fill(); // Körper
  ctx.fillStyle = "#c4b5fd"; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(10, -10); ctx.lineTo(8, -2); ctx.closePath(); ctx.fill(); // Schnauze
  ctx.fillStyle = "#ede9fe"; // Hörner
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-6, -16); ctx.lineTo(-2, -9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(6, -16); ctx.lineTo(2, -9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f0abfc"; ctx.fillRect(6, -7, 3, 3); // glühendes Auge
}

// Titan-Golem: massiver Felskörper, leuchtende Kern-Risse
function drawGolemPet(t, def) {
  const pulse = 0.5 + Math.sin(t * 2) * 0.5;
  ctx.fillStyle = "#475569"; ctx.fillRect(-12, -10, 24, 22); // Körper
  ctx.fillStyle = "#334155"; ctx.fillRect(-16, -6, 6, 14); ctx.fillRect(10, -6, 6, 14); // Arme
  ctx.fillStyle = "#64748b"; ctx.fillRect(-10, -18, 20, 10); // Kopf
  // Leuchtende Risse (Energiekern)
  ctx.strokeStyle = `rgba(56,189,248,${0.5 + pulse * 0.5})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.moveTo(4, -6); ctx.lineTo(8, 4); ctx.stroke();
  ctx.fillStyle = `rgba(125,211,252,${0.6 + pulse * 0.4})`; ctx.fillRect(-7, -15, 4, 3); ctx.fillRect(3, -15, 4, 3); // Augen
}

// Sturm-Luchs: schlanke Raubkatze mit Blitz-Aura
function drawLynxPet(t, def) {
  const run = Math.sin(t * 12) * 3;
  ctx.fillStyle = def.color; ctx.beginPath(); ctx.ellipse(0, 2, 11, 7, 0, 0, Math.PI * 2); ctx.fill(); // Körper
  ctx.beginPath(); ctx.ellipse(9, -4, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); // Kopf
  ctx.fillStyle = "#0ea5e9"; // Ohren (Luchs-Pinsel)
  ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(5, -15); ctx.lineTo(9, -9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, -8); ctx.lineTo(13, -15); ctx.lineTo(10, -9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e0f2fe"; ctx.fillRect(10, -5, 2, 2); // Auge
  // Beine
  ctx.strokeStyle = def.color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(-6 + run, 14); ctx.moveTo(4, 8); ctx.lineTo(4 - run, 14); ctx.stroke();
  // Blitz-Funken
  if (Math.random() < 0.4) particles.push({ x: petRuntime.x + (Math.random() - 0.5) * 24, y: petRuntime.y + (Math.random() - 0.5) * 20, vx: 0, vy: 0, life: 0.2, color: "#7dd3fc", size: 2 });
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
      const buyIcon = svgIconFor({ id: entry.id }, def?.color) || `${def?.icon || "?"}`;
      row.innerHTML = `
        <span class="tr-icon" style="color:${def?.color || "#fff"}">${buyIcon}</span>
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
      if (i === player.weaponIndex || i === player.armorIndex || i === player.bootsIndex || i === player.hatIndex) continue; // ausgeruestetes nicht verkaufbar
      const price = sellPrices[inv.id];
      if (!price) continue;
      const def = itemDefs[inv.id];
      const row = document.createElement("div");
      row.className = "trader-row";
      const sellIcon = svgIconFor(inv, def?.color) || `${def?.icon || "?"}`;
      row.innerHTML = `
        <span class="tr-icon" style="color:${def?.color || "#fff"}">${sellIcon}</span>
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
    shiftEquipIndices(index);
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
      if (npc.id === "gambler") openGamble();
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
  const facing = isTouchDevice ? aimAngle() : Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
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
  // Spin-Animation (Wirbelschlag / Charm-Dance)
  if ((player.spinAnim || 0) > 0) {
    player.spinAnim = Math.max(0, player.spinAnim - 0.016);
    ctx.translate(player.x, player.y);
    const spinSpeed = player.spinAnim > 1 ? 6 : 12; // Tanz langsamer als Wirbel
    ctx.rotate(performance.now() / 1000 * spinSpeed);
    ctx.translate(-player.x, -player.y);
  }
  const bearActive = player.bearForm > 0;
  // Ausgeruestete Ausruestung nach aussen projizieren (wie in der Charakter-Vorschau)
  const armorItem = !bearActive ? equippedArmorItem() : null;
  const bootsItem = !bearActive ? equippedBootsItem() : null;
  const hatItem = !bearActive ? equippedHatItem() : null;
  const bodyColor = bearActive ? "#7c3a1d" : (armorItem ? itemDefs[armorItem.id].color : classDef.color);
  const headColor = bearActive ? "#92400e" : "#f3c7a1";
  const armColor = bearActive ? "#7c3a1d" : "#f3c7a1";
  const legColor = bearActive ? "#5b2a13" : (classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : "#21513d");
  const playerScale = bearActive ? 1.35 : 1.05;
  const gear = bearActive ? null : {
    boots: bootsItem ? itemDefs[bootsItem.id].color : null,
    hat: hatItem ? itemDefs[hatItem.id].color : null,
  };
  drawBlockPerson(player.x, player.y, {
    head: headColor,
    body: bodyColor,
    arms: armColor,
    legs: legColor,
  }, playerScale, facing, (player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0) || player.hitFlash > 0,
    classDef.bodyAccent, classDef.accent, player.walkPhase, breath, gear);
  if (!bearActive) drawEquippedWeapon(facing, classDef);
  ctx.restore();
  // Rüstungs-Glanz ab +7 — glitzert staerker, je hoeher die Aufwertung
  const armorUpg = armorItem?.upgrade || 0;
  if (armorUpg >= 7) {
    const t = performance.now() / 1000;
    const intensity = armorUpg - 6; // +7=1, +8=2, +9=3
    const col = itemDefs[armorItem.id].color || "#fff2a8";
    ctx.save();
    ctx.globalAlpha = 0.30 + 0.28 * (0.5 + 0.5 * Math.sin(t * 6));
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5 + intensity * 0.9;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 4, player.r + 9 + intensity * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Glitzer-Funken (mehr je hoeher)
    if (Math.random() < 0.10 * intensity) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 46,
        y: player.y - 18 + (Math.random() - 0.5) * 46,
        vx: (Math.random() - 0.5) * 18, vy: -18 - Math.random() * 28,
        life: 0.5, color: Math.random() < 0.5 ? col : "#ffffff", size: 2 + Math.random() * 2,
      });
    }
  }
  // Touch: Aim-Pfeil zeigt aktuelle Skill-Richtung
  if (isTouchDevice) drawAimIndicator();
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

// Aktion eines anderen Spielers visuell abspielen (an dessen Position)
function handleRemoteAction(remote, actStr) {
  const parts = (actStr || "").split("|");
  const kind = parts[0];
  const abilityId = parts[1];
  const angle = parseFloat(parts[2]) || 0;
  const rx = remote.x, ry = remote.y;
  if (kind === "swing") {
    remote._swing = { t: 0.4, max: 0.4, angle };
    // kleiner Funken-Bogen
    for (let i = 0; i < 6; i += 1) {
      const a = angle + (i - 3) * 0.12;
      particles.push({ x: rx + Math.cos(angle) * 40, y: ry + Math.sin(angle) * 40, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 0.25, color: "#d9dee5", size: 3 });
    }
  } else if (kind === "skill" && abilityId) {
    const ab = getAbilityDef(abilityId);
    const color = ab?.color || "#fde047";
    // Skill-Burst in Ability-Farbe + kleiner Ring
    for (let i = 0; i < 24; i += 1) {
      const a = Math.random() * Math.PI * 2;
      particles.push({ x: rx, y: ry, vx: Math.cos(a) * (120 + Math.random() * 120), vy: Math.sin(a) * (120 + Math.random() * 120), life: 0.5, color, size: 4 });
    }
    crescentWaves.push({ x: rx, y: ry, angle: 0, range: 90, radius: 90, life: 0.4, maxLife: 0.4, color, radial: true });
    // Ranged-Skills: kleines Projektil-Visual in Blickrichtung (rein kosmetisch)
    if (["fireOrb", "frostCircle", "meteor", "blowKiss"].includes(abilityId)) {
      for (let i = 0; i < 8; i += 1) {
        particles.push({ x: rx + Math.cos(angle) * (20 + i * 18), y: ry + Math.sin(angle) * (20 + i * 18), vx: Math.cos(angle) * 60, vy: Math.sin(angle) * 60, life: 0.4, color, size: 4 });
      }
    }
    floatText(rx, ry - 90, ab?.name || "Skill", color);
  }
}

function drawRemotePlayers() {
  const now = Date.now();
  for (const remote of Object.values(remotePlayers)) {
    if (!remote || now - (remote.updatedAt || 0) > 12000) continue;
    // Nur Remote-Spieler in derselben Welt rendern
    if (remote.worldId && remote.worldId !== currentWorldId) continue;
    const classDef = getClassDef(remote.classId);
    // Lauf-Animation + Blickrichtung lokal aus Positionsaenderung ableiten
    if (remote._lx === undefined) { remote._lx = remote.x; remote._ly = remote.y; remote._walk = 0; remote._face = 0; }
    const mdx = remote.x - remote._lx;
    const mdy = remote.y - remote._ly;
    const moved = Math.hypot(mdx, mdy);
    if (moved > 0.4) {
      remote._walk = (remote._walk || 0) + moved * 0.05;
      remote._face = Math.atan2(mdy, mdx); // schaut in Laufrichtung
    } else {
      remote._walk = (remote._walk || 0) * 0.9;
    }
    remote._lx = remote.x;
    remote._ly = remote.y;
    const breath = moved < 0.4 ? Math.sin(now / 700 + remote.x * 0.01) * 1.2 : 0;
    drawBlockPerson(remote.x, remote.y, {
      head: "#f3c7a1",
      body: classDef.color || remote.color || "#51d37a",
      arms: "#f3c7a1",
      legs: classDef.id === "warrior" ? "#5d2f28" : classDef.id === "shadow" ? "#26214f" : "#21513d",
    }, 1.02, remote._face, false, classDef.bodyAccent, classDef.accent, remote._walk, breath);
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
  // Swing-Animation abklingen lassen
  let swingRot = 0, swingOff = 0;
  if (remote._swing && remote._swing.t > 0) {
    remote._swing.t -= 0.016;
    const pct = 1 - remote._swing.t / remote._swing.max;
    if (pct < 0.45) { const p = pct / 0.45; swingRot = -0.6 + 1.4 * p; swingOff = -4 + 16 * p; }
    else { const p = (pct - 0.45) / 0.55; swingRot = 0.8 * (1 - p); swingOff = 12 * (1 - p); }
  }
  const baseAngle = remote._swing ? remote._swing.angle : (remote._face || 0);
  ctx.save();
  ctx.translate(remote.x, remote.y - 12);
  ctx.rotate(baseAngle + swingRot);
  ctx.translate(swingOff, 0);
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

  if (style === "pole") {
    // Lange Polstange mit Goldring oben
    ctx.fillStyle = weapon.glow || "rgba(236,72,153,0.40)";
    ctx.fillRect(10, -28, 60, 56);
    // Stange (silber)
    ctx.fillStyle = "#d9dee5";
    ctx.fillRect(6, -2, 64, 4);
    // Goldring oben
    ctx.fillStyle = weapon.color || "#ec4899";
    ctx.fillRect(64, -7, 8, 14);
    ctx.fillStyle = "#f5d042";
    ctx.fillRect(66, -5, 4, 10);
    // Schleife/Akzent unten
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(2, -3, 6, 6);
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
  // Schatten unter jedem Mob
  const sScale = mob.scale || (mob.elite ? 1.05 : 0.9);
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(mob.x, mob.y + (mob.r || 28) * 0.95, (mob.r || 28) * 0.95, 7 + sScale * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Elite/Boss-Glow um Mob
  if (mob.elite || isBoss) {
    const pulse = 0.5 + Math.sin(performance.now() / 320 + mob.x * 0.01) * 0.3;
    const glowColor = isBoss ? (mob.rank === "boss" ? "rgba(240, 171, 252, 0.32)" : "rgba(253, 186, 116, 0.30)") : "rgba(192, 132, 252, 0.26)";
    ctx.save();
    ctx.beginPath();
    ctx.arc(mob.x, mob.y, (mob.r || 28) + 12 + pulse * 6, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();
    ctx.restore();
  }
  // Boss mit eigener Definition?
  if (mob.bossDef) {
    drawBossMob(mob);
  } else if (mob.skin) {
    drawSkinnedMob(mob);
  } else {
    const animState = updateMobAnimState(mob);
    drawBlockPerson(mob.x, mob.y, {
      head: mob.rank === "boss" ? "#f0abfc" : mob.rank === "miniboss" ? "#fdba74" : mob.elite ? "#c084fc" : "#b34d54",
      body: mob.rank === "boss" ? "#701a75" : mob.rank === "miniboss" ? "#7c2d12" : mob.elite ? "#65358f" : "#5b2229",
      arms: mob.rank === "boss" ? "#c026d3" : mob.rank === "miniboss" ? "#ea580c" : mob.elite ? "#8b5cc0" : "#7f2f37",
      legs: "#242936",
    }, sScale, 0, mob.hitTimer > 0, null, null, animState.walkPhase, animState.breath);
    // Augen-Glow (rote leuchtende Punkte)
    ctx.save();
    const eyeColor = isBoss ? "#fff" : mob.elite ? "#fbbf24" : "#fca5a5";
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = isBoss ? "#fbbf24" : "#ef4444";
    ctx.shadowBlur = 6;
    ctx.fillRect(mob.x - 7 * sScale, mob.y - 35 * sScale + animState.breath, 3 * sScale, 3 * sScale);
    ctx.fillRect(mob.x + 4 * sScale, mob.y - 35 * sScale + animState.breath, 3 * sScale, 3 * sScale);
    ctx.restore();
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
  // Unter HUD-Toggle-Buttons platzieren
  const py = 70;
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
  // Host-Anzeige unten in Mini-Map
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = isHost ? "#51d37a" : "#9faebd";
  ctx.fillText(multiplayerReady ? (isHost ? `HOST: ${authUser}` : `Host: ${currentHostName || "—"}`) : "Solo", px + 4, py + h - 4);
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
    if (p.heart) {
      // Pixel-Herz (5x5)
      const s = p.size || 4;
      ctx.fillRect(p.x - s, p.y - s, s, s);
      ctx.fillRect(p.x, p.y - s, s, s);
      ctx.fillRect(p.x - s * 2, p.y, s, s);
      ctx.fillRect(p.x - s, p.y, s, s);
      ctx.fillRect(p.x, p.y, s, s);
      ctx.fillRect(p.x + s, p.y, s, s);
      ctx.fillRect(p.x - s, p.y + s, s, s);
      ctx.fillRect(p.x, p.y + s, s, s);
      ctx.fillRect(p.x, p.y + s * 2, s, s);
    } else {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
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
    const isImportant = text.big || (text.text && (text.text.includes("CRIT") || text.text.includes("KOMBO")));
    const baseSize = text.big ? 28 : isImportant ? 22 : 16;
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
  const worldChanged = currentWorldId !== "meadows";
  if (worldChanged) {
    currentWorldId = "meadows";
    applyWorldSize(); // Weltgroesse + Schmied-Position auf Wiesen zuruecksetzen
  }
  raid = null; // Raid-Tod beendet die Eisbrecher-Flucht
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
  clearGroundEffects();
  waveTimer = 3.5;
  minibossTimer = 18;
  bossTimer = 48;
  player.powerWindow = 0;
  player.dashCritWindow = 0;
  player.abilityCooldowns = {};
  player.frostSlowTimer = 0;
  seedWorld();
  renderInventory();
  // Multiplayer: bei Welt-Wechsel (z.B. aus Frost zurueck in Wiesen) neu subscriben,
  // damit man nicht weiter die Mobs der alten Welt sieht/ueberschreibt.
  if (multiplayerReady && worldChanged) resubscribeWorld();
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
