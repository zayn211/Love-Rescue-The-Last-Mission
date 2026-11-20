import React, { useState } from 'react';
import { ArrowLeft, Crown, Lock, Play, Star } from 'lucide-react';
import { ALL_LEVELS } from '../data/levels';
import { getWorldName } from '../data/villains';
import { SaveData, WorldId } from '../types/game';

interface LevelSelectProps {
  saveData: SaveData;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const WORLD_THEMES: Record<
  WorldId,
  { accent: string; bg: string; border: string; subtitle: string }
> = {
  1: {
    accent: 'text-emerald-400',
    bg: 'from-emerald-950/90 to-slate-950',
    border: 'border-emerald-700/60',
    subtitle: 'Levels 1–10 · Lush Rivers, Waterfalls & Caves',
  },
  2: {
    accent: 'text-amber-400',
    bg: 'from-amber-950/80 to-slate-950',
    border: 'border-amber-700/60',
    subtitle: 'Levels 11–20 · Golden Dunes, Pyramids & Quicksand',
  },
  3: {
    accent: 'text-sky-300',
    bg: 'from-sky-950/80 to-slate-950',
    border: 'border-sky-700/60',
    subtitle: 'Levels 21–30 · Slippery Ice, Frozen Lakes & Icicles',
  },
  4: {
    accent: 'text-rose-400',
    bg: 'from-rose-950/80 to-slate-950',
    border: 'border-rose-800/60',
    subtitle: 'Levels 31–40 · Haunted Spires, Lava Pits & Dragons',
  },
  5: {
    accent: 'text-indigo-300',
    bg: 'from-indigo-950/85 to-slate-950',
    border: 'border-indigo-700/60',
    subtitle: 'Levels 41–50 · Secret Helipads, Lasers & Vex’s Fortress',
  },
};

export const LevelSelect: React.FC<LevelSelectProps> = ({
  saveData,
  onSelectLevel,
  onBack,
}) => {
  const initialWorld = Math.min(5, Math.ceil(saveData.unlockedLevel / 10)) as WorldId;
  const [activeWorld, setActiveWorld] = useState<WorldId>(initialWorld);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(saveData.unlockedLevel);

  const worldLevels = ALL_LEVELS.filter((l) => l.world === activeWorld);
  const selectedLevel = ALL_LEVELS.find((l) => l.id === selectedLevelId) ?? worldLevels[0];
  const theme = WORLD_THEMES[activeWorld];

  return (
    <div className={`w-full h-full flex flex-col bg-gradient-to-b ${theme.bg} text-slate-100 overflow-hidden safe-area-hud`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-6 py-2 sm:py-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl leading-none">
              Mission Select · 50 Levels
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{theme.subtitle}</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm font-mono-num text-slate-300">
          Unlocked: <strong className="text-amber-400">{saveData.unlockedLevel}/50</strong>
        </div>
      </div>

      {/* 5 World Tabs */}
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 overflow-x-auto border-b border-slate-800/60 shrink-0">
        {([1, 2, 3, 4, 5] as WorldId[]).map((w) => {
          const isActive = activeWorld === w;
          return (
            <button
              key={w}
              onClick={() => {
                setActiveWorld(w);
                setSelectedLevelId((w - 1) * 10 + 1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              World {w}: {getWorldName(w)}
            </button>
          );
        })}
      </div>

      {/* Levels Grid + Mission Details Split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 content-start">
          {worldLevels.map((lvl) => {
            const unlocked = lvl.id <= saveData.unlockedLevel;
            const stars = saveData.starsByLevel[lvl.id] ?? 0;
            const isBoss = lvl.id % 10 === 0;
            const isSelected = selectedLevel.id === lvl.id;

            return (
              <button
                key={lvl.id}
                disabled={!unlocked}
                onClick={() => setSelectedLevelId(lvl.id)}
                onDoubleClick={() => unlocked && onSelectLevel(lvl.id)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all min-h-[96px] cursor-pointer ${
                  !unlocked
                    ? 'bg-slate-900/50 border-slate-800/70 opacity-55 cursor-not-allowed'
                    : isSelected
                    ? 'bg-slate-800 border-amber-400 shadow-md shadow-amber-500/15'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono-num font-bold text-sm text-white">
                    L{lvl.id}
                  </span>
                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : isBoss ? (
                    <Crown className="w-4 h-4 text-rose-400" />
                  ) : null}
                </div>

                <div className="text-xs font-medium text-slate-200 line-clamp-2 my-1">
                  {lvl.title}
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= stars
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Level Briefing Card */}
        <div className={`flex flex-col justify-between p-4 rounded-xl bg-slate-900/90 border ${theme.border}`}>
          <div>
            <div className={`text-xs font-semibold ${theme.accent}`}>
              {selectedLevel.subtitle}
              {selectedLevel.boss?.isMajorWorldBoss ? ' · World Boss' : ''}
            </div>
            <h3 className="font-display font-bold text-xl text-white mt-1">
              {selectedLevel.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {selectedLevel.missionBrief}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono-num">
              <div className="flex justify-between">
                <span>Best Score</span>
                <strong className="text-white">
                  {saveData.bestScoreByLevel[selectedLevel.id] ?? 0}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Target Time</span>
                <strong className="text-white">{selectedLevel.targetTimeSec}s</strong>
              </div>
              <div className="flex justify-between">
                <span>Enemy Patrols</span>
                <strong className="text-white">{selectedLevel.enemies.length}</strong>
              </div>
              {selectedLevel.boss && (
                <div className="flex justify-between text-rose-300">
                  <span>{selectedLevel.boss.isMajorWorldBoss ? 'World Boss' : 'Giant Boss'}</span>
                  <strong>{selectedLevel.boss.name}</strong>
                </div>
              )}
            </div>
          </div>

          <button
            disabled={selectedLevel.id > saveData.unlockedLevel}
            onClick={() => onSelectLevel(selectedLevel.id)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {selectedLevel.id <= saveData.unlockedLevel
                ? `Start Level ${selectedLevel.id}`
                : 'Complete Previous Level'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
