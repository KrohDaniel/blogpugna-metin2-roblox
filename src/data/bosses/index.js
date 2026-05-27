import { frostJarl } from "./frost_jarl.js";
import { pyromantAsaru } from "./pyromant_asaru.js";
import { motherSphagne } from "./mother_sphagne.js";
import { aetherius } from "./aetherius.js";

export const bosses = {
  [frostJarl.id]: frostJarl,
  [pyromantAsaru.id]: pyromantAsaru,
  [motherSphagne.id]: motherSphagne,
  [aetherius.id]: aetherius,
};

export function bossForWorld(worldId) {
  return Object.values(bosses).find((b) => b.worldId === worldId);
}

export function petForBossId(bossId) {
  return bosses[bossId]?.pet || null;
}
