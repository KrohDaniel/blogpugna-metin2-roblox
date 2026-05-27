// Wiederverwendbare Animations-Bausteine fuer alle Klassen.
// Schreiben in das uebergebene particles-Array und nutzen groundEffects.

import {
  groundEffects,
  createSpinTrail,
  createRosePetals,
  createPoleStruct,
  createCharmAura,
  createExpandingRing,
  createCrater,
  createPoisonCloud,
  createRoots,
  createFrostRing,
  createLavaPool,
} from "./groundEffects.js";

export function spawnDustPuff(particles, x, y, color = "#a8a29e", count = 12) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: x + Math.cos(a) * 4,
      y: y + Math.sin(a) * 4,
      vx: Math.cos(a) * (30 + Math.random() * 40),
      vy: Math.sin(a) * (30 + Math.random() * 40) - 20,
      life: 0.4 + Math.random() * 0.3,
      color,
      size: 3 + Math.random() * 2,
    });
  }
}

export function spawnHearts(particles, x, y, n, color = "#ec4899") {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (40 + Math.random() * 80),
      vy: Math.sin(a) * (40 + Math.random() * 80) - 30,
      life: 0.6 + Math.random() * 0.3,
      color,
      size: 4 + Math.random() * 3,
      heart: true,
    });
  }
}

export function spawnSpinAura(x, y, radius, color = "#ec4899", trailCount = 5, lifeStep = 0.06) {
  // Mehrere konzentrische Trail-Ringe leicht versetzt (Spin-Effekt)
  for (let i = 0; i < trailCount; i += 1) {
    setTimeout(() => {
      groundEffects.push(createSpinTrail(x, y, radius, 0.45, color));
    }, i * lifeStep * 1000);
  }
}

export function spawnHeartTrail(particles, fromX, fromY, toX, toY, count = 8, color = "#f472b6") {
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 30,
      vy: -20 - Math.random() * 20,
      life: 0.5,
      color,
      size: 4,
      heart: true,
    });
  }
}

export function spawnPoleDance(x, y) {
  // Polstange schiesst aus dem Boden hoch
  groundEffects.push(createPoleStruct(x, y, 1.6));
  // Gold-Funken-Ring
  groundEffects.push(createExpandingRing(x, y, 120, 0.6, "#f5d042"));
  // Rosen-Bluetenblaetter regnen
  setTimeout(() => groundEffects.push(createRosePetals(x, y, 2.2)), 400);
}

export function applyCharmAura(target) {
  if (!target) return;
  // Verhindere Duplikate
  const existing = groundEffects.find((g) => g.kind === "charm_aura" && g.targetRef === target);
  if (existing) { existing.life = existing.maxLife; return; }
  groundEffects.push(createCharmAura(target, 5));
}

export function spawnRootsAt(x, y, radius = 50, life = 3) {
  groundEffects.push(createRoots(x, y, radius, life));
}

export function spawnRoar(x, y, color = "#92400e") {
  groundEffects.push(createExpandingRing(x, y, 180, 0.55, color));
  groundEffects.push(createExpandingRing(x, y, 240, 0.85, "#a3e635"));
}

export function spawnSwarmCloud(particles, x, y, color = "#a3e635") {
  // Dichte Schwarm-Wolke aus kleinen Pixeln (statt 5 grosser Insekten)
  for (let i = 0; i < 18; i += 1) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: x + Math.cos(a) * (5 + Math.random() * 10),
      y: y + Math.sin(a) * (5 + Math.random() * 10),
      vx: Math.cos(a) * 20,
      vy: Math.sin(a) * 20 - 10,
      life: 0.4 + Math.random() * 0.4,
      color,
      size: 2 + Math.random() * 2,
    });
  }
}

export function spawnFrostRing(x, y, radius = 90, life = 6) {
  groundEffects.push(createFrostRing(x, y, radius, life));
}

export function spawnLavaPool(x, y, radius = 60, life = 4) {
  groundEffects.push(createLavaPool(x, y, radius, life));
}

export function spawnCrater(x, y, radius = 80, life = 8) {
  groundEffects.push(createCrater(x, y, radius, life));
}

export function spawnPoisonCloud(x, y, radius = 50, life = 5) {
  groundEffects.push(createPoisonCloud(x, y, radius, life));
}
