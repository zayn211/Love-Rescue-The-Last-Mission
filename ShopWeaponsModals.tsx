import React, { useState } from 'react';
import { Award, Check, Gift, Lock, RotateCcw, ShoppingBag, Swords, X } from 'lucide-react';
import {
  ACHIEVEMENTS_LIST,
  HERO_SKINS,
  WEAPONS_LIST,
} from '../data/shopAndAchievements';
import {
  CombatWeaponId,
  GameSettings,
  HeroSkinId,
  ModalType,
  SaveData,
  WeaponId,
} from '../types/game';
import { WeaponIcon } from './WeaponIcon';

interface ModalsProps {
  activeModal: ModalType;
  saveData: SaveData;
  canClaimDaily: boolean;
  onClose: () => void;
  onBuyOrEquipSkin: (skinId: HeroSkinId) => void;
  onEquipOrUpgradeWeapon: (weaponId: WeaponId, action: 'unlock' | 'equip' | 'upgrade') => void;
  onClaimAchievement: (id: string, rewardDiamonds: number) => void;
  onClaimDailyReward: () => void;
  onUpdateSettings: (next: GameSettings) => void;
  onResetProgress: () => void;
}

export const AppModals: React.FC<ModalsProps> = ({
  activeModal,
  saveData,
  canClaimDaily,
  onClose,
  onBuyOrEquipSkin,
  onEquipOrUpgradeWeapon,
  onClaimAchievement,
  onClaimDailyReward,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!activeModal) return null;

  const totalStars = Object.values(saveData.starsByLevel).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            {activeModal === 'SHOP' && <ShoppingBag className="w-5 h-5 text-emerald-400" />}
            {activeModal === 'WEAPONS' && <Swords className="w-5 h-5 text-orange-400" />}
            {activeModal === 'ACHIEVEMENTS' && <Award className="w-5 h-5 text-yellow-400" />}
            {activeModal === 'DAILY_REWARD' && <Gift className="w-5 h-5 text-amber-400" />}
            <h2 className="font-display font-bold text-lg sm:text-xl">
              {activeModal === 'SHOP' && 'Character Shop · Hero Skins'}
              {activeModal === 'WEAPONS' && 'Weapons & Abilities'}
              {activeModal === 'ACHIEVEMENTS' && 'Mission Achievements'}
              {activeModal === 'DAILY_REWARD' && 'Daily Rescue Supply Drop'}
              {activeModal === 'SETTINGS' && 'Game Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-num text-slate-300">
              Coins: <strong className="text-amber-400">{saveData.coins}</strong> · Gems:{' '}
              <strong className="text-sky-400">{saveData.diamonds}</strong>
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeModal === 'SHOP' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HERO_SKINS.map((skin) => {
                const unlocked = saveData.unlockedSkins.includes(skin.id);
                const equipped = saveData.equippedSkin === skin.id;
                const canAfford =
                  saveData.coins >= skin.costCoins && saveData.diamonds >= skin.costDiamonds;

                return (
                  <div
                    key={skin.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      equipped
                        ? 'bg-slate-800 border-amber-400'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color swatch preview of Leo's jacket + scarf */}
                      <div
                        className="w-12 h-12 rounded-xl border border-slate-600 shrink-0 flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: skin.jacketColor }}
                      >
                        <div
                          className="w-full h-3 absolute bottom-2"
                          style={{ backgroundColor: skin.scarfColor }}
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-white">
                          {skin.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{skin.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs font-mono-num text-slate-300">
                        {unlocked ? (
                          <span className="text-emerald-400 font-semibold">Unlocked</span>
                        ) : (
                          <span>
                            {skin.costCoins} Coins
                            {skin.costDiamonds > 0 ? ` + ${skin.costDiamonds} Gems` : ''}
                          </span>
                        )}
                      </div>

                      <button
                        disabled={!unlocked && !canAfford}
                        onClick={() => onBuyOrEquipSkin(skin.id)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          equipped
                            ? 'bg-emerald-500 text-slate-950'
                            : unlocked
                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                            : canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {equipped ? 'Equipped' : unlocked ? 'Equip' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'WEAPONS' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5">
                Unlock weapons with Coins to add them to your live right-side Combat Inventory during missions.
              </div>
              {WEAPONS_LIST.map((w) => {
                const isCombat = w.role === 'Combat';
                const unlocked = isCombat
                  ? saveData.unlockedWeapons.includes(w.id as CombatWeaponId)
                  : true;
                const lvl = saveData.weaponLevels[w.id] ?? 1;
                const isSelected = isCombat
                  ? saveData.equippedWeapon === w.id
                  : saveData.equippedSpecial === w.id;
                const upgradeCost = w.upgradeCostCoins * lvl;
                const maxed = lvl >= w.maxLevel;
                const canAffordUnlock = saveData.coins >= w.unlockCostCoins;
                const canAffordUpgrade = saveData.coins >= upgradeCost;

                return (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected && unlocked
                        ? 'bg-slate-800/90 border-amber-400/70'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center shrink-0"
                        style={{ color: w.accentColor }}
                      >
                        <WeaponIcon weaponId={w.id} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-bold text-base text-white">
                            {w.name}
                          </h3>
                          <span className="text-xs text-amber-400 font-mono-num">
                            {unlocked ? `Lv.${lvl}/${w.maxLevel}` : 'Locked'} ·{' '}
                            {w.maxAmmo === null ? 'Unlimited' : `${w.maxAmmo} Ammo`} ·{' '}
                            {w.cooldownSec}s CD
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{w.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!unlocked ? (
                        <button
                          disabled={!canAffordUnlock}
                          onClick={() => onEquipOrUpgradeWeapon(w.id, 'unlock')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                            canAffordUnlock
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Unlock ({w.unlockCostCoins} Coins)
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onEquipOrUpgradeWeapon(w.id, 'equip')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                          <button
                            disabled={maxed || !canAffordUpgrade}
                            onClick={() => onEquipOrUpgradeWeapon(w.id, 'upgrade')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                              maxed
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : canAffordUpgrade
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {maxed ? 'Max Level' : `Upgrade (${upgradeCost}c)`}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'ACHIEVEMENTS' && (
            <div className="space-y-2.5">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const status = ach.check({
                  completedLevels: saveData.completedLevels,
                  totalEnemiesDefeated: saveData.totalEnemiesDefeated,
                  totalChestsOpened: saveData.totalChestsOpened,
                  totalCoinsCollected: saveData.totalCoinsCollected,
                  totalBossesDefeated: saveData.totalBossesDefeated,
                  totalStars,
                });
                const claimed = saveData.achievements.includes(ach.id);

                return (
                  <div
                    key={ach.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-sm sm:text-base text-white">
                          {ach.title}
                        </h3>
                        <span className="text-xs font-mono-num text-sky-400">
                          +{ach.rewardDiamonds} Gems
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${(status.progress / status.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono-num text-slate-400">
                          {status.progress}/{status.target}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {claimed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <Check className="w-4 h-4" /> Claimed
                        </span>
                      ) : status.unlocked ? (
                        <button
                          onClick={() => onClaimAchievement(ach.id, ach.rewardDiamonds)}
                          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Claim +{ach.rewardDiamonds}
                        </button>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'DAILY_REWARD' && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-300 mb-4">
                Current Streak: <strong className="text-amber-400">{saveData.dailyStreak} Days</strong> · Return every day for bonus supplies!
              </p>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const coinsR = day * 40;
                  const gemsR = day >= 5 ? 3 : day >= 3 ? 2 : 1;
                  const claimed = day <= (saveData.dailyStreak % 7);
                  return (
                    <div
                      key={day}
                      className={`p-2.5 rounded-xl border text-center font-mono-num ${
                        claimed
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Day {day}</div>
                      <div className="text-xs text-amber-400 mt-1">{coinsR}c</div>
                      <div className="text-xs text-sky-400">{gemsR}g</div>
                    </div>
                  );
                })}
              </div>
              <button
                disabled={!canClaimDaily}
                onClick={onClaimDailyReward}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-extrabold cursor-pointer"
              >
                {canClaimDaily ? 'Claim Today’s Reward' : 'Already Claimed Today'}
              </button>
            </div>
          )}

          {activeModal === 'SETTINGS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <span className="text-sm font-semibold">Background Music</span>
                  <input
                    type="checkbox"
                    checked={saveData.settings.musicEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        musicEnabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <span className="text-sm font-semibold">Sound Effects & Voice</span>
                  <input
                    type="checkbox"
                    checked={saveData.settings.sfxEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        sfxEnabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono-num mb-1">
                    <span>Music Volume</span>
                    <span>{Math.round(saveData.settings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveData.settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        musicVolume: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono-num mb-1">
                    <span>SFX & Voice Volume</span>
                    <span>{Math.round(saveData.settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveData.settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        sfxVolume: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono-num mb-1">
                    <span>Control Sensitivity</span>
                    <span>{saveData.settings.controlSensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.25}
                    step={0.05}
                    value={saveData.settings.controlSensitivity}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        controlSensitivity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold">Graphics Quality</span>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                    {(['high', 'balanced'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() =>
                          onUpdateSettings({ ...saveData.settings, graphicsQuality: q })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold capitalize cursor-pointer ${
                          saveData.settings.graphicsQuality === q
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <span className="text-sm font-semibold">On-Screen Touch Pads</span>
                  <input
                    type="checkbox"
                    checked={saveData.settings.showTouchControls}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...saveData.settings,
                        showTouchControls: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                </label>
              </div>

              {/* Reset Progress with explicit confirmation */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-rose-300">Reset All Progress</div>
                  <div className="text-xs text-slate-400">
                    Clears unlocked levels, coins, diamonds, skins, and stars.
                  </div>
                </div>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onResetProgress();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
