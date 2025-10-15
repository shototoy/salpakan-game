import React, { useMemo, useEffect } from 'react';

export default function RoomWaiting({ roomId, onLeave, onStart, onToggleReady, players, isReady, myReady, opponentReady, playerId, connectionStatus }) {
  useEffect(() => {
    console.log('=== RoomWaiting MOUNTED ===');
    console.log('roomId:', roomId);
    console.log('playerId:', playerId);
    console.log('connectionStatus:', connectionStatus);
    console.log('players:', players);
    console.log('myReady:', myReady);
    console.log('opponentReady:', opponentReady);
  }, []);

  useEffect(() => {
    console.log('connectionStatus changed to:', connectionStatus);
  }, [connectionStatus]);

  useEffect(() => {
    console.log('players updated:', players);
  }, [players]);

  useEffect(() => {
    console.log('myReady:', myReady, 'opponentReady:', opponentReady);
  }, [myReady, opponentReady]);

  const playerSlots = useMemo(() => {
    const slots = [null, null];
    players.forEach(p => {
      if (p === 1) slots[0] = 1;
      if (p === 2) slots[1] = 2;
    });
    console.log('playerSlots calculated:', slots);
    return slots;
  }, [players]);

  const handleToggleReady = () => {
    console.log('Toggle Ready clicked, current myReady:', myReady);
    onToggleReady();
  };

  const handleStart = () => {
    console.log('Start Battle clicked');
    onStart();
  };

  const handleLeave = () => {
    console.log('Leave Room clicked');
    onLeave();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center my-4">
        <button onClick={handleLeave} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">← Leave Room</button>

        <div className="text-5xl mb-4">🎮</div>
        <h2 className="text-3xl font-serif font-black text-yellow-400 mb-4">ROOM</h2>

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

        <div className="mt-4 p-3 bg-red-900 bg-opacity-20 rounded text-xs text-left">
          <div className="text-yellow-500 font-bold mb-1">DEBUG INFO:</div>
          <div className="text-gray-400">Status: {connectionStatus}</div>
          <div className="text-gray-400">PlayerId: {playerId}</div>
          <div className="text-gray-400">Players: [{players.join(', ')}]</div>
          <div className="text-gray-400">My Ready: {String(myReady)}</div>
          <div className="text-gray-400">Opponent Ready: {String(opponentReady)}</div>
        </div>
      </div>
    </div>
  );
}