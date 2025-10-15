import React, { useMemo } from 'react';

export default function RoomWaiting({ roomId, onLeave, onStart, onToggleReady, players, isReady, myReady, opponentReady, playerId, connectionStatus }) {

  // ============================================
  // PLAYER SLOTS
  // ============================================

  const playerSlots = useMemo(() => {
    const slots = [null, null];
    players.forEach(p => {
      if (p === 1) slots[0] = 1;
      if (p === 2) slots[1] = 2;
    });
    return slots;
  }, [players]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleToggleReady = () => {
    onToggleReady();
  };

  const handleStart = () => {
    onStart();
  };

  const handleLeave = () => {
    onLeave();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl w-full max-w-md border-4 border-yellow-700 text-center" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="flex flex-col h-full">
          <button onClick={handleLeave} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm self-start">← Leave Room</button>
          <div className="bg-black rounded-lg p-6 mb-6 border-2 border-yellow-800">
            <p className="text-yellow-600 text-sm font-serif mb-2">Room ID</p>
            <p className="text-yellow-400 text-4xl font-mono font-bold">{roomId}</p>
            <div className={`mt-3 text-xs ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
              {connectionStatus === 'connected' ? '✓ Connected' : '⏳ Connecting...'}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-500 text-sm mb-3">Players ({players.filter(p => p).length}/2)</p>
            {playerSlots.map((playerNum, idx) => {
              const hasPlayer = playerNum !== null;
              const isMe = hasPlayer && playerNum === playerId;
              const playerReady = hasPlayer ? (isMe ? myReady : opponentReady) : false;

              return (
                <div key={idx} className={`bg-black rounded px-3 py-2 mb-2 flex justify-between ${!hasPlayer ? 'opacity-50' : ''}`}>
                  <span className="text-yellow-400 font-serif">Commander {idx + 1} {isMe ? '(You)' : ''}</span>
                  <span className={`text-sm ${playerReady ? 'text-green-500' : 'text-yellow-500'}`}>
                    {hasPlayer ? (playerReady ? '✓ Ready' : '⏳ Not Ready') : '⏳ Waiting...'}
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
              className={`w-full px-6 py-3 text-lg font-serif font-bold rounded border-2 shadow-lg mb-3 ${
                myReady
                  ? 'bg-gray-700 text-gray-300 border-gray-600'
                  : 'bg-yellow-700 text-black border-yellow-600'
              } disabled:opacity-50`}>
              {myReady ? '✓ READY' : 'READY UP'}
            </button>

            {playerId === 1 && (
              <button
                onClick={handleStart}
                disabled={!isReady}
                className="w-full px-6 py-3 bg-emerald-700 text-white text-lg font-serif font-bold rounded border-2 border-emerald-600 disabled:opacity-50">
                ⚔ START BATTLE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}