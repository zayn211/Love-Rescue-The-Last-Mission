import {
  CheckpointDef,
  CollectibleDef,
  HazardDef,
  LevelConfig,
  PlatformDef,
  WorldId,
} from '../types/game';

interface WorldPalette {
  skyTop: string;
  skyBottom: string;
  farHills: string;
  midHills: string;
  ambientGlow: string;
}

function getWorldPalette(world: WorldId): WorldPalette {
  switch (world) {
    case 1:
      return {
        skyTop: '#0c4a6e',
        skyBottom: '#6ee7b7',
        farHills: '#115e59',
        midHills: '#064e3b',
        ambientGlow: 'rgba(253, 224, 71, 0.12)',
      };
    case 2:
      return {
        skyTop: '#9a3412',
        skyBottom: '#fde68a',
        farHills: '#d97706',
        midHills: '#b45309',
        ambientGlow: 'rgba(251, 146, 60, 0.16)',
      };
    case 3:
      return {
        skyTop: '#0f172a',
        skyBottom: '#7dd3fc',
        farHills: '#334155',
        midHills: '#1e293b',
        ambientGlow: 'rgba(165, 243, 252, 0.14)',
      };
    case 4:
      return {
        skyTop: '#09090b',
        skyBottom: '#4c0519',
        farHills: '#27272a',
        midHills: '#18181b',
        ambientGlow: 'rgba(220, 38, 38, 0.14)',
      };
    case 5:
      return {
        skyTop: '#020617',
        skyBottom: '#1e293b',
        farHills: '#0f172a',
        midHills: '#1e293b',
        ambientGlow: 'rgba(14, 165, 233, 0.14)',
      };
  }
}

export function drawWorldBackground(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  camX: number,
  viewW: number,
  viewH: number,
  t: number,
  stormIntensity = 0,
  lightningFlash = 0
): void {
  const pal = getWorldPalette(level.world);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, pal.skyTop);
  skyGrad.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // Darken sky during giant boss storm
  if (stormIntensity > 0.01) {
    const stormColors: Record<WorldId, string> = {
      1: `rgba(6, 18, 28, ${0.68 * stormIntensity})`,
      2: `rgba(58, 22, 8, ${0.62 * stormIntensity})`,
      3: `rgba(8, 15, 38, ${0.72 * stormIntensity})`,
      4: `rgba(18, 4, 24, ${0.72 * stormIntensity})`,
      5: `rgba(2, 8, 23, ${0.75 * stormIntensity})`,
    };
    ctx.fillStyle = stormColors[level.world];
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // Sky lightning illumination pulse
  if (lightningFlash > 0.02) {
    ctx.fillStyle =
      level.world === 4
        ? `rgba(254, 202, 202, ${0.38 * lightningFlash})`
        : level.world === 2
        ? `rgba(254, 240, 138, ${0.35 * lightningFlash})`
        : `rgba(224, 242, 254, ${0.44 * lightningFlash})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // Celestial body (Sun / Moon / Aurora / Crimson Moon / Spotlight)
  ctx.save();
  if (level.world === 1 || level.world === 2) {
    const sunX = viewW * 0.78 - camX * 0.03;
    ctx.fillStyle = level.world === 2 ? '#fef08a' : '#fde047';
    ctx.beginPath();
    ctx.arc(sunX, 110, level.world === 2 ? 48 : 38, 0, Math.PI * 2);
    ctx.fill();
  } else if (level.world === 3) {
    // Northern Aurora waves
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
    ctx.lineWidth = 28;
    ctx.beginPath();
    for (let x = 0; x <= viewW; x += 30) {
      const y = 95 + Math.sin(x * 0.01 + t * 0.8) * 24;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (level.world === 4) {
    // Crimson Haunted Moon
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(viewW * 0.76 - camX * 0.02, 105, 42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Villain Island Searchlights sweeping sky
    for (let i = 0; i < 3; i++) {
      const baseX = (i * 380 - (camX * 0.15) % 380) + 140;
      const angle = Math.sin(t * 1.4 + i * 2) * 0.45;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.11)';
      ctx.beginPath();
      ctx.moveTo(baseX, viewH);
      ctx.lineTo(baseX + Math.tan(angle - 0.14) * viewH, 0);
      ctx.lineTo(baseX + Math.tan(angle + 0.14) * viewH, 0);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // Parallax Layer 1: Far silhouettes (Pyramids, Peaks, Castle Spires, Jungle Mountains, Fortress)
  ctx.fillStyle = pal.farHills;
  const step1 = 220;
  const off1 = -(camX * 0.18) % step1;
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  for (let x = off1 - step1; x <= viewW + step1; x += step1) {
    if (level.world === 2) {
      // Great Pyramids
      ctx.lineTo(x, viewH - 140);
      ctx.lineTo(x + step1 * 0.5, viewH - 295);
      ctx.lineTo(x + step1, viewH - 140);
    } else if (level.world === 3) {
      // Jagged Alpine Peaks
      ctx.lineTo(x, viewH - 155);
      ctx.lineTo(x + step1 * 0.45, viewH - 330);
      ctx.lineTo(x + step1, viewH - 170);
    } else if (level.world === 4) {
      // Castle Battlements
      ctx.lineTo(x, viewH - 190);
      ctx.lineTo(x + 40, viewH - 190);
      ctx.lineTo(x + 40, viewH - 285);
      ctx.lineTo(x + 95, viewH - 320);
      ctx.lineTo(x + 150, viewH - 285);
      ctx.lineTo(x + 150, viewH - 190);
      ctx.lineTo(x + step1, viewH - 190);
    } else if (level.world === 5) {
      // Industrial Radar & Fortress Towers
      ctx.lineTo(x, viewH - 180);
      ctx.lineTo(x + 30, viewH - 270);
      ctx.lineTo(x + 120, viewH - 270);
      ctx.lineTo(x + 135, viewH - 180);
      ctx.lineTo(x + step1, viewH - 180);
    } else {
      ctx.quadraticCurveTo(x + step1 * 0.5, viewH - 310, x + step1, viewH - 165);
    }
  }
  ctx.lineTo(viewW + step1, viewH);
  ctx.closePath();
  ctx.fill();

  // Animated Dark Storm Clouds & Distant Background Lightning during Boss Battles
  if (stormIntensity > 0.02) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.95, stormIntensity);
    const cloudDrift = -(t * 48 + camX * 0.12) % 240;
    for (let cx = cloudDrift - 240; cx < viewW + 260; cx += 190) {
      const cy = 32 + Math.sin(cx * 0.02 + t * 0.8) * 10;
      const cloudColor =
        lightningFlash > 0.25
          ? '#475569'
          : level.world === 2
          ? '#451a03'
          : level.world === 4
          ? '#2e1065'
          : '#0f172a';
      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.arc(cx + 48, cy - 12, 56, 0, Math.PI * 2);
      ctx.arc(cx + 104, cy + 4, 46, 0, Math.PI * 2);
      ctx.arc(cx + 148, cy - 6, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant horizon lightning bolt silhouettes during flash
    if (lightningFlash > 0.28) {
      const boltX = ((Math.floor(t * 7) * 197) % Math.max(240, viewW - 80)) + 40;
      ctx.strokeStyle = `rgba(254, 249, 195, ${lightningFlash * 0.9})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(boltX, 34);
      ctx.lineTo(boltX - 18, 95);
      ctx.lineTo(boltX + 12, 148);
      ctx.lineTo(boltX - 22, 225);
      ctx.lineTo(boltX + 6, 285);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Parallax Layer 2: Midground animated trees, waterfalls, temples, or fortress structures (reacts to wind!)
  const windForce = stormIntensity * 14 + Math.sin(t * 4.5) * stormIntensity * 8;
  const step2 = 260;
  const off2 = -(camX * 0.42) % step2;
  for (let x = off2 - step2; x <= viewW + step2; x += step2) {
    if (level.world === 1) {
      // Animated Jungle Trees & Hanging Vines swaying in wind
      const sway = Math.sin(t * 2.5 + x * 0.02) * (5 + stormIntensity * 9) + windForce;
      ctx.fillStyle = '#3f2e21';
      ctx.beginPath();
      ctx.moveTo(x + 65, viewH);
      ctx.lineTo(x + 85, viewH);
      ctx.lineTo(x + 85 + sway * 0.55, viewH - 280);
      ctx.lineTo(x + 65 + sway * 0.55, viewH - 280);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(x + 75 + sway, viewH - 290, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(x + 95 + sway, viewH - 272, 42, 0, Math.PI * 2);
      ctx.fill();
      // Waterfall strip every second tree
      if (Math.abs(Math.round((x - off2) / step2)) % 2 === 0) {
        ctx.fillStyle = 'rgba(125, 211, 252, 0.25)';
        ctx.fillRect(x + 160, viewH - 260, 44, 260);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
        const drop = (t * 140) % 45;
        for (let wy = viewH - 250 + drop; wy < viewH; wy += 45) {
          ctx.fillRect(x + 168, wy, 10, 22);
          ctx.fillRect(x + 186, (wy + 20) % viewH, 8, 18);
        }
      }
    } else if (level.world === 2) {
      // Desert sandstone pillars & wind-bent palms
      const palmSway = Math.sin(t * 3.1 + x * 0.02) * (3 + stormIntensity * 8) + windForce;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + 80, viewH - 220, 28, 220);
      ctx.fillStyle = '#15803d';
      for (let leaf = -2; leaf <= 2; leaf++) {
        ctx.beginPath();
        ctx.ellipse(x + 94 + palmSway + leaf * 16, viewH - 224, 20, 6, leaf * 0.35 + stormIntensity * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (level.world === 3) {
      // Snow-covered pine silhouettes reacting to blizzard gusts
      const pineSway = windForce * 0.6;
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.moveTo(x + 90 + pineSway, viewH - 270);
      ctx.lineTo(x + 42, viewH - 120);
      ctx.lineTo(x + 138, viewH - 120);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(x + 90 + pineSway, viewH - 270);
      ctx.lineTo(x + 68 + pineSway * 0.4, viewH - 200);
      ctx.lineTo(x + 112 + pineSway * 0.4, viewH - 200);
      ctx.closePath();
      ctx.fill();
    } else if (level.world === 4) {
      // Dead twisted trees & wall torches swaying in storm
      const deadSway = windForce * 0.45;
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x + 90, viewH);
      ctx.lineTo(x + 90 + deadSway * 0.4, viewH - 220);
      ctx.lineTo(x + 55 + deadSway, viewH - 265);
      ctx.moveTo(x + 90 + deadSway * 0.4, viewH - 200);
      ctx.lineTo(x + 130 + deadSway, viewH - 250);
      ctx.stroke();
    } else {
      // Villain Island Steel Gantries
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 70, viewH - 260, 18, 260);
      ctx.fillRect(x + 160, viewH - 260, 18, 260);
      ctx.fillRect(x + 65, viewH - 260, 120, 14);
    }
  }

  // Cave overlay dimming when inside underground cave scenery zones
  for (const zone of level.sceneryZones) {
    if (zone.style === 'cave') {
      const sx = zone.xStart - camX;
      const sw = zone.xEnd - zone.xStart;
      if (sx + sw > 0 && sx < viewW) {
        ctx.fillStyle = 'rgba(9, 13, 28, 0.56)';
        ctx.fillRect(Math.max(0, sx), 0, sw, viewH);
        // Glowing cave stalactites at ceiling
        ctx.fillStyle = level.world === 3 ? '#38bdf8' : '#334155';
        for (let cx = Math.max(zone.xStart, camX - 40); cx < Math.min(zone.xEnd, camX + viewW + 40); cx += 65) {
          ctx.beginPath();
          ctx.moveTo(cx - camX, 0);
          ctx.lineTo(cx - camX + 18, 48 + (cx % 30));
          ctx.lineTo(cx - camX + 36, 0);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

export function drawWorldForegroundWeather(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  viewW: number,
  viewH: number,
  t: number,
  stormIntensity = 0,
  lightningFlash = 0
): void {
  if (level.hasSnowfall) {
    const count = stormIntensity > 0.2 ? 64 : 42;
    const windSpeed = 28 + stormIntensity * 185;
    ctx.fillStyle = 'rgba(240, 249, 255, 0.82)';
    for (let i = 0; i < count; i++) {
      const x = ((i * 97 + t * (windSpeed + (i % 4) * 14)) % (viewW + 40)) - 20;
      const y = ((i * 53 + t * (55 + stormIntensity * 85 + (i % 3) * 18)) % (viewH + 20)) - 10;
      ctx.beginPath();
      ctx.arc(x, y, 1.8 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level.hasSandstorm || (level.world === 2 && stormIntensity > 0.15)) {
    const count = stormIntensity > 0.2 ? 44 : 26;
    ctx.fillStyle = `rgba(253, 224, 71, ${0.22 + stormIntensity * 0.16})`;
    for (let i = 0; i < count; i++) {
      const x = viewW - ((t * (320 + stormIntensity * 260) + i * 71) % (viewW + 120));
      const y = (i * 37 + Math.sin(t * 3 + i) * 14) % viewH;
      ctx.fillRect(x, y, 30 + (i % 3) * 18, 2.2);
    }
  } else if (level.hasLavaGlow) {
    const count = stormIntensity > 0.2 ? 36 : 20;
    ctx.fillStyle = 'rgba(251, 146, 60, 0.62)';
    for (let i = 0; i < count; i++) {
      const x = (i * 83 + Math.sin(t * 2.5 + i) * 24 + t * stormIntensity * 90) % viewW;
      const y = viewH - ((t * (60 + stormIntensity * 70) + i * 47) % viewH);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Intense storm diagonal rain & wind streaks during boss fights (especially Jungle, Castle, Island)
  if (stormIntensity > 0.08 && level.world !== 2 && level.world !== 3) {
    ctx.save();
    ctx.strokeStyle =
      level.world === 4
        ? `rgba(248, 113, 113, ${0.32 * stormIntensity})`
        : level.world === 5
        ? `rgba(56, 189, 248, ${0.42 * stormIntensity})`
        : `rgba(186, 230, 253, ${0.42 * stormIntensity})`;
    ctx.lineWidth = 1.6;
    const dropCount = Math.floor(32 + stormIntensity * 38);
    ctx.beginPath();
    for (let i = 0; i < dropCount; i++) {
      const rx = ((i * 89 - t * (260 + (i % 5) * 30)) % (viewW + 120) + (viewW + 120)) % (viewW + 120) - 40;
      const ry = ((i * 67 + t * (560 + (i % 4) * 50)) % (viewH + 60)) - 30;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 14, ry + 24);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Wind dust streaks sweeping across ground during any boss storm
  if (stormIntensity > 0.15) {
    ctx.fillStyle = `rgba(248, 250, 252, ${0.14 * stormIntensity})`;
    for (let i = 0; i < 12; i++) {
      const wx = viewW - ((t * 480 + i * 113) % (viewW + 160));
      const wy = viewH - 35 - (i % 4) * 28;
      ctx.fillRect(wx, wy, 48 + (i % 3) * 22, 2);
    }
  }

  // Foreground lightning flash sheen illuminating the battlefield
  if (lightningFlash > 0.04) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.22 * lightningFlash})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  p: PlatformDef,
  renderX: number,
  renderY: number
): void {
  if (p.kind === 'bridge') {
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(renderX, renderY, p.w, p.h, 4);
    ctx.fill();
    ctx.stroke();
    // Wooden plank lines
    ctx.strokeStyle = '#451a03';
    for (let px = renderX + 20; px < renderX + p.w; px += 22) {
      ctx.beginPath();
      ctx.moveTo(px, renderY);
      ctx.lineTo(px, renderY + p.h);
      ctx.stroke();
    }
    return;
  }

  if (p.kind === 'bouncy') {
    ctx.fillStyle = '#15803d';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(renderX, renderY, p.w, p.h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(renderX + 8, renderY + 3, p.w - 16, 5);
    return;
  }

  const tile = p.biomeTile ?? 'grass';
  let bodyColor = '#5c4033';
  let topColor = '#22c55e';
  if (tile === 'cave') {
    bodyColor = '#334155';
    topColor = '#64748b';
  } else if (tile === 'sand' || tile === 'temple') {
    bodyColor = '#b45309';
    topColor = '#fbbf24';
  } else if (tile === 'snow') {
    bodyColor = '#334155';
    topColor = '#f8fafc';
  } else if (tile === 'ice' || p.kind === 'ice') {
    bodyColor = '#0284c7';
    topColor = '#bae6fd';
  } else if (tile === 'stone') {
    bodyColor = '#27272a';
    topColor = '#52525b';
  } else if (tile === 'metal') {
    bodyColor = '#1e293b';
    topColor = '#38bdf8';
  }

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(renderX, renderY, p.w, p.h, 6);
  ctx.fill();
  ctx.stroke();

  // Top cap
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.roundRect(renderX, renderY, p.w, Math.min(12, p.h * 0.45), [6, 6, 2, 2]);
  ctx.fill();

  if (p.kind === 'moving') {
    // Glowing directional thruster strip on moving platforms
    ctx.fillStyle = '#facc15';
    ctx.fillRect(renderX + p.w * 0.5 - 16, renderY + p.h - 6, 32, 4);
  }
}

export function drawHazard(
  ctx: CanvasRenderingContext2D,
  h: HazardDef,
  camX: number,
  t: number
): void {
  const rx = h.x - camX;
  const ry = h.y;

  if (h.kind === 'water') {
    ctx.fillStyle = 'rgba(14, 165, 233, 0.72)';
    ctx.fillRect(rx, ry, h.w, h.h);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = rx; x <= rx + h.w; x += 14) {
      const waveY = ry + Math.sin(t * 5 + x * 0.08) * 3;
      if (x === rx) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  } else if (h.kind === 'quicksand') {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(rx, ry, h.w, h.h);
    ctx.fillStyle = '#fbbf24';
    for (let bx = rx + 12; bx < rx + h.w - 12; bx += 28) {
      const r = 3 + Math.abs(Math.sin(t * 3 + bx)) * 4;
      ctx.beginPath();
      ctx.arc(bx, ry + 8, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (h.kind === 'lava') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(rx, ry, h.w, h.h);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(rx, ry, h.w, 8 + Math.sin(t * 6) * 3);
  } else if (h.kind === 'laser') {
    const cycle = h.cycleMs ?? 2400;
    const active = ((t * 1000) % cycle) < cycle * 0.58;
    ctx.fillStyle = '#475569';
    ctx.fillRect(rx - 4, ry, h.w + 8, 8);
    ctx.fillRect(rx - 4, ry + h.h - 8, h.w + 8, 8);
    if (active) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.88)';
      ctx.fillRect(rx + h.w * 0.25, ry + 8, Math.max(4, h.w * 0.5), h.h - 16);
    }
  } else if (h.kind === 'icicle') {
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + h.w * 0.5, ry + h.h);
    ctx.lineTo(rx + h.w, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Spikes / Cactus thorns
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    const count = Math.max(2, Math.floor(h.w / 18));
    const sw = h.w / count;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + i * sw, ry + h.h);
      ctx.lineTo(rx + i * sw + sw * 0.5, ry);
      ctx.lineTo(rx + (i + 1) * sw, ry + h.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

export function drawCollectible(
  ctx: CanvasRenderingContext2D,
  c: CollectibleDef,
  camX: number,
  t: number
): void {
  const rx = c.x - camX;
  const bob = Math.sin(t * 4.5 + c.x * 0.04) * 4;
  const ry = c.y + bob;

  ctx.save();
  ctx.translate(rx, ry);

  if (c.kind === 'coin') {
    const spinW = Math.max(3, Math.abs(Math.cos(t * 5 + c.x * 0.05)) * 12);
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, spinW, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (spinW > 6) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1.5, -6, 3, 12);
    }
  } else if (c.kind === 'diamond') {
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, -3);
    ctx.lineTo(0, 15);
    ctx.lineTo(-13, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, -3);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
  } else if (c.kind === 'chest') {
    ctx.translate(0, -bob); // Chest rests solidly on ledge
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-20, -14, 40, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-20, -4, 40, 4);
    ctx.fillRect(-4, -7, 8, 10);
  } else if (c.kind === 'heart') {
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-16, -2, -12, -16, 0, -7);
    ctx.bezierCurveTo(12, -16, 16, -2, 0, 10);
    ctx.fill();
    ctx.stroke();
  } else {
    // Power-up orb
    const color =
      c.kind === 'power_fireball'
        ? '#f97316'
        : c.kind === 'power_boomerang'
        ? '#22d3ee'
        : c.kind === 'power_shield'
        ? '#3b82f6'
        : c.kind === 'power_speed'
        ? '#10b981'
        : c.kind === 'power_doublejump'
        ? '#a855f7'
        : '#facc15';
    const label =
      c.kind === 'power_fireball'
        ? 'F'
        : c.kind === 'power_boomerang'
        ? 'B'
        : c.kind === 'power_shield'
        ? 'S'
        : c.kind === 'power_speed'
        ? '⚡'
        : c.kind === 'power_doublejump'
        ? '↑↑'
        : '★';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
  }

  ctx.restore();
}

export function drawCheckpoint(
  ctx: CanvasRenderingContext2D,
  cp: CheckpointDef,
  camX: number,
  reached: boolean,
  t: number
): void {
  const rx = cp.x - camX;
  const ry = cp.y;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(rx - 3, ry - 64, 6, 64);

  const wave = Math.sin(t * 6) * 3;
  ctx.fillStyle = reached ? '#10b981' : '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(rx + 3, ry - 62);
  ctx.lineTo(rx + 34, ry - 52 + wave);
  ctx.lineTo(rx + 3, ry - 40);
  ctx.closePath();
  ctx.fill();
}
