import { audioEngine, MusicMood } from '../audio/AudioEngine';
import { COMBAT_WEAPONS_LIST } from '../data/shopAndAchievements';
import { getVillainForLevelEnd } from '../data/villains';
import {
  CollectibleDef,
  CombatWeaponId,
  EnemySpawnDef,
  EnemyType,
  HeroAnimationState,
  HeroSkinId,
  HudSnapshot,
  LevelConfig,
  LevelEndSummary,
  SaveData,
  VillainHeliConfig,
  WeaponId,
} from '../types/game';
import {
  drawBossSprite,
  drawEnemySprite,
  drawGirlfriend,
  drawHero,
  drawThrownSwordProjectile,
  drawVillainHelicopter,
  isZombieEnemyType,
} from './CharacterRenderer';
import {
  drawCheckpoint,
  drawCollectible,
  drawHazard,
  drawPlatform,
  drawWorldBackground,
  drawWorldForegroundWeather,
} from './WorldRenderer';

interface ActivePlatform {
  id: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  kind: LevelConfig['platforms'][number]['kind'];
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  biomeTile?: LevelConfig['platforms'][number]['biomeTile'];
}

type ZombieAiState = 'patrol' | 'chase' | 'windup' | 'throw' | 'hurt' | 'dying';

interface ActiveEnemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  patrolWidth: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  hurtFlash: number;
  dead: boolean;
  dying: boolean;
  deathTimer: number;
  rewarded: boolean;
  shootCooldown: number;
  isFlying: boolean;
  slowTimer: number;
  // Zombie-specific combat & locomotion state
  isZombie: boolean;
  zombieMode: 'chase' | 'stand';
  zombieState: ZombieAiState;
  stateTimer: number;
  windupDuration: number;
  throwAnimTimer: number;
  hurtStaggerTimer: number;
  hasSword: boolean;
  swordRegrowTimer: number;
  platformMinX: number;
  platformMaxX: number;
  detectRange: number;
  throwRange: number;
  throwCooldownBase: number;
  chaseSpeed: number;
  patrolSpeed: number;
  growlCooldown: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind:
    | 'fireball'
    | 'boomerang'
    | 'magic_bow'
    | 'ice_blaster'
    | 'energy_gun'
    | 'explosive_bomb'
    | 'enemy_shot'
    | 'boss_shot'
    | 'zombie_sword';
  life: number;
  returnToHero?: boolean;
  damage: number;
  pierceLeft?: number;
  rotation?: number;
  spinSpeed?: number;
  swordVariant?: EnemyType;
  swordScale?: number;
  glowColor?: string;
  gravity?: number;
  trail?: Array<{ x: number; y: number; rot: number }>;
}

interface LightningBolt {
  x: number;
  yTop: number;
  yBottom: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface StormHazard {
  x: number;
  yGround: number;
  warnTimer: number;
  strikeTimer: number;
  kind: 'lightning' | 'ice_spike';
}

export type BossLifecycleState =
  | 'ACTIVE'
  | 'DEFEATING'
  | 'DEFEATED'
  | 'LEVEL_PROGRESSION';

interface ActiveBoss {
  id: NonNullable<LevelConfig['boss']>['id'];
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  arenaX: number;
  arenaWidth: number;
  hurtFlash: number;
  slowTimer: number;
  scale: number;
  accentColor: string;
  phase: 'idle' | 'windup' | 'charge' | 'slam' | 'special' | 'enraged_final' | 'defeat';
  phaseTimer: number;
  attackCycleCount: number;
  finalAttackUsed: boolean;
  engaged: boolean;
  lifecycle: BossLifecycleState;
  defeating: boolean;
  defeatTimer: number;
  defeatStartedAtMs: number;
  defeatBurstTimer: number;
  defeated: boolean;
  rewardGranted: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  attackPressed: boolean;
  specialPressed: boolean;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelComplete: (summary: LevelEndSummary) => void;
  onGameOver: () => void;
}

const GRAVITY = 1550;
const JUMP_VEL = -590;
const DOUBLE_JUMP_VEL = -540;
const MOVE_SPEED = 290;

export class GameCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private level: LevelConfig;
  private saveData: SaveData;
  private callbacks: EngineCallbacks;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private paused = false;
  private finished = false;
  private totalTime = 0;

  // Player state
  private px: number;
  private py: number;
  private vx = 0;
  private vy = 0;
  private facing: 1 | -1 = 1;
  private grounded = false;
  private onIce = false;
  private inQuicksand = false;
  private jumpsRemaining = 2;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private heroState: HeroAnimationState = 'idle';
  private attackTimer = 0;
  private landTimer = 0;
  private hurtFlash = 0;
  private invulnTimer = 0;
  private stepAudioTimer = 0;

  // Stats & power-ups
  private hp = 100;
  private maxHp = 100;
  private lives = 3;
  private score = 0;
  private coins = 0;
  private diamonds = 0;
  private chestsOpened = 0;
  private enemiesDefeated = 0;
  private elapsedSec = 0;
  private equippedWeapon: CombatWeaponId;
  private weaponAmmo: Record<CombatWeaponId, number | null>;
  private weaponCooldowns: Record<CombatWeaponId, number>;
  private weaponMaxCooldowns: Record<CombatWeaponId, number>;
  private weaponRechargeTimers: Record<CombatWeaponId, number>;
  private activeSpecial: WeaponId;
  private specialAmmo = 6;
  private shieldTimer = 0;
  private speedTimer = 0;
  private invincibleTimer = 0;
  private doubleJumpBoostTimer = 0;
  private respawnX: number;
  private respawnY: number;
  private checkpointReached = false;
  private secretFoundToast: string | null = null;
  private secretToastTimer = 0;

  // World entities
  private platforms: ActivePlatform[] = [];
  private collectibles: (CollectibleDef & { collected: boolean })[] = [];
  private enemies: ActiveEnemy[] = [];
  private projectiles: Projectile[] = [];
  private lightningBolts: LightningBolt[] = [];
  private stormHazards: StormHazard[] = [];
  private stormIntensity = 0;
  private lightningFlash = 0;
  private stormThunderTimer = 2.6;
  private lightningStrikeTimer = 3.4;
  private particles: Particle[] = [];
  private reachedCheckpoints = new Set<string>();
  private boss: ActiveBoss | null = null;

  // Camera
  private camX = 0;
  private camY = 0;
  private camZoom = 1;
  private shakeTimer = 0;
  private shakeMag = 0;
  private hitstopTimer = 0;

  // Cutscene state
  private inCutscene = false;
  private cutsceneTime = 0;
  private cutsceneSubtitle = '';
  private cutsceneSpeaker: 'Leo' | 'Maya' | 'Villain' | null = null;
  private spokenVowTriggered = false;
  private villainHeli: VillainHeliConfig | null = null;
  private mayaCutsceneX = 0;
  private mayaCutsceneY = 0;
  private mayaTied = true;
  private mayaMood: 'scared' | 'crying' | 'hopeful' | 'reunited' = 'scared';
  private heliX = 0;
  private heliY = -120;
  private ropeDrop = 0;
  private carryingMaya = false;
  private henchmanX = 0;
  private henchmanY = 0;
  private showHenchman = false;
  private searchlightAlpha = 0;
  private crySoundTimer = 0;

  // Input state
  public input: InputState = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    attackPressed: false,
    specialPressed: false,
  };

  private lastHudPush = 0;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    saveData: SaveData,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    this.ctx = context;
    this.level = level;
    this.saveData = saveData;
    this.callbacks = callbacks;

    this.px = level.spawnX;
    this.py = level.spawnY;
    this.respawnX = level.spawnX;
    this.respawnY = level.spawnY;
    this.activeSpecial = saveData.equippedSpecial;
    this.equippedWeapon = saveData.equippedWeapon ?? 'sword_slash';

    this.weaponAmmo = {
      sword_slash: null,
      fireball: 10,
      boomerang: 6,
      magic_bow: 14,
      thunder_attack: 5,
      ice_blaster: 12,
      energy_gun: 18,
      explosive_bomb: 6,
    };
    this.weaponCooldowns = {
      sword_slash: 0,
      fireball: 0,
      boomerang: 0,
      magic_bow: 0,
      thunder_attack: 0,
      ice_blaster: 0,
      energy_gun: 0,
      explosive_bomb: 0,
    };
    this.weaponMaxCooldowns = {
      sword_slash: 0.28,
      fireball: 0.45,
      boomerang: 0.75,
      magic_bow: 0.36,
      thunder_attack: 1.25,
      ice_blaster: 0.42,
      energy_gun: 0.22,
      explosive_bomb: 1.1,
    };
    this.weaponRechargeTimers = {
      sword_slash: 0,
      fireball: 0,
      boomerang: 0,
      magic_bow: 0,
      thunder_attack: 0,
      ice_blaster: 0,
      energy_gun: 0,
      explosive_bomb: 0,
    };

    this.initLevelEntities();
    this.villainHeli = level.id < 50 ? getVillainForLevelEnd(level.id) : null;
  }

  private initLevelEntities(): void {
    this.platforms = this.level.platforms.map((p) => ({
      id: p.id,
      baseX: p.x,
      baseY: p.y,
      x: p.x,
      y: p.y,
      dx: 0,
      dy: 0,
      w: p.w,
      h: p.h,
      kind: p.kind,
      moveAxis: p.moveAxis,
      moveRange: p.moveRange,
      moveSpeed: p.moveSpeed,
      biomeTile: p.biomeTile,
    }));

    this.collectibles = this.level.collectibles.map((c) => ({
      ...c,
      collected: false,
    }));

    this.enemies = this.level.enemies.map((e: EnemySpawnDef, idx: number) => {
      const isZombie = isZombieEnemyType(e.type);
      const isFlying =
        e.type === 'jungle_hornet' ||
        e.type === 'desert_vulture' ||
        e.type === 'snow_owl' ||
        e.type === 'castle_bat' ||
        e.type === 'castle_ghost' ||
        e.type === 'island_drone';

      // Find supporting platform bounds so chasing zombies never walk off ledges
      let platformMinX = e.x - Math.max(40, e.patrolWidth * 0.5);
      let platformMaxX = e.x + Math.max(40, e.patrolWidth * 0.5);
      if (isZombie) {
        const sup = this.platforms.find(
          (p) => e.x >= p.x && e.x <= p.x + p.w && Math.abs(e.y - p.y) <= 14
        );
        if (sup) {
          platformMinX = sup.x + 24;
          platformMaxX = sup.x + sup.w - 24;
        }
      }

      const worldScale = this.level.world;
      let baseHp = 25;
      let patrolSpeed = 78;
      let chaseSpeed = 90;
      let detectRange = 430;
      let throwRange = 390;
      let throwCooldownBase = 2.4;
      let windupDuration = 0.54;

      if (isZombie) {
        switch (e.type) {
          case 'zombie_runner':
            baseHp = 30 + worldScale * 2;
            patrolSpeed = 68;
            chaseSpeed = 148;
            detectRange = 470;
            throwRange = 360;
            throwCooldownBase = 1.95;
            windupDuration = 0.42;
            break;
          case 'zombie_armoured':
            baseHp = 78 + worldScale * 4;
            patrolSpeed = 36;
            chaseSpeed = 64;
            detectRange = 435;
            throwRange = 385;
            throwCooldownBase = 2.65;
            windupDuration = 0.6;
            break;
          case 'zombie_heavy':
            baseHp = 92 + worldScale * 5;
            patrolSpeed = 28;
            chaseSpeed = 52;
            detectRange = 490;
            throwRange = 455;
            throwCooldownBase = 2.85;
            windupDuration = 0.66;
            break;
          case 'zombie_elite':
            baseHp = 64 + worldScale * 4;
            patrolSpeed = 58;
            chaseSpeed = 114;
            detectRange = 520;
            throwRange = 465;
            throwCooldownBase = 1.65;
            windupDuration = 0.4;
            break;
          case 'zombie_rare':
            baseHp = 85 + worldScale * 4;
            patrolSpeed = 52;
            chaseSpeed = 98;
            detectRange = 540;
            throwRange = 490;
            throwCooldownBase = 1.85;
            windupDuration = 0.52;
            break;
          default:
            baseHp = 36 + worldScale * 2;
            patrolSpeed = 44;
            chaseSpeed = 82;
            detectRange = 445;
            throwRange = 395;
            throwCooldownBase = 2.45;
            windupDuration = 0.55;
            break;
        }
      } else {
        baseHp =
          e.type === 'island_mech' ||
          e.type === 'castle_knight' ||
          e.type === 'snow_yeti' ||
          e.type === 'desert_mummy'
            ? 60
            : e.type === 'jungle_boar' || e.type === 'island_commando'
            ? 40
            : 25;
        patrolSpeed =
          e.type === 'jungle_totem' || e.type === 'island_turret'
            ? 0
            : e.type === 'snow_wolf' || e.type === 'jungle_boar'
            ? 115
            : 78;
      }

      const zMode = e.zombieMode ?? (e.type === 'zombie_heavy' ? 'stand' : 'chase');
      const mult = e.speedMultiplier ?? 1;
      const startVx = isZombie
        ? zMode === 'stand'
          ? 0
          : patrolSpeed * mult * (idx % 2 === 0 ? 1 : -1)
        : patrolSpeed * mult * (Math.random() > 0.5 ? 1 : -1);

      return {
        id: e.id,
        type: e.type,
        x: e.x,
        y: e.y,
        startX: e.x,
        startY: e.y,
        patrolWidth: e.patrolWidth,
        vx: startVx,
        vy: 0,
        facing: -1,
        hp: baseHp,
        maxHp: baseHp,
        hurtFlash: 0,
        dead: false,
        dying: false,
        deathTimer: 0,
        rewarded: false,
        shootCooldown: isZombie ? 0.95 + (idx % 4) * 0.45 + Math.random() * 0.35 : 1.4 + Math.random(),
        isFlying,
        slowTimer: 0,
        isZombie,
        zombieMode: zMode,
        zombieState: 'patrol',
        stateTimer: 0,
        windupDuration,
        throwAnimTimer: 0,
        hurtStaggerTimer: 0,
        hasSword: true,
        swordRegrowTimer: 0,
        platformMinX,
        platformMaxX,
        detectRange,
        throwRange,
        throwCooldownBase,
        chaseSpeed: chaseSpeed * mult,
        patrolSpeed: patrolSpeed * mult,
        growlCooldown: 0.4 + (idx % 3) * 0.8,
      };
    });

    if (this.level.boss) {
      const b = this.level.boss;
      this.boss = {
        id: b.id,
        name: b.name,
        title: b.title,
        x: b.spawnX,
        y: this.level.finishY,
        vx: -85,
        vy: 0,
        facing: -1,
        hp: b.maxHp,
        maxHp: b.maxHp,
        arenaX: b.arenaX,
        arenaWidth: b.arenaWidth,
        hurtFlash: 0,
        slowTimer: 0,
        scale: b.scale ?? 1.18,
        accentColor: b.accentColor ?? '#ef4444',
        phase: 'idle',
        phaseTimer: 1.5,
        attackCycleCount: 0,
        finalAttackUsed: false,
        engaged: false,
        lifecycle: 'ACTIVE',
        defeating: false,
        defeatTimer: 0,
        defeatStartedAtMs: 0,
        defeatBurstTimer: 0,
        defeated: false,
        rewardGranted: false,
        rewardCoins: b.rewardCoins,
        rewardDiamonds: b.rewardDiamonds,
      };
    }

    this.mayaCutsceneX = this.level.finishX + 85;
    this.mayaCutsceneY = this.level.finishY;
    this.mayaTied = true;
    this.mayaMood = 'scared';
  }

  public start(): void {
    const worldMood = `world${this.level.world}` as MusicMood;
    audioEngine.setMusicMood(worldMood);
    this.lastTimestamp = performance.now();
    this.pushHud(true);
    const loop = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Number.isFinite(rawDt) ? Math.max(0, Math.min(rawDt, 0.05)) : 1 / 60;

      try {
        if (!this.paused && !this.finished) {
          this.update(dt);
        }
        this.render();
      } catch (err) {
        console.error('Game loop frame error:', err);
      }

      if (!this.finished) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    audioEngine.stopHelicopterRotor();
  }

  public setPaused(p: boolean): void {
    this.paused = p;
    if (p) {
      audioEngine.setHelicopterIntensity(0);
    }
  }

  public updateSaveData(next: SaveData): void {
    this.saveData = next;
    this.activeSpecial = next.equippedSpecial;
    if (next.unlockedWeapons.includes(next.equippedWeapon)) {
      this.equippedWeapon = next.equippedWeapon;
    }
  }

  public selectWeapon(weaponId: CombatWeaponId): void {
    if (this.saveData.unlockedWeapons.includes(weaponId)) {
      this.equippedWeapon = weaponId;
      this.pushHud(true);
    }
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.canvas.width = Math.round(width);
    this.canvas.height = Math.round(height);
    this.updateCamera(1);
    this.render();
  }

  private getWorldScale(): number {
    const w = this.canvas.width || 960;
    const h = this.canvas.height || 560;
    if (w >= h) {
      // Landscape: fit vertical 560px world cleanly across full height
      return Math.max(0.48, h / 560);
    }
    // Portrait: preserve >= 450 logical horizontal units so player sees upcoming platforms & enemies
    return Math.max(0.45, Math.min(w / 450, h / 620));
  }

  public skipCutsceneIfAllowed(): void {
    if (this.inCutscene && this.cutsceneTime >= 11.2 && !this.finished) {
      this.completeLevelNow();
    }
  }

  private update(dt: number): void {
    this.totalTime += dt;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.secretToastTimer > 0) {
      this.secretToastTimer -= dt;
      if (this.secretToastTimer <= 0) this.secretFoundToast = null;
    }

    this.updatePlatforms(dt);
    this.updateParticles(dt);
    this.updateWeaponCooldownsAndRecharge(dt);
    this.updateStormAndLightning(dt);

    if (this.inCutscene) {
      this.updateCutscene(dt);
      this.pushHud();
      return;
    }

    this.elapsedSec += dt;
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateCollectiblesAndCheckpoints();
    this.updateCamera(dt);

    // Check trigger for end-of-level finish cutscene (after giant boss HP hits zero / defeat completes)
    const bossPathUnlocked = !this.boss || this.boss.lifecycle !== 'ACTIVE';
    if (bossPathUnlocked && this.px >= this.level.finishX - 190) {
      if (this.boss && this.boss.lifecycle === 'DEFEATING') {
        this.finalizeBossDefeat();
      }
      this.beginFinishCutscene();
    }

    this.pushHud();
  }

  private updatePlatforms(dt: number): void {
    for (const p of this.platforms) {
      if (p.kind !== 'moving') {
        p.dx = 0;
        p.dy = 0;
        continue;
      }
      const prevX = p.x;
      const prevY = p.y;
      const speed = p.moveSpeed ?? 1.4;
      const range = p.moveRange ?? 120;
      const offset = (Math.sin(this.totalTime * speed) * 0.5 + 0.5) * range;
      if (p.moveAxis === 'y') {
        p.y = p.baseY - offset;
      } else {
        p.x = p.baseX + offset;
      }
      p.dx = p.x - prevX;
      p.dy = p.y - prevY;
      void dt;
    }
  }

  private updatePlayer(dt: number): void {
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.landTimer > 0) this.landTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.speedTimer > 0) this.speedTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.doubleJumpBoostTimer > 0) this.doubleJumpBoostTimer -= dt;

    // Input buffering & coyote time
    if (this.input.jumpPressed) {
      this.jumpBufferTimer = 0.13;
      this.input.jumpPressed = false;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    if (this.grounded) {
      this.coyoteTimer = 0.11;
      this.jumpsRemaining = this.doubleJumpBoostTimer > 0 ? 3 : 2;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    const sens = this.saveData.settings.controlSensitivity;
    const speedBonus =
      (this.speedTimer > 0 ? 1.38 : 1) *
      (1 + (this.saveData.weaponLevels.speed_surge - 1) * 0.05) *
      (this.inQuicksand ? 0.52 : 1);
    const maxSpeed = MOVE_SPEED * speedBonus * Math.max(0.8, Math.min(1.25, sens));

    const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    if (moveDir !== 0) {
      this.facing = moveDir > 0 ? 1 : -1;
      const accel = this.onIce ? 620 : 2100;
      const targetVx = moveDir * maxSpeed;
      if (this.vx < targetVx) this.vx = Math.min(targetVx, this.vx + accel * dt);
      else if (this.vx > targetVx) this.vx = Math.max(targetVx, this.vx - accel * dt);
    } else {
      const friction = this.onIce ? 260 : 1900;
      if (this.vx > 0) this.vx = Math.max(0, this.vx - friction * dt);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + friction * dt);
    }

    // Jump & Double Jump
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        this.vy = this.inQuicksand ? JUMP_VEL * 0.85 : JUMP_VEL;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpsRemaining = (this.doubleJumpBoostTimer > 0 ? 3 : 2) - 1;
        this.heroState = 'jump';
        audioEngine.playSfx('jump');
        this.spawnDust(this.px, this.py, 5, '#e2e8f0');
      } else if (this.jumpsRemaining > 0) {
        this.vy = DOUBLE_JUMP_VEL;
        this.jumpsRemaining--;
        this.jumpBufferTimer = 0;
        this.heroState = 'doubleJump';
        audioEngine.playSfx('double_jump');
        this.spawnDust(this.px, this.py - 10, 8, '#7dd3fc');
      }
    }

    // Variable jump height cut when jump released early
    if (!this.input.jumpHeld && this.vy < -220) {
      this.vy += GRAVITY * 1.4 * dt;
    }

    // Attack using ONLY the currently selected weapon from the Dynamic Inventory
    if (this.input.attackPressed) {
      this.input.attackPressed = false;
      this.executeSelectedWeapon(this.equippedWeapon);
    }

    // Secondary Special key (keyboard K/X/E) also triggers selected weapon or shield/speed utility
    if (this.input.specialPressed) {
      this.input.specialPressed = false;
      if (this.activeSpecial === 'shield_aura' || this.activeSpecial === 'speed_surge') {
        this.triggerSpecialAbility();
      } else {
        this.executeSelectedWeapon(this.equippedWeapon);
      }
    }

    // Gravity
    this.vy = Math.min(820, this.vy + (this.inQuicksand ? GRAVITY * 0.35 : GRAVITY) * dt);

    // Move X + Arena Bounds (Cannot skip past ACTIVE giant boss; unlocks immediately when boss is defeated!)
    this.px += this.vx * dt;
    if (this.px < 24) this.px = 24;
    if (this.boss && this.boss.lifecycle === 'ACTIVE') {
      const maxX = this.boss.arenaX + this.boss.arenaWidth - 32;
      if (this.px > maxX) this.px = maxX;
      if (this.boss.engaged) {
        const minX = this.boss.arenaX + 20;
        if (this.px < minX) this.px = minX;
      }
    }
    this.px = Math.min(this.level.width - 30, this.px);

    // Move Y & Platform Collisions
    const prevY = this.py;
    const wasGrounded = this.grounded;
    this.py += this.vy * dt;
    this.grounded = false;
    this.onIce = false;

    const halfW = 14;
    for (const p of this.platforms) {
      if (this.px + halfW > p.x && this.px - halfW < p.x + p.w) {
        // Landing on top of platform
        if (this.vy >= 0 && prevY <= p.y + 12 && this.py >= p.y) {
          this.py = p.y;
          this.vy = 0;
          this.grounded = true;
          this.onIce = p.kind === 'ice';
          // Carry player on moving platform
          this.px += p.dx;
          this.py += p.dy;

          if (p.kind === 'bouncy') {
            this.vy = -760;
            this.grounded = false;
            this.jumpsRemaining = 1;
            audioEngine.playSfx('double_jump');
            this.spawnDust(this.px, this.py, 7, '#4ade80');
          } else if (!wasGrounded) {
            this.landTimer = 0.14;
            audioEngine.playSfx('land');
            this.spawnDust(this.px, this.py, 4, '#cbd5e1');
          }
          break;
        }
      }
    }

    // Hazard checks
    this.inQuicksand = false;
    for (const h of this.level.hazards) {
      if (h.kind === 'laser') {
        const cycle = h.cycleMs ?? 2400;
        const active = ((this.totalTime * 1000) % cycle) < cycle * 0.58;
        if (!active) continue;
      }
      let hy = h.y;
      if (h.kind === 'icicle') {
        // Animated falling icicle cycle
        const cycle = (this.totalTime * 190 + h.x) % 420;
        hy = h.y + (cycle > 140 ? (cycle - 140) * 1.4 : 0);
      }
      if (
        this.px + 10 > h.x &&
        this.px - 10 < h.x + h.w &&
        this.py > hy &&
        this.py - 46 < hy + h.h
      ) {
        if (h.kind === 'quicksand') {
          this.inQuicksand = true;
          if (this.py > h.y + h.h - 10) {
            this.damagePlayer(25, true);
          }
        } else if (h.kind === 'water' || h.kind === 'lava') {
          this.damagePlayer(35, true);
        } else {
          this.damagePlayer(20, false);
        }
      }
    }

    // Fall into abyss
    if (this.py > this.level.height + 90) {
      this.damagePlayer(35, true);
    }

    // Footstep sound while running on ground
    if (this.grounded && Math.abs(this.vx) > 40) {
      this.stepAudioTimer -= dt;
      if (this.stepAudioTimer <= 0) {
        this.stepAudioTimer = Math.abs(this.vx) > 200 ? 0.22 : 0.34;
        const stepSfx =
          this.level.world === 2
            ? 'footstep_sand'
            : this.level.world === 3
            ? 'footstep_ice'
            : this.level.world === 4
            ? 'footstep_stone'
            : this.level.world === 5
            ? 'footstep_metal'
            : 'footstep_grass';
        audioEngine.playSfx(stepSfx);
      }
    }

    // Determine hero animation state
    if (this.attackTimer > 0) {
      this.heroState = 'attack';
    } else if (this.hurtFlash > 0.36) {
      this.heroState = 'hurt';
    } else if (!this.grounded) {
      if (this.heroState !== 'doubleJump') this.heroState = 'jump';
    } else if (this.landTimer > 0) {
      this.heroState = 'land';
    } else if (Math.abs(this.vx) > 190) {
      this.heroState = 'run';
    } else if (Math.abs(this.vx) > 20) {
      this.heroState = 'walk';
    } else {
      this.heroState = 'idle';
    }
  }

  private updateWeaponCooldownsAndRecharge(dt: number): void {
    for (const def of COMBAT_WEAPONS_LIST) {
      const id = def.id as CombatWeaponId;
      if (this.weaponCooldowns[id] > 0) {
        this.weaponCooldowns[id] = Math.max(0, this.weaponCooldowns[id] - dt);
      }
      const curAmmo = this.weaponAmmo[id];
      if (def.maxAmmo !== null && def.rechargeSec !== null && curAmmo !== null && curAmmo < def.maxAmmo) {
        this.weaponRechargeTimers[id] += dt;
        if (this.weaponRechargeTimers[id] >= def.rechargeSec) {
          this.weaponRechargeTimers[id] = 0;
          this.weaponAmmo[id] = curAmmo + 1;
        }
      }
    }
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].life -= dt;
      if (this.lightningBolts[i].life <= 0) this.lightningBolts.splice(i, 1);
    }
  }

  private executeSelectedWeapon(weaponId: CombatWeaponId): void {
    if (this.weaponCooldowns[weaponId] > 0) return;
    const ammo = this.weaponAmmo[weaponId];
    if (ammo !== null && ammo <= 0) {
      // Out of ammo, show spark cue; recharging automatically
      this.spawnDust(this.px + this.facing * 14, this.py - 28, 3, '#94a3b8');
      return;
    }

    const def = COMBAT_WEAPONS_LIST.find((w) => w.id === weaponId);
    const lvl = this.saveData.weaponLevels[weaponId] ?? 1;
    const cd = def?.cooldownSec ?? 0.35;
    this.weaponCooldowns[weaponId] = cd;
    if (ammo !== null) {
      this.weaponAmmo[weaponId] = ammo - 1;
    }

    this.attackTimer = 0.24;
    this.heroState = 'attack';

    switch (weaponId) {
      case 'sword_slash': {
        audioEngine.playSfx('sword_slash');
        this.performMeleeHit();
        break;
      }
      case 'fireball': {
        const dmg = 34 + (lvl - 1) * 10;
        this.projectiles.push({
          x: this.px + this.facing * 22,
          y: this.py - 28,
          vx: this.facing * 490,
          vy: 0,
          kind: 'fireball',
          life: 1.4,
          damage: dmg,
        });
        audioEngine.playSfx('fireball');
        break;
      }
      case 'boomerang': {
        const dmg = 28 + (lvl - 1) * 9;
        this.projectiles.push({
          x: this.px + this.facing * 20,
          y: this.py - 28,
          vx: this.facing * 450,
          vy: 0,
          kind: 'boomerang',
          life: 1.6,
          returnToHero: false,
          damage: dmg,
        });
        audioEngine.playSfx('boomerang');
        break;
      }
      case 'magic_bow': {
        const dmg = 30 + (lvl - 1) * 9;
        this.projectiles.push({
          x: this.px + this.facing * 22,
          y: this.py - 30,
          vx: this.facing * 680,
          vy: -18,
          kind: 'magic_bow',
          life: 1.15,
          damage: dmg,
          pierceLeft: 2,
        });
        audioEngine.playSfx('magic_bow');
        this.spawnDust(this.px + this.facing * 20, this.py - 30, 5, '#c084fc');
        break;
      }
      case 'thunder_attack': {
        const dmg = 52 + (lvl - 1) * 14;
        // Strike nearest enemy ahead (within 320px), else 170px ahead of Leo
        let targetX = this.px + this.facing * 170;
        let targetY = this.py;
        let bestDist = 340;
        for (const e of this.enemies) {
          if (e.dead || e.dying) continue;
          const dist = Math.abs(e.x - this.px);
          if (Math.sign(e.x - this.px) === this.facing && dist < bestDist) {
            bestDist = dist;
            targetX = e.x;
            targetY = e.y;
          }
        }
        if (this.boss && this.boss.lifecycle === 'ACTIVE') {
          const bDist = Math.abs(this.boss.x - this.px);
          if (bDist < 360) {
            targetX = this.boss.x;
            targetY = this.boss.y;
          }
        }

        this.lightningBolts.push({
          x: targetX,
          yTop: targetY - 360,
          yBottom: targetY,
          life: 0.28,
        });
        audioEngine.playSfx('thunder_attack');
        this.triggerShake(6, 0.18);
        this.spawnDust(targetX, targetY - 12, 16, '#facc15');

        for (const e of this.enemies) {
          if (!e.dead && !e.dying && Math.abs(e.x - targetX) < 82 && Math.abs(e.y - targetY) < 95) {
            this.damageEnemy(e, dmg);
          }
        }
        if (this.boss && this.boss.lifecycle === 'ACTIVE') {
          if (Math.abs(this.boss.x - targetX) < 110 * this.boss.scale) {
            this.damageBoss(dmg);
          }
        }
        break;
      }
      case 'ice_blaster': {
        const dmg = 26 + (lvl - 1) * 8;
        this.projectiles.push({
          x: this.px + this.facing * 22,
          y: this.py - 28,
          vx: this.facing * 530,
          vy: 0,
          kind: 'ice_blaster',
          life: 1.25,
          damage: dmg,
        });
        audioEngine.playSfx('ice_blaster');
        this.spawnDust(this.px + this.facing * 18, this.py - 28, 6, '#7dd3fc');
        break;
      }
      case 'energy_gun': {
        const dmg = 22 + (lvl - 1) * 7;
        this.projectiles.push({
          x: this.px + this.facing * 24,
          y: this.py - 27,
          vx: this.facing * 790,
          vy: 0,
          kind: 'energy_gun',
          life: 0.9,
          damage: dmg,
        });
        audioEngine.playSfx('energy_gun');
        break;
      }
      case 'explosive_bomb': {
        const dmg = 64 + (lvl - 1) * 16;
        this.projectiles.push({
          x: this.px + this.facing * 18,
          y: this.py - 34,
          vx: this.facing * 280,
          vy: -320,
          kind: 'explosive_bomb',
          life: 1.15,
          damage: dmg,
        });
        audioEngine.playSfx('explosive_bomb');
        break;
      }
    }
  }

  private performMeleeHit(): void {
    const bladeLvl = this.saveData.weaponLevels.sword_slash;
    const range = 62 + (bladeLvl - 1) * 7;
    const dmg = 28 + (bladeLvl - 1) * 8;
    const hitCenterX = this.px + this.facing * (range * 0.55);

    let hitAny = false;
    for (const e of this.enemies) {
      if (e.dead || e.dying) continue;
      if (Math.abs(e.x - hitCenterX) < range * 0.65 && Math.abs(e.y - this.py) < 62) {
        this.damageEnemy(e, dmg);
        hitAny = true;
      }
    }

    // Sword slash can also deflect/shatter incoming thrown zombie swords!
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (!pr || pr.kind !== 'zombie_sword') continue;
      if (Math.abs(pr.x - hitCenterX) < range * 0.65 && Math.abs(pr.y - (this.py - 28)) < 46) {
        this.spawnDust(pr.x, pr.y, 9, '#fef08a');
        audioEngine.playSfx('sword_clash');
        this.score += 15;
        this.projectiles.splice(i, 1);
        hitAny = true;
      }
    }

    if (this.boss && this.boss.lifecycle === 'ACTIVE') {
      const reach = range + 38 * this.boss.scale;
      if (Math.abs(this.boss.x - hitCenterX) < reach && Math.abs(this.boss.y - this.py) < 120 * this.boss.scale) {
        this.damageBoss(dmg);
        hitAny = true;
      }
    }

    if (hitAny && (!this.boss || this.boss.lifecycle === 'ACTIVE')) {
      this.hitstopTimer = 0.04;
      this.triggerShake(4, 0.12);
    }
  }

  private triggerSpecialAbility(): void {
    const spec = this.activeSpecial;
    if (spec === 'shield_aura') {
      this.shieldTimer = 6 + this.saveData.weaponLevels.shield_aura;
      audioEngine.playSfx('shield');
      this.spawnDust(this.px, this.py - 28, 12, '#38bdf8');
      return;
    }
    if (spec === 'speed_surge') {
      this.speedTimer = 6 + this.saveData.weaponLevels.speed_surge;
      audioEngine.playSfx('speed');
      this.spawnDust(this.px, this.py - 20, 10, '#10b981');
      return;
    }
    this.executeSelectedWeapon(this.equippedWeapon);
  }

  private hasZombieLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const midY = (y1 + y2) * 0.5;
    for (const p of this.platforms) {
      if (p.kind !== 'solid' && p.kind !== 'ice' && p.kind !== 'secret_wall') continue;
      if (p.h < 28) continue;
      if (p.x > minX + 14 && p.x + p.w < maxX - 14 && midY > p.y + 4 && midY < p.y + p.h - 4) {
        return false;
      }
    }
    return true;
  }

  private spawnZombieSword(e: ActiveEnemy): void {
    const dx = this.px - e.x;
    const dy = this.py - 26 - (e.y - 28);
    const dir: 1 | -1 = dx >= 0 ? 1 : -1;
    e.facing = dir;

    let speed = 300;
    let damage = 13;
    let gravity = 80;
    let spinSpeed = 16;
    let swordScale = 1.0;
    let glowColor = '#f8fafc';

    switch (e.type) {
      case 'zombie_runner':
        speed = 345;
        damage = 12;
        gravity = 55;
        spinSpeed = 21;
        swordScale = 0.92;
        glowColor = '#fda4af';
        break;
      case 'zombie_armoured':
        speed = 315;
        damage = 16;
        gravity = 105;
        spinSpeed = 15;
        swordScale = 1.08;
        glowColor = '#fdba74';
        break;
      case 'zombie_heavy':
        speed = 270;
        damage = 22;
        gravity = 230;
        spinSpeed = 12;
        swordScale = 1.32;
        glowColor = '#f87171';
        break;
      case 'zombie_elite':
        speed = 385;
        damage = 17;
        gravity = 40;
        spinSpeed = 23;
        swordScale = 1.08;
        glowColor = '#38bdf8';
        break;
      case 'zombie_rare':
        speed = 405;
        damage = 19;
        gravity = 50;
        spinSpeed = 24;
        swordScale = 1.12;
        glowColor = '#5eead4';
        break;
      default:
        speed = 295;
        damage = 13;
        gravity = 85;
        spinSpeed = 16;
        swordScale = 1.0;
        glowColor = '#e2e8f0';
        break;
    }

    const absDx = Math.max(40, Math.abs(dx));
    const flightTime = absDx / speed;
    // Compensate slightly for gravity so thrown swords arc cleanly toward hero height
    const vyAim = Math.max(-240, Math.min(180, dy / Math.max(0.2, flightTime) - 0.5 * gravity * flightTime));

    this.projectiles.push({
      x: e.x + dir * 20,
      y: e.y - 30,
      vx: dir * speed,
      vy: vyAim,
      kind: 'zombie_sword',
      life: 2.6,
      damage,
      rotation: 0,
      spinSpeed: dir * spinSpeed,
      swordVariant: e.type,
      swordScale,
      glowColor,
      gravity,
      trail: [],
    });

    // Rare Glowing Zombie special attack: fires a second high-arc glowing spectral blade!
    if (e.type === 'zombie_rare') {
      this.projectiles.push({
        x: e.x + dir * 20,
        y: e.y - 38,
        vx: dir * (speed * 0.86),
        vy: vyAim - 135,
        kind: 'zombie_sword',
        life: 2.7,
        damage: 16,
        rotation: 1.1,
        spinSpeed: dir * 26,
        swordVariant: 'zombie_rare',
        swordScale: 1.04,
        glowColor: '#fef08a',
        gravity: 220,
        trail: [],
      });
      this.spawnDust(e.x + dir * 18, e.y - 30, 10, '#2dd4bf');
    }

    audioEngine.playSfx('zombie_sword_throw');
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;
      if (e.slowTimer > 0) e.slowTimer -= dt;

      // Dying animation: collapse & dissolve, zero attacks/collision
      if (e.dying) {
        e.deathTimer -= dt;
        e.zombieState = 'dying';
        if (Math.random() < 0.35) {
          this.spawnDust(
            e.x + (Math.random() - 0.5) * 24,
            e.y - 16 - Math.random() * 20,
            2,
            e.type === 'zombie_rare' ? '#2dd4bf' : '#84cc16'
          );
        }
        if (e.deathTimer <= 0) {
          e.dead = true;
        }
        continue;
      }

      const slowFactor = e.slowTimer > 0 ? 0.42 : 1;

      if (e.isZombie) {
        if (e.hurtStaggerTimer > 0) e.hurtStaggerTimer -= dt;
        if (e.throwAnimTimer > 0) e.throwAnimTimer -= dt;
        if (e.growlCooldown > 0) e.growlCooldown -= dt;
        if (e.shootCooldown > 0) e.shootCooldown -= dt * slowFactor;
        if (e.swordRegrowTimer > 0) {
          e.swordRegrowTimer -= dt;
          if (e.swordRegrowTimer <= 0) {
            e.hasSword = true;
          }
        }

        if (e.hurtStaggerTimer > 0) {
          e.zombieState = 'hurt';
          e.x = Math.max(e.platformMinX, Math.min(e.platformMaxX, e.x + e.vx * dt));
          e.vx *= Math.max(0, 1 - dt * 8);
        } else if (e.zombieState === 'windup') {
          e.facing = this.px < e.x ? -1 : 1;
          e.stateTimer -= dt * slowFactor;
          if (e.stateTimer <= 0) {
            if (!this.inCutscene) {
              this.spawnZombieSword(e);
            }
            e.zombieState = 'throw';
            e.throwAnimTimer = 0.26;
            e.hasSword = false;
            e.swordRegrowTimer = 0.48;
            e.shootCooldown = e.throwCooldownBase * (0.85 + Math.random() * 0.3);
          }
        } else if (e.throwAnimTimer > 0) {
          e.zombieState = 'throw';
        } else {
          const dx = this.px - e.x;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(this.py - e.y);
          const noticed = !this.inCutscene && absDx >= 26 && absDx <= e.detectRange && absDy < 185;

          if (noticed) {
            e.facing = dx < 0 ? -1 : 1;
            if (e.growlCooldown <= 0 && absDx < 450) {
              e.growlCooldown = 4.2 + Math.random() * 2.2;
              audioEngine.playSfx('zombie_growl');
            }

            const hasLos = this.hasZombieLineOfSight(e.x, e.y - 28, this.px, this.py - 28);
            if (e.shootCooldown <= 0 && absDx <= e.throwRange && hasLos) {
              e.zombieState = 'windup';
              e.stateTimer = e.windupDuration;
              e.vx = 0;
              if (e.growlCooldown <= 2.4 && absDx < 440) {
                e.growlCooldown = 3.8;
                audioEngine.playSfx('zombie_growl');
              }
            } else if (e.zombieMode === 'chase' && absDx > 78) {
              e.zombieState = 'chase';
              const step = e.facing * e.chaseSpeed * slowFactor * dt;
              const nextX = e.x + step;
              if (nextX >= e.platformMinX && nextX <= e.platformMaxX) {
                e.x = nextX;
              }
            } else {
              e.zombieState = 'patrol';
            }
          } else {
            e.zombieState = 'patrol';
            if (e.zombieMode === 'chase' && e.patrolSpeed > 0) {
              if (Math.abs(e.vx) < 10) {
                e.vx = e.facing * e.patrolSpeed;
              }
              e.x += e.vx * slowFactor * dt;
              const pMin = Math.max(e.platformMinX, e.startX - e.patrolWidth * 0.5);
              const pMax = Math.min(e.platformMaxX, e.startX + e.patrolWidth * 0.5);
              if (e.x <= pMin) {
                e.x = pMin;
                e.vx = Math.abs(e.patrolSpeed);
              } else if (e.x >= pMax) {
                e.x = pMax;
                e.vx = -Math.abs(e.patrolSpeed);
              }
              e.facing = e.vx >= 0 ? 1 : -1;
            } else {
              // Standing sentry turns toward hero side
              e.facing = this.px < e.x ? -1 : 1;
            }
          }
        }
      } else {
        if (e.vx !== 0) {
          e.x += e.vx * slowFactor * dt;
          e.facing = e.vx > 0 ? 1 : -1;
          if (Math.abs(e.x - e.startX) > e.patrolWidth * 0.5) {
            e.vx *= -1;
            e.x = e.startX + Math.sign(e.x - e.startX) * (e.patrolWidth * 0.5);
          }
        } else {
          e.facing = this.px < e.x ? -1 : 1;
        }

        if (e.isFlying) {
          e.y = e.startY + Math.sin(this.totalTime * 3 + e.startX * 0.05) * 26;
        }

        // Ranged enemy projectiles
        if (
          e.type === 'jungle_totem' ||
          e.type === 'island_turret' ||
          e.type === 'island_guard' ||
          e.type === 'island_commando' ||
          e.type === 'snow_golem'
        ) {
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0 && Math.abs(e.x - this.px) < 420) {
            e.shootCooldown = 2.3;
            const dir = this.px < e.x ? -1 : 1;
            this.projectiles.push({
              x: e.x + dir * 16,
              y: e.y - 24,
              vx: dir * 260,
              vy: 0,
              kind: 'enemy_shot',
              life: 2.2,
              damage: 15,
            });
          }
        }
      }

      // Collision with hero (skipped if zombie is dying or dead)
      const dx = Math.abs(e.x - this.px);
      const dy = this.py - e.y;
      if (dx < 26 && Math.abs(dy) < 42) {
        if (this.invincibleTimer > 0) {
          this.damageEnemy(e, 999);
        } else if (this.vy > 80 && this.py < e.y - 16) {
          // Stomp enemy from above!
          this.vy = -420;
          this.jumpsRemaining = 1;
          this.damageEnemy(e, 32);
        } else {
          this.damagePlayer(e.isZombie ? 15 : 18, false, this.px < e.x ? -1 : 1);
        }
      }
    }
  }

  private updateStormAndLightning(dt: number): void {
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.8);
    }

    const activeBossFight = Boolean(
      this.boss && this.boss.engaged && this.boss.lifecycle === 'ACTIVE' && !this.inCutscene
    );

    if (activeBossFight) {
      this.stormIntensity = Math.min(1, this.stormIntensity + dt * 0.65);

      // Periodic ambient storm thunder & bright sky lightning flashes
      this.stormThunderTimer -= dt;
      if (this.stormThunderTimer <= 0) {
        this.stormThunderTimer = 3.2 + Math.random() * 2.8;
        this.lightningFlash = 0.85;
        audioEngine.playSfx('thunder_rumble');
        this.triggerShake(3.5, 0.22);
      }

      // Fair, clearly telegraphed lightning strikes in the boss arena
      this.lightningStrikeTimer -= dt;
      const bossHpRatio = this.boss ? this.boss.hp / this.boss.maxHp : 1;
      if (this.lightningStrikeTimer <= 0 && this.boss) {
        this.lightningStrikeTimer = bossHpRatio < 0.35 ? 2.6 : 3.9;
        const strikeX = Math.max(
          this.boss.arenaX + 55,
          Math.min(
            this.boss.arenaX + this.boss.arenaWidth - 55,
            this.px + (Math.random() - 0.5) * 140
          )
        );
        this.stormHazards.push({
          x: strikeX,
          yGround: this.level.finishY,
          warnTimer: 1.15,
          strikeTimer: 0.26,
          kind: 'lightning',
        });
      }
    } else {
      // Storm gradually calms after giant boss is defeated or outside arena
      this.stormIntensity = Math.max(0, this.stormIntensity - dt * 0.45);
    }

    // Update active telegraphed storm hazards (lightning & ice spikes)
    for (let i = this.stormHazards.length - 1; i >= 0; i--) {
      const sh = this.stormHazards[i];
      if (sh.warnTimer > 0) {
        sh.warnTimer -= dt;
        if (sh.warnTimer <= 0) {
          if (sh.kind === 'lightning') {
            this.lightningFlash = 1.0;
            audioEngine.playSfx('thunder_rumble');
            this.triggerShake(6, 0.22);
            this.spawnDust(sh.x, sh.yGround - 12, 16, '#fef08a');
            this.lightningBolts.push({
              x: sh.x,
              yTop: sh.yGround - 440,
              yBottom: sh.yGround,
              life: 0.28,
            });
            if (!this.inCutscene && Math.abs(this.px - sh.x) < 28 && this.py > sh.yGround - 220) {
              this.damagePlayer(20, false);
            }
          } else {
            audioEngine.playSfx('boss_ice');
            this.spawnDust(sh.x, sh.yGround - 16, 14, '#bae6fd');
            if (!this.inCutscene && Math.abs(this.px - sh.x) < 30 && this.py > sh.yGround - 78) {
              this.damagePlayer(18, false);
            }
          }
        }
      } else {
        sh.strikeTimer -= dt;
        if (sh.strikeTimer <= 0) {
          this.stormHazards.splice(i, 1);
        }
      }
    }
  }

  private spawnBossSpecialAttack(b: ActiveBoss, isFinalDesperation = false): void {
    const dir = this.px < b.x ? -1 : 1;
    const count = isFinalDesperation ? 5 : 3;

    switch (b.id) {
      case 'giant_trex':
      case 'giant_crocodile': {
        audioEngine.playSfx(b.id === 'giant_trex' ? 'boss_fire' : 'boss_bite');
        this.triggerShake(6, 0.22);
        for (let k = 0; k < count; k++) {
          const speed = 250 + k * 55;
          this.projectiles.push({
            x: b.x + dir * 42,
            y: b.y - 46 - (k % 2) * 26,
            vx: dir * speed,
            vy: k === 1 ? -60 : 0,
            kind: 'boss_shot',
            life: 2.4,
            damage: 20,
          });
        }
        break;
      }
      case 'giant_snake':
      case 'giant_sand_snake': {
        audioEngine.playSfx('boss_bite');
        for (let k = 0; k < count; k++) {
          const vy = -120 + k * 75;
          this.projectiles.push({
            x: b.x + dir * 32,
            y: b.y - 82,
            vx: dir * (280 + k * 25),
            vy,
            kind: 'boss_shot',
            life: 2.4,
            damage: 18,
          });
        }
        break;
      }
      case 'giant_gorilla':
      case 'goliath_kong': {
        audioEngine.playSfx('boss_slam');
        this.triggerShake(8, 0.25);
        [-1, 1].forEach((d) => {
          this.projectiles.push({
            x: b.x + d * 36,
            y: b.y - 16,
            vx: d * 280,
            vy: 0,
            kind: 'boss_shot',
            life: 2.3,
            damage: 20,
          });
        });
        if (isFinalDesperation) {
          this.projectiles.push({
            x: b.x + dir * 24,
            y: b.y - 90,
            vx: dir * 240,
            vy: -140,
            kind: 'boss_shot',
            life: 2.2,
            damage: 22,
          });
        }
        break;
      }
      case 'giant_ice_monster':
      case 'giant_frost_dragon':
      case 'glacier_behemoth': {
        audioEngine.playSfx('boss_ice');
        for (let k = 0; k < (isFinalDesperation ? 3 : 2); k++) {
          const sx = Math.max(
            b.arenaX + 55,
            Math.min(b.arenaX + b.arenaWidth - 55, this.px + (k - 0.5) * 110)
          );
          this.stormHazards.push({
            x: sx,
            yGround: this.level.finishY,
            warnTimer: 0.9,
            strikeTimer: 0.45,
            kind: 'ice_spike',
          });
        }
        this.projectiles.push({
          x: b.x + dir * 36,
          y: b.y - 52,
          vx: dir * 300,
          vy: -30,
          kind: 'boss_shot',
          life: 2.3,
          damage: 20,
        });
        break;
      }
      case 'giant_dragon':
      case 'obsidian_dragon':
      case 'giant_fire_demon': {
        audioEngine.playSfx('boss_fire');
        this.triggerShake(5, 0.2);
        for (let k = 0; k < count; k++) {
          this.projectiles.push({
            x: b.x + dir * 42,
            y: b.y - 72,
            vx: dir * (280 + k * 35),
            vy: -70 + k * 55,
            kind: 'boss_shot',
            life: 2.4,
            damage: 22,
          });
        }
        break;
      }
      case 'giant_robot':
      case 'vex_fortress_mech': {
        audioEngine.playSfx('boss_laser');
        for (let k = 0; k < count; k++) {
          this.projectiles.push({
            x: b.x + dir * 44,
            y: b.y - 38 - (k % 2) * 34,
            vx: dir * (360 + k * 30),
            vy: 0,
            kind: 'boss_shot',
            life: 2.2,
            damage: 22,
          });
        }
        break;
      }
      default: {
        // Giant Scorpion, Scarab Titan, Sand Colossus, Giant Skeleton, Giant Mutant
        audioEngine.playSfx('boss_roar');
        for (let k = 0; k < count; k++) {
          this.projectiles.push({
            x: b.x + dir * 36,
            y: b.y - 34 - k * 20,
            vx: dir * (290 + k * 30),
            vy: k === 2 ? -55 : 0,
            kind: 'boss_shot',
            life: 2.3,
            damage: 20,
          });
        }
        break;
      }
    }

    // Final attack below 25% HP also summons twin telegraphed storm lightning bolts!
    if (isFinalDesperation) {
      [-90, 90].forEach((offset) => {
        const lx = Math.max(
          b.arenaX + 50,
          Math.min(b.arenaX + b.arenaWidth - 50, this.px + offset)
        );
        this.stormHazards.push({
          x: lx,
          yGround: this.level.finishY,
          warnTimer: 1.15,
          strikeTimer: 0.28,
          kind: 'lightning',
        });
      });
    }
  }

  private startBossDefeat(): void {
    const b = this.boss;
    if (!b || b.lifecycle !== 'ACTIVE') return;

    b.hp = 0;
    b.lifecycle = 'DEFEATING';
    b.defeating = true;
    b.defeatTimer = 1.5;
    b.defeatStartedAtMs = performance.now();
    b.defeatBurstTimer = 0.04;
    b.phase = 'defeat';
    b.vx = 0;
    b.vy = 0;
    b.hurtFlash = 0;
    b.slowTimer = 0;

    // Immediately stop hitstop, deactivate any live boss shots & storm hazards, and clear FINAL ATTACK toasts
    this.hitstopTimer = 0;
    for (const p of this.projectiles) {
      if (p.kind === 'boss_shot') {
        p.life = -1;
        p.damage = 0;
      }
    }
    this.stormHazards = [];
    this.secretFoundToast = `${b.name} Defeated! Path Unlocked!`;
    this.secretToastTimer = 2.4;

    try {
      audioEngine.playSfx('boss_defeat');
      const worldMood = `world${this.level.world}` as MusicMood;
      audioEngine.setMusicMood(worldMood);
    } catch {
      // Keep progression intact if WebAudio is suspended
    }

    this.triggerShake(10, 0.45);
    this.spawnDust(b.x, b.y - 54 * b.scale, 34, '#facc15');
    this.pushHud(true);
  }

  private finalizeBossDefeat(): void {
    const b = this.boss;
    if (!b || b.rewardGranted) return;

    b.rewardGranted = true;
    b.defeating = false;
    b.defeated = true;
    b.lifecycle = 'DEFEATED';

    // Award boss reward strictly once
    this.score += 1000;
    this.coins += b.rewardCoins;
    this.diamonds += b.rewardDiamonds;

    // Victory burst & chime
    this.spawnDust(b.x, b.y - 36 * b.scale, 28, '#fde047');
    this.secretFoundToast = `Boss Victory! +${b.rewardCoins} Coins · +${b.rewardDiamonds} Gems`;
    this.secretToastTimer = 3.0;
    try {
      audioEngine.playSfx('chest');
      const worldMood = `world${this.level.world}` as MusicMood;
      audioEngine.setMusicMood(worldMood);
    } catch {
      // Ignore audio errors
    }

    b.lifecycle = 'LEVEL_PROGRESSION';
    this.pushHud(true);
  }

  private updateBoss(dt: number): void {
    const b = this.boss;
    if (!b || b.lifecycle === 'DEFEATED' || b.lifecycle === 'LEVEL_PROGRESSION') return;

    // Defensive check: if HP reached 0 in any state while still ACTIVE, transition immediately
    if (b.lifecycle === 'ACTIVE' && b.hp <= 0) {
      this.startBossDefeat();
    }

    if (b.hurtFlash > 0) b.hurtFlash -= dt;
    if (b.slowTimer > 0) b.slowTimer -= dt;

    // Boss defeat collapse animation -> guaranteed transition via dt OR wall-clock timeout fallback
    if (b.lifecycle === 'DEFEATING') {
      b.defeatTimer -= dt;
      b.defeatBurstTimer -= dt;
      if (b.defeatBurstTimer <= 0) {
        b.defeatBurstTimer = 0.16;
        const ox = (Math.random() - 0.5) * 75 * b.scale;
        const oy = -Math.random() * 85 * b.scale;
        this.spawnDust(b.x + ox, b.y + oy, 12, b.accentColor);
        this.spawnDust(b.x + ox, b.y + oy, 8, '#fef08a');
        try {
          audioEngine.playSfx('explosion');
        } catch {
          // Ignore audio errors
        }
      }
      const wallElapsedMs = performance.now() - b.defeatStartedAtMs;
      if (b.defeatTimer <= 0 || wallElapsedMs >= 1750) {
        this.finalizeBossDefeat();
      }
      return;
    }

    if (!b.engaged) {
      if (this.px >= b.arenaX + 45) {
        this.engageBoss();
      }
      return;
    }

    const hpRatio = b.hp / b.maxHp;
    const aggro = hpRatio < 0.25 ? 1.48 : hpRatio < 0.5 ? 1.24 : 1.0;
    const chill = b.slowTimer > 0 ? 0.62 : 1.0;
    const speedScale = aggro * chill;

    // Trigger unique special final attack once when boss drops below 25% HP (ONLY while alive!)
    if (!b.finalAttackUsed && b.hp > 0 && hpRatio <= 0.25) {
      b.finalAttackUsed = true;
      b.phase = 'enraged_final';
      b.phaseTimer = 1.4;
      audioEngine.playSfx('boss_roar');
      this.lightningFlash = 0.95;
      this.secretFoundToast = `${b.name} unleashes FINAL ATTACK!`;
      this.secretToastTimer = 2.6;
      this.spawnBossSpecialAttack(b, true);
      this.pushHud(true);
      return;
    }

    b.phaseTimer -= dt * speedScale;
    b.facing = this.px < b.x ? -1 : 1;

    if (b.phase === 'idle') {
      b.x += b.facing * 88 * speedScale * dt;
      if (b.phaseTimer <= 0) {
        b.phase = 'windup';
        b.phaseTimer = 0.72;
        audioEngine.playSfx('boss_roar');
      }
    } else if (b.phase === 'windup') {
      if (b.phaseTimer <= 0) {
        b.attackCycleCount++;
        const mod = b.attackCycleCount % 3;
        if (mod === 1) {
          b.phase = 'charge';
          b.phaseTimer = 1.05;
          b.vx = b.facing * 305 * speedScale;
          if (b.id === 'giant_trex' || b.id === 'giant_crocodile' || b.id === 'giant_snake' || b.id === 'giant_sand_snake') {
            audioEngine.playSfx('boss_bite');
          }
        } else if (mod === 2) {
          b.phase = 'slam';
          b.phaseTimer = 0.72;
          audioEngine.playSfx('boss_slam');
          this.triggerShake(7.5, 0.26);
          this.spawnDust(b.x, b.y - 8, 16, '#e2e8f0');
          [-1, 1].forEach((dir) => {
            this.projectiles.push({
              x: b.x + dir * 32,
              y: b.y - 18,
              vx: dir * (250 * aggro),
              vy: 0,
              kind: 'boss_shot',
              life: 2.2,
              damage: 20,
            });
          });
        } else {
          b.phase = 'special';
          b.phaseTimer = 0.9;
          this.spawnBossSpecialAttack(b, false);
        }
      }
    } else if (b.phase === 'charge') {
      b.x += b.vx * dt;
      if (b.phaseTimer <= 0) {
        b.phase = 'idle';
        b.phaseTimer = 1.35;
      }
    } else if (b.phase === 'slam' || b.phase === 'special' || b.phase === 'enraged_final') {
      if (b.phaseTimer <= 0) {
        b.phase = 'idle';
        b.phaseTimer = 1.25;
      }
    }

    b.x = Math.max(b.arenaX + 54, Math.min(b.arenaX + b.arenaWidth - 54, b.x));

    // Boss contact collision ONLY while ACTIVE
    const hitW = 46 * b.scale;
    const hitH = 88 * b.scale;
    if (b.lifecycle === 'ACTIVE' && Math.abs(b.x - this.px) < hitW && Math.abs(b.y - this.py) < hitH) {
      if (this.invincibleTimer > 0) {
        this.damageBoss(12);
      } else if (this.vy > 90 && this.py < b.y - hitH * 0.62) {
        this.vy = -460;
        this.damageBoss(28);
      } else {
        this.damagePlayer(22, false);
      }
    }
  }

  private detonateBomb(x: number, y: number, damage: number): void {
    audioEngine.playSfx('explosion');
    this.triggerShake(8, 0.24);
    this.spawnDust(x, y, 22, '#ef4444');
    this.spawnDust(x, y, 12, '#fde047');
    for (const e of this.enemies) {
      if (!e.dead && !e.dying && Math.hypot(e.x - x, e.y - 20 - y) < 98) {
        this.damageEnemy(e, damage);
      }
    }
    if (this.boss && this.boss.lifecycle === 'ACTIVE') {
      if (Math.hypot(this.boss.x - x, this.boss.y - 45 * this.boss.scale - y) < 125) {
        this.damageBoss(damage);
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const removeProj = (target: Projectile) => {
      const idx = this.projectiles.indexOf(target);
      if (idx !== -1) this.projectiles.splice(idx, 1);
    };
    const worldScale = this.getWorldScale();
    const viewW = (this.canvas.width || 960) / (worldScale * this.camZoom);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (!pr) continue;
      if (pr.kind === 'boss_shot' && (pr.life <= 0 || pr.damage <= 0)) {
        removeProj(pr);
        continue;
      }
      pr.life -= dt;
      if (pr.kind === 'boomerang' && pr.life < 0.85) {
        pr.returnToHero = true;
      }
      if (pr.returnToHero) {
        const dx = this.px - pr.x;
        const dy = this.py - 28 - pr.y;
        const dist = Math.hypot(dx, dy) || 1;
        pr.vx = (dx / dist) * 460;
        pr.vy = (dy / dist) * 460;
        if (dist < 24) {
          removeProj(pr);
          continue;
        }
      }

      if (pr.kind === 'explosive_bomb') {
        pr.vy += 980 * dt;
        // Bounce on platforms
        for (const p of this.platforms) {
          if (pr.x >= p.x && pr.x <= p.x + p.w && pr.y >= p.y - 8 && pr.y <= p.y + 18 && pr.vy > 0) {
            pr.y = p.y - 8;
            pr.vy = -pr.vy * 0.55;
            pr.vx *= 0.78;
            break;
          }
        }
      }

      if (pr.kind === 'zombie_sword') {
        if (!pr.trail) pr.trail = [];
        pr.trail.push({ x: pr.x, y: pr.y, rot: pr.rotation ?? 0 });
        if (pr.trail.length > 6) pr.trail.shift();
        pr.rotation = (pr.rotation ?? 0) + (pr.spinSpeed ?? 16) * dt;
        if (pr.gravity) {
          pr.vy += pr.gravity * dt;
        }
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      const isPlayerProj =
        pr.kind !== 'enemy_shot' && pr.kind !== 'boss_shot' && pr.kind !== 'zombie_sword';

      if (isPlayerProj) {
        let hit = false;
        for (const e of this.enemies) {
          if (e.dead || e.dying) continue;
          if (Math.abs(e.x - pr.x) < 28 && Math.abs(e.y - 22 - pr.y) < 34) {
            if (pr.kind === 'explosive_bomb') {
              this.detonateBomb(pr.x, pr.y, pr.damage);
              hit = true;
              break;
            }
            this.damageEnemy(e, pr.damage, Math.sign(pr.vx) || 1);
            if (pr.kind === 'ice_blaster') {
              e.slowTimer = 3.0;
              this.spawnDust(e.x, e.y - 20, 8, '#bae6fd');
            }
            hit = true;
            if (pr.kind === 'magic_bow' && (pr.pierceLeft ?? 0) > 0) {
              pr.pierceLeft = (pr.pierceLeft ?? 0) - 1;
              hit = false;
            } else if (pr.kind !== 'boomerang') {
              break;
            }
          }
        }

        if (this.boss && this.boss.lifecycle === 'ACTIVE') {
          const bHalfW = 54 * this.boss.scale;
          const bMidY = this.boss.y - 54 * this.boss.scale;
          const bHalfH = 62 * this.boss.scale;
          if (Math.abs(this.boss.x - pr.x) < bHalfW && Math.abs(bMidY - pr.y) < bHalfH) {
            if (pr.kind === 'explosive_bomb') {
              this.detonateBomb(pr.x, pr.y, pr.damage);
            } else {
              this.damageBoss(pr.damage);
              if (pr.kind === 'ice_blaster') {
                this.boss.slowTimer = 1.6;
                this.spawnDust(this.boss.x, bMidY, 8, '#bae6fd');
              }
            }
            hit = true;
          }
        }

        if (hit && pr.kind !== 'boomerang') {
          if (pr.kind === 'fireball') {
            this.spawnDust(pr.x, pr.y, 12, '#f97316');
            audioEngine.playSfx('explosion');
          } else if (pr.kind === 'energy_gun') {
            this.spawnDust(pr.x, pr.y, 6, '#34d399');
          }
          removeProj(pr);
          continue;
        }
      } else {
        // Destroy thrown zombie swords when hitting solid walls/platforms or leaving gameplay area
        if (pr.kind === 'zombie_sword') {
          let blocked = false;
          for (const p of this.platforms) {
            if (p.kind !== 'solid' && p.kind !== 'ice' && p.kind !== 'secret_wall') continue;
            if (
              pr.x >= p.x &&
              pr.x <= p.x + p.w &&
              pr.y >= p.y + 2 &&
              pr.y <= p.y + p.h
            ) {
              blocked = true;
              break;
            }
          }
          if (
            blocked ||
            pr.x < 0 ||
            pr.x > this.level.width ||
            pr.y > this.level.height + 50 ||
            pr.x < this.camX - 220 ||
            pr.x > this.camX + viewW + 220
          ) {
            if (blocked) {
              this.spawnDust(pr.x, pr.y, 6, '#cbd5e1');
            }
            removeProj(pr);
            continue;
          }
        }

        // Enemy/Boss/Zombie Sword projectile hitting Leo
        const hitHalfW = pr.kind === 'zombie_sword' ? 18 : 20;
        const hitHalfH = pr.kind === 'zombie_sword' ? 26 : 30;
        if (Math.abs(this.px - pr.x) < hitHalfW && Math.abs(this.py - 24 - pr.y) < hitHalfH) {
          this.damagePlayer(pr.damage, false, Math.sign(pr.vx) || 1);
          if (pr.kind === 'zombie_sword') {
            this.spawnDust(pr.x, pr.y, 8, '#f87171');
          }
          removeProj(pr);
          continue;
        }
      }

      if (pr.life <= 0) {
        if (pr.kind === 'explosive_bomb') {
          this.detonateBomb(pr.x, pr.y, pr.damage);
        }
        removeProj(pr);
      }
    }
  }

  private updateCollectiblesAndCheckpoints(): void {
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (Math.abs(c.x - this.px) < 28 && Math.abs(c.y - (this.py - 26)) < 36) {
        c.collected = true;
        if (c.kind === 'coin') {
          this.coins += 1;
          this.score += 25;
          audioEngine.playSfx('coin');
          this.spawnDust(c.x, c.y, 6, '#facc15');
        } else if (c.kind === 'diamond') {
          this.diamonds += 1;
          this.score += 120;
          audioEngine.playSfx('diamond');
          this.spawnDust(c.x, c.y, 10, '#38bdf8');
        } else if (c.kind === 'chest') {
          this.chestsOpened += 1;
          this.coins += 25;
          this.diamonds += 1;
          this.score += 250;
          this.secretFoundToast = 'Secret Treasure Found! +25 Coins · +1 Diamond';
          this.secretToastTimer = 3.0;
          audioEngine.playSfx('chest');
          this.spawnDust(c.x, c.y, 18, '#fbbf24');
        } else if (c.kind === 'heart') {
          this.hp = Math.min(this.maxHp, this.hp + 35);
          audioEngine.playSfx('heart');
          this.spawnDust(c.x, c.y, 8, '#f43f5e');
        } else if (c.kind === 'power_fireball') {
          this.weaponAmmo.fireball = Math.min(10, (this.weaponAmmo.fireball ?? 0) + 4);
          audioEngine.playSfx('powerup');
        } else if (c.kind === 'power_boomerang') {
          this.weaponAmmo.boomerang = Math.min(6, (this.weaponAmmo.boomerang ?? 0) + 3);
          audioEngine.playSfx('powerup');
        } else if (c.kind === 'power_shield') {
          this.shieldTimer = 8;
          audioEngine.playSfx('shield');
        } else if (c.kind === 'power_speed') {
          this.speedTimer = 8;
          audioEngine.playSfx('speed');
        } else if (c.kind === 'power_doublejump') {
          this.doubleJumpBoostTimer = 14;
          audioEngine.playSfx('powerup');
        } else if (c.kind === 'power_invincible') {
          this.invincibleTimer = 8;
          audioEngine.playSfx('powerup');
        }
      }
    }

    for (const cp of this.level.checkpoints) {
      if (!this.reachedCheckpoints.has(cp.id) && Math.abs(cp.x - this.px) < 40) {
        this.reachedCheckpoints.add(cp.id);
        this.respawnX = cp.x;
        this.respawnY = cp.y - 40;
        this.checkpointReached = true;
        audioEngine.playSfx('checkpoint');
        this.spawnDust(cp.x, cp.y - 30, 12, '#10b981');
      }
    }
  }

  private damageEnemy(e: ActiveEnemy, amount: number, hitDir?: number): void {
    if (e.dead || e.dying) return;
    e.hp = Math.max(0, e.hp - amount);
    e.hurtFlash = 0.18;

    if (e.isZombie) {
      audioEngine.playSfx('zombie_hit');
      e.hurtStaggerTimer = 0.22;
      // Interrupt windup briefly when struck hard, and apply knockback away from hit
      if (e.zombieState === 'windup') {
        e.zombieState = 'hurt';
      }
      const pushDir = hitDir ?? (this.px < e.x ? 1 : -1);
      e.vx = pushDir * (e.type === 'zombie_armoured' || e.type === 'zombie_heavy' ? 70 : 125);
      this.spawnDust(e.x, e.y - 24, 7, e.type === 'zombie_armoured' ? '#cbd5e1' : '#84cc16');
    } else {
      audioEngine.playSfx('enemy_hit');
      this.spawnDust(e.x, e.y - 20, 6, '#f87171');
    }

    if (e.hp <= 0 && !e.rewarded) {
      e.rewarded = true;
      e.hp = 0;
      this.enemiesDefeated++;

      if (e.isZombie) {
        e.dying = true;
        e.deathTimer = 0.65;
        e.zombieState = 'dying';
        e.vx = 0;
        e.vy = 0;
        const coinReward =
          e.type === 'zombie_rare'
            ? 20
            : e.type === 'zombie_heavy' || e.type === 'zombie_elite'
            ? 10
            : e.type === 'zombie_armoured'
            ? 8
            : 5;
        const scoreReward =
          e.type === 'zombie_rare'
            ? 300
            : e.type === 'zombie_heavy' || e.type === 'zombie_elite' || e.type === 'zombie_armoured'
            ? 150
            : 100;
        this.coins += coinReward;
        this.score += scoreReward;
        if (e.type === 'zombie_rare') {
          this.diamonds += 1;
          this.secretFoundToast = `Rare Glowing Zombie Defeated! +${coinReward} Coins · +1 Gem`;
          this.secretToastTimer = 2.6;
        }
        audioEngine.playSfx('zombie_defeat');
        this.spawnDust(e.x, e.y - 24, 18, e.type === 'zombie_rare' ? '#2dd4bf' : '#a3e635');
      } else {
        e.dead = true;
        this.score += 80;
        this.coins += 3;
        audioEngine.playSfx('enemy_defeat');
        this.spawnDust(e.x, e.y - 20, 14, '#fbbf24');
      }
    }
  }

  private engageBoss(): void {
    const b = this.boss;
    if (!b || b.engaged || b.lifecycle !== 'ACTIVE') return;
    b.engaged = true;
    try {
      audioEngine.setMusicMood('boss');
      audioEngine.playSfx('boss_roar');
      audioEngine.playSfx('thunder_rumble');
    } catch {
      // Ignore audio errors
    }
    this.lightningFlash = 0.9;
    this.triggerShake(6, 0.3);
    this.secretFoundToast = `${b.name} · ${b.title}!`;
    this.secretToastTimer = 3.0;
    this.pushHud(true);
  }

  private damageBoss(amount: number): void {
    const b = this.boss;
    if (!b || b.lifecycle !== 'ACTIVE') return;
    if (!b.engaged) this.engageBoss();
    b.hp = Math.max(0, Math.round(b.hp - amount));
    b.hurtFlash = 0.16;
    audioEngine.playSfx('enemy_hit');
    this.spawnDust(b.x, b.y - 50 * b.scale, 10, '#fb923c');

    if (b.hp <= 0) {
      this.startBossDefeat();
    }
  }

  private damagePlayer(amount: number, fellInHazard: boolean, knockDir?: number): void {
    if (this.invincibleTimer > 0 && !fellInHazard) return;
    if (this.shieldTimer > 0 && !fellInHazard) {
      this.shieldTimer = 0;
      this.invulnTimer = 1.0;
      audioEngine.playSfx('shield');
      this.spawnDust(this.px, this.py - 24, 14, '#38bdf8');
      return;
    }
    if (this.invulnTimer > 0 && !fellInHazard) return;

    this.hp -= amount;
    this.hurtFlash = 0.6;
    this.invulnTimer = 1.1;
    audioEngine.playSfx('player_hurt');
    this.triggerShake(6, 0.2);

    if (fellInHazard) {
      this.px = this.respawnX;
      this.py = this.respawnY;
      this.vx = 0;
      this.vy = 0;
    } else {
      this.vy = -290;
      this.vx = (knockDir ?? -this.facing) * 190;
      this.heroState = 'hurt';
    }

    if (this.hp <= 0) {
      this.lives--;
      if (this.lives > 0) {
        this.hp = this.maxHp;
        this.px = this.respawnX;
        this.py = this.respawnY;
        this.vx = 0;
        this.vy = 0;
      } else {
        this.hp = 0;
        this.finished = true;
        audioEngine.stopHelicopterRotor();
        this.pushHud(true);
        this.callbacks.onGameOver();
      }
    }
  }

  // =========================================================================
  // MANDATORY STORY CUTSCENE: LEVELS 1-49 HELICOPTER KIDNAPPING & LEVEL 50 REUNION
  // =========================================================================
  private beginFinishCutscene(): void {
    if (this.inCutscene || this.finished) return;
    this.inCutscene = true;
    this.cutsceneTime = 0;
    this.hitstopTimer = 0;
    this.hurtFlash = 0;
    this.vx = 0;
    this.vy = 0;
    this.py = this.level.finishY;
    this.facing = 1;
    this.input.left = false;
    this.input.right = false;
    this.input.jumpPressed = false;
    this.input.jumpHeld = false;
    this.input.attackPressed = false;
    this.input.specialPressed = false;
    this.projectiles = [];
    this.stormHazards = [];
    this.mayaCutsceneX = this.level.finishX + 95;
    this.mayaCutsceneY = this.level.finishY;
    this.heliX = this.level.finishX + 420;
    this.heliY = -90;
    this.ropeDrop = 0;
    this.carryingMaya = false;
    this.showHenchman = false;
    this.searchlightAlpha = 0;
    this.spokenVowTriggered = false;
    this.pushHud(true);

    if (this.level.id < 50) {
      this.mayaTied = true;
      this.mayaMood = 'hopeful';
      this.cutsceneSpeaker = 'Leo';
      this.cutsceneSubtitle = 'Maya!! Hold on, I’m right here!';
    } else {
      // Level 50 Finale
      this.mayaTied = true;
      this.mayaMood = 'hopeful';
      this.cutsceneSpeaker = 'Leo';
      this.cutsceneSubtitle = 'General Vex is defeated! Maya, I finally reached you!';
    }
  }

  private updateCutscene(dt: number): void {
    this.cutsceneTime += dt;
    const t = this.cutsceneTime;

    if (this.level.id === 50) {
      this.updateLevel50ReunionCutscene(dt, t);
      return;
    }

    const vConfig = this.villainHeli!;

    // PHASE 1 (0 - 1.8s): Hero sees Maya tied up, gets extremely happy & runs toward her!
    if (t < 1.8) {
      this.heroState = 'run';
      const targetX = this.mayaCutsceneX - 85;
      if (this.px < targetX) {
        this.px = Math.min(targetX, this.px + 210 * dt);
      } else {
        this.heroState = 'victory';
      }
      this.camX += (this.level.finishX - 240 - this.camX) * Math.min(1, dt * 4);
      this.camZoom += (1.06 - this.camZoom) * Math.min(1, dt * 3);
      if (t > 0.9) {
        this.cutsceneSpeaker = 'Maya';
        this.cutsceneSubtitle = 'Leo! Watch out—I hear a helicopter!';
      }
    }
    // PHASE 2 (1.8 - 4.2s): Helicopter rotor swells louder, villain helicopter descends!
    else if (t < 4.2) {
      if (t - dt < 1.8) {
        audioEngine.startHelicopterRotor();
        audioEngine.setMusicMood('kidnap_dramatic');
        this.triggerShake(4, 2.2);
      }
      const p = (t - 1.8) / 2.4;
      audioEngine.setHelicopterIntensity(0.25 + p * 0.72);
      this.heliX = this.level.finishX + 420 - p * 320;
      this.heliY = -90 + p * 270; // Descends to Y = 180
      this.searchlightAlpha = p;
      this.heroState = 'idle';
      this.mayaMood = 'scared';
      this.cutsceneSpeaker = 'Villain';
      this.cutsceneSubtitle = `${vConfig.villainName}: "${vConfig.tauntLine}"`;

      this.ropeDrop = Math.max(0, (p - 0.45) / 0.55);
      if (this.ropeDrop > 0.35) {
        this.showHenchman = true;
        this.henchmanX = this.heliX - 18;
        this.henchmanY = this.heliY + 28 + this.ropeDrop * 125;
      }
    }
    // PHASE 3 (4.2 - 7.4s): Henchmen take Maya into the helicopter, lift off & fly away!
    else if (t < 7.4) {
      if (t - dt < 4.2) {
        audioEngine.playSfx('maya_cry');
      }
      const p = (t - 4.2) / 3.2;
      if (p < 0.35) {
        // Grab Maya & pull her up
        this.carryingMaya = true;
        this.showHenchman = true;
        this.ropeDrop = 1 - (p / 0.35) * 0.75;
        this.henchmanX = this.heliX - 18;
        this.henchmanY = this.heliY + 28 + this.ropeDrop * 125;
        this.cutsceneSpeaker = 'Maya';
        this.cutsceneSubtitle = 'Leo!! Help me!!';
      } else {
        // Helicopter ascends and banks away into distance
        const flyP = (p - 0.35) / 0.65;
        this.carryingMaya = true;
        this.ropeDrop = 0.25;
        this.showHenchman = false;
        this.heliX = this.level.finishX + 100 + flyP * 480;
        this.heliY = 180 - flyP * 290;
        this.searchlightAlpha = Math.max(0, 1 - flyP * 1.4);
        audioEngine.setHelicopterIntensity(Math.max(0.05, 0.92 - flyP * 0.85));
      }
      this.heroState = 'idle';
    }
    // PHASE 4 (7.4 - 10.6s): Hero watches helplessly, heartbreak + visible falling tears!
    else if (t < 10.6) {
      if (t - dt < 7.4) {
        audioEngine.setMusicMood('emotional_piano');
        audioEngine.playSfx('leo_cry');
      }
      this.carryingMaya = false;
      this.heliY = -200; // Gone into distant sky
      this.heroState = 'crying';
      this.crySoundTimer -= dt;
      if (this.crySoundTimer <= 0) {
        this.crySoundTimer = 1.6;
        audioEngine.playSfx('leo_cry');
      }

      // Smooth cinematic close-up zoom onto Leo's crying face!
      const zoomTarget = vConfig.cameraAngle === 'close_heartbreak' ? 1.75 : 1.58;
      this.camZoom += (zoomTarget - this.camZoom) * Math.min(1, dt * 2.4);
      const totalS = this.getWorldScale() * this.camZoom;
      const viewW = this.canvas.width / totalS;
      const viewH = this.canvas.height / totalS;
      this.camX += (this.px - viewW * 0.45 - this.camX) * Math.min(1, dt * 3);
      this.camY += (this.py - viewH * 0.68 - this.camY) * Math.min(1, dt * 3);

      this.cutsceneSpeaker = 'Leo';
      this.cutsceneSubtitle = 'No... Maya... not again...';
    }
    // PHASE 5 (10.6 - 13.8s): Hero looks toward departing helicopter & speaks exact audible voice line!
    else if (t < 13.8) {
      this.heroState = 'dialogue';
      this.cutsceneSpeaker = 'Leo';
      this.cutsceneSubtitle = '"Baby, I am coming!"';

      if (!this.spokenVowTriggered) {
        this.spokenVowTriggered = true;
        audioEngine.stopHelicopterRotor();
        audioEngine.speakDialogue('Baby, I am coming!');
      }
    }
    // PHASE 6 (13.8s+): Transition to dramatic LEVEL COMPLETE screen
    else {
      this.completeLevelNow();
    }
  }

  private updateLevel50ReunionCutscene(dt: number, t: number): void {
    // 0 - 1.5s: Vex's escape helicopter smokes & crashes in background; Leo runs to Maya
    if (t < 1.5) {
      this.heroState = 'run';
      const targetX = this.mayaCutsceneX - 38;
      if (this.px < targetX) {
        this.px = Math.min(targetX, this.px + 185 * dt);
      }
      this.camX += (this.level.finishX - 240 - this.camX) * Math.min(1, dt * 4);
      this.camZoom += (1.2 - this.camZoom) * Math.min(1, dt * 3);
    }
    // 1.5 - 2.6s: Leo slices Maya's ropes free!
    else if (t < 2.6) {
      if (t - dt < 1.5) {
        audioEngine.setMusicMood('reunion');
        audioEngine.playSfx('sword_slash');
        this.mayaTied = false;
        this.mayaMood = 'reunited';
        this.spawnDust(this.mayaCutsceneX, this.mayaCutsceneY - 24, 20, '#f472b6');
      }
      this.heroState = t < 1.9 ? 'attack' : 'victory';
      this.cutsceneSpeaker = 'Maya';
      this.cutsceneSubtitle = 'Leo!! You came all this way for me!';
    }
    // 2.6 - 7.5s: Joyful reunion embrace + hearts + audible spoken reunion line
    else if (t < 7.5) {
      this.heroState = 'victory';
      this.mayaMood = 'reunited';
      this.camZoom += (1.55 - this.camZoom) * Math.min(1, dt * 2.5);
      const totalS = this.getWorldScale() * this.camZoom;
      const viewW = this.canvas.width / totalS;
      const viewH = this.canvas.height / totalS;
      this.camX += (this.px + 16 - viewW * 0.5 - this.camX) * Math.min(1, dt * 3);
      this.camY += (this.py - viewH * 0.65 - this.camY) * Math.min(1, dt * 3);

      if (Math.random() < 0.25) {
        this.particles.push({
          x: this.px + 18 + (Math.random() - 0.5) * 40,
          y: this.py - 45,
          vx: (Math.random() - 0.5) * 35,
          vy: -45 - Math.random() * 30,
          life: 1.5,
          maxLife: 1.5,
          size: 5,
          color: '#f43f5e',
        });
      }

      if (!this.spokenVowTriggered) {
        this.spokenVowTriggered = true;
        audioEngine.speakDialogue('Maya! You are safe now. I promised I was coming!');
      }
      this.cutsceneSpeaker = 'Leo';
      this.cutsceneSubtitle = 'I promised I’d never stop until you were safe in my arms!';
    } else {
      this.completeLevelNow();
    }
  }

  private completeLevelNow(): void {
    if (this.finished) return;
    this.finished = true;
    audioEngine.stopHelicopterRotor();
    audioEngine.setMusicMood(this.level.id === 50 ? 'reunion' : 'victory');

    // Calculate 1-3 Stars
    let stars = 1;
    if (this.score >= 350 || this.coins >= 6) stars = 2;
    if (this.elapsedSec <= this.level.targetTimeSec && this.lives >= 2) stars = 3;

    const summary: LevelEndSummary = {
      levelId: this.level.id,
      levelTitle: this.level.title,
      score: this.score + Math.max(0, Math.round((this.level.targetTimeSec - this.elapsedSec) * 5)),
      coinsCollected: this.coins,
      diamondsCollected: this.diamonds,
      starsEarned: stars,
      enemiesDefeated: this.enemiesDefeated,
      chestsFound: this.chestsOpened,
      elapsedSec: Math.round(this.elapsedSec),
      newlyUnlockedLevel:
        this.level.id < 50 && this.saveData.unlockedLevel <= this.level.id
          ? this.level.id + 1
          : null,
      kidnappingClue:
        this.villainHeli?.nextLocationClue ??
        'Maya is finally safe! You completed the Last Mission!',
      nextVillainName: this.villainHeli?.villainName ?? 'General Vex',
      isFinalVictory: this.level.id === 50,
    };

    this.callbacks.onLevelComplete(summary);
  }

  private updateCamera(dt: number): void {
    const scale = this.getWorldScale();
    const viewW = this.canvas.width / scale;
    const viewH = this.canvas.height / scale;
    let targetX = this.px - viewW * 0.36;
    if (this.boss && this.boss.engaged && this.boss.lifecycle === 'ACTIVE') {
      targetX = this.boss.arenaX - (viewW - this.boss.arenaWidth) * 0.5;
    }
    targetX = Math.max(0, Math.min(Math.max(0, this.level.width - viewW), targetX));
    this.camX += (targetX - this.camX) * Math.min(1, dt * 7);

    // Center world vertically nicely in both landscape and tall portrait screens
    const targetY = Math.max(-260, Math.min(60, this.py - viewH * 0.68));
    this.camY += (targetY - this.camY) * Math.min(1, dt * 6);
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private spawnDust(x: number, y: number, count: number, color: string): void {
    if (this.saveData.settings.graphicsQuality === 'balanced') {
      count = Math.max(2, Math.floor(count / 2));
    }
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        size: 3 + Math.random() * 3.5,
        color,
      });
    }
  }

  private triggerShake(mag: number, dur: number): void {
    this.shakeMag = mag;
    this.shakeTimer = dur;
  }

  private pushHud(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastHudPush < 75) return;
    this.lastHudPush = now;
    const bossActive = Boolean(this.boss && this.boss.engaged && this.boss.lifecycle === 'ACTIVE');
    this.callbacks.onHudUpdate({
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      lives: this.lives,
      score: this.score,
      coins: this.coins,
      diamonds: this.diamonds,
      chestsOpened: this.chestsOpened,
      enemiesDefeated: this.enemiesDefeated,
      elapsedSec: Math.round(this.elapsedSec),
      equippedWeapon: this.equippedWeapon,
      weaponAmmo: { ...this.weaponAmmo },
      weaponCooldowns: { ...this.weaponCooldowns },
      weaponMaxCooldowns: { ...this.weaponMaxCooldowns },
      activeSpecial: this.activeSpecial,
      specialAmmo: this.specialAmmo,
      shieldTimer: Math.max(0, Math.ceil(this.shieldTimer)),
      speedTimer: Math.max(0, Math.ceil(this.speedTimer)),
      invincibleTimer: Math.max(0, Math.ceil(this.invincibleTimer)),
      doubleJumpBoostTimer: Math.max(0, Math.ceil(this.doubleJumpBoostTimer)),
      checkpointReached: this.checkpointReached,
      bossName: bossActive && this.boss ? this.boss.name : null,
      bossTitle: bossActive && this.boss ? this.boss.title : null,
      bossHp: bossActive && this.boss ? this.boss.hp : 0,
      bossMaxHp: this.boss ? this.boss.maxHp : 1,
      bossEnraged: Boolean(
        bossActive && this.boss && this.boss.hp > 0 && this.boss.hp / this.boss.maxHp <= 0.5
      ),
      inCutscene: this.inCutscene,
      cutsceneSubtitle: this.cutsceneSubtitle,
      cutsceneSpeaker: this.cutsceneSpeaker,
      canSkipCutscene: this.inCutscene && this.cutsceneTime >= 11.2,
      secretFoundToast: this.secretFoundToast,
    });
  }

  private render(): void {
    const ctx = this.ctx;
    const rawW = this.canvas.width;
    const rawH = this.canvas.height;
    const worldScale = this.getWorldScale();
    const totalScale = worldScale * this.camZoom;
    const viewW = rawW / totalScale;
    const viewH = rawH / totalScale;

    ctx.save();
    ctx.clearRect(0, 0, rawW, rawH);

    // Apply uniform responsive scale + cutscene zoom without stretching
    ctx.scale(totalScale, totalScale);

    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;

    drawWorldBackground(
      ctx,
      this.level,
      this.camX,
      viewW,
      viewH,
      this.totalTime,
      this.stormIntensity,
      this.lightningFlash
    );

    ctx.save();
    ctx.translate(shakeX, -this.camY + shakeY);

    // Platforms
    for (const p of this.platforms) {
      const rx = p.x - this.camX;
      if (rx + p.w < -60 || rx > viewW / this.camZoom + 60) continue;
      drawPlatform(ctx, p, rx, p.y);
    }

    // Hazards
    for (const h of this.level.hazards) {
      if (h.x - this.camX + h.w < -60 || h.x - this.camX > viewW / this.camZoom + 60) continue;
      drawHazard(ctx, h, this.camX, this.totalTime);
    }

    // Checkpoints
    for (const cp of this.level.checkpoints) {
      drawCheckpoint(ctx, cp, this.camX, this.reachedCheckpoints.has(cp.id), this.totalTime);
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (c.x - this.camX < -40 || c.x - this.camX > viewW / this.camZoom + 40) continue;
      drawCollectible(ctx, c, this.camX, this.totalTime);
    }

    // Maya waiting tied up at the finish clearing (always visible near finish!)
    if (!this.carryingMaya) {
      drawGirlfriend(ctx, {
        x: this.mayaCutsceneX - this.camX,
        y: this.mayaCutsceneY,
        facing: -1,
        animTime: this.totalTime,
        tied: this.mayaTied,
        mood: this.mayaMood,
      });
    }

    // Arena Storm Barrier blocking path to Maya ONLY while Giant Boss is ACTIVE
    if (this.boss && this.boss.lifecycle === 'ACTIVE') {
      const gateX = this.boss.arenaX + this.boss.arenaWidth - 16 - this.camX;
      const gateTop = this.level.finishY - 280;
      const pulse = 0.45 + Math.sin(this.totalTime * 9) * 0.25;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(gateX, gateTop);
      ctx.lineTo(gateX, this.level.finishY);
      ctx.stroke();
      ctx.strokeStyle = `rgba(254, 240, 138, ${pulse * 0.85})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Enemies (including animated Sword-Throwing Zombies & overhead health bars)
    for (const e of this.enemies) {
      if (e.dead) continue;
      const rx = e.x - this.camX;
      if (rx < -80 || rx > viewW / this.camZoom + 80) continue;
      if (e.isZombie) {
        const stateProgress = e.dying
          ? Math.max(0, Math.min(1, 1 - e.deathTimer / 0.65))
          : e.zombieState === 'windup' && e.windupDuration > 0
          ? Math.max(0, Math.min(1, 1 - e.stateTimer / e.windupDuration))
          : 0;
        drawEnemySprite(ctx, e.type, rx, e.y, e.facing, this.totalTime, e.hurtFlash, {
          world: this.level.world,
          zombieState: e.zombieState,
          stateProgress,
          hasSword: e.hasSword,
          hpRatio: e.hp / e.maxHp,
        });
        // Show clean compact health bar when damaged or engaged near Leo
        if (!e.dying && (e.hp < e.maxHp || Math.abs(e.x - this.px) < 340)) {
          const barW = e.type === 'zombie_heavy' ? 42 : 34;
          const barH = 4.5;
          const barY = e.type === 'zombie_heavy' ? e.y - 74 : e.y - 62;
          const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
          ctx.fillRect(rx - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
          ctx.fillStyle =
            e.type === 'zombie_rare'
              ? '#2dd4bf'
              : e.type === 'zombie_elite'
              ? '#a78bfa'
              : e.type === 'zombie_armoured'
              ? '#fb923c'
              : '#ef4444';
          ctx.fillRect(rx - barW / 2, barY, barW * ratio, barH);
          ctx.restore();
        }
      } else {
        drawEnemySprite(ctx, e.type, rx, e.y, e.facing, this.totalTime, e.hurtFlash);
      }
    }

    // Boss (renders during ACTIVE fight AND during dramatic 1.5s DEFEATING animation)
    if (this.boss && (this.boss.lifecycle === 'ACTIVE' || this.boss.lifecycle === 'DEFEATING')) {
      const defeatProg =
        this.boss.lifecycle === 'DEFEATING'
          ? Math.max(0, Math.min(1, 1 - this.boss.defeatTimer / 1.5))
          : 0;
      drawBossSprite(
        ctx,
        this.boss.id,
        this.boss.x - this.camX,
        this.boss.y,
        this.boss.facing,
        this.totalTime,
        this.boss.hurtFlash,
        this.boss.phase,
        this.boss.scale,
        this.boss.accentColor,
        this.boss.hp / this.boss.maxHp,
        defeatProg
      );
    }

    // Telegraphed Storm Hazards (Lightning Warnings & Ice Spikes)
    for (const sh of this.stormHazards) {
      const rx = sh.x - this.camX;
      ctx.save();
      if (sh.warnTimer > 0) {
        const blink = 0.4 + Math.abs(Math.sin(this.totalTime * 18)) * 0.55;
        if (sh.kind === 'lightning') {
          ctx.strokeStyle = `rgba(250, 204, 21, ${blink})`;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(rx, sh.yGround - 420);
          ctx.lineTo(rx, sh.yGround);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = `rgba(250, 204, 21, ${blink * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(rx, sh.yGround, 26, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(56, 189, 248, ${blink * 0.65})`;
          ctx.beginPath();
          ctx.ellipse(rx, sh.yGround, 28, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (sh.kind === 'ice_spike') {
        ctx.fillStyle = '#7dd3fc';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(rx - 22, sh.yGround);
        ctx.lineTo(rx - 6, sh.yGround - 76);
        ctx.lineTo(rx + 4, sh.yGround - 52);
        ctx.lineTo(rx + 12, sh.yGround - 84);
        ctx.lineTo(rx + 24, sh.yGround);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Henchman during kidnapping extraction
    if (this.inCutscene && this.showHenchman) {
      drawEnemySprite(
        ctx,
        'henchman',
        this.henchmanX - this.camX,
        this.henchmanY,
        -1,
        this.totalTime,
        0
      );
    }

    // Hero (Leo)
    const heroEmotion =
      this.inCutscene && this.level.id < 50
        ? this.cutsceneTime < 2.2
          ? 'happy'
          : this.cutsceneTime < 7.4
          ? 'shocked'
          : this.cutsceneTime < 10.6
          ? 'heartbroken'
          : 'speaking'
        : this.inCutscene && this.level.id === 50
        ? 'happy'
        : 'normal';

    const tearIntensity =
      this.inCutscene && this.level.id < 50 && this.cutsceneTime >= 7.2
        ? Math.min(1, (this.cutsceneTime - 7.2) * 1.4)
        : 0;

    drawHero(ctx, {
      x: this.px - this.camX,
      y: this.py,
      facing: this.facing,
      state: this.heroState,
      animTime: this.totalTime,
      skinId: this.saveData.equippedSkin as HeroSkinId,
      vx: this.vx,
      vy: this.vy,
      invincibleTimer: this.invincibleTimer,
      shieldTimer: this.shieldTimer,
      speedTimer: this.speedTimer,
      hurtFlash: this.hurtFlash,
      emotion: heroEmotion,
      tearIntensity,
    });

    // Villain Helicopter during cutscene
    if (this.inCutscene && this.villainHeli && this.heliY > -180) {
      drawVillainHelicopter(
        ctx,
        this.villainHeli,
        this.heliX - this.camX,
        this.heliY,
        this.totalTime,
        this.carryingMaya,
        this.ropeDrop,
        this.searchlightAlpha
      );
    }

    // Projectiles & Lightning Bolts
    for (const lb of this.lightningBolts) {
      const rx = lb.x - this.camX;
      ctx.save();
      ctx.globalAlpha = Math.min(1, lb.life * 4);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(rx, lb.yTop);
      ctx.lineTo(rx - 14, lb.yTop + 110);
      ctx.lineTo(rx + 12, lb.yTop + 210);
      ctx.lineTo(rx - 8, lb.yTop + 290);
      ctx.lineTo(rx, lb.yBottom);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    for (const pr of this.projectiles) {
      if (pr.kind === 'zombie_sword') {
        drawThrownSwordProjectile(ctx, {
          x: pr.x,
          y: pr.y,
          rotation: pr.rotation ?? 0,
          variant: pr.swordVariant,
          world: this.level.world,
          scale: pr.swordScale,
          glowColor: pr.glowColor,
          trail: pr.trail,
          camX: this.camX,
        });
        continue;
      }
      const rx = pr.x - this.camX;
      ctx.save();
      ctx.translate(rx, pr.y);
      if (pr.kind === 'fireball') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (pr.kind === 'boomerang') {
        ctx.rotate(this.totalTime * 18);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 1.2);
        ctx.stroke();
      } else if (pr.kind === 'magic_bow') {
        const dir = pr.vx >= 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.fillStyle = '#f5d0fe';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(8, -4.5);
        ctx.lineTo(8, 4.5);
        ctx.closePath();
        ctx.fill();
      } else if (pr.kind === 'ice_blaster') {
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(0, -6);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (pr.kind === 'energy_gun') {
        ctx.fillStyle = '#34d399';
        ctx.fillRect(-14, -2.5, 28, 5);
        ctx.fillStyle = '#ecfdf5';
        ctx.fillRect(-10, -1, 20, 2);
      } else if (pr.kind === 'explosive_bomb') {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(3, -9, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = pr.kind === 'boss_shot' ? '#ef4444' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, pr.kind === 'boss_shot' ? 10 : 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Particles
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x - this.camX, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // end camera Y / shake

    // Foreground weather (snow, sandstorm, lava embers, boss storm rain & lightning flash)
    if (this.saveData.settings.graphicsQuality === 'high' || this.stormIntensity > 0.05) {
      drawWorldForegroundWeather(
        ctx,
        this.level,
        viewW,
        viewH,
        this.totalTime,
        this.stormIntensity,
        this.lightningFlash
      );
    }

    // Cinematic letterbox bars during kidnapping/reunion cutscenes
    if (this.inCutscene) {
      const barH = Math.min(44, this.cutsceneTime * 60);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.fillRect(0, 0, viewW, barH);
      ctx.fillRect(0, viewH - barH, viewW, barH);
    }

    ctx.restore();
  }
}
