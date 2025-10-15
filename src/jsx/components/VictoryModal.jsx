// ============================================
// jsx/components/VictoryModal.jsx
// ============================================

import React from 'react';

export default function VictoryModal({ winner, victoryType, onBackToHome }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 rounded-sm shadow-2xl max-w-md w-full border-4 border-zinc-800 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative text-6xl mb-4">
          {winner ? '👑' : (
            <span style={{ color: 'white', textShadow: '0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(220,38,38,0.6)' }}>⚔</span>
          )}
        </div>
        <h2 className="relative text-4xl font-black text-zinc-100 mb-4 uppercase tracking-widest" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '3px 3px 0px rgba(0,0,0,1), 0 0 30px rgba(220,38,38,0.6), 0 0 5px rgba(161,161,170,1)' }}>
          {winner ? `COMMANDER ${winner} WINS!` : 'BATTLE ENDED'}
        </h2>
        <div className="relative mb-6 p-4 bg-black rounded-sm border-2 border-zinc-800 shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]">
          <p className="text-lg text-zinc-300 font-bold uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            {victoryType === 'flag_captured' && 'Enemy Flag Captured!'}
            {victoryType === 'flag_reached' && 'Flag Reached Enemy Territory!'}
          </p>
        </div>
        <button 
          onClick={onBackToHome}
          className="relative w-full px-8 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-xl font-black rounded-sm border-2 border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] uppercase tracking-wider transition-all" 
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          RETURN TO COMMAND CENTER
        </button>
      </div>
    </div>
  );
}