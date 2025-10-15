// ============================================
// jsx/components/HomeScreen.jsx
// ============================================

import React from 'react';

export default function HomeScreen({ onModeSelect }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-4">
      <div className="relative bg-zinc-950 p-10 rounded-sm shadow-2xl max-w-md w-full border-4 border-zinc-800 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative z-10">
          <div className="text-6xl mb-4 filter drop-shadow-[0_0_10px_rgba(139,0,0,0.5)]">⚔</div>
          <h2 className="text-5xl font-black text-zinc-300 mb-2 tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(139,0,0,0.3)' }}>
            IMPERIUM
          </h2>
          <p className="text-xs text-zinc-500 mb-8 tracking-[0.3em] uppercase font-bold border-t border-b border-zinc-800 py-2 mt-4" style={{ fontFamily: 'Courier New, monospace' }}>
            ⦿ SALPAKAN ⦿
          </p>

          <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => onModeSelect('ai')}
              className="group relative px-6 py-4 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-300 hover:text-zinc-200 text-base font-bold rounded-sm border-2 border-zinc-700 hover:border-red-900 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_4px_20px_rgba(139,0,0,0.6)] transform hover:scale-105 transition-all uppercase tracking-wider"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              <span className="relative z-10">⚔ VS MACHINE</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button onClick={() => onModeSelect('2player', 'local')}
              className="group relative px-6 py-4 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-300 hover:text-zinc-200 text-base font-bold rounded-sm border-2 border-zinc-700 hover:border-red-900 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_4px_20px_rgba(139,0,0,0.6)] transform hover:scale-105 transition-all uppercase tracking-wider"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              <span className="relative z-10">⚔ VS LOCAL COMMANDER</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button onClick={() => onModeSelect('multiplayer')}
              className="group relative px-6 py-4 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-300 hover:text-zinc-200 text-base font-bold rounded-sm border-2 border-zinc-700 hover:border-red-900 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_4px_20px_rgba(139,0,0,0.6)] transform hover:scale-105 transition-all uppercase tracking-wider"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              <span className="relative z-10">⚔ VS NETWORK COMMANDER</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>
              In the grim darkness of war, there is only victory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}