// ============================================
// UI COMPONENTS (Pure Presentational)
// ============================================

window.TILESET_CONFIG = {
  url: './assets/imperium.svg',
  cellWidth: 240,
  cellHeight: 200,
  columns: 5,
  totalWidth: 1200,
  totalHeight: 800
};

window.PieceIcon = function PieceIcon({ rank, player, RANKS, isHidden }) {
  const [hasError, setHasError] = React.useState(false);
  
  const rankData = isHidden ? { tileX: 0, tileY: 3 } : RANKS.find(r => r.r === rank);
  
  if (!rankData && !isHidden) return <span className="text-yellow-600 font-bold text-2xl">{rank}</span>;

  const { tileX, tileY } = rankData;
  const padding = 30;
  const extractX = tileX * 240 + padding;
  const extractY = tileY * 200 + padding;
  const extractWidth = 240 - (padding * 2);
  const extractHeight = 200 - (padding * 2);

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-xs md:text-sm font-bold font-serif ${
        player === 2 ? 'text-blue-400 bg-blue-900' : 'text-yellow-400 bg-yellow-900'
      } rounded border-2 ${player === 2 ? 'border-blue-600' : 'border-yellow-600'}`}>
        {isHidden ? '?' : rank}
      </div>
    );
  }

  return (
    <svg
      viewBox={`${extractX} ${extractY} ${extractWidth} ${extractHeight}`}
      style={{
        width: '100%',
        height: '100%',
        filter: player === 2 ? 'hue-rotate(180deg) saturate(0.7) brightness(0.9)' : 'none'
      }}
    >
      <image
        href={window.TILESET_CONFIG.url}
        width={window.TILESET_CONFIG.totalWidth}
        height={window.TILESET_CONFIG.totalHeight}
        style={{ imageRendering: 'crisp-edges' }}
        onError={(e) => {
          console.error('Image load error', e);
          setHasError(true);
        }}
      />
    </svg>
  );
}

window.HomeScreen = function HomeScreen({ onModeSelect, devMode, setDevMode }) {
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

window.MultiplayerLobby = function MultiplayerLobby({ onBack, onCreateRoom, onJoinRoom, roomId, setRoomId, availableRooms, WebSocketManager }) {
  const [showServerSelect, setShowServerSelect] = React.useState(false);
  const servers = WebSocketManager.getAllServers();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700">
        <button onClick={onBack} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">← Back</button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌐</div>
          <h2 className="text-3xl font-serif font-black text-yellow-400 mb-2 tracking-wider">ONLINE BATTLE</h2>
        </div>

        {showServerSelect ? (
          <div>
            <button onClick={() => setShowServerSelect(false)} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">
              ← Back to Lobby
            </button>
            <h3 className="text-xl font-serif font-bold text-yellow-400 mb-4 text-center">Select Server</h3>
            <div className="flex flex-col gap-3">
              {servers.map(server => (
                <button 
                  key={server.url}
                  onClick={() => {
                    onCreateRoom(server.url);
                    setShowServerSelect(false);
                  }}
                  className={`w-full px-6 py-4 text-white text-lg font-serif font-bold rounded border-2 shadow-lg hover:opacity-90 transition-all ${
                    server.name === 'Local' 
                      ? 'bg-gradient-to-r from-blue-700 to-blue-800 border-blue-600'
                      : 'bg-gradient-to-r from-purple-700 to-purple-800 border-purple-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span>{server.name === 'Local' ? '🏠' : '☁️'} {server.name}</span>
                    <span className="text-xs opacity-75">{server.name === 'Local' ? 'LAN' : 'Cloud'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setShowServerSelect(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white text-xl font-serif font-bold rounded border-2 border-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg mb-4">
              ➕ CREATE ROOM
            </button>

            {availableRooms && availableRooms.length > 0 && (
              <div className="mb-4">
                <p className="text-yellow-600 font-serif text-sm mb-2">Available Rooms ({availableRooms.length}):</p>
                <div className="max-h-48 overflow-y-auto">
                  {availableRooms.map(room => (
                    <button key={`${room.serverUrl}-${room.id}`} onClick={() => onJoinRoom(room.id, room.serverUrl)}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded border border-yellow-800 font-mono mb-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">{room.id}</span>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            room.server === 'Local' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'
                          }`}>
                            {room.server}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">{room.players}/2</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!availableRooms || availableRooms.length === 0) && (
              <div className="mb-4 p-4 bg-zinc-800 rounded border border-yellow-900 text-center">
                <p className="text-yellow-600 text-sm">No rooms available</p>
                <p className="text-gray-500 text-xs mt-1">Create one or join by ID</p>
              </div>
            )}

            <div className="border-t border-yellow-900 pt-4 mt-4">
              <p className="text-yellow-600 font-serif text-xs mb-2 text-center">Join by Room ID</p>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-black text-yellow-400 border-2 border-yellow-800 rounded font-mono text-lg text-center mb-2"
                maxLength={6}
              />
              <button
                onClick={() => roomId.length === 6 && onJoinRoom(roomId)}
                disabled={roomId.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-lg font-serif font-bold rounded border-2 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-yellow-700">
                🚪 JOIN ROOM
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.RoomWaiting = function RoomWaiting({ roomId, onLeave, onStart, onToggleReady, players, isReady, myReady, opponentReady, playerId, connectionStatus }) {
  const playerSlots = React.useMemo(() => {
    const slots = [null, null];
    players.forEach(p => {
      if (p === 1) slots[0] = 1;
      if (p === 2) slots[1] = 2;
    });
    return slots;
  }, [players]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <button onClick={onLeave} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">← Leave Room</button>

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
          onClick={onToggleReady}
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
            onClick={onStart}
            disabled={!isReady}
            className="w-full px-6 py-3 bg-emerald-700 text-white text-lg font-serif font-bold rounded border-2 border-emerald-600 disabled:opacity-50">
            ⚔ START BATTLE
          </button>
        )}
      </div>
    </div>
  );
}

window.GameBoard = function GameBoard({ 
  board, phase, mode, multiplayerMode, turn, setupPlayer, sel, moves, lastMove, 
  devMode, playerId, opponentLastSelected, flaggedPiece, 
  onCellClick, onCellPress, onCellRelease, GameModes, RANKS 
}) {
  const modeHandler = mode === 'ai' ? GameModes.ai : (multiplayerMode === 'online' ? GameModes.online : GameModes.local);
  const perspective = modeHandler.getBoardPerspective(phase, turn, setupPlayer, playerId);

  const rows = [];
  for (let r = 0; r < 8; r++) {
    const cells = [];
    for (let c = 0; c < 9; c++) {
      const actualR = perspective === 2 ? 7 - r : r;
      const actualC = perspective === 2 ? 8 - c : c;
      const cell = board[actualR][actualC];

      const isSelected = sel?.[0] === actualR && sel?.[1] === actualC;
      const isValidMove = moves.some(([mr, mc]) => mr === actualR && mc === actualC);
      const isOpponentSelected = opponentLastSelected?.[0] === actualR && opponentLastSelected?.[1] === actualC;

      let isLastMoveFrom = false;
      let isLastMoveTo = false;

      if (lastMove && lastMove.turn !== turn) {
        isLastMoveFrom = lastMove.from[0] === actualR && lastMove.from[1] === actualC;
        isLastMoveTo = lastMove.to[0] === actualR && lastMove.to[1] === actualC;
      }

      const isFlagged = flaggedPiece?.[0] === actualR && flaggedPiece?.[1] === actualC; 
      const canSee = phase === 'setup'
        ? (cell?.p === (multiplayerMode === 'online' ? playerId : setupPlayer) || devMode || !cell)
        : modeHandler.shouldShowPiece(cell, turn, playerId, devMode);

      cells.push(
        <div
          key={c}
          onClick={() => onCellClick(actualR, actualC)}
          onMouseDown={() => onCellPress(actualR, actualC)}
          onMouseUp={onCellRelease}
          onMouseLeave={onCellRelease}
          onTouchStart={() => onCellPress(actualR, actualC)}
          onTouchEnd={onCellRelease}
          className={`flex items-center justify-center cursor-pointer transition-all ${
            isSelected ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-[inset_0_0_15px_rgba(251,191,36,0.4)]' :
            isFlagged ? 'bg-gradient-to-br from-violet-400 to-violet-500 shadow-[inset_0_0_15px_rgba(167,139,250,0.4)]' :
            isOpponentSelected ? 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[inset_0_0_15px_rgba(251,146,60,0.4)]' :
            isValidMove ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400' :
            (isLastMoveFrom || isLastMoveTo) ? 'bg-gradient-to-br from-rose-400 to-rose-500 hover:from-rose-300 hover:to-rose-400' :
            ((actualR + actualC) % 2 === 0) 
              ? 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-50 hover:to-slate-100' 
              : 'bg-gradient-to-br from-slate-300 to-slate-400 hover:from-slate-250 hover:to-slate-350'
          } border-[0.5px] border-slate-400/30`}
          style={{ flex: 1, aspectRatio: '1/1' }}
        >
          {cell ? (canSee ? (
            <div className="w-full h-full p-[2px] md:p-1">
              <PieceIcon rank={cell.r} player={cell.p} RANKS={RANKS} />
            </div>
          ) : (
            <div className="w-full h-full p-[2px] md:p-1">
              <PieceIcon rank={null} player={cell.p} RANKS={RANKS} isHidden={true} />
            </div>
          )) : ''}
        </div>
      );
    }
    rows.push(
      <div key={r} className="flex" style={{ flex: 1, minHeight: 0 }}>
        {cells}
      </div>
    );
  }
  return rows;
}

window.Sidebar = function Sidebar({
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

window.UnitPicker = function UnitPicker({ inventory, setupPlayer, onSelect, onCancel, RANKS }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-lg shadow-2xl max-w-lg w-full border-4 border-yellow-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-serif font-black text-yellow-400 mb-4 text-center">SELECT UNIT</h2>
        <div className="grid grid-cols-5 gap-2">
          {RANKS.map(({ r }) => (
            inventory[r] > 0 && (
              <button key={r} onClick={() => onSelect(r)}
                className="px-2 py-3 rounded border-2 bg-gradient-to-br from-yellow-700 to-yellow-800 border-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
                <div className="w-full h-12"><PieceIcon rank={r} player={setupPlayer} RANKS={RANKS} /></div>
                <div className="text-xs mt-1 bg-black bg-opacity-50 rounded px-1 text-yellow-300">×{inventory[r]}</div>
              </button>
            )
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full px-4 py-2 bg-red-900 text-yellow-300 rounded">CANCEL</button>
      </div>
    </div>
  );
}

window.TurnLockModal = function TurnLockModal({ pausePhase, setupPlayer, mode, multiplayerMode, turn, battleResult, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="text-6xl mb-4">⚔</div>
        <h2 className="text-3xl font-serif font-black text-yellow-400 mb-3">
          {pausePhase ? (setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local' ? 'COMMANDER 2' : 'BATTLE BEGINS') : `COMMANDER ${turn}`}
        </h2>
        <p className="text-lg text-yellow-600 mb-6 font-serif">
          {pausePhase ? 'Transfer command authority' : (battleResult ? 'Review the battle outcome' : 'Prepare your strategy')}
        </p>
        <button onClick={onConfirm} className="px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl rounded w-full">
          READY ✓
        </button>
      </div>
    </div>
  );
}

window.VictoryModal = function VictoryModal({ winner, victoryType, onBackToHome }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="text-6xl mb-4">
          {winner ? '👑' : '⚔'}
        </div>
        <h2 className="text-4xl font-serif font-black text-yellow-400 mb-4">
          {winner ? `COMMANDER ${winner} WINS!` : 'BATTLE ENDED'}
        </h2>
        <div className="mb-6 p-4 bg-black rounded border-2 border-yellow-800">
          <p className="text-lg text-yellow-600 font-serif">
            {victoryType === 'flag_captured' && 'Enemy Flag Captured!'}
            {victoryType === 'flag_reached' && 'Flag Reached Enemy Territory!'}
          </p>
        </div>
        <button 
          onClick={onBackToHome}
          className="w-full px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl font-serif font-bold rounded border-2 border-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg">
          RETURN TO COMMAND CENTER
        </button>
      </div>
    </div>
  );
}

window.BattleReportModal = function BattleReportModal({ battleResult, showingBattleForPlayer, onContinue, RANKS }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="mb-6 p-4 bg-black rounded border-2 border-yellow-800">
          <div className="text-xl font-serif font-bold text-yellow-400 mb-3">BATTLE REPORT</div>
          <div className="flex items-center justify-center gap-4 mb-2">
            {battleResult.result === 'draw' ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.attacker : battleResult.defender} player={showingBattleForPlayer} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={showingBattleForPlayer === battleResult.player ? battleResult.defender : battleResult.attacker} player={showingBattleForPlayer === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Enemy Unit</div>
                </div>
              </>
            ) : showingBattleForPlayer === battleResult.player ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.attacker} player={battleResult.player} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-yellow-600">?</div>
                  </div>
                  <div className="text-xs text-yellow-600">Enemy</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1 flex items-center justify-center">
                    <div className="text-4xl text-yellow-600">?</div>
                  </div>
                  <div className="text-xs text-yellow-600">Enemy</div>
                </div>
                <div className="text-3xl">⚔</div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-1">
                    <PieceIcon rank={battleResult.defender} player={battleResult.player === 1 ? 2 : 1} RANKS={RANKS} />
                  </div>
                  <div className="text-xs text-yellow-600">Your Unit</div>
                </div>
              </>
            )}
          </div>
          <div className={`text-lg font-serif font-bold mt-3 ${
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? 'text-green-400' :
            (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {(showingBattleForPlayer === battleResult.player && battleResult.result === 'win') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'lose') ? '⚔ VICTORY' :
             (showingBattleForPlayer === battleResult.player && battleResult.result === 'lose') || (showingBattleForPlayer !== battleResult.player && battleResult.result === 'win') ? '☠ UNIT LOST' : '⚡ MUTUAL ELIMINATION'}
          </div>
        </div>

        <button onClick={onContinue} className="px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl rounded w-full">
          CONTINUE ✓
        </button>
      </div>
    </div>
  );
}