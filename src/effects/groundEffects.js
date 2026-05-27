// Persistente Boden-Effekte: bleiben fuer X Sekunden auf der Map sichtbar.
// Verwendung: groundEffects.push(createFrostRing(x, y, 90, 6))
//
// Jeder Effekt hat: kind, x, y, life, maxLife + kind-spezifische Felder.
// update(dt) reduziert life, entfernt abgelaufene.
// draw(ctx) rendert alle aktiven Effekte.

export const groundEffects = [];

export function createFrostRing(x, y, radius, life = 6) {
  return { kind: "frost_ring", x, y, radius, life, maxLife: life };
}

export function createLavaPool(x, y, radius, life = 4) {
  return { kind: "lava_pool", x, y, radius, life, maxLife: life };
}

export function createPoisonCloud(x, y, radius, life = 5) {
  return { kind: "poison_cloud", x, y, radius, life, maxLife: life, bubbles: [] };
}

export function createRoots(x, y, radius, life = 3) {
  return { kind: "roots", x, y, radius, life, maxLife: life, sprouts: 8 + Math.floor(Math.random() * 4) };
}

export function createCharmAura(targetRef, life = 5) {
  return { kind: "charm_aura", targetRef, life, maxLife: life };
}

export function createSpinTrail(x, y, radius, life = 0.5, color = "#ec4899") {
  return { kind: "spin_trail", x, y, radius, life, maxLife: life, color };
}

export function createRosePetals(x, y, life = 2) {
  // Bluetenblaetter regnen
  const petals = [];
  for (let i = 0; i < 24; i += 1) {
    const a = Math.random() * Math.PI * 2;
    petals.push({
      x: x + Math.cos(a) * (10 + Math.random() * 30),
      y: y + Math.sin(a) * (10 + Math.random() * 30) - 60,
      vx: (Math.random() - 0.5) * 40,
      vy: 30 + Math.random() * 40,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      size: 5 + Math.random() * 3,
    });
  }
  return { kind: "rose_petals", x, y, life, maxLife: life, petals };
}

export function createCrater(x, y, radius, life = 8) {
  return { kind: "crater", x, y, radius, life, maxLife: life };
}

export function createExpandingRing(x, y, maxRadius, life = 0.6, color = "#f4c95d") {
  return { kind: "expanding_ring", x, y, maxRadius, life, maxLife: life, color };
}

export function createPoleStruct(x, y, life = 1.5) {
  return { kind: "pole_struct", x, y, life, maxLife: life };
}

export function clearGroundEffects() {
  groundEffects.length = 0;
}

export function updateGroundEffects(dt) {
  for (let i = groundEffects.length - 1; i >= 0; i -= 1) {
    const g = groundEffects[i];
    g.life -= dt;
    if (g.kind === "poison_cloud") {
      // Bubbles steigen auf
      if (Math.random() < dt * 6) {
        g.bubbles.push({
          x: g.x + (Math.random() - 0.5) * g.radius * 1.6,
          y: g.y + (Math.random() - 0.5) * 20,
          vy: -20 - Math.random() * 30,
          life: 0.8 + Math.random() * 0.4,
          maxLife: 1.2,
          size: 3 + Math.random() * 3,
        });
      }
      for (let b = g.bubbles.length - 1; b >= 0; b -= 1) {
        g.bubbles[b].y += g.bubbles[b].vy * dt;
        g.bubbles[b].life -= dt;
        if (g.bubbles[b].life <= 0) g.bubbles.splice(b, 1);
      }
    } else if (g.kind === "rose_petals") {
      for (const p of g.petals) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;
        p.vy += 30 * dt; // sanftes Schweben/Fallen
      }
    } else if (g.kind === "expanding_ring") {
      // Radius waechst ueber Zeit
      g.currentRadius = g.maxRadius * (1 - g.life / g.maxLife);
    }
    if (g.life <= 0) groundEffects.splice(i, 1);
  }
}

export function drawGroundEffects(ctx) {
  for (const g of groundEffects) {
    const t = Math.max(0, g.life / g.maxLife); // 1 -> 0
    ctx.save();
    if (g.kind === "frost_ring") {
      ctx.globalAlpha = 0.45 * t + 0.15;
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Hexagonal-Muster innen
      ctx.fillStyle = "rgba(186, 230, 253, 0.15)";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius * 0.94, 0, Math.PI * 2);
      ctx.fill();
      // Eis-Splitter am Rand
      ctx.fillStyle = "#e0f2fe";
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2 + (1 - t) * 1.5;
        const rx = g.x + Math.cos(a) * g.radius;
        const ry = g.y + Math.sin(a) * g.radius;
        ctx.fillRect(rx - 3, ry - 3, 6, 6);
      }
    } else if (g.kind === "lava_pool") {
      ctx.globalAlpha = 0.55 * t + 0.2;
      // Glow
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      grad.addColorStop(0, "#ff9540");
      grad.addColorStop(0.6, "#dc2626");
      grad.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      // Knister-Funken
      ctx.fillStyle = "#fde047";
      for (let i = 0; i < 6; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const rx = g.x + Math.cos(a) * g.radius * 0.7;
        const ry = g.y + Math.sin(a) * g.radius * 0.7;
        ctx.fillRect(rx, ry, 3, 3);
      }
    } else if (g.kind === "poison_cloud") {
      ctx.globalAlpha = 0.35 * t + 0.15;
      ctx.fillStyle = "#65a30d";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#84cc16";
      for (const b of g.bubbles) {
        ctx.globalAlpha = clamp(b.life / b.maxLife, 0, 1) * 0.7;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (g.kind === "roots") {
      ctx.globalAlpha = Math.min(1, (1 - t) * 4) * t; // sprout-in, dann fade
      ctx.strokeStyle = "#4d7c0f";
      ctx.lineWidth = 4;
      for (let i = 0; i < g.sprouts; i += 1) {
        const a = (i / g.sprouts) * Math.PI * 2;
        const len = g.radius * (1 - Math.pow(t, 2));
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        // Wackel-Wurzel
        const cx = g.x + Math.cos(a) * len * 0.5 + Math.cos(a + 1) * 8;
        const cy = g.y + Math.sin(a) * len * 0.5 + Math.sin(a + 1) * 8;
        const ex = g.x + Math.cos(a) * len;
        const ey = g.y + Math.sin(a) * len;
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
        // Knoten-Pixel an der Spitze
        ctx.fillStyle = "#65a30d";
        ctx.fillRect(ex - 3, ey - 3, 6, 6);
      }
    } else if (g.kind === "charm_aura") {
      const target = g.targetRef;
      if (!target || target.hp <= 0) { g.life = 0; ctx.restore(); continue; }
      // Pulsierende Herz-Aura ueber dem Ziel
      const pulse = 0.5 + Math.sin(performance.now() / 220) * 0.3;
      ctx.globalAlpha = (0.6 + pulse * 0.3) * t;
      ctx.fillStyle = "#ec4899";
      const hx = target.x;
      const hy = target.y - (target.r || 30) - 30;
      const s = 4 + pulse * 2;
      // Pixel-Herz
      ctx.fillRect(hx - s, hy - s, s, s);
      ctx.fillRect(hx, hy - s, s, s);
      ctx.fillRect(hx - s * 2, hy, s, s);
      ctx.fillRect(hx - s, hy, s, s);
      ctx.fillRect(hx, hy, s, s);
      ctx.fillRect(hx + s, hy, s, s);
      ctx.fillRect(hx - s, hy + s, s, s);
      ctx.fillRect(hx, hy + s, s, s);
      ctx.fillRect(hx - s * 0.5, hy + s * 2, s, s);
    } else if (g.kind === "spin_trail") {
      ctx.globalAlpha = t * 0.7;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius * (1 + (1 - t) * 0.3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (g.kind === "rose_petals") {
      ctx.globalAlpha = t * 0.95;
      for (const p of g.petals) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        ctx.fillStyle = "#f472b6";
        ctx.fillRect(-p.size * 0.4, -p.size / 2, p.size * 0.8, p.size);
        ctx.restore();
      }
    } else if (g.kind === "crater") {
      ctx.globalAlpha = 0.4 * t + 0.2;
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      // Crack-Linien
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x + Math.cos(a) * g.radius, g.y + Math.sin(a) * g.radius);
        ctx.stroke();
      }
    } else if (g.kind === "expanding_ring") {
      const r = g.currentRadius || 0;
      ctx.globalAlpha = t * 0.8;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 4 * t + 1;
      ctx.beginPath();
      ctx.arc(g.x, g.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (g.kind === "pole_struct") {
      // Polstange wird sichtbar (animiert hoch fahren)
      const heightFrac = Math.min(1, (1 - t) * 3); // schnelles Hochfahren
      const h = 90 * heightFrac;
      ctx.globalAlpha = Math.min(1, t * 4);
      // Stange (silber-pink)
      ctx.fillStyle = "#d9dee5";
      ctx.fillRect(g.x - 3, g.y - h, 6, h);
      // Goldring oben
      ctx.fillStyle = "#f5d042";
      ctx.fillRect(g.x - 6, g.y - h - 4, 12, 4);
      // Gold-Funken um den Boden
      ctx.fillStyle = "#fde047";
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + (1 - t) * 4;
        const r = 18 + (1 - t) * 12;
        ctx.fillRect(g.x + Math.cos(a) * r - 2, g.y + Math.sin(a) * r - 2, 4, 4);
      }
    }
    ctx.restore();
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
