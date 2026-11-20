export type WorldId = 1 | 2 | 3 | 4 | 5;

export type ScreenState =
  | 'MAIN_MENU'
  | 'LEVEL_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'FINAL_VICTORY';

export type ModalType =
  | null
  | 'SHOP'
  | 'WEAPONS'
  | 'ACHIEVEMENTS'
  | 'SETTINGS'
  | 'DAILY_REWARD'
  | 'STORY_RECAP';

export type HeroAnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'doubleJump'
  | 'land'
  | 'attack'
  | 'special'
  | 'hurt'
  | 'collect'
  | 'victory'
  | 'crying'
  | 'dialogue';

export type HeroSkinId =
  | 'classic'
  | 'jungle_ranger'
  | 'desert_nomad'
  | 'arctic_knight'
  | 'shadow_ace'
  | 'golden_champion';

export type CombatWeaponId =
  | 'sword_slash'
  | 'fireball'
  | 'boomerang'
  | 'magic_bow'
  | 'thunder_attack'
  | 'ice_blaster'
  | 'energy_gun'
  | 'explosive_bomb';

export type WeaponId =
  | CombatWeaponId
  | 'shield_aura'
  | 'speed_surge';

export type EnemyType =
  | 'jungle_slime'
  | 'jungle_boar'
  | 'jungle_hornet'
  | 'jungle_totem'
  | 'desert_scorpion'
  | 'desert_raider'
  | 'desert_vulture'
  | 'desert_mummy'
  | 'snow_yeti'
  | 'snow_wolf'
  | 'snow_owl'
  | 'snow_golem'
  | 'castle_skeleton'
  | 'castle_ghost'
  | 'castle_bat'
  | 'castle_knight'
  | 'island_guard'
  | 'island_drone'
  | 'island_mech'
  | 'island_commando'
  | 'island_turret'
  | 'henchman'
  | 'zombie_basic'
  | 'zombie_runner'
  | 'zombie_armoured'
  | 'zombie_heavy'
  | 'zombie_elite'
  | 'zombie_rare';

export type BossId =
  | 'giant_trex'
  | 'giant_snake'
  | 'giant_crocodile'
  | 'giant_gorilla'
  | 'goliath_kong'
  | 'giant_scorpion'
  | 'giant_sand_snake'
  | 'giant_sand_colossus'
  | 'scarab_titan'
  | 'giant_ice_monster'
  | 'giant_frost_dragon'
  | 'glacier_behemoth'
  | 'giant_skeleton'
  | 'giant_fire_demon'
  | 'giant_dragon'
  | 'obsidian_dragon'
  | 'giant_robot'
  | 'giant_mutant'
  | 'vex_fortress_mech';

export type PlatformKind =
  | 'solid'
  | 'bridge'
  | 'moving'
  | 'ice'
  | 'bouncy'
  | 'secret_wall';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  biomeTile?: 'grass' | 'cave' | 'sand' | 'temple' | 'snow' | 'ice' | 'stone' | 'metal';
}

export type HazardKind =
  | 'spikes'
  | 'water'
  | 'quicksand'
  | 'icicle'
  | 'lava'
  | 'laser';

export interface HazardDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: HazardKind;
  cycleMs?: number;
}

export type CollectibleKind =
  | 'coin'
  | 'diamond'
  | 'chest'
  | 'heart'
  | 'power_fireball'
  | 'power_boomerang'
  | 'power_shield'
  | 'power_speed'
  | 'power_doublejump'
  | 'power_invincible';

export interface CollectibleDef {
  id: string;
  x: number;
  y: number;
  kind: CollectibleKind;
  secret?: boolean;
}

export interface EnemySpawnDef {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  patrolWidth: number;
  speedMultiplier?: number;
  zombieMode?: 'chase' | 'stand';
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export interface SceneryZone {
  xStart: number;
  xEnd: number;
  style: 'open' | 'cave' | 'waterfall' | 'temple' | 'storm' | 'fortress';
}

export interface BossConfig {
  id: BossId;
  name: string;
  title: string;
  maxHp: number;
  arenaX: number;
  arenaWidth: number;
  spawnX: number;
  spawnY: number;
  rewardCoins: number;
  rewardDiamonds: number;
  scale?: number;
  accentColor?: string;
  isMajorWorldBoss?: boolean;
}

export interface VillainHeliConfig {
  levelFrom: number;
  nextLevel: number;
  villainName: string;
  villainTitle: string;
  heliName: string;
  heliColor: string;
  heliAccent: string;
  heliStyle: 'single' | 'twin' | 'stealth' | 'armored' | 'cryo' | 'gothic' | 'gunship';
  captureMethod: 'rope_ladder' | 'claw_cage' | 'winch_harness' | 'tractor_net' | 'jet_grappler';
  cameraAngle: 'pan_zoom' | 'low_dramatic' | 'overhead_sweep' | 'close_heartbreak';
  tauntLine: string;
  nextLocationClue: string;
  villainSkinTone: string;
  villainCoatColor: string;
  villainVisorColor: string;
  villainHairStyle: 'spiky' | 'slick' | 'helmet' | 'hood' | 'mohawk';
}

export interface LevelConfig {
  id: number;
  world: WorldId;
  worldName: string;
  title: string;
  subtitle: string;
  missionBrief: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  finishX: number;
  finishY: number;
  hasUndergroundCave: boolean;
  hasWaterfall: boolean;
  hasSandstorm: boolean;
  hasSnowfall: boolean;
  hasLavaGlow: boolean;
  hasSearchlights: boolean;
  sceneryZones: SceneryZone[];
  platforms: PlatformDef[];
  hazards: HazardDef[];
  collectibles: CollectibleDef[];
  enemies: EnemySpawnDef[];
  checkpoints: CheckpointDef[];
  boss?: BossConfig;
  targetTimeSec: number;
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'high' | 'balanced';
  controlSensitivity: number;
  showTouchControls: boolean;
}

export interface SaveData {
  unlockedLevel: number;
  completedLevels: number[];
  starsByLevel: Record<number, number>;
  bestScoreByLevel: Record<number, number>;
  coins: number;
  diamonds: number;
  unlockedSkins: HeroSkinId[];
  equippedSkin: HeroSkinId;
  unlockedWeapons: CombatWeaponId[];
  equippedWeapon: CombatWeaponId;
  equippedSpecial: WeaponId;
  weaponLevels: Record<WeaponId, number>;
  achievements: string[];
  totalEnemiesDefeated: number;
  totalChestsOpened: number;
  totalCoinsCollected: number;
  totalBossesDefeated: number;
  lastDailyClaimDate: string | null;
  dailyStreak: number;
  settings: GameSettings;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  lives: number;
  score: number;
  coins: number;
  diamonds: number;
  chestsOpened: number;
  enemiesDefeated: number;
  elapsedSec: number;
  equippedWeapon: CombatWeaponId;
  weaponAmmo: Record<CombatWeaponId, number | null>;
  weaponCooldowns: Record<CombatWeaponId, number>;
  weaponMaxCooldowns: Record<CombatWeaponId, number>;
  activeSpecial: WeaponId;
  specialAmmo: number;
  shieldTimer: number;
  speedTimer: number;
  invincibleTimer: number;
  doubleJumpBoostTimer: number;
  checkpointReached: boolean;
  bossName: string | null;
  bossTitle?: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossEnraged?: boolean;
  inCutscene: boolean;
  cutsceneSubtitle: string;
  cutsceneSpeaker: 'Leo' | 'Maya' | 'Villain' | null;
  canSkipCutscene: boolean;
  secretFoundToast: string | null;
}

export interface LevelEndSummary {
  levelId: number;
  levelTitle: string;
  score: number;
  coinsCollected: number;
  diamondsCollected: number;
  starsEarned: number;
  enemiesDefeated: number;
  chestsFound: number;
  elapsedSec: number;
  newlyUnlockedLevel: number | null;
  kidnappingClue: string;
  nextVillainName: string;
  isFinalVictory: boolean;
}
