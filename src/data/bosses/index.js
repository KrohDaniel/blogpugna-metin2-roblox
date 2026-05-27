import { frostJarl } from "./frost_jarl.js";

export const bosses = {
  [frostJarl.id]: frostJarl,
};

export function bossForWorld(worldId) {
  return Object.values(bosses).find((b) => b.worldId === worldId);
}

export function petForBossId(bossId) {
  return bosses[bossId]?.pet || null;
}
