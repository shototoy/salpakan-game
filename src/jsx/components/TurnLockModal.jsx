// ============================================
// jsx/components/TurnLockModal.jsx
// ============================================

import React from 'react';

export default function TurnLockModal({ pausePhase, setupPlayer, mode, multiplayerMode, turn, battleResult, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 rounded-sm shadow-2xl max-w-md w-full border-4 border-zinc-800 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative text-6xl mb-4" style={{ color: 'white', textShadow: '0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.6)' }}>⚔</div>
        <h2 className="relative text-3xl font-black text-zinc-100 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 20px rgba(220,38,38,0.5), 0 0 3px rgba(161,161,170,0.8)' }}>
          {pausePhase ? (setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local' ? 'COMMANDER 2' : 'BATTLE BEGINS') : `COMMANDER ${turn}`}
        </h2>
        <p className="relative text-lg text-zinc-400 mb-6 uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>
          {pausePhase ? 'Transfer command authority' : (battleResult ? 'Review the battle outcome' : 'Prepare your strategy')}
        </p>
        <button onClick={onConfirm} 
          className="relative px-8 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-emerald-700 hover:to-emerald-800 text-zinc-100 hover:text-white text-xl rounded-sm w-full border-2 border-zinc-600 hover:border-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.6)] uppercase tracking-wider font-black transition-all" 
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          READY ✓
        </button>
      </div>
    </div>
  );
}