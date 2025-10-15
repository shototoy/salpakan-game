// ============================================
// jsx/components/BattleReportModal.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function BattleReportModal({ battleResult, showingBattleForPlayer, onContinue, RANKS }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 rounded-sm shadow-2xl max-w-md w-full border-4 border-zinc-800 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative mb-6 p-4 bg-black rounded-sm border-2 border-zinc-800 shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]">
          <div className="text-xl font-black text-zinc-100 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 15px rgba(161,161,170,0.6)' }}>
            BATTLE REPORT
          </div>
          <div className="flex items-center justify-center gap-4 mb-2">
            {battleResult.result === 'draw' ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.attacker : battleResult.defender} player={showingBattleForPlayer} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Your Unit</div>
                </div>
                <div className="text-3xl" style={{ color: 'white', textShadow: '0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.6)' }}>⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.defender : battleResult.attacker} player={showingBattleForPlayer === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Enemy Unit</div>
                </div>
              </>
            ) : showingBattleForPlayer === battleResult.player ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.attacker} player={battleResult.player} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Your Unit</div>
                </div>
                <div className="text-3xl" style={{ color: 'white', textShadow: '0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.6)' }}>⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-zinc-500">?</div>
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Enemy</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-zinc-500">?</div>
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Enemy</div>
                </div>
                <div className="text-3xl" style={{ color: 'white', textShadow: '0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.6)' }}>⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.defender} player={battleResult.player === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Your Unit</div>
                </div>
              </>
            )}
          </div>
          <div className={`text-lg font-black mt-3 uppercase tracking-wider ${
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? 'text-emerald-400' :
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? 'text-red-400' : 'text-amber-400'
          }`} style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 10px currentColor' }}>
            {(showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? '⚔ VICTORY' :
             (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? '☠ UNIT LOST' : '⚡ MUTUAL ELIMINATION'}
          </div>
        </div>

        <button onClick={onContinue} 
          className="relative px-8 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-emerald-700 hover:to-emerald-800 text-zinc-100 hover:text-white text-xl rounded-sm w-full border-2 border-zinc-600 hover:border-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.6)] uppercase tracking-wider font-black transition-all" 
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          CONTINUE ✓
        </button>
      </div>
    </div>
  );
}