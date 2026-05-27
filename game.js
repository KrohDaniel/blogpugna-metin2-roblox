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
  skillAura: document.querySelector("#skillAura"),
  skillCrescent: document.querySelector("#skillCrescent"),
  blacksmithDistance: document.querySelector("#blacksmithDistance"),
  blacksmithText: document.querySelector("#blacksmithText"),
  upgradeWeapon: document.querySelector("#upgradeWeapon"),
  upgradeArmor: document.querySelector("#upgradeArmor"),
  authOverlay: document.querySelector("#authOverlay"),
  authForm: document.querySelector("#authForm"),
  authUsername: document.querySelector("#authUsername"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  registerButton: document.querySelector("#registerButton"),
  playerNameText: document.querySelector("#playerNameText"),
};

const world = { w: 2400, h: 1600 };
const blacksmith = { x: 1220, y: 820, r: 44 };
const keys = new Set();
const particles = [];
const floatingText = [];
const droppedItems = [];
const weaponTrails = [];
const crescentWaves = [];
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

const player = {
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
  swordAura: 0,
  auraCooldown: 0,
  crescentCooldown: 0,
  mobsKilled: 0,
  stonesKilled: 0,
  inventory: [
    item("health_potion", 3),
    item("rust_sword", 1),
  ],
  weapon: "rust_sword",
  weaponIndex: 1,
};

const defaultPlayerState = {
  maxHp: 120,
  nextXp: 50,
  baseAttack: 8,
  attackBonus: 3,
  armorLevel: 0,
  inventory: [
    item("health_potion", 3),
    item("rust_sword", 1),
  ],
  weapon: "rust_sword",
  weaponIndex: 1,
};

const itemDefs = {
  health_potion: { name: "Roter Trank", icon: "+", type: "potion", rarity: "common", heal: 45 },
  rust_sword: { name: "Rostklinge", icon: "/", type: "weapon", rarity: "common", attack: 3, color: "#d9dee5", glow: "rgba(217,222,229,0.18)", reach: 82, cooldown: 0.42 },
  iron_blade: { name: "Eisenklinge", icon: "I", type: "weapon", rarity: "rare", attack: 8, color: "#9ee7ff", glow: "rgba(85,215,255,0.28)", reach: 92, cooldown: 0.38 },
  metin_glaive: { name: "Metin-Gleve", icon: "G", type: "weapon", rarity: "rare", attack: 14, color: "#55d7ff", glow: "rgba(85,215,255,0.36)", reach: 108, cooldown: 0.36 },
  pugna_cleaver: { name: "Pugna-Spalter", icon: "P", type: "weapon", rarity: "epic", attack: 21, color: "#c084fc", glow: "rgba(192,132,252,0.42)", reach: 118, cooldown: 0.46 },
  storm_saber: { name: "Sturmsaebel", icon: "S", type: "weapon", rarity: "epic", attack: 17, color: "#f4c95d", glow: "rgba(244,201,93,0.42)", reach: 102, cooldown: 0.28 },
  fullmoon_sickle: { name: "Vollmondsichel", icon: "C", type: "weapon", rarity: "legendary", attack: 29, color: "#fff2a8", glow: "rgba(244,201,93,0.48)", reach: 132, cooldown: 0.33 },
  metin_shard: { name: "Metin-Splitter", icon: "*", type: "material", rarity: "rare" },
  pugna_core: { name: "Pugna-Kern", icon: "O", type: "material", rarity: "epic" },
  gem: { name: "Kristall", icon: "<>", type: "material", rarity: "rare" },
};

function item(id, count = 1) {
  return { id, count };
}

function attackPower() {
  const auraBonus = player.swordAura > 0 ? 12 + Math.floor(player.level * 0.8) : 0;
  return player.baseAttack + player.attackBonus + weaponUpgradeBonus() + auraBonus + Math.floor(player.level * 1.5);
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

function itemLabel(invItem) {
  const def = itemDefs[invItem.id];
  const upgrade = invItem.upgrade ? ` +${invItem.upgrade}` : "";
  return `${def.name}${upgrade}`;
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

function spawnMob(x, y, rank = "mob") {
  if (typeof rank === "boolean") rank = rank ? "elite" : "mob";
  const stats = mobStats(rank);
  mobs.push({
    x, y,
    r: stats.r,
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    damage: stats.damage,
    xp: stats.xp,
    elite: rank !== "mob",
    rank,
    name: stats.name,
    color: stats.color,
    scale: stats.scale,
    hitTimer: 0,
  });
}

function mobStats(rank) {
  if (rank === "boss") {
    const name = greekBossNames[Math.floor(Math.random() * greekBossNames.length)];
    return { r: 42, hp: 420, speed: 72, damage: 50, xp: 150, name, color: "#d946ef", scale: 1.55 };
  }
  if (rank === "miniboss") {
    const name = greekBossNames[Math.floor(Math.random() * greekBossNames.length)];
    return { r: 34, hp: 165, speed: 82, damage: 36, xp: 62, name, color: "#f97316", scale: 1.28 };
  }
  if (rank === "elite") return { r: 26, hp: 58, speed: 88, damage: 30, xp: 26, name: "Elite", color: "#c084fc", scale: 1.05 };
  return { r: 20, hp: 28, speed: 110, damage: 18, xp: 13, name: "Schattenklotz", color: "#b34d54", scale: 0.9 };
}

function spawnStone(x, y) {
  stones.push({
    x, y,
    r: 38,
    hp: 160,
    maxHp: 160,
    pulse: Math.random() * 10,
    hitTimer: 0,
  });
}

function randomPointAwayFromPlayer(minDistance = 360) {
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = 160 + Math.random() * (world.w - 320);
    y = 150 + Math.random() * (world.h - 300);
    tries += 1;
  } while (Math.hypot(x - player.x, y - player.y) < minDistance && tries < 80);
  return { x, y };
}

function spawnSpecialMob(rank, announce = true) {
  const point = randomPointAwayFromPlayer(rank === "boss" ? 900 : 720);
  spawnMob(point.x, point.y, rank);
  const mob = mobs[mobs.length - 1];
  if (announce) showToast(`${rank === "boss" ? "Boss" : "Miniboss"} ${mob.name} ist erschienen.`);
}

function seedWorld() {
  for (let i = 0; i < 30; i += 1) {
    const point = randomPointAwayFromPlayer(760);
    spawnMob(point.x, point.y, Math.random() < 0.22 ? "elite" : "mob");
  }
  for (let i = 0; i < 2; i += 1) spawnSpecialMob("miniboss", false);
  spawnStone(440, 430);
  spawnStone(1800, 470);
  spawnStone(1220, 1240);
}

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
  keys.add(event.key.toLowerCase());
  if (event.code === "Space") {
    event.preventDefault();
    swing();
  }
  if (event.key.toLowerCase() === "q") {
    activateSwordAura();
  }
  if (event.key.toLowerCase() === "e") {
    crescentStrike();
  }
  if (event.key.toLowerCase() === "f") {
    useBlacksmith();
  }
  if (event.key === "1") {
    usePotion();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

canvas.addEventListener("mousedown", swing);
ui.skillAura.addEventListener("click", activateSwordAura);
ui.skillCrescent.addEventListener("click", crescentStrike);
ui.upgradeWeapon.addEventListener("click", () => upgradeAtBlacksmith("weapon"));
ui.upgradeArmor.addEventListener("click", () => upgradeAtBlacksmith("armor"));

ui.sortInventory.addEventListener("click", () => {
  const equipped = equippedWeaponItem();
  player.inventory.sort((a, b) => itemDefs[a.id].name.localeCompare(itemDefs[b.id].name));
  player.weaponIndex = Math.max(0, player.inventory.indexOf(equipped));
  renderInventory();
});

ui.inventory.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || slot.classList.contains("empty")) return;
  const invItem = player.inventory[Number(slot.dataset.index)];
  const def = itemDefs[invItem.id];
  if (def.type === "potion") usePotion();
  if (def.type === "weapon") equipWeapon(Number(slot.dataset.index));
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
  const api = await waitForFirebase();
  authUser = username;
  authColor = colorForName(username);
  localStorage.setItem("blocpugnaUser", username);
  ui.playerNameText.textContent = `${username} online`;
  ui.authOverlay.classList.add("hidden");
  playerRef = api.ref(api.database, `blocpugna/rooms/${multiplayerRoom}/players/${username}`);
  await api.onDisconnect(playerRef).remove();
  await syncPresence(true);
  const playersRef = api.ref(api.database, `blocpugna/rooms/${multiplayerRoom}/players`);
  unsubscribePlayers = api.onValue(playersRef, (snapshot) => {
    const value = snapshot.val() || {};
    delete value[authUser];
    remotePlayers = value;
  });
  multiplayerReady = true;
  showToast(`${username} ist verbunden. Freunde sehen dich jetzt auf der Map.`);
}

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
    weapon: weapon.id,
    weaponUpgrade: equippedWeaponItem()?.upgrade || 0,
    armorLevel: player.armorLevel,
    updatedAt: Date.now(),
  });
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function camera() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  return {
    x: clamp(player.x - w / 2, 0, world.w - w),
    y: clamp(player.y - h / 2, 0, world.h - h),
    w,
    h,
  };
}

function swing() {
  if (player.attackCooldown > 0 || player.hp <= 0) return;
  const weapon = currentWeapon();
  player.attackCooldown = weapon.cooldown || 0.42;
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const reach = weapon.reach || 82;
  const arcX = player.x + Math.cos(angle) * reach;
  const arcY = player.y + Math.sin(angle) * reach;
  let hit = false;

  for (const mob of [...mobs]) {
    if (Math.hypot(mob.x - arcX, mob.y - arcY) < mob.r + 52 || dist(player, mob) < mob.r + reach - 28) {
      damageMob(mob, attackPower());
      hit = true;
    }
  }
  for (const stone of [...stones]) {
    if (Math.hypot(stone.x - arcX, stone.y - arcY) < stone.r + 56 || dist(player, stone) < stone.r + reach - 24) {
      damageStone(stone, attackPower());
      hit = true;
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

function activateSwordAura() {
  if (player.auraCooldown > 0 || player.hp <= 0) return;
  player.swordAura = 8;
  player.auraCooldown = 18;
  showToast("Schwertverbesserung aktiv: rote Aura und mehr Schaden.");
  for (let i = 0; i < 28; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: player.x + Math.cos(a) * 28,
      y: player.y - 18 + Math.sin(a) * 28,
      vx: Math.cos(a) * 90,
      vy: Math.sin(a) * 90,
      life: 0.52,
      color: "#ff343f",
      size: 5,
    });
  }
}

function crescentStrike() {
  if (player.crescentCooldown > 0 || player.hp <= 0) return;
  const weapon = currentWeapon();
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const range = weapon.id === "fullmoon_sickle" ? 360 : weapon.rarity === "legendary" ? 340 : 260;
  const radius = weapon.id === "fullmoon_sickle" ? 130 : 95;
  const damage = Math.floor(attackPower() * (weapon.id === "fullmoon_sickle" ? 1.85 : 1.25));
  player.crescentCooldown = weapon.id === "fullmoon_sickle" ? 5.5 : 8;

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

function isInCone(target, angle, range, radius) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const forward = Math.cos(angle) * dx + Math.sin(angle) * dy;
  if (forward < 0 || forward > range) return false;
  const side = Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy);
  return side < radius + target.r * 0.6;
}

function damageMob(mob, amount) {
  mob.hp -= amount;
  mob.hitTimer = 0.14;
  floatText(mob.x, mob.y - 28 - mob.r * 0.35, `-${amount}`, player.swordAura > 0 ? "#ff343f" : "#f4c95d");
  if (mob.hp <= 0) {
    const index = mobs.indexOf(mob);
    if (index >= 0) mobs.splice(index, 1);
    player.mobsKilled += 1;
    gainXp(mob.xp);
    dropLoot(mob.x, mob.y, mob.rank || (mob.elite ? "elite" : "mob"));
    burst(mob.x, mob.y, mob.color || (mob.elite ? "#c084fc" : "#ff6b6b"), mob.rank === "boss" ? 70 : mob.rank === "miniboss" ? 42 : 24);
    if (mob.rank === "boss") showToast(`${mob.name} besiegt: Boss-Loot liegt am Boden.`);
    if (mob.rank === "miniboss") showToast(`${mob.name} besiegt: starker Loot liegt am Boden.`);
    setTimeout(() => {
      const point = randomPointAwayFromPlayer(680);
      spawnMob(point.x, point.y, Math.random() < 0.24 ? "elite" : "mob");
    }, 850);
  }
}

function damageStone(stone, amount) {
  stone.hp -= amount;
  stone.hitTimer = 0.16;
  floatText(stone.x, stone.y - 50, `-${amount}`, "#55d7ff");
  burst(stone.x, stone.y, "#55d7ff", 8);
  if (stone.hp <= 0) {
    const index = stones.indexOf(stone);
    if (index >= 0) stones.splice(index, 1);
    player.stonesKilled += 1;
    gainXp(70);
    dropLoot(stone.x, stone.y, "metin");
    burst(stone.x, stone.y, "#c084fc", 50);
    showToast("Metin-Stein zerstoert: seltener Loot liegt am Boden.");
    setTimeout(() => spawnStone(180 + Math.random() * (world.w - 360), 160 + Math.random() * (world.h - 320)), 7000);
  }
}

function dropLoot(x, y, source) {
  const drops = source === "boss"
    ? [
        item("health_potion", 2),
        item("pugna_core", 2),
        item(bossWeaponDrop(), 1),
        item("metin_shard", 4),
      ]
    : source === "miniboss"
      ? [
          item("health_potion", 1),
          item(Math.random() < 0.45 ? "pugna_core" : "gem", 1),
          item(Math.random() < 0.22 ? "fullmoon_sickle" : metinWeaponDrop(), 1),
        ]
      : source === "metin"
    ? [
        item("metin_shard", 2 + Math.floor(Math.random() * 3)),
        item(Math.random() < 0.45 ? "pugna_core" : "gem", 1),
        item(metinWeaponDrop(), 1),
      ]
    : [
        item("health_potion", Math.random() < 0.26 ? 1 : 0),
        item("gem", Math.random() < 0.12 ? 1 : 0),
        item("iron_blade", source === "elite" && Math.random() < 0.22 ? 1 : 0),
      ];

  for (const drop of drops.filter((entry) => entry.count > 0)) {
    droppedItems.push({
      ...drop,
      x: x + (Math.random() - 0.5) * 54,
      y: y + (Math.random() - 0.5) * 54,
      bob: Math.random() * 10,
    });
  }
  player.gold += source === "boss"
    ? 90 + Math.floor(Math.random() * 55)
    : source === "miniboss"
      ? 38 + Math.floor(Math.random() * 24)
      : source === "metin"
        ? 22 + Math.floor(Math.random() * 18)
        : 4 + Math.floor(Math.random() * 7);
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
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.floor(player.nextXp * 1.35);
    player.maxHp += 16;
    player.hp = player.maxHp;
    player.baseAttack += 2;
    showToast(`Level ${player.level}! Angriff und Leben steigen.`);
  }
}

function addInventory(id, count = 1) {
  if (itemDefs[id]?.type === "weapon") {
    player.inventory.push({ id, count: 1, upgrade: 0 });
    const def = itemDefs[id];
    showToast(`${def.name} erhalten.`);
    renderInventory();
    return;
  }
  const found = player.inventory.find((entry) => entry.id === id);
  if (found) found.count += count;
  else player.inventory.push(item(id, count));
  const def = itemDefs[id];
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

function isNearBlacksmith() {
  return Math.hypot(player.x - blacksmith.x, player.y - blacksmith.y) < 105;
}

function useBlacksmith() {
  if (!isNearBlacksmith()) {
    showToast("Der Schmied ist zu weit weg. Folge dem Amboss auf der Karte.");
    return;
  }
  upgradeAtBlacksmith("weapon");
}

function upgradeAtBlacksmith(kind) {
  if (!isNearBlacksmith()) {
    showToast("Gehe zum Schmied, um Upgrades durchzufuehren.");
    return;
  }
  const targetLevel = kind === "armor" ? player.armorLevel : (equippedWeaponItem()?.upgrade || 0);
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
    player.armorLevel += 1;
    showToast(`Ruestung auf +${player.armorLevel} verbessert.`);
  } else {
    const weapon = equippedWeaponItem();
    if (!weapon) return;
    weapon.upgrade = (weapon.upgrade || 0) + 1;
    showToast(`${itemLabel(weapon)} geschmiedet. Schaden steigt.`);
  }
  renderInventory();
}

function upgradeCost(nextLevel, kind) {
  return {
    gold: (kind === "armor" ? 18 : 24) * nextLevel,
    shards: Math.ceil(nextLevel / 2),
    gems: nextLevel >= 4 ? Math.ceil((nextLevel - 3) / 2) : 0,
    cores: nextLevel >= 7 ? 1 : 0,
  };
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
  floatingText.push({ x, y, text, color, life: 0.75 });
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

function update(dt) {
  if (player.hp <= 0) {
    if (keys.has("r")) restart();
    return;
  }

  const move = { x: 0, y: 0 };
  if (keys.has("w") || keys.has("arrowup")) move.y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) move.y += 1;
  if (keys.has("a") || keys.has("arrowleft")) move.x -= 1;
  if (keys.has("d") || keys.has("arrowright")) move.x += 1;
  const len = Math.hypot(move.x, move.y) || 1;
  player.x = clamp(player.x + (move.x / len) * player.speed * dt, player.r, world.w - player.r);
  player.y = clamp(player.y + (move.y / len) * player.speed * dt, player.r, world.h - player.r);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.swordAura = Math.max(0, player.swordAura - dt);
  player.auraCooldown = Math.max(0, player.auraCooldown - dt);
  player.crescentCooldown = Math.max(0, player.crescentCooldown - dt);
  if (player.swordAura > 0 && Math.random() < 0.38) {
    particles.push({
      x: player.x + 20 + Math.random() * 64,
      y: player.y - 36 + (Math.random() - 0.5) * 36,
      vx: (Math.random() - 0.5) * 70,
      vy: -45 - Math.random() * 55,
      life: 0.34,
      color: "#ff343f",
      size: 3 + Math.random() * 4,
    });
  }
  waveTimer -= dt;
  minibossTimer -= dt;
  bossTimer -= dt;
  if (waveTimer <= 0) {
    spawnMobWave();
    waveTimer = 3.2 + Math.random() * 3.2;
  }
  if (minibossTimer <= 0) {
    spawnSpecialMob("miniboss");
    minibossTimer = 28 + Math.random() * 20;
  }
  if (bossTimer <= 0) {
    spawnSpecialMob("boss");
    bossTimer = 70 + Math.random() * 35;
  }

  for (const mob of mobs) {
    mob.hitTimer = Math.max(0, mob.hitTimer - dt);
    const dx = player.x - mob.x;
    const dy = player.y - mob.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 520) {
      mob.x += (dx / d) * mob.speed * dt;
      mob.y += (dy / d) * mob.speed * dt;
    }
    if (d < player.r + mob.r && player.invuln <= 0) {
      const mitigatedDamage = Math.max(2, mob.damage - player.armorLevel * 3);
      player.hp -= mitigatedDamage;
      player.invuln = 0.65;
      floatText(player.x, player.y - 36, `-${mitigatedDamage}`, "#ff5d62");
      if (player.hp <= 0) showToast("Du wurdest besiegt. Druecke R fuer Neustart.");
    }
  }

  for (const stone of stones) {
    stone.pulse += dt;
    stone.hitTimer = Math.max(0, stone.hitTimer - dt);
  }

  for (let i = droppedItems.length - 1; i >= 0; i -= 1) {
    const entry = droppedItems[i];
    entry.bob += dt * 5;
    if (Math.hypot(entry.x - player.x, entry.y - player.y) < 48) {
      addInventory(entry.id, entry.count);
      droppedItems.splice(i, 1);
    }
  }

  updateParticles(dt);
  updateQuest();
  updateUi();
  syncPresence();

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.remove("show");
  }
}

function spawnMobWave() {
  const maxMobs = 44 + Math.min(player.level * 2, 16);
  if (mobs.length >= maxMobs) return;
  const amount = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < amount && mobs.length < maxMobs; i += 1) {
    const point = randomPointAwayFromPlayer(650);
    spawnMob(point.x, point.y, Math.random() < 0.18 ? "elite" : "mob");
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
  ui.armorText.textContent = `+${player.armorLevel}`;
  updateBlacksmithUi();
  updateSkillButton(ui.skillAura, player.auraCooldown, 18, player.swordAura > 0 ? `Aktiv ${player.swordAura.toFixed(1)}s` : "Schwertverbesserung");
  updateSkillButton(ui.skillCrescent, player.crescentCooldown, currentWeapon().id === "fullmoon_sickle" ? 5.5 : 8, "Sichelhieb");
}

function updateBlacksmithUi() {
  const distance = Math.floor(Math.hypot(player.x - blacksmith.x, player.y - blacksmith.y));
  const near = isNearBlacksmith();
  ui.blacksmithDistance.textContent = near ? "Bereit" : `${distance}m`;
  ui.blacksmithText.textContent = near
    ? "Druecke F oder nutze die Buttons. Upgrades kosten Gold und Metin-Materialien."
    : "Gehe zum Schmied auf der Karte und druecke F fuer Upgrades bis +9.";
  ui.upgradeWeapon.disabled = !near;
  ui.upgradeArmor.disabled = !near;
}

function updateSkillButton(button, cooldown, maxCooldown, label) {
  const pct = cooldown <= 0 ? 100 : Math.max(0, 100 - (cooldown / maxCooldown) * 100);
  button.style.setProperty("--cooldown", `${pct}%`);
  button.classList.toggle("ready", cooldown <= 0);
  const strong = button.querySelector("strong");
  if (strong) strong.textContent = cooldown > 0 ? `${label} ${cooldown.toFixed(1)}s` : label;
}

function renderInventory() {
  ui.inventory.innerHTML = "";
  const slots = 20;
  for (let i = 0; i < slots; i += 1) {
    const invItem = player.inventory[i];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.dataset.index = i;
    if (!invItem) {
      slot.classList.add("empty");
      slot.setAttribute("aria-label", "Leerer Inventarplatz");
      ui.inventory.append(slot);
      continue;
    }
    const def = itemDefs[invItem.id];
    slot.classList.add(def.rarity);
    if (player.weaponIndex === i) slot.classList.add("equipped");
    slot.title = `${itemLabel(invItem)}${def.attack ? ` (+${def.attack + (invItem.upgrade || 0) * 3} Angriff, ausruesten per Klick)` : ""}`;
    slot.setAttribute("aria-label", slot.title);
    const upgrade = invItem.upgrade ? `<span class="upgrade">+${invItem.upgrade}</span>` : "";
    slot.innerHTML = `<span class="icon">${def.icon}</span>${upgrade}<span class="count">${invItem.count}</span>`;
    ui.inventory.append(slot);
  }
}

function draw() {
  const cam = camera();
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawGround(cam);
  drawBlacksmith();
  drawDroppedItems();
  for (const stone of stones) drawStone(stone);
  for (const mob of mobs) drawMob(mob);
  drawRemotePlayers();
  drawCrescentWaves();
  drawWeaponTrails();
  drawPlayer();
  drawParticles();
  drawFloatingText();
  ctx.restore();

  if (player.hp <= 0) drawDeathScreen();
}

function drawGround(cam) {
  ctx.fillStyle = "#2f4630";
  ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
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

function drawBlockPerson(x, y, colors, scale = 1, facing = 0, hurt = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing * 0.08);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(-20 * scale, 16 * scale, 40 * scale, 10 * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.legs;
  ctx.fillRect(-16 * scale, 8 * scale, 12 * scale, 24 * scale);
  ctx.fillRect(4 * scale, 8 * scale, 12 * scale, 24 * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.body;
  ctx.fillRect(-18 * scale, -22 * scale, 36 * scale, 34 * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.arms;
  ctx.fillRect(-32 * scale, -18 * scale, 12 * scale, 32 * scale);
  ctx.fillRect(20 * scale, -18 * scale, 12 * scale, 32 * scale);
  ctx.fillStyle = hurt ? "#ffffff" : colors.head;
  ctx.fillRect(-15 * scale, -54 * scale, 30 * scale, 30 * scale);
  ctx.fillStyle = "#14181f";
  ctx.fillRect(-7 * scale, -43 * scale, 4 * scale, 4 * scale);
  ctx.fillRect(5 * scale, -43 * scale, 4 * scale, 4 * scale);
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
  const cam = camera();
  mouse.worldX = mouse.x + cam.x;
  mouse.worldY = mouse.y + cam.y;
  const facing = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  drawBlockPerson(player.x, player.y, {
    head: "#f3c7a1",
    body: "#55d7ff",
    arms: "#f3c7a1",
    legs: "#3b5fcb",
  }, 1.05, facing, player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0);

  drawEquippedWeapon(facing);
}

function drawRemotePlayers() {
  const now = Date.now();
  for (const remote of Object.values(remotePlayers)) {
    if (!remote || now - (remote.updatedAt || 0) > 12000) continue;
    drawBlockPerson(remote.x, remote.y, {
      head: "#f3c7a1",
      body: remote.color || "#51d37a",
      arms: "#f3c7a1",
      legs: "#283f87",
    }, 1.02, 0, false);
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

function drawEquippedWeapon(facing) {
  const weapon = currentWeapon();
  const bob = Math.sin(performance.now() / 120) * 2;
  ctx.save();
  ctx.translate(player.x, player.y - 12 + bob);
  ctx.rotate(facing);
  ctx.fillStyle = weapon.glow || "rgba(217,222,229,0.18)";
  ctx.fillRect(14, -16, 52, 32);
  if (player.swordAura > 0) {
    ctx.fillStyle = "rgba(255, 52, 63, 0.42)";
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
  drawBlockPerson(mob.x, mob.y, {
    head: mob.rank === "boss" ? "#f0abfc" : mob.rank === "miniboss" ? "#fdba74" : mob.elite ? "#c084fc" : "#b34d54",
    body: mob.rank === "boss" ? "#701a75" : mob.rank === "miniboss" ? "#7c2d12" : mob.elite ? "#65358f" : "#5b2229",
    arms: mob.rank === "boss" ? "#c026d3" : mob.rank === "miniboss" ? "#ea580c" : mob.elite ? "#8b5cc0" : "#7f2f37",
    legs: "#242936",
  }, mob.scale || (mob.elite ? 1.05 : 0.9), 0, mob.hitTimer > 0);
  const barWidth = mob.rank === "boss" ? 116 : mob.rank === "miniboss" ? 86 : 48;
  const y = mob.y - 70 - mob.r * 0.55;
  drawHealth(mob.x, y, barWidth, mob.hp / mob.maxHp);
  if (isBoss) {
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = mob.rank === "boss" ? "#f0abfc" : "#fdba74";
    ctx.fillText(mob.name, mob.x, y - 8);
  }
}

function drawStone(stone) {
  const glow = 0.5 + Math.sin(stone.pulse * 4) * 0.18;
  ctx.save();
  ctx.translate(stone.x, stone.y);
  ctx.fillStyle = `rgba(85, 215, 255, ${0.12 + glow * 0.12})`;
  ctx.fillRect(-54, -58, 108, 112);
  ctx.fillStyle = stone.hitTimer > 0 ? "#ffffff" : "#4bb7d9";
  ctx.fillRect(-34, -46, 68, 92);
  ctx.fillStyle = stone.hitTimer > 0 ? "#ffffff" : "#86efff";
  ctx.fillRect(-18, -64, 36, 28);
  ctx.fillStyle = "#1b4d68";
  ctx.fillRect(-22, -20, 44, 20);
  ctx.fillStyle = "#c084fc";
  ctx.fillRect(-10, -12, 20, 20);
  ctx.restore();
  drawHealth(stone.x, stone.y - 78, 70, stone.hp / stone.maxHp);
}

function drawHealth(x, y, w, pct) {
  ctx.fillStyle = "#111820";
  ctx.fillRect(x - w / 2, y, w, 7);
  ctx.fillStyle = pct < 0.35 ? "#ff5d62" : "#51d37a";
  ctx.fillRect(x - w / 2, y, w * clamp(pct, 0, 1), 7);
}

function drawDroppedItems() {
  for (const entry of droppedItems) {
    const def = itemDefs[entry.id];
    const y = entry.y + Math.sin(entry.bob) * 5;
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(entry.x - 14, y + 15, 28, 8);
    ctx.fillStyle = def.rarity === "legendary" ? "#fff2a8" : def.rarity === "epic" ? "#c084fc" : def.rarity === "rare" ? "#55d7ff" : "#f4c95d";
    ctx.fillRect(entry.x - 13, y - 13, 26, 26);
    ctx.fillStyle = "#101419";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(def.icon, entry.x, y + 5);
  }
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
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  for (const text of floatingText) {
    ctx.globalAlpha = clamp(text.life * 1.6, 0, 1);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
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
  resetProgressAfterDeath();
  player.x = world.w / 2;
  player.y = world.h / 2;
  player.hp = player.maxHp;
  player.invuln = 2;
  mobs.length = 0;
  stones.length = 0;
  droppedItems.length = 0;
  weaponTrails.length = 0;
  crescentWaves.length = 0;
  waveTimer = 3.5;
  minibossTimer = 18;
  bossTimer = 48;
  player.swordAura = 0;
  player.auraCooldown = 0;
  player.crescentCooldown = 0;
  seedWorld();
  renderInventory();
  showToast("Tod bezahlt: Stats und Inventar wurden zurueckgesetzt.");
}

function resetProgressAfterDeath() {
  player.maxHp = defaultPlayerState.maxHp;
  player.hp = defaultPlayerState.maxHp;
  player.xp = 0;
  player.nextXp = defaultPlayerState.nextXp;
  player.level = 1;
  player.gold = 0;
  player.baseAttack = defaultPlayerState.baseAttack;
  player.attackBonus = defaultPlayerState.attackBonus;
  player.armorLevel = defaultPlayerState.armorLevel;
  player.mobsKilled = 0;
  player.stonesKilled = 0;
  player.weapon = defaultPlayerState.weapon;
  player.weaponIndex = defaultPlayerState.weaponIndex;
  player.inventory = defaultPlayerState.inventory.map((entry) => ({ ...entry }));
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

renderInventory();
updateUi();
requestAnimationFrame(loop);
