// ============================================
// jsx/components/RoomWaiting.jsx
// ============================================

import React, { useMemo, useState } from 'react';

export default function RoomWaiting({ 
  roomId, onLeave, onStart, onToggleReady, players, isReady, myReady, 
  opponentReady, playerId, connectionStatus, roomType, onSelectSlot, 
  playerNames, onUpdateName, hostId 
}) {
  const [nameInput, setNameInput] = useState('');
  const isThreePlayer = roomType === '3player';
  const maxPlayers = isThreePlayer ? 3 : 2;

  const playerSlots = useMemo(() => {
    if (!players || typeof players !== 'object') {
      return isThreePlayer ? [null, null, null] : [null, null];
    }

    if (isThreePlayer) {
      const slots = [null, null, null];
      Object.entries(players).forEach(([pid, slotNum]) => {
        if (slotNum >= 1 && slotNum <= 3) {
          slots[slotNum - 1] = parseInt(pid);
        }
      });
      return slots;
    } else {
      const slots = [null, null];
      Object.entries(players).forEach(([pid, slotNum]) => {
        if (slotNum === 1) slots[0] = parseInt(pid);
        if (slotNum === 2) slots[1] = parseInt(pid);
      });
      return slots;
    }
  }, [players, isThreePlayer]);

  const mySlot = players && players[playerId] ? players[playerId] : null;
  const isObserver = isThreePlayer && mySlot === 3;
  const isHost = hostId && playerId && hostId === playerId;
  const playerCount = players && typeof players === 'object' ? Object.keys(players).length : 0;

  const handleToggleReady = () => {
    if (!isObserver && mySlot) {
      onToggleReady();
    }
  };

  const handleSelectSlot = (slotNum) => {
    console.log('Selecting slot:', slotNum, 'PlayerId:', playerId, 'ConnectionStatus:', connectionStatus);
    if (onSelectSlot && connectionStatus === 'connected' && playerId) {
      onSelectSlot(slotNum);
    } else {
      console.log('Cannot select slot - missing requirements:', {
        hasCallback: !!onSelectSlot,
        isConnected: connectionStatus === 'connected',
        hasPlayerId: !!playerId
      });
    }
  };

  const handleUpdateName = () => {
    if (nameInput.trim() && onUpdateName) {
      onUpdateName(nameInput.trim());
      setNameInput('');
    }
  };

  const getReadyStatus = (slotNum) => {
    const pid = playerSlots[slotNum - 1];
    if (!pid) return { ready: false, text: '⊕ EMPTY' };
    
    if (isThreePlayer && slotNum === 3) {
      return { ready: true, text: '👁️ WATCHING' };
    }
    
    const playerReadyStates = {};
    Object.keys(players).forEach(pId => {
      if (pId == playerId) {
        playerReadyStates[pId] = myReady;
      } else {
        playerReadyStates[pId] = opponentReady;
      }
    });
    
    const isPlayerReady = playerReadyStates[pid] || false;
    
    if (pid == playerId) {
      return { ready: myReady, text: myReady ? '✓ READY' : '⏳ STANDBY' };
    } else {
      return { ready: isPlayerReady, text: isPlayerReady ? '✓ READY' : '⏳ STANDBY' };
    }
  };

  const getSlotLabel = (slotNum) => {
    if (isThreePlayer && slotNum === 3) return 'OBSERVER';
    return `CMDR ${slotNum}`;
  };

  const canStartGame = () => {
    if (!isHost) return false;
    
    const slot1Player = Object.keys(players).find(pid => players[pid] === 1);
    const slot2Player = Object.keys(players).find(pid => players[pid] === 2);
    
    if (!slot1Player || !slot2Player) return false;
    
    const playerReadyStates = {};
    Object.keys(players).forEach(pId => {
      if (pId == playerId) {
        playerReadyStates[pId] = myReady;
      } else {
        playerReadyStates[pId] = opponentReady;
      }
    });
    
    return playerReadyStates[slot1Player] && playerReadyStates[slot2Player];
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-4">
      <div className="relative bg-zinc-950 p-6 rounded-sm shadow-2xl w-full max-w-md border-4 border-zinc-800 text-center" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <button onClick={onLeave} className="mb-3 text-zinc-400 hover:text-zinc-100 text-xs uppercase tracking-wider self-start" style={{ fontFamily: 'Courier New, monospace' }}>
            ← RETURN
          </button>
          
          <div className="bg-black rounded-sm p-4 mb-3 border-2 border-zinc-800">
            <p className="text-zinc-400 text-xs mb-1 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>ROOM ID</p>
            <p className="text-zinc-200 text-3xl font-mono font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(161,161,170,0.5)' }}>{roomId}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className={`text-xs uppercase tracking-wider ${connectionStatus === 'connected' ? 'text-green-600' : 'text-zinc-600'}`} style={{ fontFamily: 'Courier New, monospace' }}>
                {connectionStatus === 'connected' ? '✓ CONNECTED' : '⏳ CONNECTING...'}
              </div>
              {isThreePlayer && (
                <div className="text-xs uppercase tracking-wider text-violet-400" style={{ fontFamily: 'Courier New, monospace' }}>
                  👁️ 3-PLAYER
                </div>
              )}
              {isHost && (
                <div className="text-xs uppercase tracking-wider text-yellow-500" style={{ fontFamily: 'Courier New, monospace' }}>
                  👑 HOST
                </div>
              )}
            </div>
          </div>

          {playerNames && (
            <div className="bg-zinc-900 rounded-sm p-2 mb-3 border border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={16}
                  className="flex-1 px-2 py-1 bg-black text-zinc-200 border border-zinc-800 focus:border-zinc-700 rounded-sm font-mono text-sm"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={!nameInput.trim()}
                  className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-xs font-bold rounded-sm border border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-all"
                  style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                  SET
                </button>
              </div>
              {playerNames[playerId] && (
                <div className="mt-1 text-zinc-300 text-xs font-mono">
                  IGN: {playerNames[playerId]}
                </div>
              )}
            </div>
          )}

          <div className="bg-zinc-900 rounded-sm p-3 mb-3 border border-zinc-800 flex-1 overflow-y-auto">
            <p className="text-zinc-400 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>
              {isThreePlayer ? 'PLAYERS' : 'COMMANDERS'} ({playerCount}/{maxPlayers})
            </p>
            
            {playerSlots.map((pid, idx) => {
              const slotNum = idx + 1;
              const hasPlayer = pid !== null;
              const isMe = hasPlayer && pid === playerId;
              const isSlotHost = hasPlayer && pid === hostId;
              const status = getReadyStatus(slotNum);
              const isObserverSlot = isThreePlayer && slotNum === 3;
              const canSelect = !hasPlayer && !mySlot && connectionStatus === 'connected';

              return (
                <button
                  key={idx}
                  onClick={() => canSelect && handleSelectSlot(slotNum)}
                  disabled={!canSelect && !isMe}
                  className={`w-full bg-black rounded-sm px-2 py-2 mb-1.5 flex justify-between items-center transition-all ${
                    canSelect ? 'opacity-100 hover:opacity-100 cursor-pointer border-2 border-dashed border-zinc-600 hover:border-zinc-500' : 
                    hasPlayer ? 'opacity-100 cursor-default border border-zinc-800' : 
                    'opacity-50 cursor-not-allowed border border-zinc-800'
                  } ${isMe ? 'ring-2 ring-zinc-500' : ''}`}>
                  <div className="flex flex-col items-start">
                    <span className={`text-sm uppercase tracking-wider font-bold ${isObserverSlot ? 'text-violet-300' : 'text-zinc-200'}`} style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                      {isSlotHost && '👑 '}
                      {isObserverSlot ? '👁️' : '⚔️'} {getSlotLabel(slotNum)} {isMe ? '(YOU)' : ''}
                    </span>
                    {hasPlayer && playerNames && playerNames[pid] && (
                      <span className="text-xs text-zinc-400 font-mono mt-0.5">{playerNames[pid]}</span>
                    )}
                  </div>
                  <span className={`text-xs uppercase tracking-wider ${status.ready ? 'text-green-600' : 'text-zinc-600'}`} style={{ fontFamily: 'Courier New, monospace' }}>
                    {hasPlayer ? status.text : (canSelect ? '⊕ CLICK' : status.text)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto">
            {!isObserver && mySlot && (
              <button
                onClick={handleToggleReady}
                disabled={connectionStatus !== 'connected'}
                className={`w-full px-4 py-2.5 text-base font-bold rounded-sm border-2 shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2 uppercase tracking-wider transition-all ${
                  myReady
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                {myReady ? '✓ READY' : 'READY UP'}
              </button>
            )}

            {isObserver && (
              <div className="w-full px-4 py-2.5 bg-violet-900/30 text-violet-300 text-sm font-bold rounded-sm border-2 border-violet-700/50 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                👁️ OBSERVER MODE
                <div className="text-xs text-violet-400 mt-0.5 normal-case tracking-normal font-mono">
                  Omniscience enabled
                </div>
              </div>
            )}

            {!mySlot && connectionStatus === 'connected' && (
              <div className="w-full px-4 py-2.5 bg-zinc-900/50 text-zinc-500 text-sm font-bold rounded-sm border-2 border-zinc-800 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                ⊕ SELECT A SLOT
              </div>
            )}

            {canStartGame() && (
              <button
                onClick={onStart}
                className="w-full px-4 py-2.5 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-base font-bold rounded-sm border-2 border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] uppercase tracking-wider transition-all"
                style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                ⚔ START BATTLE
              </button>
            )}

            {!isHost && mySlot && !isObserver && (
              <div className="text-xs text-zinc-600 text-center mt-2" style={{ fontFamily: 'Courier New, monospace' }}>
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}