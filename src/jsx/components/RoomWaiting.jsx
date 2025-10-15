// ============================================
// jsx/components/RoomWaiting.jsx
// ============================================

import React, { useMemo } from 'react';

export default function RoomWaiting({ roomId, onLeave, onStart, onToggleReady, players, isReady, myReady, opponentReady, playerId, connectionStatus }) {

  const playerSlots = useMemo(() => {
    const slots = [null, null];
    players.forEach(p => {
      if (p === 1) slots[0] = 1;
      if (p === 2) slots[1] = 2;
    });
    return slots;
  }, [players]);

  const handleToggleReady = () => {
    onToggleReady();
  };

  const handleStart = () => {
    onStart();
  };

  const handleLeave = () => {
    onLeave();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-4">
      <div className="relative bg-zinc-950 p-10 rounded-sm shadow-2xl w-full max-w-md border-4 border-zinc-800 text-center" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <button onClick={handleLeave} className="mb-4 text-zinc-400 hover:text-zinc-100 text-xs uppercase tracking-wider self-start" style={{ fontFamily: 'Courier New, monospace' }}>
            ← RETURN
          </button>
          <div className="bg-black rounded-sm p-6 mb-6 border-2 border-zinc-800">
            <p className="text-zinc-400 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>ROOM ID</p>
            <p className="text-zinc-200 text-4xl font-mono font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(161,161,170,0.5)' }}>{roomId}</p>
            <div className={`mt-3 text-xs uppercase tracking-wider ${connectionStatus === 'connected' ? 'text-green-600' : 'text-zinc-600'}`} style={{ fontFamily: 'Courier New, monospace' }}>
              {connectionStatus === 'connected' ? '✓ CONNECTED' : '⏳ CONNECTING...'}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-sm p-4 mb-6 border border-zinc-800">
            <p className="text-zinc-400 text-xs mb-3 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>COMMANDERS ({players.filter(p => p).length}/2)</p>
            {playerSlots.map((playerNum, idx) => {
              const hasPlayer = playerNum !== null;
              const isMe = hasPlayer && playerNum === playerId;
              const playerReady = hasPlayer ? (isMe ? myReady : opponentReady) : false;

              return (
                <div key={idx} className={`bg-black rounded-sm px-3 py-2 mb-2 flex justify-between ${!hasPlayer ? 'opacity-50' : ''}`}>
                  <span className="text-zinc-200 text-sm uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                    CMDR {idx + 1} {isMe ? '(YOU)' : ''}
                  </span>
                  <span className={`text-xs uppercase tracking-wider ${playerReady ? 'text-green-600' : 'text-zinc-600'}`} style={{ fontFamily: 'Courier New, monospace' }}>
                    {hasPlayer ? (playerReady ? '✓ READY' : '⏳ STANDBY') : '⏳ WAITING...'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex-1"></div>

          <div className="mt-auto">
            <button
              onClick={handleToggleReady}
              disabled={connectionStatus !== 'connected' || players.filter(p => p).length < 2}
              className={`w-full px-6 py-3 text-lg font-bold rounded-sm border-2 shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-3 uppercase tracking-wider transition-all ${
                myReady
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)]'
              } disabled:opacity-50`}
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              {myReady ? '✓ READY' : 'READY UP'}
            </button>

            {playerId === 1 && (
              <button
                onClick={handleStart}
                disabled={!isReady}
                className="w-full px-6 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-lg font-bold rounded-sm border-2 border-zinc-600 hover:border-red-700 disabled:opacity-50 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] uppercase tracking-wider transition-all"
                style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                ⚔ START BATTLE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}