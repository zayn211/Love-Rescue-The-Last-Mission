import { getSkinById } from '../data/shopAndAchievements';
import {
  BossId,
  EnemyType,
  HeroAnimationState,
  HeroSkinId,
  VillainHeliConfig,
  WorldId,
} from '../types/game';

export interface HeroRenderOptions {
  x: number;
  y: number;
  facing: 1 | -1;
  state: HeroAnimationState;
  animTime: number;
  skinId: HeroSkinId;
  vx: number;
  vy: number;
  invincibleTimer: number;
  shieldTimer: number;
  speedTimer: number;
  hurtFlash: number;
  emotion?: 'normal' | 'happy' | 'shocked' | 'heartbroken' | 'speaking';
  tearIntensity?: number; // 0..1
  scale?: number;
}

export function drawHero(ctx: CanvasRenderingContext2D, opts: HeroRenderOptions): void {
  const skin = getSkinById(opts.skinId);
  const scale = opts.scale ?? 1;
  const t = opts.animTime;

  ctx.save();
  ctx.translate(opts.x, opts.y);
  ctx.scale(opts.facing * scale, scale);

  // Squash & stretch
  let sx = 1;
  let sy = 1;
  if (opts.state === 'jump' || opts.state === 'doubleJump') {
    sx = 0.92;
    sy = 1.08;
  } else if (opts.state === 'land') {
    sx = 1.14;
    sy = 0.86;
  } else if (opts.state === 'hurt') {
    sx = 1.06;
    sy = 0.94;
    ctx.rotate(-0.14);
  } else if (opts.state === 'crying' || opts.state === 'dialogue') {
    const tremble = Math.sin(t * 22) * 0.6;
    ctx.translate(tremble, 2);
  }
  ctx.scale(sx, sy);

  // Double jump spin
  if (opts.state === 'doubleJump') {
    ctx.translate(0, -28);
    ctx.rotate(t * 14);
    ctx.translate(0, 28);
  }

  // Invincibility / hurt blink
  if (opts.hurtFlash > 0 && Math.floor(t * 24) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  // Speed aura
  if (opts.speedTimer > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-20 - i * 10, -42 + i * 14);
      ctx.lineTo(-36 - i * 12, -42 + i * 14);
      ctx.stroke();
    }
  }

  // Ground shadow (only when not mid-spin)
  if (opts.state !== 'doubleJump') {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const walkCycle =
    opts.state === 'run'
      ? Math.sin(t * 16)
      : opts.state === 'walk'
      ? Math.sin(t * 10)
      : 0;
  const breath = Math.sin(t * 3.5) * 1.3;
  const lean = opts.state === 'run' ? 0.14 : opts.state === 'crying' ? -0.06 : 0;

  // Flowing crimson scarf tail behind body
  const scarfWave1 = Math.sin(t * 9 - opts.vx * 0.01) * 5;
  const scarfWave2 = Math.cos(t * 11) * 6;
  ctx.fillStyle = skin.scarfColor;
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -36 + breath);
  ctx.quadraticCurveTo(-19 - Math.abs(opts.vx) * 0.03, -38 + scarfWave1, -30 - Math.abs(opts.vx) * 0.04, -30 + scarfWave2);
  ctx.quadraticCurveTo(-20, -25 + scarfWave1 * 0.6, -4, -30 + breath);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs
  const leftLegAngle = walkCycle * 0.55;
  const rightLegAngle = -walkCycle * 0.55;
  const drawLeg = (hipX: number, angle: number, darken: boolean) => {
    ctx.save();
    ctx.translate(hipX, -18);
    ctx.rotate(
      opts.state === 'jump'
        ? -0.35
        : opts.state === 'crying'
        ? 0.08
        : angle
    );
    ctx.fillStyle = darken ? '#0f172a' : skin.pantsColor;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, 13, 3);
    ctx.fill();
    ctx.stroke();
    // Boot
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.roundRect(-4.5, 11, 11, 7, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawLeg(-4, rightLegAngle, true);
  drawLeg(4, leftLegAngle, false);

  // Torso (Adventure jacket + cream tee)
  ctx.save();
  ctx.translate(0, -18 + breath * 0.5);
  ctx.rotate(lean);

  // Back arm
  ctx.save();
  ctx.translate(-7, -17);
  ctx.rotate(opts.state === 'attack' ? -0.4 : -walkCycle * 0.65);
  ctx.fillStyle = skin.jacketColor;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 14, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3c6a5';
  ctx.beginPath();
  ctx.arc(0, 15, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Shirt & Jacket
  ctx.fillStyle = skin.shirtColor;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-10, -21, 20, 22, 5);
  ctx.fill();
  ctx.stroke();

  // Jacket sides
  ctx.fillStyle = skin.jacketColor;
  ctx.beginPath();
  ctx.roundRect(-10.5, -21, 8, 22, 4);
  ctx.roundRect(2.5, -21, 8, 22, 4);
  ctx.fill();
  ctx.stroke();

  // Jacket collar trim
  ctx.fillStyle = skin.jacketTrim;
  ctx.fillRect(-10, -19, 3, 5);
  ctx.fillRect(7, -19, 3, 5);

  // Belt
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-10, -3, 20, 3.5);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-2.5, -3.5, 5, 4.5);

  // Scarf wrap around neck
  ctx.fillStyle = skin.scarfColor;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-9, -23, 18, 6.5, 3);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.save();
  const headTilt =
    opts.state === 'crying'
      ? -0.09
      : opts.state === 'dialogue'
      ? -0.14
      : opts.state === 'victory'
      ? -0.08
      : 0;
  ctx.translate(0, -24);
  ctx.rotate(headTilt);

  // Face oval
  ctx.fillStyle = '#f7cba8';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -11, 13.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.beginPath();
  ctx.ellipse(7.5, -8, 3.2, 1.8, 0, 0, Math.PI * 2);
  ctx.ellipse(-4, -8, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tousled chestnut hair (back + bangs)
  ctx.fillStyle = skin.hairColor;
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-13, -12);
  ctx.quadraticCurveTo(-16, -24, -7, -26);
  ctx.lineTo(-3, -29);
  ctx.lineTo(1, -25);
  ctx.lineTo(6, -29);
  ctx.lineTo(9, -24);
  ctx.quadraticCurveTo(15, -22, 13, -13);
  ctx.quadraticCurveTo(8, -19, 2, -17);
  ctx.lineTo(-2, -14);
  ctx.quadraticCurveTo(-8, -19, -13, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Expressive Eyes & Brows
  const emotion = opts.emotion ?? (opts.state === 'crying' ? 'heartbroken' : opts.state === 'dialogue' ? 'speaking' : opts.state === 'victory' ? 'happy' : opts.state === 'hurt' ? 'shocked' : 'normal');
  const blink = emotion === 'normal' && Math.sin(t * 2.1) > 0.96;

  const drawEye = (ex: number, ey: number, radiusX: number) => {
    if (blink) {
      ctx.strokeStyle = '#1e1b18';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - radiusX, ey);
      ctx.lineTo(ex + radiusX, ey);
      ctx.stroke();
      return;
    }
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, radiusX, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.arc(ex + 0.6, ey + (emotion === 'speaking' ? -0.6 : 0), 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex + 0.8, ey + (emotion === 'speaking' ? -0.6 : 0), 1.1, 0, Math.PI * 2);
    ctx.fill();
    // Specular shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 1.4, ey - 1.1, 0.85, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(-2.5, -11.5, 2.8);
  drawEye(6.8, -11.5, 3.0);

  // Eyebrows based on emotion
  ctx.strokeStyle = '#3b2214';
  ctx.lineWidth = 1.9;
  if (emotion === 'heartbroken' || emotion === 'speaking') {
    // Sad angled inner-up eyebrows
    ctx.beginPath();
    ctx.moveTo(-5.5, -15.5);
    ctx.lineTo(-0.5, -17.2);
    ctx.moveTo(4.5, -17.2);
    ctx.lineTo(9.8, -15.5);
    ctx.stroke();
  } else if (emotion === 'shocked') {
    ctx.beginPath();
    ctx.moveTo(-5, -17.5);
    ctx.lineTo(0, -18.2);
    ctx.moveTo(4.5, -18.2);
    ctx.lineTo(9.5, -17.5);
    ctx.stroke();
  } else {
    // Determined / happy brows
    ctx.beginPath();
    ctx.moveTo(-5, -16.5);
    ctx.lineTo(0, -15.8);
    ctx.moveTo(4.5, -15.8);
    ctx.lineTo(9.8, -16.8);
    ctx.stroke();
  }

  // Mouth based on emotion
  ctx.strokeStyle = '#5c2c1d';
  ctx.lineWidth = 1.6;
  if (emotion === 'happy') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3, -5.5, 4.2, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (emotion === 'shocked') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(3, -4.5, 2.6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (emotion === 'heartbroken') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(3, -2.8, 3.2, Math.PI + 0.25, -0.25);
    ctx.stroke();
  } else if (emotion === 'speaking') {
    const speakOpen = 1.8 + Math.abs(Math.sin(t * 14)) * 2.4;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(3, -4.5, 3.4, speakOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0.5, -5.2);
    ctx.quadraticCurveTo(3.5, -4.0, 6.2, -5.8);
    ctx.stroke();
  }

  // CLEARLY VISIBLE ANIMATED TEARS rolling down BOTH cheeks and dripping onto the ground
  const tearAmt = opts.tearIntensity ?? (opts.state === 'crying' || opts.state === 'dialogue' ? 1 : 0);
  if (tearAmt > 0.05) {
    // Glistening water pool on lower eyelids
    ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-2.5, -8.3, 2.8, 1.1, 0, 0, Math.PI * 2);
    ctx.ellipse(6.8, -8.3, 3.0, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two streams (left eye & right eye) with multiple falling teardrops
    const eyeOffsets = [-2.5, 6.8];
    eyeOffsets.forEach((ex, idx) => {
      // Shimmering tear streak down cheek
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(ex, -8);
      ctx.quadraticCurveTo(ex + 0.8, -4, ex, -0.5);
      ctx.stroke();

      // 3 staggered teardrops rolling down cheek and falling all the way to the ground!
      for (let d = 0; d < 3; d++) {
        const phase = (t * 1.45 + d * 0.33 + idx * 0.17) % 1;
        const dropY = -7.5 + phase * 48; // Travels from eye (-7.5) down past chin to ground (+40.5 in head space)
        const dropX = ex + Math.sin(phase * Math.PI * 2) * 1.1;
        const alpha = phase < 0.88 ? 0.95 : (1 - phase) * 7;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * tearAmt;
        ctx.fillStyle = '#bae6fd';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(dropX, dropY - 3.6);
        ctx.quadraticCurveTo(dropX + 2.8, dropY + 0.8, dropX, dropY + 2.5);
        ctx.quadraticCurveTo(dropX - 2.8, dropY + 0.8, dropX, dropY - 3.6);
        ctx.fill();
        ctx.stroke();

        // Splash ring when drop hits ground
        if (phase > 0.86) {
          const splashR = (phase - 0.86) * 45;
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(dropX, 41, splashR, splashR * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
  }

  ctx.restore(); // End head

  // Front Arm + Sword Attack / Victory / Crying Gesture
  ctx.save();
  ctx.translate(6, -16);
  let armAngle = walkCycle * 0.65;
  if (opts.state === 'attack') {
    armAngle = -1.6 + Math.sin(t * 28) * 1.2;
  } else if (opts.state === 'victory') {
    armAngle = -2.5;
  } else if (opts.state === 'crying') {
    armAngle = -1.75 + Math.sin(t * 10) * 0.12; // Hand raised near face/chest in grief
  } else if (opts.state === 'dialogue') {
    armAngle = -1.1 + Math.sin(t * 6) * 0.15; // Reaching out toward departing helicopter
  }
  ctx.rotate(armAngle);
  ctx.fillStyle = skin.jacketColor;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 14, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3c6a5';
  ctx.beginPath();
  ctx.arc(0, 15, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hero Blade during attack
  if (opts.state === 'attack') {
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(24, 11);
    ctx.lineTo(28, 15);
    ctx.lineTo(24, 19);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Crescent slash arc effect
  if (opts.state === 'attack') {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(14, -12, 26, -1.0, 0.9);
    ctx.stroke();
  }

  ctx.restore(); // End torso

  // Shield Aura Bubble
  if (opts.shieldTimer > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -28, 34 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Invincibility golden sparkle ring
  if (opts.invincibleTimer > 0) {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, -28, 38, t * 5, t * 5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export interface GirlfriendRenderOptions {
  x: number;
  y: number;
  facing: 1 | -1;
  animTime: number;
  tied: boolean;
  mood: 'scared' | 'crying' | 'hopeful' | 'reunited';
  scale?: number;
}

export function drawGirlfriend(ctx: CanvasRenderingContext2D, opts: GirlfriendRenderOptions): void {
  const t = opts.animTime;
  const scale = opts.scale ?? 1;

  ctx.save();
  ctx.translate(opts.x, opts.y);
  ctx.scale(opts.facing * scale, scale);

  const shiver = opts.tied ? Math.sin(t * 18) * 0.8 : 0;
  const bounce = opts.mood === 'reunited' ? Math.abs(Math.sin(t * 6)) * -4 : 0;
  ctx.translate(shiver, bounce);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing auburn wavy back hair
  ctx.fillStyle = '#9a3412';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -42);
  ctx.quadraticCurveTo(-20, -24, -13, -12);
  ctx.quadraticCurveTo(-5, -8, 10, -14);
  ctx.quadraticCurveTo(16, -28, 12, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs / Shoes
  ctx.fillStyle = '#f3c6a5';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.4;
  ctx.fillRect(-6, -13, 4.5, 11);
  ctx.strokeRect(-6, -13, 4.5, 11);
  ctx.fillRect(1.5, -13, 4.5, 11);
  ctx.strokeRect(1.5, -13, 4.5, 11);
  // Shoes
  ctx.fillStyle = '#be185d';
  ctx.beginPath();
  ctx.roundRect(-7, -4, 7, 5, 2.5);
  ctx.roundRect(0.5, -4, 7, 5, 2.5);
  ctx.fill();
  ctx.stroke();

  // Rope around ankles when tied
  if (opts.tied) {
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(7, -8);
    ctx.moveTo(-7, -5.5);
    ctx.lineTo(7, -5.5);
    ctx.stroke();
  }

  // Golden-amber dress
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-8, -32);
  ctx.lineTo(8, -32);
  ctx.lineTo(13, -11);
  ctx.quadraticCurveTo(0, -8, -13, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cream cardigan shoulders
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(-9.5, -34, 19, 13, 4);
  ctx.fill();
  ctx.stroke();

  // Arms (bound in front with rope if tied, open if freed)
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.5;
  if (opts.tied) {
    ctx.beginPath();
    ctx.roundRect(-9, -31, 6, 12, 3);
    ctx.roundRect(3, -31, 6, 12, 3);
    ctx.fill();
    ctx.stroke();
    // Braided cartoon rope around wrists
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-6, -21);
    ctx.lineTo(6, -21);
    ctx.stroke();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(-6, -21);
    ctx.lineTo(6, -21);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.beginPath();
    ctx.roundRect(-14, -34, 6, 12, 3);
    ctx.roundRect(8, -34, 6, 12, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Head
  ctx.save();
  ctx.translate(0, -45);
  ctx.fillStyle = '#f9d2b4';
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12.2, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Auburn front waves
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.quadraticCurveTo(-13, -14, 0, -14);
  ctx.quadraticCurveTo(13, -14, 12, -2);
  ctx.quadraticCurveTo(6, -9, 0, -8);
  ctx.quadraticCurveTo(-6, -9, -12, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Signature Rose-Pink Ribbon Hairband
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, -2, 11.5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  // Ribbon bow
  ctx.fillStyle = '#f472b6';
  ctx.strokeStyle = '#831843';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-9, -10, 3.5, 2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hazel Eyes
  const drawMayaEye = (ex: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, -0.5, 2.7, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.arc(ex + 0.4, -0.5, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex + 0.5, -0.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 1, -1.4, 0.75, 0, Math.PI * 2);
    ctx.fill();
  };
  drawMayaEye(-4);
  drawMayaEye(5.2);

  // Brows & Tears if scared/crying
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.5;
  if (opts.mood === 'scared' || opts.mood === 'crying') {
    ctx.beginPath();
    ctx.moveTo(-6.5, -4.5);
    ctx.lineTo(-2, -6);
    ctx.moveTo(3, -6);
    ctx.lineTo(7.5, -4.5);
    ctx.stroke();

    // Animated Maya tears
    const dropPhase = (t * 1.6) % 1;
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(-4, 2 + dropPhase * 8, 1.8, 0, Math.PI * 2);
    ctx.arc(5.2, 2 + ((dropPhase + 0.4) % 1) * 8, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Worried open mouth
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(0.6, 6, 2.4, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Hopeful or joyful smile
    ctx.strokeStyle = '#9d174d';
    ctx.beginPath();
    ctx.arc(0.6, 4.2, 3.5, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  ctx.restore(); // End head
  ctx.restore();
}

export interface EnemySpriteOptions {
  world?: WorldId;
  zombieState?: 'patrol' | 'chase' | 'windup' | 'throw' | 'hurt' | 'dying';
  stateProgress?: number; // 0..1 within windup, throw, hurt, dying
  hasSword?: boolean;
  hpRatio?: number;
}

export function isZombieEnemyType(type: EnemyType): boolean {
  return (
    type === 'zombie_basic' ||
    type === 'zombie_runner' ||
    type === 'zombie_armoured' ||
    type === 'zombie_heavy' ||
    type === 'zombie_elite' ||
    type === 'zombie_rare'
  );
}

function drawZombieSwordShape(
  ctx: CanvasRenderingContext2D,
  bladeLen: number,
  bladeW: number,
  bladeColor: string,
  edgeGlow: string,
  hiltColor: string,
  curved = false
): void {
  // Handle / grip
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-2, -1.8, 7, 3.6, 1.4);
  ctx.fill();
  ctx.stroke();

  // Pommel
  ctx.fillStyle = hiltColor;
  ctx.beginPath();
  ctx.arc(-3, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crossguard
  ctx.fillStyle = hiltColor;
  ctx.beginPath();
  ctx.roundRect(4, -5.5, 3.5, 11, 1.5);
  ctx.fill();
  ctx.stroke();

  // Metallic Blade
  ctx.fillStyle = bladeColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (curved) {
    ctx.moveTo(7.5, -bladeW * 0.45);
    ctx.quadraticCurveTo(7.5 + bladeLen * 0.6, -bladeW * 0.9, 7.5 + bladeLen, -bladeW * 0.15);
    ctx.quadraticCurveTo(7.5 + bladeLen * 0.65, bladeW * 0.45, 7.5, bladeW * 0.45);
  } else {
    ctx.moveTo(7.5, -bladeW * 0.5);
    ctx.lineTo(7.5 + bladeLen - 5, -bladeW * 0.45);
    ctx.lineTo(7.5 + bladeLen, 0);
    ctx.lineTo(7.5 + bladeLen - 5, bladeW * 0.45);
    ctx.lineTo(7.5, bladeW * 0.5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sharp highlight / enchanted edge
  ctx.strokeStyle = edgeGlow;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(9, -bladeW * 0.18);
  ctx.lineTo(7.5 + bladeLen - 4, -bladeW * 0.12);
  ctx.stroke();
}

export interface ThrownSwordRenderOptions {
  x: number;
  y: number;
  rotation: number;
  variant?: EnemyType;
  world?: WorldId;
  scale?: number;
  glowColor?: string;
  trail?: Array<{ x: number; y: number; rot: number }>;
  camX: number;
}

export function drawThrownSwordProjectile(
  ctx: CanvasRenderingContext2D,
  opts: ThrownSwordRenderOptions
): void {
  const scale = opts.scale ?? 1;
  const variant = opts.variant ?? 'zombie_basic';
  const world = opts.world ?? 1;
  const curved = variant === 'zombie_runner' || world === 2;
  const bladeLen = variant === 'zombie_heavy' ? 30 : variant === 'zombie_runner' ? 20 : 24;
  const bladeW = variant === 'zombie_heavy' ? 8.5 : 5.6;

  let bladeCol = '#e2e8f0';
  let edgeGlow = opts.glowColor ?? '#f8fafc';
  let hiltCol = '#d97706';

  if (variant === 'zombie_rare') {
    bladeCol = '#5eead4';
    edgeGlow = '#fef08a';
    hiltCol = '#facc15';
  } else if (variant === 'zombie_elite') {
    bladeCol = '#a78bfa';
    edgeGlow = '#38bdf8';
    hiltCol = '#f43f5e';
  } else if (world === 3) {
    bladeCol = '#7dd3fc';
    edgeGlow = '#e0f2fe';
    hiltCol = '#0284c7';
  } else if (world === 2) {
    bladeCol = '#fcd34d';
    edgeGlow = '#fef3c7';
    hiltCol = '#92400e';
  } else if (world === 4) {
    bladeCol = '#94a3b8';
    edgeGlow = '#fb7185';
    hiltCol = '#7f1d1d';
  } else if (world === 5) {
    bladeCol = '#94a3b8';
    edgeGlow = '#4ade80';
    hiltCol = '#dc2626';
  }

  // Fading motion trail behind spinning sword
  if (opts.trail && opts.trail.length > 0) {
    for (let i = 0; i < opts.trail.length; i++) {
      const tr = opts.trail[i];
      const alpha = ((i + 1) / (opts.trail.length + 1)) * 0.34;
      ctx.save();
      ctx.translate(tr.x - opts.camX, tr.y);
      ctx.rotate(tr.rot);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = edgeGlow;
      ctx.lineWidth = bladeW * 0.85;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(bladeLen * 0.7, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Main rotating flying sword centered around its balance point
  ctx.save();
  ctx.translate(opts.x - opts.camX, opts.y);
  ctx.scale(scale, scale);

  // Subtle spinning air-slash ring
  ctx.strokeStyle = edgeGlow;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, bladeLen * 0.62, opts.rotation, opts.rotation + Math.PI * 1.15);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.rotate(opts.rotation);
  ctx.translate(-bladeLen * 0.38, 0);
  drawZombieSwordShape(ctx, bladeLen, bladeW, bladeCol, edgeGlow, hiltCol, curved);
  ctx.restore();
}

export function drawZombieSprite(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  facing: 1 | -1,
  t: number,
  hurtFlash: number,
  options: EnemySpriteOptions = {}
): void {
  const world = options.world ?? 1;
  const zState = options.zombieState ?? 'patrol';
  const progress = options.stateProgress ?? 0;
  const hasSword = options.hasSword ?? true;

  // Variant base sizing & styling
  const scale =
    type === 'zombie_heavy'
      ? 1.24
      : type === 'zombie_armoured'
      ? 1.09
      : type === 'zombie_rare'
      ? 1.08
      : type === 'zombie_elite'
      ? 1.06
      : type === 'zombie_runner'
      ? 0.96
      : 1.0;

  let skinColor = '#7aa861';
  let shirtColor = '#3f6212';
  let pantsColor = '#1e293b';
  let eyeGlow = '#a3e635';
  let bladeColor = '#cbd5e1';
  let edgeGlow = '#f8fafc';
  let hiltColor = '#92400e';

  // World thematic palette base
  if (world === 2) {
    // Ancient mummy zombie & desert sword warrior
    skinColor = '#9aa87a';
    shirtColor = '#dfd0a8';
    pantsColor = '#78350f';
    eyeGlow = '#fbbf24';
    bladeColor = '#fcd34d';
    hiltColor = '#b45309';
  } else if (world === 3) {
    // Frozen zombie & ice sword thrower
    skinColor = '#8cb3d9';
    shirtColor = '#1e3a5f';
    pantsColor = '#0f172a';
    eyeGlow = '#38bdf8';
    bladeColor = '#7dd3fc';
    edgeGlow = '#e0f2fe';
    hiltColor = '#0284c7';
  } else if (world === 4) {
    // Dark castle skeleton/dark sword zombie
    skinColor = '#b8c4cf';
    shirtColor = '#3b0764';
    pantsColor = '#18181b';
    eyeGlow = '#f43f5e';
    bladeColor = '#94a3b8';
    edgeGlow = '#fb7185';
    hiltColor = '#7f1d1d';
  } else if (world === 5) {
    // Secret island mutant zombie & undead guard
    skinColor = '#6f9c3d';
    shirtColor = '#334155';
    pantsColor = '#111827';
    eyeGlow = '#4ade80';
    bladeColor = '#94a3b8';
    edgeGlow = '#22c55e';
    hiltColor = '#dc2626';
  }

  // Variant overrides so every zombie tier is distinct across every world
  if (type === 'zombie_runner') {
    skinColor = world === 3 ? '#7dd3fc' : '#859c87';
    eyeGlow = '#f43f5e';
  } else if (type === 'zombie_armoured') {
    shirtColor = '#475569';
    eyeGlow = '#fb923c';
  } else if (type === 'zombie_heavy') {
    skinColor = world === 3 ? '#64748b' : '#65855a';
    shirtColor = '#451a03';
    eyeGlow = '#ef4444';
  } else if (type === 'zombie_elite') {
    skinColor = '#94a3b8';
    shirtColor = '#311042';
    eyeGlow = '#38bdf8';
    bladeColor = '#a78bfa';
    edgeGlow = '#38bdf8';
    hiltColor = '#f43f5e';
  } else if (type === 'zombie_rare') {
    skinColor = '#5eead4';
    shirtColor = '#0f766e';
    eyeGlow = '#fef08a';
    bladeColor = '#2dd4bf';
    edgeGlow = '#fef08a';
    hiltColor = '#facc15';
  }

  ctx.save();
  ctx.translate(x, y);

  // Dying collapse & eerie dissolve animation
  if (zState === 'dying') {
    const slump = Math.max(0, Math.min(1, progress));
    ctx.globalAlpha = Math.max(0.08, 1 - Math.max(0, slump - 0.45) * 1.65);
    ctx.translate(facing * -slump * 14, slump * 24);
    ctx.rotate(facing * -slump * 1.25);
  }

  ctx.scale(facing * scale, scale);

  if (hurtFlash > 0) {
    ctx.filter = 'brightness(1.85)';
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rare Glowing Zombie pulsing aura
  if (type === 'zombie_rare' && zState !== 'dying') {
    ctx.save();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.75)';
    ctx.fillStyle = 'rgba(45, 212, 191, 0.14)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, -28, 22 + Math.sin(t * 8) * 2.5, 31 + Math.cos(t * 8) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const walkSpeed = type === 'zombie_runner' ? 16 : zState === 'chase' ? 11.5 : 6.8;
  const isMoving = zState === 'patrol' || zState === 'chase';
  const stride = isMoving ? Math.sin(t * walkSpeed) : 0;
  const limpBob = isMoving ? Math.abs(Math.sin(t * walkSpeed)) * -2.2 : Math.sin(t * 3.5) * 1.2;

  let bodyLean = type === 'zombie_runner' ? 0.2 : 0.06;
  if (zState === 'windup') bodyLean = -0.22;
  else if (zState === 'throw') bodyLean = 0.28;
  else if (zState === 'hurt') bodyLean = -0.28;

  // Torn trailing cloak/scarf for Elite or Runner
  if (type === 'zombie_elite' || type === 'zombie_runner' || world === 4) {
    const capeCol = type === 'zombie_elite' ? '#581c87' : type === 'zombie_runner' ? '#991b1b' : '#450a0a';
    const flutter = Math.sin(t * 9) * 4;
    ctx.fillStyle = capeCol;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, -36 + limpBob);
    ctx.lineTo(-22, -16 + flutter);
    ctx.lineTo(-16, -12 + flutter * 0.5);
    ctx.lineTo(-12, -18 + flutter);
    ctx.lineTo(-5, -22 + limpBob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Legs with tattered pants & boots
  const drawZombieLeg = (hipX: number, angle: number, dark: boolean) => {
    ctx.save();
    ctx.translate(hipX, -17);
    ctx.rotate(angle);
    ctx.fillStyle = dark ? '#0f172a' : pantsColor;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-3.8, 0, 7.6, 12, 2.5);
    ctx.fill();
    ctx.stroke();
    // Torn trouser cuff / bone ankle
    ctx.fillStyle = skinColor;
    ctx.fillRect(-2.5, 10, 5, 3);
    // Heavy boot
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.roundRect(-4, 12, 10, 5.5, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawZombieLeg(-4, -stride * 0.48, true);
  drawZombieLeg(4, stride * 0.48, false);

  // Torso group
  ctx.save();
  ctx.translate(0, -17 + limpBob);
  ctx.rotate(bodyLean);

  // Back outstretched undead arm
  ctx.save();
  ctx.translate(-5, -18);
  ctx.rotate(zState === 'windup' ? -0.9 : -1.1 + Math.sin(t * 5) * 0.16);
  ctx.fillStyle = shirtColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-3, 0, 6, 11, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.roundRect(-2.5, 9, 5, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Torso with jagged torn clothing hem
  ctx.fillStyle = shirtColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-10, -21);
  ctx.lineTo(10, -21);
  ctx.lineTo(11, 1);
  ctx.lineTo(6, -3);
  ctx.lineTo(1, 2);
  ctx.lineTo(-4, -2);
  ctx.lineTo(-10, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mummy wraps (World 2) or Ribcage / Armour plates
  if (world === 2 && type !== 'zombie_armoured') {
    ctx.strokeStyle = '#a89260';
    ctx.lineWidth = 2;
    for (let wy = -17; wy <= -5; wy += 4.5) {
      ctx.beginPath();
      ctx.moveTo(-9, wy);
      ctx.lineTo(9, wy + 2);
      ctx.stroke();
    }
  } else if (type === 'zombie_armoured' || (world === 5 && type !== 'zombie_runner')) {
    // Cracked iron/syndicate chestplate & shoulder pauldron
    ctx.fillStyle = world === 5 ? '#334155' : '#64748b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-10.5, -21, 21, 16, 4);
    ctx.fill();
    ctx.stroke();
    // Glowing chest core/rivets
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(-2, -16, 5, 5);
  } else {
    // Torn chest scar / exposed rib detail
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(2, -11, 4.5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1, -12);
    ctx.lineTo(5, -10);
    ctx.stroke();
  }

  // World 3 Frozen shoulder icicles
  if (world === 3) {
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -20);
    ctx.lineTo(-15, -29);
    ctx.lineTo(-5, -21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Head
  ctx.save();
  ctx.translate(1, -24);
  const headTilt = zState === 'hurt' ? -0.25 : zState === 'windup' ? -0.1 : 0.08 + Math.sin(t * 4) * 0.04;
  ctx.rotate(headTilt);

  // Zombie skull / face oval
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -10, 12.2, 11.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mummy head wraps in Desert Kingdom
  if (world === 2 && type !== 'zombie_elite') {
    ctx.fillStyle = '#e7d8b1';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -13, 11.8, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'zombie_armoured') {
    // Cracked iron war helmet
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -13, 12.6, Math.PI, 0);
    ctx.lineTo(13, -9);
    ctx.lineTo(-13, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'zombie_elite') {
    // Dark spiked crown / hood
    ctx.fillStyle = '#581c87';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -13);
    ctx.lineTo(-8, -26);
    ctx.lineTo(-1, -19);
    ctx.lineTo(5, -27);
    ctx.lineTo(12, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Jagged dark undead hair tufts
    ctx.fillStyle = world === 3 ? '#1e3a8a' : '#1f2937';
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(-8, -24);
    ctx.lineTo(-2, -20);
    ctx.lineTo(3, -25);
    ctx.lineTo(8, -20);
    ctx.lineTo(11, -13);
    ctx.quadraticCurveTo(0, -17, -11, -14);
    ctx.closePath();
    ctx.fill();
  }

  // Forehead stitches / scar
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(-1, -14);
  ctx.moveTo(-4.5, -17);
  ctx.lineTo(-3.5, -13.5);
  ctx.stroke();

  // Scary glowing zombie eyes
  const drawZombieEye = (ex: number, ey: number, r: number) => {
    if (zState === 'dying') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - r, ey - r);
      ctx.lineTo(ex + r, ey + r);
      ctx.moveTo(ex + r, ey - r);
      ctx.lineTo(ex - r, ey + r);
      ctx.stroke();
      return;
    }
    // Dark eye socket
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(ex, ey, r + 1.4, 0, Math.PI * 2);
    ctx.fill();
    // Glowing iris
    ctx.fillStyle = zState === 'windup' ? '#fef08a' : eyeGlow;
    ctx.beginPath();
    ctx.arc(ex + 0.5, ey, r, 0, Math.PI * 2);
    ctx.fill();
    // Pinpoint pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex + 0.8, ey, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  };

  drawZombieEye(-2.2, -10.2, 2.7);
  drawZombieEye(6.5, -10.2, 2.9);

  // Dangerous furrowed brows
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5.5, -14.5);
  ctx.lineTo(0.5, -12.5);
  ctx.moveTo(3.5, -12.5);
  ctx.lineTo(9.5, -14.8);
  ctx.stroke();

  // Snarling jagged mouth
  const mouthOpen = zState === 'windup' || zState === 'throw' ? 4.4 : 2.8;
  ctx.fillStyle = '#450a0a';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(3, -3.6, 5.2, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Jagged teeth
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-0.5, -5.6);
  ctx.lineTo(1, -3.2);
  ctx.lineTo(2.5, -5.6);
  ctx.lineTo(4.2, -3.0);
  ctx.lineTo(5.8, -5.6);
  ctx.fill();

  ctx.restore(); // End head

  // Front Sword-Throwing Arm & Held Sword
  ctx.save();
  ctx.translate(4, -17);
  let armAngle = -0.35 + Math.sin(t * 6) * 0.12;
  if (zState === 'windup') {
    // Raised high behind shoulder for clear visible warning!
    armAngle = -2.25 - Math.sin(progress * Math.PI) * 0.25;
  } else if (zState === 'throw') {
    armAngle = 0.45;
  } else if (zState === 'hurt') {
    armAngle = -0.9;
  } else if (zState === 'chase') {
    armAngle = -0.65 + Math.sin(t * 14) * 0.28;
  }

  ctx.rotate(armAngle);
  // Sleeve + forearm
  ctx.fillStyle = shirtColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-3, 0, 6, 10, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.roundRect(-2.6, 8, 5.2, 8, 2.2);
  ctx.fill();
  ctx.stroke();

  // Sword held in zombie hand (visible unless just thrown!)
  if (hasSword && zState !== 'dying') {
    ctx.save();
    ctx.translate(0, 15);
    ctx.rotate(zState === 'windup' ? -0.45 : -0.85);
    const bladeLen = type === 'zombie_heavy' ? 28 : type === 'zombie_runner' ? 19 : 23;
    const bladeW = type === 'zombie_heavy' ? 7.8 : 5.2;
    drawZombieSwordShape(
      ctx,
      bladeLen,
      bladeW,
      bladeColor,
      edgeGlow,
      hiltColor,
      type === 'zombie_runner' || world === 2
    );

    // Warning glint star at blade tip during windup!
    if (zState === 'windup') {
      const pulse = 0.6 + Math.abs(Math.sin(t * 28)) * 0.6;
      ctx.fillStyle = type === 'zombie_rare' ? '#5eead4' : '#fef08a';
      ctx.beginPath();
      ctx.arc(8 + bladeLen, 0, 4.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(8 + bladeLen, 0, 8 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore(); // End front arm
  ctx.restore(); // End torso
  ctx.restore(); // End zombie root
}

export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  facing: 1 | -1,
  t: number,
  hurtFlash: number,
  options?: EnemySpriteOptions
): void {
  if (isZombieEnemyType(type)) {
    drawZombieSprite(ctx, type, x, y, facing, t, hurtFlash, options);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  if (hurtFlash > 0) {
    ctx.filter = 'brightness(1.8)';
  }

  const bob = Math.sin(t * 7) * 2.5;

  switch (type) {
    case 'jungle_slime': {
      const squish = Math.sin(t * 6) * 2.5;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -14 + squish * 0.4, 18 - squish * 0.5, 15 + squish * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Leaf crest & angry eyes
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(-2, -29, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -15, 3.5, 0, Math.PI * 2);
      ctx.arc(6, -15, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-4, -15, 1.7, 0, Math.PI * 2);
      ctx.arc(7, -15, 1.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'jungle_boar': {
      ctx.fillStyle = '#7c2d12';
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -17 + bob * 0.4, 21, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Tusks
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(16, -12);
      ctx.lineTo(25, -20);
      ctx.lineTo(19, -9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Angry eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(11, -20, 2.8, 0, Math.PI * 2);
      ctx.fill();
      // Trotters
      const stride = Math.sin(t * 14) * 5;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-13 + stride, -6, 6, 7);
      ctx.fillRect(6 - stride, -6, 6, 7);
      break;
    }
    case 'jungle_hornet':
    case 'desert_vulture':
    case 'snow_owl':
    case 'castle_bat':
    case 'island_drone': {
      const wing = Math.sin(t * 22) * 10;
      const bodyCol =
        type === 'jungle_hornet'
          ? '#eab308'
          : type === 'desert_vulture'
          ? '#78350f'
          : type === 'snow_owl'
          ? '#e2e8f0'
          : type === 'castle_bat'
          ? '#581c87'
          : '#334155';
      // Wings
      ctx.fillStyle = type === 'island_drone' ? '#38bdf8' : 'rgba(248, 250, 252, 0.8)';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(-8, -22 + wing * 0.6, 14, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Body
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(0, -16 + bob, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Glowing eye/sensor
      ctx.fillStyle = type === 'island_drone' ? '#ef4444' : '#facc15';
      ctx.beginPath();
      ctx.arc(8, -17 + bob, 3.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'jungle_totem':
    case 'island_turret': {
      ctx.fillStyle = type === 'jungle_totem' ? '#15803d' : '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-13, -38, 26, 38, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = type === 'jungle_totem' ? '#a855f7' : '#ef4444';
      ctx.beginPath();
      ctx.arc(6, -24, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'desert_scorpion': {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, -12, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Tail stinger
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.quadraticCurveTo(-24, -36, -6, -34 + Math.sin(t * 8) * 3);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-5, -34 + Math.sin(t * 8) * 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'castle_ghost': {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -24 + bob, 14, Math.PI, 0);
      ctx.lineTo(14, -4 + bob);
      ctx.lineTo(6, -10 + bob);
      ctx.lineTo(0, -4 + bob);
      ctx.lineTo(-6, -10 + bob);
      ctx.lineTo(-14, -4 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-4, -24 + bob, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -24 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'island_mech':
    case 'snow_golem':
    case 'snow_yeti': {
      const col =
        type === 'island_mech' ? '#3f3f46' : type === 'snow_golem' ? '#38bdf8' : '#cbd5e1';
      ctx.fillStyle = col;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -46 + bob * 0.4, 32, 34, 8);
      ctx.fill();
      ctx.stroke();
      // Legs
      const step = Math.sin(t * 9) * 4;
      ctx.fillRect(-11 + step, -12, 8, 12);
      ctx.fillRect(4 - step, -12, 8, 12);
      // Visor / Eyes
      ctx.fillStyle = type === 'island_mech' ? '#ef4444' : '#0284c7';
      ctx.fillRect(0, -37 + bob * 0.4, 12, 5);
      break;
    }
    default: {
      // Humanoid armed enemies: desert_raider, desert_mummy, snow_wolf, castle_skeleton, castle_knight, island_guard, island_commando, henchman
      const armorCol =
        type === 'castle_skeleton'
          ? '#e2e8f0'
          : type === 'castle_knight'
          ? '#334155'
          : type === 'desert_raider'
          ? '#9a3412'
          : type === 'desert_mummy'
          ? '#fef3c7'
          : type === 'snow_wolf'
          ? '#94a3b8'
          : type === 'island_commando'
          ? '#7f1d1d'
          : '#1e293b';

      const leg = Math.sin(t * 11) * 5;
      ctx.fillStyle = '#111827';
      ctx.fillRect(-7 + leg, -13, 6, 13);
      ctx.fillRect(2 - leg, -13, 6, 13);

      ctx.fillStyle = armorCol;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(-11, -35, 22, 24, 5);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.fillStyle = type === 'castle_skeleton' ? '#f8fafc' : '#d6a483';
      ctx.beginPath();
      ctx.arc(0, -43, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Helmet / Visor
      ctx.fillStyle = type === 'henchman' || type === 'island_guard' || type === 'island_commando' ? '#dc2626' : '#f59e0b';
      ctx.fillRect(1, -46, 8, 4);

      // Weapon held forward
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, -26, 15, 4);
      break;
    }
  }

  ctx.restore();
}

export function drawBossSprite(
  ctx: CanvasRenderingContext2D,
  bossId: BossId,
  x: number,
  y: number,
  facing: 1 | -1,
  t: number,
  hurtFlash: number,
  attackPhase: 'idle' | 'windup' | 'charge' | 'slam' | 'special' | 'enraged_final' | 'defeat',
  scale = 1.15,
  accentColor = '#ef4444',
  hpRatio = 1,
  defeatProgress = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  // Defeat collapse & fade
  if (attackPhase === 'defeat') {
    const slump = Math.min(1, defeatProgress);
    ctx.globalAlpha = Math.max(0.1, 1 - slump * 0.85);
    ctx.translate(Math.sin(t * 42) * (1 - slump) * 6, slump * 28);
    ctx.rotate(facing * slump * 0.45);
  }

  ctx.scale(facing * scale, scale);

  if (hurtFlash > 0) {
    ctx.filter = 'brightness(1.85)';
  }

  const isRoaring =
    attackPhase === 'windup' ||
    attackPhase === 'special' ||
    attackPhase === 'enraged_final';
  const isCharging = attackPhase === 'charge';
  const breathe = Math.sin(t * (hpRatio < 0.5 ? 6.5 : 4)) * 3;
  const stride = Math.sin(t * (isCharging ? 14 : 7)) * (isCharging ? 11 : 6);
  const windupShake =
    attackPhase === 'windup' || attackPhase === 'enraged_final'
      ? Math.sin(t * 36) * 3.5
      : 0;
  ctx.translate(windupShake, attackPhase === 'slam' ? -Math.abs(Math.sin(t * 14)) * 12 : 0);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 48, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Enraged aura below 50% HP
  if (hpRatio < 0.5 && attackPhase !== 'defeat') {
    ctx.save();
    ctx.strokeStyle = hpRatio < 0.25 ? '#ef4444' : accentColor;
    ctx.globalAlpha = 0.35 + Math.sin(t * 12) * 0.2;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -56, 54, 62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const drawBossEyes = (ex: number, ey: number, eyeColor = '#ef4444', size = 4.5) => {
    if (attackPhase === 'defeat' || hurtFlash > 0) {
      // X-eyes when hurt/defeated
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ex - size, ey - size);
      ctx.lineTo(ex + size, ey + size);
      ctx.moveTo(ex + size, ey - size);
      ctx.lineTo(ex - size, ey + size);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex, ey, size + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isRoaring || hpRatio < 0.3 ? '#fef08a' : eyeColor;
    ctx.beginPath();
    ctx.arc(ex + 1, ey, size, 0, Math.PI * 2);
    ctx.fill();
    // Angry slanted brow
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ex - size - 3, ey - size - 3);
    ctx.lineTo(ex + size + 3, ey - size + 1);
    ctx.stroke();
  };

  switch (bossId) {
    case 'giant_trex': {
      // Curved heavy tail
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-18, -34 + breathe);
      ctx.quadraticCurveTo(-72, -46 + Math.sin(t * 5) * 6, -86, -24 + Math.sin(t * 5) * 8);
      ctx.quadraticCurveTo(-56, -12, -14, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#166534';
      ctx.fillRect(-16 + stride * 0.6, -24, 15, 25);
      ctx.fillRect(4 - stride * 0.6, -24, 15, 25);
      // Muscular torso + tan belly
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(-2, -52 + breathe, 32, 34, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.ellipse(10, -48 + breathe, 16, 24, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Back dorsal spikes
      ctx.fillStyle = accentColor;
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(-30 + s * 8, -74 + s * 6 + breathe);
        ctx.lineTo(-42 + s * 8, -86 + s * 6 + breathe);
        ctx.lineTo(-22 + s * 8, -64 + s * 6 + breathe);
        ctx.closePath();
        ctx.fill();
      }
      // Huge head & snapping jaw
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(4, -104 + breathe, 46, 26, 8);
      ctx.fill();
      ctx.stroke();
      const jawOpen = isRoaring ? 12 : 4;
      ctx.beginPath();
      ctx.roundRect(8, -80 + jawOpen + breathe, 38, 13, 5);
      ctx.fill();
      ctx.stroke();
      // Sharp teeth
      ctx.fillStyle = '#ffffff';
      for (let tx = 14; tx <= 40; tx += 8) {
        ctx.beginPath();
        ctx.moveTo(tx, -78 + breathe);
        ctx.lineTo(tx + 3, -71 + breathe);
        ctx.lineTo(tx + 6, -78 + breathe);
        ctx.closePath();
        ctx.fill();
      }
      if (isRoaring) {
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(32, -74 + breathe, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawBossEyes(22, -94 + breathe, accentColor, 4.5);
      break;
    }

    case 'giant_snake':
    case 'giant_sand_snake': {
      const isSand = bossId === 'giant_sand_snake';
      const bodyCol = isSand ? '#b45309' : '#16a34a';
      const bellyCol = isSand ? '#fde68a' : '#a7f3d0';
      const sway = Math.sin(t * 5.5) * 8;
      ctx.strokeStyle = isSand ? '#451a03' : '#052e16';
      ctx.lineWidth = 3;
      // Coiled lower body
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(-6, -16, 46, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(4, -36 + breathe * 0.5, 36, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Rising neck & cobra hood
      ctx.beginPath();
      ctx.moveTo(-14, -36);
      ctx.quadraticCurveTo(-22 + sway, -76, -4 + sway * 0.5, -104 + breathe);
      ctx.lineTo(24 + sway * 0.5, -104 + breathe);
      ctx.quadraticCurveTo(22 + sway, -70, 18, -36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Belly scales
      ctx.fillStyle = bellyCol;
      ctx.beginPath();
      ctx.ellipse(6 + sway * 0.4, -68 + breathe, 10, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Flared Cobra Hood + Head
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.ellipse(6 + sway * 0.5, -94 + breathe, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.roundRect(-2 + sway * 0.5, -110 + breathe, 38, 22, 10);
      ctx.fill();
      ctx.stroke();
      // Fangs & forked tongue
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(22 + sway * 0.5, -90 + breathe);
      ctx.lineTo(25 + sway * 0.5, -81 + breathe);
      ctx.lineTo(28 + sway * 0.5, -90 + breathe);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(36 + sway * 0.5, -94 + breathe);
      ctx.lineTo(50 + sway * 0.5, -92 + Math.sin(t * 18) * 3 + breathe);
      ctx.stroke();
      drawBossEyes(18 + sway * 0.5, -101 + breathe, '#fde047', 4.2);
      break;
    }

    case 'giant_crocodile': {
      ctx.fillStyle = '#047857';
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 2.8;
      // Spiked tail
      ctx.beginPath();
      ctx.moveTo(-26, -24);
      ctx.lineTo(-82, -32 + Math.sin(t * 7) * 7);
      ctx.lineTo(-28, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Heavy low armored body
      ctx.beginPath();
      ctx.ellipse(0, -34 + breathe * 0.6, 44, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Dorsal ridges
      ctx.fillStyle = accentColor;
      for (let rx = -28; rx <= 12; rx += 13) {
        ctx.beginPath();
        ctx.moveTo(rx, -56 + breathe * 0.6);
        ctx.lineTo(rx + 6, -68 + breathe * 0.6);
        ctx.lineTo(rx + 12, -56 + breathe * 0.6);
        ctx.closePath();
        ctx.fill();
      }
      // Legs
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-24 + stride * 0.5, -18, 14, 18);
      ctx.fillRect(10 - stride * 0.5, -18, 14, 18);
      // Huge snapping croc snout
      ctx.fillStyle = '#059669';
      const jawOpen = isRoaring ? 14 : 5;
      ctx.beginPath();
      ctx.roundRect(14, -56 + breathe * 0.6, 46, 16, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(14, -40 + jawOpen + breathe * 0.6, 42, 11, 5);
      ctx.fill();
      ctx.stroke();
      // Teeth
      ctx.fillStyle = '#ffffff';
      for (let tx = 22; tx <= 52; tx += 9) {
        ctx.fillRect(tx, -40 + breathe * 0.6, 4, 6);
      }
      drawBossEyes(24, -52 + breathe * 0.6, '#facc15', 4.5);
      break;
    }

    case 'giant_gorilla':
    case 'goliath_kong': {
      const isGoliath = bossId === 'goliath_kong';
      ctx.fillStyle = isGoliath ? '#3f2e21' : '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      // Legs
      ctx.fillRect(-26 + stride * 0.6, -24, 18, 25);
      ctx.fillRect(8 - stride * 0.6, -24, 18, 25);
      // Muscular torso
      ctx.beginPath();
      ctx.ellipse(0, -54 + breathe, 42, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Chest armor / silverback crest
      ctx.fillStyle = isGoliath ? '#15803d' : '#64748b';
      ctx.beginPath();
      ctx.ellipse(-28, -74 + breathe, 18, 14, -0.3, 0, Math.PI * 2);
      ctx.ellipse(28, -74 + breathe, 18, 14, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Pounding Fist Arms
      const armBeat = isRoaring ? Math.sin(t * 22) * 14 : Math.sin(t * 5) * 5;
      ctx.fillStyle = isGoliath ? '#573d2b' : '#475569';
      ctx.beginPath();
      ctx.roundRect(24, -76 + armBeat, 24, 44, 10);
      ctx.fill();
      ctx.stroke();
      // Head & roaring fangs
      ctx.beginPath();
      ctx.arc(4, -96 + breathe, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(12, -84 + breathe, 11, isRoaring ? 8 : 3, 0, 0, Math.PI * 2);
      ctx.fill();
      drawBossEyes(14, -101 + breathe, accentColor, 4.5);
      break;
    }

    case 'giant_scorpion':
    case 'scarab_titan': {
      const isTitan = bossId === 'scarab_titan';
      ctx.fillStyle = isTitan ? '#b45309' : '#92400e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      // Arched segmented stinger tail
      const stingBob = Math.sin(t * 7) * 5;
      ctx.strokeStyle = isTitan ? '#d97706' : '#b45309';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(-26, -34);
      ctx.bezierCurveTo(-74, -56, -68, -124 + stingBob, -12, -118 + stingBob);
      ctx.stroke();
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(-8, -118 + stingBob, 9, 0, Math.PI * 2);
      ctx.fill();
      // Armored exoskeleton body
      ctx.fillStyle = isTitan ? '#b45309' : '#78350f';
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-36, -68 + breathe, 74, 52, 18);
      ctx.fill();
      ctx.stroke();
      // Giant snapping pincer claw forward
      const pinch = Math.sin(t * 10) * 6;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(46, -42 + breathe, 16, 0.3 + pinch * 0.04, Math.PI * 2 - 0.3 - pinch * 0.04);
      ctx.lineTo(46, -42 + breathe);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (isTitan) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-18, -68 + breathe);
        ctx.lineTo(4, -96 + breathe);
        ctx.lineTo(24, -68 + breathe);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      drawBossEyes(22, -52 + breathe, '#22d3ee', 5);
      break;
    }

    case 'giant_sand_colossus': {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.fillRect(-24 + stride * 0.5, -24, 16, 25);
      ctx.fillRect(8 - stride * 0.5, -24, 16, 25);
      ctx.beginPath();
      ctx.roundRect(-36, -104 + breathe, 72, 84, 12);
      ctx.fill();
      ctx.stroke();
      // Glowing sandstone runes
      ctx.fillStyle = accentColor;
      ctx.fillRect(-16, -68 + breathe, 32, 8);
      ctx.fillRect(-6, -80 + breathe, 12, 32);
      // Pharaoh headdress hood
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(-26, -104 + breathe);
      ctx.lineTo(0, -124 + breathe);
      ctx.lineTo(26, -104 + breathe);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawBossEyes(14, -92 + breathe, '#fde047', 4.8);
      break;
    }

    case 'giant_ice_monster':
    case 'glacier_behemoth': {
      const isBehemoth = bossId === 'glacier_behemoth';
      ctx.fillStyle = isBehemoth ? '#0284c7' : '#0ea5e9';
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 3;
      // Legs
      ctx.fillRect(-26 + stride * 0.6, -24, 18, 24);
      ctx.fillRect(8 - stride * 0.6, -24, 18, 24);
      // Jagged crystal body
      ctx.beginPath();
      ctx.moveTo(-42, -20);
      ctx.lineTo(-34, -104 + breathe);
      ctx.lineTo(0, -124 + breathe);
      ctx.lineTo(36, -104 + breathe);
      ctx.lineTo(42, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing frost core & spikes
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(0, -82 + breathe);
      ctx.lineTo(14, -64 + breathe);
      ctx.lineTo(0, -46 + breathe);
      ctx.lineTo(-14, -64 + breathe);
      ctx.closePath();
      ctx.fill();
      drawBossEyes(14, -92 + breathe, '#e0f2fe', 5);
      break;
    }

    case 'giant_frost_dragon':
    case 'giant_dragon':
    case 'obsidian_dragon': {
      const isFrost = bossId === 'giant_frost_dragon';
      const isObsidian = bossId === 'obsidian_dragon';
      const wingCol = isFrost ? '#38bdf8' : isObsidian ? '#4c0519' : '#991b1b';
      const bodyCol = isFrost ? '#0369a1' : isObsidian ? '#18181b' : '#7f1d1d';
      const flap = Math.sin(t * 7.5) * 20;
      const hover = Math.sin(t * 3.5) * 8;
      ctx.translate(0, hover - 12);

      // Wings
      ctx.fillStyle = wingCol;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-8, -74);
      ctx.lineTo(-82, -134 + flap);
      ctx.lineTo(-46, -54);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Tail
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.moveTo(-24, -36);
      ctx.lineTo(-76, -24 + Math.sin(t * 6) * 8);
      ctx.lineTo(-22, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Torso
      ctx.beginPath();
      ctx.ellipse(0, -54 + breathe, 38, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Horned Dragon Head + Snout
      ctx.beginPath();
      ctx.roundRect(10, -106 + breathe, 46, 26, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(14, -106 + breathe);
      ctx.lineTo(2, -128 + breathe);
      ctx.lineTo(24, -106 + breathe);
      ctx.closePath();
      ctx.fill();
      if (isRoaring) {
        ctx.fillStyle = isFrost ? '#bae6fd' : '#f97316';
        ctx.beginPath();
        ctx.arc(54, -92 + breathe, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      drawBossEyes(34, -96 + breathe, isFrost ? '#e0f2fe' : '#f97316', 4.6);
      break;
    }

    case 'giant_skeleton': {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      // Dark tattered cape
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(-14, -84 + breathe);
      ctx.lineTo(-48, -12);
      ctx.lineTo(-8, -18);
      ctx.closePath();
      ctx.fill();
      // Bone legs & ribcage
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-18 + stride * 0.6, -28, 11, 28);
      ctx.fillRect(8 - stride * 0.6, -28, 11, 28);
      ctx.beginPath();
      ctx.roundRect(-24, -82 + breathe, 48, 54, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      for (let ry = -72; ry <= -42; ry += 10) {
        ctx.fillRect(-14, ry + breathe, 28, 4);
      }
      // Horned skull
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(4, -100 + breathe, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Giant bone cleaver sword
      ctx.save();
      ctx.translate(26, -54 + breathe);
      ctx.rotate(isRoaring ? -0.9 : 0.25);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, -44, 12, 48);
      ctx.strokeRect(0, -44, 12, 48);
      ctx.restore();
      drawBossEyes(14, -103 + breathe, accentColor, 4.6);
      break;
    }

    case 'giant_fire_demon': {
      // Blazing wings/flames
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-12, -74);
      ctx.lineTo(-56, -126 + Math.sin(t * 14) * 10);
      ctx.lineTo(-32, -48);
      ctx.closePath();
      ctx.fill();
      // Magma body
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3;
      ctx.fillRect(-24 + stride * 0.6, -24, 16, 24);
      ctx.fillRect(8 - stride * 0.6, -24, 16, 24);
      ctx.beginPath();
      ctx.roundRect(-34, -88 + breathe, 68, 68, 16);
      ctx.fill();
      ctx.stroke();
      // Molten chest crack
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(6, -56 + breathe, 10, 0, Math.PI * 2);
      ctx.fill();
      // Demon head + huge curved horns
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(4, -102 + breathe, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-6, -114 + breathe);
      ctx.lineTo(-26, -138 + breathe);
      ctx.lineTo(6, -118 + breathe);
      ctx.fill();
      drawBossEyes(14, -104 + breathe, '#fde047', 4.6);
      break;
    }

    case 'giant_mutant': {
      ctx.fillStyle = '#365314';
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 3;
      ctx.fillRect(-24 + stride * 0.6, -24, 16, 24);
      ctx.fillRect(8 - stride * 0.6, -24, 16, 24);
      ctx.beginPath();
      ctx.ellipse(0, -56 + breathe, 40, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Glowing toxic back crystals
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.moveTo(-24, -84 + breathe);
      ctx.lineTo(-34, -116 + breathe);
      ctx.lineTo(-8, -90 + breathe);
      ctx.closePath();
      ctx.fill();
      // Oversized mutated claw arm
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.roundRect(22, -74 + breathe, 32, 34, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(6, -96 + breathe, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawBossEyes(14, -100 + breathe, accentColor, 4.5);
      drawBossEyes(2, -106 + breathe, '#facc15', 3.2);
      break;
    }

    case 'giant_robot':
    case 'vex_fortress_mech':
    default: {
      const isVex = bossId === 'vex_fortress_mech';
      ctx.fillStyle = isVex ? '#1e293b' : '#334155';
      ctx.strokeStyle = isVex ? '#dc2626' : accentColor;
      ctx.lineWidth = 3;
      // Hydraulic legs
      ctx.fillRect(-26 + stride * 0.5, -24, 18, 24);
      ctx.fillRect(8 - stride * 0.5, -24, 18, 24);
      // Heavy Steel Chassis
      ctx.beginPath();
      ctx.roundRect(-44, -106 + breathe, 88, 86, 14);
      ctx.fill();
      ctx.stroke();
      if (isVex) {
        // Cockpit dome showing General Vex inside
        ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
        ctx.beginPath();
        ctx.arc(0, -86 + breathe, 22, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-8, -94 + breathe, 18, 6);
      } else {
        // Glowing robot cyclops visor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-16, -92 + breathe, 44, 16);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-4 + Math.sin(t * 8) * 6, -88 + breathe, 22, 8);
      }
      // Plasma cannon arm
      ctx.fillStyle = isVex ? '#dc2626' : accentColor;
      ctx.fillRect(34, -68 + breathe, 30, 16);
      if (attackPhase === 'defeat' || hurtFlash > 0) {
        drawBossEyes(10, -84 + breathe, '#ffffff', 4.5);
      }
      break;
    }
  }

  // Telegraph ring during windup or final desperation attack
  if (attackPhase === 'windup' || attackPhase === 'enraged_final') {
    ctx.strokeStyle = attackPhase === 'enraged_final' ? '#facc15' : '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -58, 64 + Math.sin(t * 25) * 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawVillainHelicopter(
  ctx: CanvasRenderingContext2D,
  config: VillainHeliConfig,
  x: number,
  y: number,
  t: number,
  carryingMaya: boolean,
  ropeDropProgress: number, // 0..1
  searchlightAlpha: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Subtle rotor tilt
  const hoverBob = Math.sin(t * 5) * 3;
  ctx.translate(0, hoverBob);

  // Searchlight beam
  if (searchlightAlpha > 0.02) {
    const grad = ctx.createLinearGradient(0, 18, 0, 260);
    grad.addColorStop(0, `rgba(254, 240, 138, ${0.42 * searchlightAlpha})`);
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-14, 22);
    ctx.lineTo(14, 22);
    ctx.lineTo(95, 250);
    ctx.lineTo(-95, 250);
    ctx.closePath();
    ctx.fill();
  }

  // Capture rig (rope ladder / claw cage / winch / tractor net)
  if (ropeDropProgress > 0.02) {
    const dropLen = ropeDropProgress * 125;
    ctx.strokeStyle = config.captureMethod === 'tractor_net' ? '#38bdf8' : '#d97706';
    ctx.lineWidth = config.captureMethod === 'claw_cage' ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(0, 28 + dropLen);
    ctx.stroke();

    if (config.captureMethod === 'rope_ladder') {
      for (let r = 20; r < dropLen; r += 18) {
        ctx.beginPath();
        ctx.moveTo(-10, 28 + r);
        ctx.lineTo(10, 28 + r);
        ctx.stroke();
      }
    } else if (config.captureMethod === 'claw_cage') {
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(-22, 28 + dropLen - 45, 44, 50);
    }

    if (carryingMaya) {
      drawGirlfriend(ctx, {
        x: 0,
        y: 28 + dropLen + 8,
        facing: -1,
        animTime: t,
        tied: true,
        mood: 'crying',
        scale: 0.9,
      });
    }
  }

  // Tail boom
  ctx.fillStyle = config.heliColor;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(30, -8);
  ctx.lineTo(118, -18);
  ctx.lineTo(124, -36);
  ctx.lineTo(132, -36);
  ctx.lineTo(126, -4);
  ctx.lineTo(30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail rotor spin
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(126, -24, 14, t * 28, t * 28 + Math.PI * 1.4);
  ctx.stroke();

  // Landing skids
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-42, 32);
  ctx.lineTo(42, 32);
  ctx.moveTo(-25, 20);
  ctx.lineTo(-28, 32);
  ctx.moveTo(25, 20);
  ctx.lineTo(28, 32);
  ctx.stroke();

  // Fuselage hull
  ctx.fillStyle = config.heliColor;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-64, 10);
  ctx.quadraticCurveTo(-68, -24, -18, -32);
  ctx.lineTo(46, -24);
  ctx.quadraticCurveTo(60, -8, 48, 18);
  ctx.lineTo(-42, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Accent stripe
  ctx.fillStyle = config.heliAccent;
  ctx.fillRect(-38, 4, 78, 7);

  // Cockpit glass with Villain silhouette inside
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.moveTo(-54, 4);
  ctx.quadraticCurveTo(-52, -18, -16, -22);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Villain bust visible inside/beside open door
  ctx.fillStyle = config.villainCoatColor;
  ctx.fillRect(-34, -12, 16, 16);
  ctx.fillStyle = config.villainSkinTone;
  ctx.beginPath();
  ctx.arc(-26, -16, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = config.villainVisorColor;
  ctx.fillRect(-31, -18, 9, 3.5);

  // Top Rotor Mast & Spinning Blades
  ctx.fillStyle = '#475569';
  ctx.fillRect(-6, -42, 12, 14);
  const bladeSpan = 108 * Math.abs(Math.cos(t * 28));
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-bladeSpan, -42);
  ctx.lineTo(bladeSpan, -42);
  ctx.stroke();
  ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, -42, 108, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (config.heliStyle === 'twin') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(42, -34, 8, 12);
    const blade2 = 75 * Math.abs(Math.sin(t * 28));
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(46 - blade2, -34);
    ctx.lineTo(46 + blade2, -34);
    ctx.stroke();
  }

  ctx.restore();
}
