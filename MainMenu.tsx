import React from 'react';
import {
  Award,
  Gift,
  Grid,
  Maximize2,
  Minimize2,
  Play,
  Settings,
  ShoppingBag,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SaveData } from '../types/game';
import { useFullscreenState } from '../utils/fullscreen';

interface MainMenuProps {
  saveData: SaveData;
  canClaimDaily: boolean;
  onPlayContinue: () => void;
  onOpenLevelSelect: () => void;
  onOpenShop: () => void;
  onOpenWeapons: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onOpenDailyReward: () => void;
  onToggleAudioQuick: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  canClaimDaily,
  onPlayContinue,
  onOpenLevelSelect,
  onOpenShop,
  onOpenWeapons,
  onOpenAchievements,
  onOpenSettings,
  onOpenDailyReward,
  onToggleAudioQuick,
}) => {
  const totalStars = Object.values(saveData.starsByLevel).reduce((a, b) => a + b, 0);
  const { isFullscreen, supported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreenState();

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 safe-area-hud">
      {/* Illustrated Key Art Backdrop */}
      <img
        src="/src/assets/images/title_key_art_1795096950005.jpg"
        alt="Leo watching Maya's kidnapping helicopter over the jungle cliffs"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-right scale-[1.03] transition-transform duration-1000 pointer-events-none"
      />
      {/* Measured contrast scrim for crisp typography */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/45 pointer-events-none" />

      {/* Top Resource, Fullscreen & Quick Audio Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-2 sm:px-6 pt-1 sm:pt-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-300 font-mono-num">
          <span>Coins: <strong className="text-amber-400">{saveData.coins}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Gems: <strong className="text-sky-400">{saveData.diamonds}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Stars: <strong className="text-yellow-300">{totalStars}/150</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {fullscreenSupported && (
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-400" />
                  <span>Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={onOpenDailyReward}
            className={`relative flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              canClaimDaily
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>{canClaimDaily ? 'Daily Gift!' : 'Daily Gift'}</span>
          </button>
          <button
            onClick={onToggleAudioQuick}
            aria-label={saveData.settings.musicEnabled ? 'Mute Audio' : 'Enable Audio'}
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {saveData.settings.musicEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Split (Scrollable safely on ultra-short landscape phones) */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col justify-center px-2 sm:px-6 py-2 max-w-4xl">
        {/* Bespoke SVG Title Lockup */}
        <div className="mb-2.5 sm:mb-4">
          <svg
            viewBox="0 0 640 120"
            className="w-full max-w-[380px] sm:max-w-[460px] h-auto overflow-visible"
            role="img"
            aria-label="Love Rescue: The Last Mission"
          >
            <defs>
              <linearGradient id="loveTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="55%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <text
              x="2"
              y="58"
              fill="url(#loveTitleGrad)"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke"
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: '64px',
                letterSpacing: '-0.02em',
              }}
            >
              LOVE RESCUE
            </text>
            <text
              x="4"
              y="98"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2.5"
              paintOrder="stroke"
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: '26px',
                letterSpacing: '0.16em',
              }}
            >
              THE LAST MISSION
            </text>
          </svg>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1 leading-relaxed">
            Five perilous worlds. 50 handcrafted missions. Chase General Vex’s helicopters across jungle, desert, snow, and fortress to bring Maya home.
          </p>
        </div>

        {/* Hero & Girlfriend Portrait Showcase */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-5">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl p-1.5 sm:p-2 pr-3">
            <img
              src="/src/assets/images/hero_portrait_1795096951158.jpg"
              alt="Leo the Hero"
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-amber-400/50"
            />
            <div className="leading-tight">
              <div className="text-xs font-bold text-white">Leo</div>
              <div className="text-[11px] text-amber-300">Brave Hero</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl p-1.5 sm:p-2 pr-3">
            <img
              src="/src/assets/images/girlfriend_portrait_1795096950846.jpg"
              alt="Maya"
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-pink-400/50"
            />
            <div className="leading-tight">
              <div className="text-xs font-bold text-white">Maya</div>
              <div className="text-[11px] text-pink-300">Awaiting Rescue</div>
            </div>
          </div>
        </div>

        {/* Primary CTA + Secondary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onPlayContinue}
            className="flex items-center gap-2.5 min-h-[46px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-display font-extrabold text-sm sm:text-lg shadow-lg shadow-amber-500/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {saveData.unlockedLevel > 1
                ? `Continue · Level ${saveData.unlockedLevel}`
                : 'Play Mission 1'}
            </span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-sky-400" />
            <span>Level Select</span>
          </button>

          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Character Shop</span>
          </button>

          <button
            onClick={onOpenWeapons}
            className="flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Swords className="w-4 h-4 text-orange-400" />
            <span>Weapons ({saveData.unlockedWeapons.length}/8)</span>
          </button>

          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Achievements</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Single flat control hint line */}
      <div className="relative z-10 px-2 sm:px-6 pb-1 sm:pb-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 shrink-0">
        <span className="truncate">
          Move: A/D or Arrows · Jump: Space · Attack: J · Switch Weapon: 1-8 · Pause: Esc
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-amber-300/90 shrink-0 ml-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>50 Levels · 5 Worlds</span>
        </span>
      </div>
    </div>
  );
};
