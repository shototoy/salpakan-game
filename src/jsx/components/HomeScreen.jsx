// ============================================
// jsx/components/HomeScreen.jsx
// ============================================

import React from 'react';

export default function HomeScreen({ onModeSelect, devMode, setDevMode }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="text-6xl mb-4">⚔</div>
        <h2 className="text-4xl font-serif font-black text-yellow-400 mb-6 tracking-wider">IMPERIUM</h2>
        <p className="text-sm text-yellow-600 mb-8 font-serif italic tracking-widest">SALPAKAN</p>

        <div className="flex flex-col gap-3">
          <button onClick={() => onModeSelect('ai')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-lg font-serif font-bold rounded border-2 border-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg transform hover:scale-105 transition-all">
            ⚔ VS MACHINE
          </button>

          <button onClick={() => onModeSelect('2player', 'local')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-lg font-serif font-bold rounded border-2 border-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg transform hover:scale-105 transition-all">
            ⚔ VS LOCAL COMMANDER
          </button>

          <button onClick={() => onModeSelect('multiplayer')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-700 to-emerald-800 text-black text-lg font-serif font-bold rounded border-2 border-emerald-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg transform hover:scale-105 transition-all">
            ⚔ VS NETWORK COMMANDER
          </button>
        </div>

        <button onClick={() => setDevMode(!devMode)}
          className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-orange-800 to-orange-900 text-white text-base font-serif font-bold rounded border-2 border-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg">
          👁 OMNISCIENCE: {devMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
