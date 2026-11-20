import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';
import { COMBAT_WEAPONS_LIST } from '../data/shopAndAchievements';
import { GameCanvasEngine } from '../game/GameCanvasEngine';
import {
  CombatWeaponId,
  HudSnapshot,
  LevelConfig,
  LevelEndSummary,
  SaveData,
} from '../types/game';
import { useFullscreenState } from '../utils/fullscreen';
import { WeaponIcon } from './WeaponIcon';

interface GameViewportProps {
  level: LevelConfig;
  saveData: SaveData;
  paused: boolean;
  onPauseToggle: () => void;
  onToggleAudioQuick: () => void;
  onSelectWeapon: (weaponId: CombatWeaponId) => void;
  onLevelComplete: (summary: LevelEndSummary) => void;
  onGameOver: () => void;
}

const DEFAULT_AMMO: Record<CombatWeaponId, number | null> = {
  sword_slash: null,
  fireball: 10,
  boomerang: 6,
  magic_bow: 14,
  thunder_attack: 5,
  ice_blaster: 12,
  energy_gun: 18,
  explosive_bomb: 6,
};

const DEFAULT_COOLDOWNS: Record<CombatWeaponId, number> = {
  sword_slash: 0,
  fireball: 0,
  boomerang: 0,
  magic_bow: 0,
  thunder_attack: 0,
  ice_blaster: 0,
  energy_gun: 0,
  explosive_bomb: 0,
};

const DEFAULT_MAX_COOLDOWNS: Record<CombatWeaponId, number> = {
  sword_slash: 0.28,
  fireball: 0.45,
  boomerang: 0.75,
  magic_bow: 0.36,
  thunder_attack: 1.25,
  ice_blaster: 0.42,
  energy_gun: 0.22,
  explosive_bomb: 1.1,
};

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  lives: 3,
  score: 0,
  coins: 0,
  diamonds: 0,
  chestsOpened: 0,
  enemiesDefeated: 0,
  elapsedSec: 0,
  equippedWeapon: 'sword_slash',
  weaponAmmo: DEFAULT_AMMO,
  weaponCooldowns: DEFAULT_COOLDOWNS,
  weaponMaxCooldowns: DEFAULT_MAX_COOLDOWNS,
  activeSpecial: 'fireball',
  specialAmmo: 6,
  shieldTimer: 0,
  speedTimer: 0,
  invincibleTimer: 0,
  doubleJumpBoostTimer: 0,
  checkpointReached: false,
  bossName: null,
  bossTitle: null,
  bossHp: 0,
  bossMaxHp: 1,
  bossEnraged: false,
  inCutscene: false,
  cutsceneSubtitle: '',
  cutsceneSpeaker: null,
  canSkipCutscene: false,
  secretFoundToast: null,
};

export const GameViewport: React.FC<GameViewportProps> = ({
  level,
  saveData,
  paused,
  onPauseToggle,
  onToggleAudioQuick,
  onSelectWeapon,
  onLevelComplete,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameCanvasEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    equippedWeapon: saveData.equippedWeapon ?? 'sword_slash',
    activeSpecial: saveData.equippedSpecial,
  }));
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 960,
    h: typeof window !== 'undefined' ? window.innerHeight : 560,
  });

  const { isFullscreen, supported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreenState();

  const unlockedCombatWeapons = useMemo(
    () =>
      COMBAT_WEAPONS_LIST.filter((w) =>
        saveData.unlockedWeapons.includes(w.id as CombatWeaponId)
      ),
    [saveData.unlockedWeapons]
  );

  // Create engine ONLY when level.id changes (preserving player pos, HP, coins, weapons across rotation!)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const initialW = container.clientWidth || window.innerWidth || 960;
    const initialH = container.clientHeight || window.innerHeight || 560;
    canvas.width = initialW;
    canvas.height = initialH;
    setViewportSize({ w: initialW, h: initialH });

    setHud({
      ...INITIAL_HUD,
      equippedWeapon: saveData.equippedWeapon ?? 'sword_slash',
      activeSpecial: saveData.equippedSpecial,
    });

    const engine = new GameCanvasEngine(canvas, level, saveData, {
      onHudUpdate: (snap) => setHud(snap),
      onLevelComplete,
      onGameOver,
    });
    engineRef.current = engine;
    engine.resize(initialW, initialH);
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // Re-create engine only when level.id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  // Responsive Resize & Phone Rotation Listener (Portrait <-> Landscape without resetting level)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        setViewportSize({ w, h });
        engineRef.current?.resize(w, h);
      }
    };

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => handleResize())
        : null;
    observer?.observe(container);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.updateSaveData(saveData);
  }, [saveData]);

  // Keyboard Controls + Weapon Quick Switch (1-8) + Blur Reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onPauseToggle();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') eng.input.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') eng.input.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!e.repeat) eng.input.jumpPressed = true;
        eng.input.jumpHeld = true;
      }
      if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyF') {
        if (!e.repeat) eng.input.attackPressed = true;
      }
      if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'KeyE') {
        if (!e.repeat) eng.input.specialPressed = true;
      }
      if (e.code.startsWith('Digit')) {
        const idx = Number(e.code.replace('Digit', '')) - 1;
        const target = unlockedCombatWeapons[idx];
        if (target && !e.repeat) {
          const id = target.id as CombatWeaponId;
          eng.selectWeapon(id);
          onSelectWeapon(id);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') eng.input.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') eng.input.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        eng.input.jumpHeld = false;
      }
    };

    const clearInputs = () => {
      const eng = engineRef.current;
      if (!eng) return;
      eng.input.left = false;
      eng.input.right = false;
      eng.input.jumpHeld = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
    };
  }, [onPauseToggle, onSelectWeapon, unlockedCombatWeapons]);

  const setTouchInput = (
    key: 'left' | 'right' | 'jump' | 'attack' | 'special',
    active: boolean
  ) => {
    audioEngine.unlock();
    const eng = engineRef.current;
    if (!eng) return;
    if (key === 'left') eng.input.left = active;
    if (key === 'right') eng.input.right = active;
    if (key === 'jump') {
      if (active) eng.input.jumpPressed = true;
      eng.input.jumpHeld = active;
    }
    if (key === 'attack' && active) eng.input.attackPressed = true;
    if (key === 'special' && active) eng.input.specialPressed = true;
  };

  const handleSelectWeapon = (weaponId: CombatWeaponId) => {
    audioEngine.unlock();
    audioEngine.playSfx('ui_click');
    engineRef.current?.selectWeapon(weaponId);
    onSelectWeapon(weaponId);
  };

  const selectedWeaponDef =
    COMBAT_WEAPONS_LIST.find((w) => w.id === hud.equippedWeapon) ??
    COMBAT_WEAPONS_LIST[0];

  const isPortrait = viewportSize.h > viewportSize.w;
  const isShortScreen = viewportSize.h < 470;
  const useTwoColsInventory =
    unlockedCombatWeapons.length > 4 ||
    (isShortScreen && unlockedCombatWeapons.length > 3);
  const showUtilityButton =
    hud.activeSpecial === 'shield_aura' || hud.activeSpecial === 'speed_surge';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
    >
      {/* True Fullscreen 2D Game Canvas (100% available viewport, aspect preserved inside engine) */}
      <canvas ref={canvasRef} className="w-full h-full block bg-slate-950" />

      {/* Low-Occlusion Top HUD Overlay with Android Safe-Area Insets */}
      <div className="pointer-events-none absolute inset-x-0 top-0 safe-area-hud flex items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left: Hero HP, Lives & Compact Resources on Small Screens */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-slate-950/78 border border-slate-700/80 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2">
            <img
              src="/src/assets/images/hero_portrait_1795096951158.jpg"
              alt="Leo"
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-amber-400/60 shrink-0"
            />
            <div className="min-w-[96px] sm:min-w-[115px]">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono-num">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-rose-500" />
                  <span>x{hud.lives}</span>
                </span>
                <span className="text-slate-200">{hud.hp}/{hud.maxHp}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-400 transition-all duration-150"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%`,
                  }}
                />
              </div>
              {(hud.shieldTimer > 0 || hud.speedTimer > 0 || hud.invincibleTimer > 0) && (
                <div className="flex items-center gap-2 text-[10px] font-mono-num text-sky-300 mt-1">
                  {hud.shieldTimer > 0 && <span>Shield {hud.shieldTimer}s</span>}
                  {hud.speedTimer > 0 && <span>Speed {hud.speedTimer}s</span>}
                  {hud.invincibleTimer > 0 && <span>Star {hud.invincibleTimer}s</span>}
                </div>
              )}
            </div>
          </div>

          {/* Mobile/Portrait compact resource strip so coins/gems/score stay visible in portrait */}
          <div className="flex md:hidden items-center gap-2 bg-slate-950/75 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono-num text-slate-200 w-fit">
            <span><strong className="text-amber-400">{hud.coins}</strong>c</span>
            <span aria-hidden="true">·</span>
            <span><strong className="text-sky-400">{hud.diamonds}</strong>g</span>
            <span aria-hidden="true">·</span>
            <span><strong className="text-white">{hud.score}</strong></span>
          </div>
        </div>

        {/* Top-Center: Level Name & Boss HP Bar */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          {!isPortrait && (
            <div className="bg-slate-950/78 border border-slate-700/80 rounded-lg px-3 py-1.5 text-center max-w-[260px] sm:max-w-xs">
              <div className="text-[10px] sm:text-[11px] text-amber-300 font-semibold truncate">
                {level.subtitle}
                {hud.checkpointReached ? ' · Saved' : ''}
              </div>
              <div className="text-xs sm:text-sm font-display font-bold text-white leading-tight truncate">
                {level.title}
              </div>
            </div>
          )}

          {isPortrait && (
            <div className="bg-slate-950/75 border border-slate-700/80 rounded-lg px-2.5 py-1 text-center">
              <div className="text-[11px] font-display font-bold text-amber-300 leading-tight">
                L{level.id} · {level.title}
              </div>
            </div>
          )}

          {hud.bossName && (
            <div
              className={`w-48 sm:w-76 bg-slate-950/88 rounded-lg px-2.5 py-1.5 shadow-lg transition-colors ${
                hud.bossEnraged
                  ? 'border border-amber-400/90 shadow-rose-600/30'
                  : 'border border-rose-500/70'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 text-[10px] sm:text-[11px] font-bold font-mono-num">
                <div className="min-w-0 truncate">
                  <span className={hud.bossEnraged ? 'text-amber-300' : 'text-rose-300'}>
                    {hud.bossName}
                  </span>
                  {hud.bossTitle && (
                    <span className="hidden sm:inline text-[9px] font-medium text-slate-400 ml-1.5">
                      {hud.bossTitle}
                    </span>
                  )}
                </div>
                <span className="text-rose-200 shrink-0">
                  {hud.bossEnraged ? 'ENRAGED · ' : ''}
                  {hud.bossHp}/{hud.bossMaxHp}
                </span>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-150 ${
                    hud.bossEnraged
                      ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(0, (hud.bossHp / hud.bossMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.secretFoundToast && (
            <div className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg shadow">
              {hud.secretFoundToast}
            </div>
          )}
        </div>

        {/* Top-Right: Coins, Diamonds, Score (Desktop/Tablet) + Fullscreen, Audio, Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <div className="hidden md:flex items-center gap-3 bg-slate-950/78 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-slate-200">
            <span>Coins: <strong className="text-amber-400">{hud.coins}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Gems: <strong className="text-sky-400">{hud.diamonds}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Score: <strong className="text-white">{hud.score}</strong></span>
          </div>

          {fullscreenSupported && (
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-100 cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-amber-400" />
              ) : (
                <Maximize2 className="w-5 h-5 text-amber-400" />
              )}
            </button>
          )}

          <button
            onClick={onToggleAudioQuick}
            aria-label="Toggle Sound"
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-100 cursor-pointer"
          >
            {saveData.settings.musicEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <button
            onClick={onPauseToggle}
            aria-label="Pause Game"
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-100 cursor-pointer"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DYNAMIC UNLOCKED WEAPON INVENTORY ON THE RIGHT SIDE (Hidden during cutscenes) */}
      {!hud.inCutscene && unlockedCombatWeapons.length > 0 && (
        <div
          aria-label="Unlocked Weapons Inventory"
          style={{
            right: 'max(0.5rem, env(safe-area-inset-right))',
            top: isShortScreen ? '62px' : '76px',
            bottom: isShortScreen ? '88px' : '108px',
          }}
          className="pointer-events-none absolute z-20 flex flex-col justify-center items-end"
        >
          <div
            className={`pointer-events-auto max-h-full overflow-y-auto p-1.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 shadow-xl grid gap-1.5 touch-pad ${
              useTwoColsInventory ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {unlockedCombatWeapons.map((w) => {
              const id = w.id as CombatWeaponId;
              const isSelected = hud.equippedWeapon === id;
              const ammo = hud.weaponAmmo[id];
              const cd = hud.weaponCooldowns[id] ?? 0;
              const maxCd = hud.weaponMaxCooldowns[id] || 1;
              const cdPct = Math.max(0, Math.min(100, (cd / maxCd) * 100));
              const outOfAmmo = ammo !== null && ammo <= 0;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectWeapon(id)}
                  aria-label={`Select ${w.name}`}
                  aria-pressed={isSelected}
                  className={`relative overflow-hidden min-w-[56px] sm:min-w-[66px] min-h-[46px] sm:min-h-[52px] px-1.5 py-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-300/70'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/90 text-slate-200'
                  } ${outOfAmmo ? 'opacity-65' : ''}`}
                >
                  {/* Ammo counter badge */}
                  <span
                    className={`absolute top-0.5 right-1 text-[9px] font-mono-num font-bold leading-none ${
                      outOfAmmo ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  >
                    {ammo === null ? '∞' : ammo}
                  </span>

                  <WeaponIcon
                    weaponId={id}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isSelected ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  />
                  <span className="text-[9px] sm:text-[10px] font-semibold leading-tight mt-0.5 truncate max-w-[58px]">
                    {w.shortName}
                  </span>

                  {/* Cooldown visual progress bar */}
                  {cd > 0 && (
                    <div
                      className="absolute inset-x-0 bottom-0 h-1 bg-sky-400/90"
                      style={{ width: `${cdPct}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cutscene Subtitle & Continue Overlay */}
      {hud.inCutscene && hud.cutsceneSubtitle && (
        <div
          style={{
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center"
        >
          <div className="max-w-xl w-full bg-slate-950/88 border border-amber-500/40 rounded-xl px-4 py-3 text-center shadow-xl">
            {hud.cutsceneSpeaker && (
              <div
                className={`text-[11px] font-bold tracking-wide mb-0.5 ${
                  hud.cutsceneSpeaker === 'Leo'
                    ? 'text-sky-300'
                    : hud.cutsceneSpeaker === 'Maya'
                    ? 'text-pink-300'
                    : 'text-rose-400'
                }`}
              >
                {hud.cutsceneSpeaker}
              </div>
            )}
            <div className="text-sm sm:text-base font-display font-bold text-white">
              {hud.cutsceneSubtitle}
            </div>
          </div>

          {hud.canSkipCutscene && (
            <button
              onClick={() => engineRef.current?.skipCutsceneIfAllowed()}
              className="pointer-events-auto mt-2 min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* Responsive Android Touch Controls (Portrait & Landscape Safe-Area Aware) */}
      {!hud.inCutscene && saveData.settings.showTouchControls && (
        <div
          style={{
            paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between"
        >
          {/* Bottom-Left: Left & Right Movement Pads */}
          <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 touch-pad">
            <button
              aria-label="Move Left"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setTouchInput('left', true);
              }}
              onPointerUp={() => setTouchInput('left', false)}
              onPointerCancel={() => setTouchInput('left', false)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/75 active:bg-amber-500 active:text-slate-950 border border-slate-600/80 flex items-center justify-center text-white shadow-lg"
            >
              <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
            <button
              aria-label="Move Right"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setTouchInput('right', true);
              }}
              onPointerUp={() => setTouchInput('right', false)}
              onPointerCancel={() => setTouchInput('right', false)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/75 active:bg-amber-500 active:text-slate-950 border border-slate-600/80 flex items-center justify-center text-white shadow-lg"
            >
              <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* Bottom-Right: Optional Utility Aura/Speed + Active Weapon Attack + Jump */}
          <div className="pointer-events-auto flex items-end gap-2 sm:gap-3 touch-pad">
            {showUtilityButton && (
              <button
                aria-label="Utility Power"
                onPointerDown={() => setTouchInput('special', true)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-600/80 active:bg-sky-400 border border-sky-300/60 flex flex-col items-center justify-center text-white shadow-lg"
              >
                {hud.activeSpecial === 'shield_aura' ? (
                  <Shield className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                <span className="text-[9px] font-bold leading-none mt-0.5">
                  {hud.activeSpecial === 'shield_aura' ? 'SHIELD' : 'SPEED'}
                </span>
              </button>
            )}

            <button
              aria-label={`Attack with ${selectedWeaponDef.name}`}
              onPointerDown={() => setTouchInput('attack', true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-600/85 active:bg-rose-400 border border-rose-300/65 flex flex-col items-center justify-center text-white shadow-lg px-1"
            >
              <WeaponIcon
                weaponId={hud.equippedWeapon}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <span className="text-[9px] sm:text-[10px] font-bold leading-none mt-0.5 truncate max-w-full">
                {selectedWeaponDef.shortName}
              </span>
            </button>

            <button
              aria-label="Jump"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setTouchInput('jump', true);
              }}
              onPointerUp={() => setTouchInput('jump', false)}
              onPointerCancel={() => setTouchInput('jump', false)}
              className="w-15 h-15 sm:w-18 sm:h-18 rounded-2xl bg-amber-500/90 active:bg-amber-300 border border-amber-200/80 flex flex-col items-center justify-center text-slate-950 font-display font-extrabold text-xs shadow-lg"
            >
              <span>JUMP</span>
              <span className="text-[10px] font-semibold">2x</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
