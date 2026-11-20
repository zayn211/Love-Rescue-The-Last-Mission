import { useCallback, useEffect, useState } from 'react';
import { audioEngine } from './audio/AudioEngine';
import { GameViewport } from './components/GameViewport';
import { LevelSelect } from './components/LevelSelect';
import { MainMenu } from './components/MainMenu';
import {
  GameOverModal,
  LevelCompleteModal,
  PauseModal,
} from './components/Overlays';
import { AppModals } from './components/ShopWeaponsModals';
import { getLevelById } from './data/levels';
import {
  loadSaveData,
  persistSaveData,
  resetSaveData,
} from './data/saveManager';
import { HERO_SKINS, WEAPONS_LIST } from './data/shopAndAchievements';
import {
  CombatWeaponId,
  GameSettings,
  HeroSkinId,
  LevelEndSummary,
  ModalType,
  SaveData,
  ScreenState,
  WeaponId,
} from './types/game';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<ScreenState>('MAIN_MENU');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => saveData.unlockedLevel);
  const [runCounter, setRunCounter] = useState(0);
  const [lastSummary, setLastSummary] = useState<LevelEndSummary | null>(null);

  const todayKey = getTodayKey();
  const canClaimDaily = saveData.lastDailyClaimDate !== todayKey;

  useEffect(() => {
    audioEngine.updateSettings(saveData.settings);
  }, [saveData.settings]);

  useEffect(() => {
    if (screen === 'MAIN_MENU' || screen === 'LEVEL_SELECT') {
      audioEngine.setMusicMood('menu');
    }
  }, [screen]);

  // Unlock browser AudioContext on first user interaction
  useEffect(() => {
    const unlock = () => audioEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const updateSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      persistSaveData(next);
      return next;
    });
  }, []);

  const startLevel = useCallback((levelId: number) => {
    audioEngine.unlock();
    audioEngine.playSfx('ui_click');
    setCurrentLevelId(levelId);
    setRunCounter((c) => c + 1);
    setLastSummary(null);
    setScreen('PLAYING');
  }, []);

  // Enter/Space on Main Menu starts/continues immediately when no modal is open
  useEffect(() => {
    if (screen !== 'MAIN_MENU' || activeModal !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startLevel(saveData.unlockedLevel);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, activeModal, saveData.unlockedLevel, startLevel]);

  const handleLevelComplete = useCallback(
    (summary: LevelEndSummary) => {
      setLastSummary(summary);
      updateSave((prev) => {
        const completed = prev.completedLevels.includes(summary.levelId)
          ? prev.completedLevels
          : [...prev.completedLevels, summary.levelId];
        const prevStars = prev.starsByLevel[summary.levelId] ?? 0;
        const prevBest = prev.bestScoreByLevel[summary.levelId] ?? 0;
        const nextUnlocked = Math.min(
          50,
          Math.max(prev.unlockedLevel, summary.levelId + 1)
        );
        return {
          ...prev,
          unlockedLevel: nextUnlocked,
          completedLevels: completed,
          starsByLevel: {
            ...prev.starsByLevel,
            [summary.levelId]: Math.max(prevStars, summary.starsEarned),
          },
          bestScoreByLevel: {
            ...prev.bestScoreByLevel,
            [summary.levelId]: Math.max(prevBest, summary.score),
          },
          coins: prev.coins + summary.coinsCollected,
          diamonds: prev.diamonds + summary.diamondsCollected,
          totalCoinsCollected: prev.totalCoinsCollected + summary.coinsCollected,
          totalEnemiesDefeated: prev.totalEnemiesDefeated + summary.enemiesDefeated,
          totalChestsOpened: prev.totalChestsOpened + summary.chestsFound,
          totalBossesDefeated: prev.totalBossesDefeated + 1,
        };
      });
      setScreen('LEVEL_COMPLETE');
    },
    [updateSave]
  );

  const handleGameOver = useCallback(() => {
    setScreen('GAME_OVER');
  }, []);

  const handleToggleAudioQuick = useCallback(() => {
    audioEngine.unlock();
    updateSave((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        musicEnabled: !prev.settings.musicEnabled,
        sfxEnabled: !prev.settings.musicEnabled,
      },
    }));
  }, [updateSave]);

  const handleBuyOrEquipSkin = (skinId: HeroSkinId) => {
    audioEngine.playSfx('ui_click');
    const skin = HERO_SKINS.find((s) => s.id === skinId);
    if (!skin) return;
    updateSave((prev) => {
      if (prev.unlockedSkins.includes(skinId)) {
        return { ...prev, equippedSkin: skinId };
      }
      if (prev.coins < skin.costCoins || prev.diamonds < skin.costDiamonds) {
        return prev;
      }
      return {
        ...prev,
        coins: prev.coins - skin.costCoins,
        diamonds: prev.diamonds - skin.costDiamonds,
        unlockedSkins: [...prev.unlockedSkins, skinId],
        equippedSkin: skinId,
      };
    });
  };

  const handleEquipOrUpgradeWeapon = (
    weaponId: WeaponId,
    action: 'unlock' | 'equip' | 'upgrade'
  ) => {
    audioEngine.playSfx('ui_click');
    const def = WEAPONS_LIST.find((w) => w.id === weaponId);
    if (!def) return;

    updateSave((prev) => {
      if (action === 'unlock') {
        if (def.role !== 'Combat') return prev;
        const combatId = weaponId as CombatWeaponId;
        if (prev.unlockedWeapons.includes(combatId)) {
          return { ...prev, equippedWeapon: combatId };
        }
        if (prev.coins < def.unlockCostCoins) return prev;
        return {
          ...prev,
          coins: prev.coins - def.unlockCostCoins,
          unlockedWeapons: [...prev.unlockedWeapons, combatId],
          equippedWeapon: combatId,
        };
      }

      if (action === 'equip') {
        if (def.role === 'Combat') {
          const combatId = weaponId as CombatWeaponId;
          if (!prev.unlockedWeapons.includes(combatId)) return prev;
          return { ...prev, equippedWeapon: combatId };
        }
        return { ...prev, equippedSpecial: weaponId };
      }

      if (
        def.role === 'Combat' &&
        !prev.unlockedWeapons.includes(weaponId as CombatWeaponId)
      ) {
        return prev;
      }

      const curLvl = prev.weaponLevels[weaponId] ?? 1;
      const cost = def.upgradeCostCoins * curLvl;
      if (curLvl >= def.maxLevel || prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        weaponLevels: {
          ...prev.weaponLevels,
          [weaponId]: curLvl + 1,
        },
      };
    });
  };

  const handleSelectWeapon = useCallback(
    (weaponId: CombatWeaponId) => {
      updateSave((prev) => {
        if (!prev.unlockedWeapons.includes(weaponId) || prev.equippedWeapon === weaponId) {
          return prev;
        }
        return { ...prev, equippedWeapon: weaponId };
      });
    },
    [updateSave]
  );

  const handleClaimAchievement = (id: string, rewardDiamonds: number) => {
    audioEngine.playSfx('diamond');
    updateSave((prev) => {
      if (prev.achievements.includes(id)) return prev;
      return {
        ...prev,
        diamonds: prev.diamonds + rewardDiamonds,
        achievements: [...prev.achievements, id],
      };
    });
  };

  const handleClaimDailyReward = () => {
    if (!canClaimDaily) return;
    audioEngine.playSfx('chest');
    updateSave((prev) => {
      const nextStreak = prev.dailyStreak + 1;
      const day = ((nextStreak - 1) % 7) + 1;
      const coinsR = day * 40;
      const gemsR = day >= 5 ? 3 : day >= 3 ? 2 : 1;
      return {
        ...prev,
        coins: prev.coins + coinsR,
        diamonds: prev.diamonds + gemsR,
        dailyStreak: nextStreak,
        lastDailyClaimDate: todayKey,
      };
    });
  };

  const handleUpdateSettings = (nextSettings: GameSettings) => {
    updateSave((prev) => ({ ...prev, settings: nextSettings }));
  };

  const handleResetProgress = () => {
    const fresh = resetSaveData();
    setSaveData(fresh);
    setCurrentLevelId(1);
    setActiveModal(null);
    setScreen('MAIN_MENU');
  };

  const activeLevel = getLevelById(currentLevelId);

  return (
    <div className="w-full h-full overflow-hidden bg-slate-950">
      {screen === 'MAIN_MENU' && (
        <MainMenu
          saveData={saveData}
          canClaimDaily={canClaimDaily}
          onPlayContinue={() => startLevel(saveData.unlockedLevel)}
          onOpenLevelSelect={() => {
            audioEngine.playSfx('ui_click');
            setScreen('LEVEL_SELECT');
          }}
          onOpenShop={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('SHOP');
          }}
          onOpenWeapons={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('WEAPONS');
          }}
          onOpenAchievements={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('ACHIEVEMENTS');
          }}
          onOpenSettings={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('SETTINGS');
          }}
          onOpenDailyReward={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('DAILY_REWARD');
          }}
          onToggleAudioQuick={handleToggleAudioQuick}
        />
      )}

      {screen === 'LEVEL_SELECT' && (
        <LevelSelect
          saveData={saveData}
          onSelectLevel={(id) => startLevel(id)}
          onBack={() => {
            audioEngine.playSfx('ui_click');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      {(screen === 'PLAYING' ||
        screen === 'PAUSED' ||
        screen === 'LEVEL_COMPLETE' ||
        screen === 'GAME_OVER') && (
        <GameViewport
          key={`${activeLevel.id}-${runCounter}`}
          level={activeLevel}
          saveData={saveData}
          paused={screen !== 'PLAYING' || activeModal !== null}
          onPauseToggle={() => {
            audioEngine.playSfx('ui_click');
            setScreen((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
          }}
          onToggleAudioQuick={handleToggleAudioQuick}
          onSelectWeapon={handleSelectWeapon}
          onLevelComplete={handleLevelComplete}
          onGameOver={handleGameOver}
        />
      )}

      {screen === 'PAUSED' && (
        <PauseModal
          levelTitle={`${activeLevel.subtitle} · ${activeLevel.title}`}
          onResume={() => {
            audioEngine.playSfx('ui_click');
            setScreen('PLAYING');
          }}
          onRestart={() => startLevel(activeLevel.id)}
          onSettings={() => {
            audioEngine.playSfx('ui_click');
            setActiveModal('SETTINGS');
          }}
          onMainMenu={() => {
            audioEngine.playSfx('ui_click');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      {screen === 'LEVEL_COMPLETE' && lastSummary && (
        <LevelCompleteModal
          summary={lastSummary}
          onNextLevel={() => startLevel(Math.min(50, lastSummary.levelId + 1))}
          onReplay={() => startLevel(lastSummary.levelId)}
          onMainMenu={() => {
            audioEngine.playSfx('ui_click');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          levelTitle={activeLevel.title}
          onRetry={() => startLevel(activeLevel.id)}
          onMainMenu={() => {
            audioEngine.playSfx('ui_click');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      <AppModals
        activeModal={activeModal}
        saveData={saveData}
        canClaimDaily={canClaimDaily}
        onClose={() => {
          audioEngine.playSfx('ui_click');
          setActiveModal(null);
        }}
        onBuyOrEquipSkin={handleBuyOrEquipSkin}
        onEquipOrUpgradeWeapon={handleEquipOrUpgradeWeapon}
        onClaimAchievement={handleClaimAchievement}
        onClaimDailyReward={handleClaimDailyReward}
        onUpdateSettings={handleUpdateSettings}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
}
