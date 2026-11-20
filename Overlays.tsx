import React from 'react';
import {
  ArrowRight,
  Home,
  Play,
  RotateCcw,
  Settings,
  Skull,
  Star,
  Trophy,
} from 'lucide-react';
import { LevelEndSummary } from '../types/game';

interface PauseModalProps {
  levelTitle: string;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelTitle,
  onResume,
  onRestart,
  onSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto safe-area-hud">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl my-auto">
        <div className="text-xs font-semibold text-amber-400">Mission Paused</div>
        <h2 className="font-display font-bold text-2xl text-white mt-1 mb-5">
          {levelTitle}
        </h2>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Mission</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Level</span>
          </button>
          <button
            onClick={onSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface LevelCompleteModalProps {
  summary: LevelEndSummary;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  summary,
  onNextLevel,
  onReplay,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex items-center justify-center p-4 overflow-y-auto safe-area-hud">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-400">
              {summary.isFinalVictory
                ? 'Grand Finale Complete'
                : `Level ${summary.levelId} Complete`}
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white mt-0.5">
              {summary.isFinalVictory ? 'Maya Is Rescued!' : summary.levelTitle}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-7 h-7 ${
                  s <= summary.starsEarned
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Emotional Story Continuity Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <img
            src={
              summary.isFinalVictory
                ? '/src/assets/images/girlfriend_portrait_1795096950846.jpg'
                : '/src/assets/images/villain_portrait_1795096950751.jpg'
            }
            alt={summary.isFinalVictory ? 'Maya safe' : summary.nextVillainName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
          />
          <div className="text-xs leading-relaxed">
            {summary.isFinalVictory ? (
              <p className="text-pink-200 font-medium">
                General Vex’s fortress has fallen! Leo and Maya are finally reunited forever after 50 unforgettable missions.
              </p>
            ) : (
              <>
                <div className="text-rose-400 font-bold">
                  Kidnapped by {summary.nextVillainName}
                </div>
                <div className="text-slate-300 mt-0.5">{summary.kidnappingClue}</div>
              </>
            )}
          </div>
        </div>

        {/* Score & Rewards Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-4 text-center font-mono-num">
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400">Score</div>
            <div className="text-base font-bold text-white">{summary.score}</div>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400">Coins</div>
            <div className="text-base font-bold text-amber-400">+{summary.coinsCollected}</div>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400">Diamonds</div>
            <div className="text-base font-bold text-sky-400">+{summary.diamondsCollected}</div>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400">Time</div>
            <div className="text-base font-bold text-slate-200">{summary.elapsedSec}s</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5">
          {!summary.isFinalVictory && (
            <button
              onClick={onNextLevel}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold cursor-pointer"
            >
              <span>Next Level ({summary.levelId + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {summary.isFinalVictory && (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 font-display font-extrabold">
              <Trophy className="w-5 h-5" />
              <span>All 50 Missions Cleared!</span>
            </div>
          )}

          <button
            onClick={onReplay}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-800 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  levelTitle: string;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  levelTitle,
  onRetry,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/88 flex items-center justify-center p-4 overflow-y-auto safe-area-hud">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-700/60 rounded-2xl p-6 text-center shadow-2xl my-auto">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400 mb-3">
          <Skull className="w-7 h-7" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white">
          Mission Failed
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-5">
          Leo fell in {levelTitle}, but Maya is still waiting. Stand up and try again!
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Mission</span>
          </button>
          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
