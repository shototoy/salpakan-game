// ============================================
// jsx/components/BattleReportModal.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function BattleReportModal({ battleResult, showingBattleForPlayer, onContinue, RANKS }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="mb-6 p-4 bg-black rounded border-2 border-yellow-800">
          <div className="text-xl font-serif font-bold text-yellow-400 mb-3">BATTLE REPORT</div>
          <div className="flex items-center justify-center gap-4 mb-2">
            {battleResult.result === 'draw' ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.attacker : battleResult.defender} player={showingBattleForPlayer} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.defender : battleResult.attacker} player={showingBattleForPlayer === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Enemy Unit</div>
                </div>
              </>
            ) : showingBattleForPlayer === battleResult.player ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.attacker} player={battleResult.player} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-yellow-600">?</div>
                  </div>
                  <div className="text-xs text-yellow-600">Enemy</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-yellow-600">?</div>
                  </div>
                  <div className="text-xs text-yellow-600">Enemy</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.defender} player={battleResult.player === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
              </>
            )}
          </div>
          <div className={`text-lg font-serif font-bold mt-3 ${
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? 'text-green-400' :
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {(showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? '⚔ VICTORY' :
             (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? '☠ UNIT LOST' : '⚡ MUTUAL ELIMINATION'}
          </div>
        </div>

        <button onClick={onContinue} className="px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl rounded w-full">
          CONTINUE ✓
        </button>
      </div>
    </div>
  );
}