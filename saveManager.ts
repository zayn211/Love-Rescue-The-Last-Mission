import { CombatWeaponId, HeroSkinId, SaveData, WeaponId } from '../types/game';

const STORAGE_KEY = 'love_rescue_last_mission_save_v1';

export const DEFAULT_SAVE_DATA: SaveData = {
  unlockedLevel: 1,
  completedLevels: [],
  starsByLevel: {},
  bestScoreByLevel: {},
  coins: 120,
  diamonds: 5,
  unlockedSkins: ['classic'],
  equippedSkin: 'classic',
  unlockedWeapons: ['sword_slash'],
  equippedWeapon: 'sword_slash',
  equippedSpecial: 'fireball',
  weaponLevels: {
    sword_slash: 1,
    fireball: 1,
    boomerang: 1,
    magic_bow: 1,
    thunder_attack: 1,
    ice_blaster: 1,
    energy_gun: 1,
    explosive_bomb: 1,
    shield_aura: 1,
    speed_surge: 1,
  },
  achievements: [],
  totalEnemiesDefeated: 0,
  totalChestsOpened: 0,
  totalCoinsCollected: 0,
  totalBossesDefeated: 0,
  lastDailyClaimDate: null,
  dailyStreak: 0,
  settings: {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.65,
    sfxVolume: 0.85,
    graphicsQuality: 'high',
    controlSensitivity: 1.0,
    showTouchControls: true,
  },
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_DATA);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const unlockedWeapons: CombatWeaponId[] =
      parsed.unlockedWeapons && parsed.unlockedWeapons.length > 0
        ? (parsed.unlockedWeapons as CombatWeaponId[])
        : ['sword_slash'];
    if (!unlockedWeapons.includes('sword_slash')) {
      unlockedWeapons.unshift('sword_slash');
    }
    const equippedWeapon: CombatWeaponId =
      parsed.equippedWeapon && unlockedWeapons.includes(parsed.equippedWeapon as CombatWeaponId)
        ? (parsed.equippedWeapon as CombatWeaponId)
        : 'sword_slash';

    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      weaponLevels: {
        ...DEFAULT_SAVE_DATA.weaponLevels,
        ...(parsed.weaponLevels ?? {}),
      },
      settings: {
        ...DEFAULT_SAVE_DATA.settings,
        ...(parsed.settings ?? {}),
      },
      unlockedSkins:
        parsed.unlockedSkins && parsed.unlockedSkins.length > 0
          ? (parsed.unlockedSkins as HeroSkinId[])
          : ['classic'],
      unlockedWeapons,
      equippedWeapon,
      equippedSpecial: (parsed.equippedSpecial as WeaponId) ?? 'fireball',
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_DATA);
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function resetSaveData(): SaveData {
  const fresh = structuredClone(DEFAULT_SAVE_DATA);
  persistSaveData(fresh);
  return fresh;
}
