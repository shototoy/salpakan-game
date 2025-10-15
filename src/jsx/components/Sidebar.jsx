// ============================================
// jsx/components/Sidebar.jsx
// ============================================

import React from 'react';

export default function Sidebar({
  phase, mode, multiplayerMode, msg, roomId, inventory, defeated,
  setupPlayer, turn, board, devMode, lastMove, opponentPiecesPlaced,
  useSVG, setUseSVG, omniscience, setOmniscience,
  onFinishSetup, onAutoSetup, onReset
}) {
  return (
    <div className="order-2 flex-shrink-0 lg:flex-initial bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-t lg:border-t-0 lg:border-l-4 border-zinc-700 flex flex-col p-2 py-3 lg:p-4 overflow-y-auto max-h-[45vh] lg:max-h-full lg:w-[380px]">
      <div className="text-center mb-2 pb-2 lg:mb-4 lg:pb-4 border-b-2 border-zinc-800">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-zinc-100 tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '3px 3px 0px rgba(0,0,0,1), 0 0 30px rgba(220,38,38,0.6), 0 0 5px rgba(161,161,170,1)' }}>
          IMPERIUM
        </h1>
        <div className="text-[10px] lg:text-xs text-zinc-400 mt-0 lg:mt-1 tracking-[0.3em] uppercase font-bold" style={{ fontFamily: 'Courier New, monospace', textShadow: '0 0 10px rgba(161,161,170,0.5)' }}>
          ⦿ SALPAKAN ⦿
        </div>
        {multiplayerMode === 'online' && roomId && (
          <div className="mt-2 bg-black rounded-sm px-3 py-1 border border-zinc-800">
            <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Room: {roomId}</span>
          </div>
        )}
      </div>

      {phase === 'setup' && multiplayerMode === 'online' && opponentPiecesPlaced > 0 && (
        <div className="mb-2 lg:mb-4 px-3 py-2 lg:px-4 lg:py-3 bg-zinc-900 rounded-sm border-2 border-zinc-700 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <div className="text-blue-400 text-sm lg:text-base font-bold uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            Opponent Deploying: <span className="text-blue-300 text-lg lg:text-xl">{opponentPiecesPlaced}</span> / 21
          </div>
        </div>
      )}

      {phase === 'setup' && (
        <>
          <div className="text-center text-base lg:text-lg text-zinc-200 mb-2 lg:mb-4 font-bold uppercase tracking-wider px-3 py-2 lg:px-4 lg:py-3 bg-black rounded-sm border-2 border-zinc-800 shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            {msg}
          </div>

          <div className="mb-2 lg:mb-4 px-3 py-2 lg:px-4 lg:py-3 bg-zinc-900 rounded-sm border-2 border-zinc-700 shadow-[inset_0_1px_0_rgba(161,161,170,0.1)]">
            <div className="text-zinc-300 text-sm lg:text-base font-bold uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              Units Remaining: <span className="text-zinc-100 text-lg lg:text-xl">{Object.values(inventory).reduce((sum, count) => sum + count, 0)}</span> / 21
            </div>
          </div>

          <div className="mb-2 lg:mb-4 px-3 py-2 lg:px-4 lg:py-3 bg-zinc-900 rounded-sm border-2 border-zinc-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                SVG Icons
              </span>
              <button
                onClick={() => setUseSVG && setUseSVG(!useSVG)}
                className={`relative w-12 h-6 rounded-sm border-2 transition-all ${
                  useSVG 
                    ? 'bg-emerald-800 border-emerald-600' 
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-100 rounded-sm transition-transform ${
                  useSVG ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                Omniscience
              </span>
              <button
                onClick={() => setOmniscience && setOmniscience(!omniscience)}
                className={`relative w-12 h-6 rounded-sm border-2 transition-all ${
                  omniscience 
                    ? 'bg-violet-800 border-violet-600' 
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-100 rounded-sm transition-transform ${
                  omniscience ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 'playing' && (
        <div className="text-center text-base lg:text-lg text-zinc-200 mb-2 lg:mb-4 font-bold uppercase tracking-wider px-3 py-2 lg:px-4 lg:py-3 bg-black rounded-sm border-2 border-zinc-800 shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          {msg}
        </div>
      )}

      {phase === 'setup' && (
        <div className="flex flex-col gap-1.5 lg:gap-2 mt-auto">
          <button onClick={onFinishSetup}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-b from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-zinc-100 hover:text-white text-sm lg:text-base font-bold rounded-sm border-2 border-emerald-700 hover:border-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(4,120,87,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.6)] uppercase tracking-wider transition-all" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            {setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local' ? '→ NEXT COMMANDER' : '⚔ BEGIN BATTLE'}
          </button>
          <button onClick={onAutoSetup}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-b from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-zinc-100 hover:text-white text-sm lg:text-base font-bold rounded-sm border-2 border-emerald-700 hover:border-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(4,120,87,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.6)] uppercase tracking-wider transition-all" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            <span style={{ color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>⚡</span> AUTO DEPLOY
          </button>
          <button onClick={onReset}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-b from-red-900 to-red-950 hover:from-red-800 hover:to-red-900 text-zinc-100 hover:text-white text-sm lg:text-base font-bold rounded-sm border-2 border-red-800 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.6)] uppercase tracking-wider transition-all" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            ↻ RESET CAMPAIGN
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col gap-1.5 lg:gap-2 mt-auto">
          <button onClick={onReset}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-b from-red-900 to-red-950 hover:from-red-800 hover:to-red-900 text-zinc-100 hover:text-white text-sm lg:text-base font-bold rounded-sm border-2 border-red-800 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.6)] uppercase tracking-wider transition-all" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            ↻ RESET CAMPAIGN
          </button>
        </div>
      )}
    </div>
  );
}