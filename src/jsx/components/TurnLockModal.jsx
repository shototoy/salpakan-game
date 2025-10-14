// ============================================
// jsx/components/TurnLockModal.jsx
// ============================================

import React from 'react';

export default function TurnLockModal({ pausePhase, setupPlayer, mode, multiplayerMode, turn, battleResult, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="text-6xl mb-4">⚔</div>
        <h2 className="text-3xl font-serif font-black text-yellow-400 mb-3">
          {pausePhase ? (setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local' ? 'COMMANDER 2' : 'BATTLE BEGINS') : `COMMANDER ${turn}`}
        </h2>
        <p className="text-lg text-yellow-600 mb-6 font-serif">
          {pausePhase ? 'Transfer command authority' : (battleResult ? 'Review the battle outcome' : 'Prepare your strategy')}
        </p>
        <button onClick={onConfirm} className="px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl rounded w-full">
          READY ✓
        </button>
      </div>
    </div>
  );
}
