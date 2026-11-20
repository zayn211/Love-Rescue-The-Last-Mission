import { HeroSkinId, WeaponId } from '../types/game';

export interface SkinDefinition {
  id: HeroSkinId;
  name: string;
  description: string;
  costCoins: number;
  costDiamonds: number;
  jacketColor: string;
  jacketTrim: string;
  scarfColor: string;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
}

export const HERO_SKINS: SkinDefinition[] = [
  {
    id: 'classic',
    name: 'Classic Explorer',
    description: 'Leo’s signature navy adventure jacket and crimson scarf.',
    costCoins: 0,
    costDiamonds: 0,
    jacketColor: '#1e3a5f',
    jacketTrim: '#3b82f6',
    scarfColor: '#dc2626',
    shirtColor: '#f1f5f9',
    pantsColor: '#1e293b',
    hairColor: '#6b3e26',
  },
  {
    id: 'jungle_ranger',
    name: 'Canopy Ranger',
    description: 'Emerald expedition vest and amber trail scarf built for the jungle.',
    costCoins: 180,
    costDiamonds: 0,
    jacketColor: '#166534',
    jacketTrim: '#4ade80',
    scarfColor: '#f59e0b',
    shirtColor: '#fef3c7',
    pantsColor: '#3f2e21',
    hairColor: '#5c3317',
  },
  {
    id: 'desert_nomad',
    name: 'Sunfire Nomad',
    description: 'Sandstone desert tunic with cobalt sash to brave scorching dunes.',
    costCoins: 350,
    costDiamonds: 3,
    jacketColor: '#b45309',
    jacketTrim: '#fbbf24',
    scarfColor: '#0284c7',
    shirtColor: '#fffbeb',
    pantsColor: '#451a03',
    hairColor: '#4a2c18',
  },
  {
    id: 'arctic_knight',
    name: 'Frostguard Coat',
    description: 'Insulated glacial parka with crimson wool scarf for frozen peaks.',
    costCoins: 550,
    costDiamonds: 6,
    jacketColor: '#0369a1',
    jacketTrim: '#bae6fd',
    scarfColor: '#e11d48',
    shirtColor: '#f8fafc',
    pantsColor: '#0f172a',
    hairColor: '#6b3e26',
  },
  {
    id: 'shadow_ace',
    name: 'Midnight Stealth',
    description: 'Obsidian covert coat with violet tactical trim for castle infiltration.',
    costCoins: 800,
    costDiamonds: 10,
    jacketColor: '#18181b',
    jacketTrim: '#a855f7',
    scarfColor: '#f43f5e',
    shirtColor: '#334155',
    pantsColor: '#09090b',
    hairColor: '#3b2416',
  },
  {
    id: 'golden_champion',
    name: 'Radiant Champion',
    description: 'Royal gold-trimmed hero coat forged for the final mission.',
    costCoins: 1200,
    costDiamonds: 16,
    jacketColor: '#ca8a04',
    jacketTrim: '#fef08a',
    scarfColor: '#be123c',
    shirtColor: '#ffffff',
    pantsColor: '#1e1b4b',
    hairColor: '#6b3e26',
  },
];

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  shortName: string;
  role: 'Combat' | 'Utility';
  description: string;
  unlockCostCoins: number;
  upgradeCostCoins: number;
  maxLevel: number;
  cooldownSec: number;
  maxAmmo: number | null; // null = unlimited
  rechargeSec: number | null;
  accentColor: string;
}

export const WEAPONS_LIST: WeaponDefinition[] = [
  {
    id: 'sword_slash',
    name: 'Basic Sword',
    shortName: 'Sword',
    role: 'Combat',
    description: 'Crisp close-range crescent blade slash. Unlimited strikes with fast recovery.',
    unlockCostCoins: 0,
    upgradeCostCoins: 120,
    maxLevel: 5,
    cooldownSec: 0.28,
    maxAmmo: null,
    rechargeSec: null,
    accentColor: '#e2e8f0',
  },
  {
    id: 'fireball',
    name: 'Fireball',
    shortName: 'Fireball',
    role: 'Combat',
    description: 'Launches blazing energy orbs that explode in fiery AoE blasts on impact.',
    unlockCostCoins: 100,
    upgradeCostCoins: 150,
    maxLevel: 5,
    cooldownSec: 0.45,
    maxAmmo: 10,
    rechargeSec: 2.2,
    accentColor: '#f97316',
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortName: 'Rang',
    role: 'Combat',
    description: 'Spinning sky blade that pierces every enemy in line and returns to Leo.',
    unlockCostCoins: 150,
    upgradeCostCoins: 160,
    maxLevel: 5,
    cooldownSec: 0.75,
    maxAmmo: 6,
    rechargeSec: 2.4,
    accentColor: '#22d3ee',
  },
  {
    id: 'magic_bow',
    name: 'Magic Bow',
    shortName: 'Bow',
    role: 'Combat',
    description: 'Fires high-velocity enchanted arrows across the screen with piercing precision.',
    unlockCostCoins: 200,
    upgradeCostCoins: 170,
    maxLevel: 5,
    cooldownSec: 0.36,
    maxAmmo: 14,
    rechargeSec: 1.8,
    accentColor: '#a855f7',
  },
  {
    id: 'thunder_attack',
    name: 'Thunder Attack',
    shortName: 'Thunder',
    role: 'Combat',
    description: 'Calls down a sky lightning bolt onto enemies ahead with heavy shock damage.',
    unlockCostCoins: 260,
    upgradeCostCoins: 200,
    maxLevel: 5,
    cooldownSec: 1.25,
    maxAmmo: 5,
    rechargeSec: 3.2,
    accentColor: '#facc15',
  },
  {
    id: 'ice_blaster',
    name: 'Ice Blaster',
    shortName: 'Ice',
    role: 'Combat',
    description: 'Fires subzero frost shards that chill and slow enemies on impact.',
    unlockCostCoins: 320,
    upgradeCostCoins: 190,
    maxLevel: 5,
    cooldownSec: 0.42,
    maxAmmo: 12,
    rechargeSec: 2.0,
    accentColor: '#38bdf8',
  },
  {
    id: 'energy_gun',
    name: 'Energy Gun',
    shortName: 'Energy',
    role: 'Combat',
    description: 'Rapid-fire plasma blaster discharging high-speed cyan laser bolts.',
    unlockCostCoins: 400,
    upgradeCostCoins: 220,
    maxLevel: 5,
    cooldownSec: 0.22,
    maxAmmo: 18,
    rechargeSec: 1.5,
    accentColor: '#34d399',
  },
  {
    id: 'explosive_bomb',
    name: 'Explosive Bomb',
    shortName: 'Bomb',
    role: 'Combat',
    description: 'Tosses an arcing heavy bomb that bounces and detonates in a huge blast radius.',
    unlockCostCoins: 500,
    upgradeCostCoins: 240,
    maxLevel: 5,
    cooldownSec: 1.1,
    maxAmmo: 6,
    rechargeSec: 3.0,
    accentColor: '#ef4444',
  },
  {
    id: 'shield_aura',
    name: 'Guardian Shield',
    shortName: 'Shield',
    role: 'Utility',
    description: 'Extends protective barrier duration when collecting or triggering shields.',
    unlockCostCoins: 0,
    upgradeCostCoins: 200,
    maxLevel: 5,
    cooldownSec: 1.0,
    maxAmmo: null,
    rechargeSec: null,
    accentColor: '#60a5fa',
  },
  {
    id: 'speed_surge',
    name: 'Dash Surge',
    shortName: 'Speed',
    role: 'Utility',
    description: 'Permanently enhances sprint agility and speed boost duration.',
    unlockCostCoins: 0,
    upgradeCostCoins: 150,
    maxLevel: 5,
    cooldownSec: 1.0,
    maxAmmo: null,
    rechargeSec: null,
    accentColor: '#10b981',
  },
];

export const COMBAT_WEAPONS_LIST = WEAPONS_LIST.filter(
  (w): w is WeaponDefinition & { id: import('../types/game').CombatWeaponId } =>
    w.role === 'Combat'
);

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardDiamonds: number;
  check: (stats: {
    completedLevels: number[];
    totalEnemiesDefeated: number;
    totalChestsOpened: number;
    totalCoinsCollected: number;
    totalBossesDefeated: number;
    totalStars: number;
  }) => { unlocked: boolean; progress: number; target: number };
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  {
    id: 'first_vow',
    title: 'Heartbreak Vow',
    description: 'Complete Level 1 and swear to rescue Maya.',
    rewardDiamonds: 2,
    check: (s) => ({
      unlocked: s.completedLevels.includes(1),
      progress: s.completedLevels.includes(1) ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: 'jungle_champ',
    title: 'Jungle Conqueror',
    description: 'Defeat Goliath Vine-Kong and clear World 1 (Level 10).',
    rewardDiamonds: 5,
    check: (s) => ({
      unlocked: s.completedLevels.includes(10),
      progress: s.completedLevels.filter((l) => l >= 1 && l <= 10).length,
      target: 10,
    }),
  },
  {
    id: 'desert_champ',
    title: 'Desert Survivor',
    description: 'Defeat Pharaoh Scarab-Titan and clear World 2 (Level 20).',
    rewardDiamonds: 6,
    check: (s) => ({
      unlocked: s.completedLevels.includes(20),
      progress: s.completedLevels.filter((l) => l >= 11 && l <= 20).length,
      target: 10,
    }),
  },
  {
    id: 'snow_champ',
    title: 'Frost Breaker',
    description: 'Defeat Glacier Behemoth and clear World 3 (Level 30).',
    rewardDiamonds: 7,
    check: (s) => ({
      unlocked: s.completedLevels.includes(30),
      progress: s.completedLevels.filter((l) => l >= 21 && l <= 30).length,
      target: 10,
    }),
  },
  {
    id: 'castle_champ',
    title: 'Dragon Slayer',
    description: 'Defeat Obsidian Dread-Dragon and clear World 4 (Level 40).',
    rewardDiamonds: 8,
    check: (s) => ({
      unlocked: s.completedLevels.includes(40),
      progress: s.completedLevels.filter((l) => l >= 31 && l <= 40).length,
      target: 10,
    }),
  },
  {
    id: 'final_hero',
    title: 'The Last Mission Complete',
    description: 'Defeat General Vex at Level 50 and reunite with Maya.',
    rewardDiamonds: 15,
    check: (s) => ({
      unlocked: s.completedLevels.includes(50),
      progress: s.completedLevels.filter((l) => l >= 41 && l <= 50).length,
      target: 10,
    }),
  },
  {
    id: 'treasure_hunter',
    title: 'Secret Path Seeker',
    description: 'Discover and open 10 hidden treasure chests.',
    rewardDiamonds: 4,
    check: (s) => ({
      unlocked: s.totalChestsOpened >= 10,
      progress: Math.min(10, s.totalChestsOpened),
      target: 10,
    }),
  },
  {
    id: 'enemy_buster',
    title: 'Fearless Brawler',
    description: 'Defeat 50 syndicate enemies across any levels.',
    rewardDiamonds: 4,
    check: (s) => ({
      unlocked: s.totalEnemiesDefeated >= 50,
      progress: Math.min(50, s.totalEnemiesDefeated),
      target: 50,
    }),
  },
  {
    id: 'coin_collector',
    title: 'Golden Fortune',
    description: 'Collect 500 gold coins on your rescue journey.',
    rewardDiamonds: 4,
    check: (s) => ({
      unlocked: s.totalCoinsCollected >= 500,
      progress: Math.min(500, s.totalCoinsCollected),
      target: 500,
    }),
  },
  {
    id: 'star_master',
    title: 'Shining Example',
    description: 'Earn 30 total stars across levels.',
    rewardDiamonds: 6,
    check: (s) => ({
      unlocked: s.totalStars >= 30,
      progress: Math.min(30, s.totalStars),
      target: 30,
    }),
  },
];

export function getSkinById(id: HeroSkinId): SkinDefinition {
  return HERO_SKINS.find((s) => s.id === id) ?? HERO_SKINS[0];
}
