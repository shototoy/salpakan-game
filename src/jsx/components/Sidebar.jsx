// ============================================
// jsx/components/Sidebar.jsx
// ============================================

import React from 'react';

export default function Sidebar({
  phase, mode, multiplayerMode, msg, roomId, inventory, defeated,
  setupPlayer, turn, board, devMode, lastMove, opponentPiecesPlaced,
  onFinishSetup, onAutoSetup, onReset
}) {
  return (
    <div className="order-2 flex-shrink-0 lg:flex-initial bg-gradient-to-b from-zinc-900 to-black border-t lg:border-t-0 lg:border-l-4 border-yellow-700 flex flex-col p-2 py-3 lg:p-4 overflow-y-auto max-h-[45vh] lg:max-h-full lg:w-[380px]">
      <div className="text-center mb-2 pb-2 lg:mb-4 lg:pb-4 border-b-2 border-yellow-800">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 tracking-wider">
          IMPERIUM
        </h1>
        <div className="text-[10px] lg:text-xs text-yellow-600 italic mt-0 lg:mt-1 font-serif tracking-widest">SALPAKAN</div>
        {multiplayerMode === 'online' && roomId && (
          <div className="mt-2 bg-black rounded px-3 py-1 border border-yellow-900">
            <span className="text-yellow-600 text-xs font-mono">Room: {roomId}</span>
          </div>
        )}
      </div>

      {phase === 'setup' && multiplayerMode === 'online' && opponentPiecesPlaced > 0 && (
        <div className="mb-2 lg:mb-4 px-3 py-2 lg:px-4 lg:py-3 bg-blue-950 rounded border-2 border-blue-900">
          <div className="text-blue-400 text-sm lg:text-base font-serif font-bold">
            Opponent Deploying: <span className="text-blue-300 text-lg lg:text-xl">{opponentPiecesPlaced}</span> / 21
          </div>
        </div>
      )}

      {phase === 'setup' && (
        <>
          <div className="text-center text-base lg:text-lg text-yellow-400 mb-2 lg:mb-4 font-serif font-bold px-3 py-2 lg:px-4 lg:py-3 bg-black rounded border-2 border-yellow-800">
            {msg}
          </div>

          <div className="mb-2 lg:mb-4 px-3 py-2 lg:px-4 lg:py-3 bg-zinc-900 rounded border-2 border-yellow-900">
            <div className="text-yellow-500 text-sm lg:text-base font-serif font-bold">
              Units Remaining: <span className="text-yellow-300 text-lg lg:text-xl">{Object.values(inventory).reduce((sum, count) => sum + count, 0)}</span> / 21
            </div>
          </div>
        </>
      )}

      {phase === 'playing' && (
        <div className="text-center text-base lg:text-lg text-yellow-400 mb-2 lg:mb-4 font-serif font-bold px-3 py-2 lg:px-4 lg:py-3 bg-black rounded border-2 border-yellow-800">
          {msg}
        </div>
      )}

      {phase === 'setup' && (
        <div className="flex flex-col gap-1.5 lg:gap-2 mt-auto">
          <button onClick={onFinishSetup}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-green-700 to-green-800 text-white text-sm lg:text-base font-serif font-bold rounded border-2 border-green-600 hover:from-green-600 hover:to-green-700 shadow-lg">
            {setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local' ? '→ NEXT COMMANDER' : '⚔ BEGIN BATTLE'}
          </button>
          <button onClick={onAutoSetup}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-purple-800 to-purple-900 text-yellow-300 text-sm lg:text-base font-serif font-bold rounded border-2 border-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
            ⚡ AUTO DEPLOY
          </button>
          <button onClick={onReset}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-red-900 to-red-950 text-yellow-300 text-sm lg:text-base font-serif font-bold rounded border-2 border-red-800 hover:from-red-800 hover:to-red-900 shadow-lg">
            ↻ RESET CAMPAIGN
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col gap-1.5 lg:gap-2 mt-auto">
          <button onClick={onReset}
            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-red-900 to-red-950 text-yellow-300 text-sm lg:text-base font-serif font-bold rounded border-2 border-red-800 hover:from-red-800 hover:to-red-900 shadow-lg">
            ↻ RESET CAMPAIGN
          </button>
        </div>
      )}
    </div>
  );
}