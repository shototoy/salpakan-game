// ============================================
// GAME CONTROLLER (State & Event Handlers)
// ============================================

const { GameLogic, RANKS, GameModes, WebSocketManager } = window;

window.GameController = function GameController() {
  const { useState, useEffect, useCallback, useRef } = React;
  
  // ============================================
  // STATE
  // ============================================
  const playerIdRef = useRef(null);
  const [screen, setScreen] = useState('home');
  const [board, setBoard] = useState(GameLogic.initBoard());
  const [phase, setPhase] = useState('setup');
  const [mode, setMode] = useState(null);
  const [turn, setTurn] = useState(1);
  const [sel, setSel] = useState(null);
  const [moves, setMoves] = useState([]);
  const [msg, setMsg] = useState('Choose Mode');
  const [devMode, setDevMode] = useState(false);
  const [setupPlayer, setSetupPlayer] = useState(1);
  const [inventory, setInventory] = useState({});
  const [showPicker, setShowPicker] = useState(null);
  const [showTurnLock, setShowTurnLock] = useState(false);
  const [pausePhase, setPausePhase] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [defeated, setDefeated] = useState({ 1: [], 2: [] });
  const [showBattleReport, setShowBattleReport] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [showingBattleForPlayer, setShowingBattleForPlayer] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [multiplayerMode, setMultiplayerMode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([null, null]);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [myReadyState, setMyReadyState] = useState(false);
  const [opponentReadyState, setOpponentReadyState] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [opponentPiecesPlaced, setOpponentPiecesPlaced] = useState(0);
  const [opponentLastSelected, setOpponentLastSelected] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryData, setVictoryData] = useState(null);

  // ============================================
  // WEBSOCKET EFFECTS
  // ============================================
  useEffect(() => {
    if (screen === 'multiplayer') {
      const host = window.location.hostname;
      const roomListWs = new WebSocket(`ws://${host}:8080`);
      
      roomListWs.onopen = () => roomListWs.send(JSON.stringify({ type: 'getRooms' }));
      roomListWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'roomList') {
          setAvailableRooms(data.rooms.filter(room => !room.isFull));
        }
      };

      const interval = setInterval(() => {
        if (roomListWs.readyState === WebSocket.OPEN) {
          roomListWs.send(JSON.stringify({ type: 'getRooms' }));
        }
      }, 2000);

      return () => {
        clearInterval(interval);
        roomListWs.close(); 
      };
    }
  }, [screen]);

  useEffect(() => {
    if ((screen === 'room' || screen === 'onlineGame') && roomId) {
      const handleRoomJoined = (data) => {
        const myId = data.playerId;
        playerIdRef.current = myId;
        setPlayerId(myId);
        
        const normalizedPlayers = [null, null];
        data.players.forEach(p => {
          if (p === 1) normalizedPlayers[0] = 1;
          if (p === 2) normalizedPlayers[1] = 2;
        });
        setPlayers(normalizedPlayers);
        setConnectionStatus('connected');
        
        const myReady = data.readyStates?.[myId] || false;
        const opponentId = myId === 1 ? 2 : 1;
        const oppReady = data.readyStates?.[opponentId] || false;
        
        setMyReadyState(myReady);
        setOpponentReadyState(oppReady);
        setIsRoomReady(myReady && oppReady);
      };

      const handlePlayerJoined = (data) => {
        const normalizedPlayers = [null, null];
        data.players.forEach(p => {
          if (p === 1) normalizedPlayers[0] = 1;
          if (p === 2) normalizedPlayers[1] = 2;
        });
        setPlayers(normalizedPlayers);
        
        const currentPlayerId = playerIdRef.current;
        if (data.readyStates && currentPlayerId) {
          const myReady = data.readyStates[currentPlayerId] || false;
          const opponentId = currentPlayerId === 1 ? 2 : 1;
          const oppReady = data.readyStates[opponentId] || false;
          
          setMyReadyState(myReady);
          setOpponentReadyState(oppReady);
          setIsRoomReady(myReady && oppReady);
        }
      };

      const handlePlayerReady = (data) => {
        const currentPlayerId = playerIdRef.current;
        if (!currentPlayerId) return;
        
        if (data.readyStates) {
          const opponentId = currentPlayerId === 1 ? 2 : 1;
          const myReady = data.readyStates[currentPlayerId] === true;
          const oppReady = data.readyStates[opponentId] === true;
          
          setMyReadyState(myReady);
          setOpponentReadyState(oppReady);
          setIsRoomReady(data.allReady === true);
        }
      };

      const handleGameStart = () => {
        setMode('2player');
        setMultiplayerMode('online');
        setBoard(GameLogic.initBoard());
        const inv = {};
        RANKS.forEach(({ r, count }) => { inv[r] = count; });
        setInventory(inv);
        setSetupPlayer(playerIdRef.current);
        setPhase('setup');
        setMsg('Deploy Your Forces');
        setScreen('onlineGame');
      };

      const handleOpponentDeploymentUpdate = (data) => {
        setOpponentPiecesPlaced(data.piecesPlaced);
        
        if (data.board && playerIdRef.current) {
          setBoard(prevBoard => {
            const mergedBoard = prevBoard.map((row, r) => 
              row.map((cell, c) => {
                if (data.board[r][c] && data.board[r][c].p !== playerIdRef.current) {
                  return data.board[r][c];
                }
                return cell;
              })
            );
            return mergedBoard;
          });
        }
      };

      const handleOpponentSetupComplete = (data) => {
        if (data.playerId !== playerIdRef.current) {
          setMsg('Opponent ready! Finish your deployment.');
        }
      };

      const handleBothPlayersReady = () => {
        setPhase('playing');
        setTurn(1);
        setMsg(playerIdRef.current === 1 ? 'Your Turn' : 'Opponent Turn');
        setOpponentPiecesPlaced(0);
      };

      const handleMove = (data) => {
        if (data.playerId !== playerIdRef.current) {
          setBoard(data.board);
          setTurn(data.turn);
          setLastMove(data.lastMove);
          setDefeated(data.defeated);
          
          if (data.lastMove) {
            setOpponentLastSelected(data.lastMove.from);
            setTimeout(() => setOpponentLastSelected(null), 2000);
          }
          
          setMsg(data.turn === playerIdRef.current ? 'Your Turn' : 'Opponent Turn');
          
          if (data.battleResult) {
            setBattleResult(data.battleResult);
            setShowBattleReport(true);
            setShowingBattleForPlayer(playerIdRef.current);
          }
        }
      };

      const handleGameEnd = (data) => {
        console.log('Game end received:', data);
        setMsg(data.message);
        setPhase('ended');
        setVictoryData({ 
          winner: data.winner, 
          victoryType: data.victoryType || 'flag_captured' 
        });
        setShowVictory(true);
        console.log('Victory modal should show now', { showVictory: true, victoryData: data });
      };

      if (screen === 'room') {
        WebSocketManager.disconnect();
        
        WebSocketManager.on('roomJoined', handleRoomJoined);
        WebSocketManager.on('playerJoined', handlePlayerJoined);
        WebSocketManager.on('playerReady', handlePlayerReady);
        WebSocketManager.on('gameStart', handleGameStart);
        WebSocketManager.on('opponentDeploymentUpdate', handleOpponentDeploymentUpdate);
        WebSocketManager.on('opponentSetupComplete', handleOpponentSetupComplete);
        WebSocketManager.on('bothPlayersReady', handleBothPlayersReady);
        WebSocketManager.on('move', handleMove);
        WebSocketManager.on('gameEnd', handleGameEnd);
        
        WebSocketManager.connect(roomId, null);
      } else if (screen === 'onlineGame') {
        WebSocketManager.on('gameStart', handleGameStart);
        WebSocketManager.on('opponentDeploymentUpdate', handleOpponentDeploymentUpdate);
        WebSocketManager.on('opponentSetupComplete', handleOpponentSetupComplete);
        WebSocketManager.on('bothPlayersReady', handleBothPlayersReady);
        WebSocketManager.on('move', handleMove);
        WebSocketManager.on('gameEnd', handleGameEnd);
      }

      return () => {
        if (screen !== 'room' && screen !== 'onlineGame') {
          WebSocketManager.disconnect();
        }
      };
    }
  }, [screen, roomId]);

  // ============================================
  // GAME HANDLERS
  // ============================================
  const resetGame = useCallback(() => {
    setScreen('home');
    setBoard(GameLogic.initBoard());
    setPhase('setup');
    setMode(null);
    setMultiplayerMode(null);
    setMsg('Choose Mode');
    setInventory({});
    setSel(null);
    setMoves([]);
    setShowPicker(null);
    setShowTurnLock(false);
    setDefeated({ 1: [], 2: [] });
    setBattleResult(null);
    setLastMove(null);
    setShowingBattleForPlayer(null);
    setShowBattleReport(false);
    setRoomId('');
    setPlayerId(null);
    setPlayers([null, null]);
    setIsRoomReady(false);
    setMyReadyState(false);
    setOpponentReadyState(false);
    setShowVictory(false);
    setVictoryData(null);
    WebSocketManager.disconnect();
  }, []);

  const startSetup = (m, mp = null) => {
    setMode(m);
    setMultiplayerMode(mp);
    setBoard(GameLogic.initBoard());
    const inv = {};
    RANKS.forEach(({ r, count }) => { inv[r] = count; });
    setInventory(inv);
    setSetupPlayer(1);
    setPhase('setup');
    setMsg('Deploy Your Forces');
    setScreen('game');
  };

  const finishSetup = () => {
    const totalPieces = Object.values(inventory).reduce((sum, count) => sum + count, 0);
    if (totalPieces > 0) {
      setMsg('Deploy All Units!');
      return;
    }

    if (mode === 'ai') {
      const nb = GameLogic.autoSetup(board, 2);
      setBoard(nb);
      setPhase('playing');
      setTurn(1);
      setMsg('Engage the Enemy');
    } else if (multiplayerMode === 'online') {
      WebSocketManager.send({
        type: 'setupComplete',
        roomId,
        playerId,
        board
      });
      setMsg('Waiting for opponent...');
    } else if (multiplayerMode === 'local') {
      if (setupPlayer === 1) {
        setShowTurnLock(true);
        setPausePhase(true);
      } else {
        setPhase('playing');
        setTurn(1);
        setShowTurnLock(true);
        setPausePhase(true);
      }
    }
  };

  const confirmTurn = () => {
    if (showBattleReport) {
      setShowBattleReport(false);
      
      if (multiplayerMode === 'local') {
        if (showingBattleForPlayer && turn === showingBattleForPlayer && showingBattleForPlayer === battleResult.player) {
          const nextTurn = turn === 1 ? 2 : 1;
          setTurn(nextTurn);
          setShowingBattleForPlayer(nextTurn);
          setShowTurnLock(true);
        } else if (showingBattleForPlayer && turn === showingBattleForPlayer && showingBattleForPlayer !== battleResult.player) {
          setShowingBattleForPlayer(null);
          setBattleResult(null);
          setShowTurnLock(false);
        }
      } else {
        setShowingBattleForPlayer(null);
        setBattleResult(null);
        setShowTurnLock(false);
      }
      return;
    }
    
    if (pausePhase && setupPlayer === 1 && mode === '2player' && multiplayerMode === 'local') {
      setSetupPlayer(2);
      const inv = {};
      RANKS.forEach(({ r, count }) => { inv[r] = count; });
      setInventory(inv);
      setMsg('Deploy Your Forces');
      setShowTurnLock(false);
      setPausePhase(false);
    } else if (pausePhase && phase === 'setup') {
      setPhase('playing');
      setTurn(1);
      setMsg('Imperium Commander 1');
      setShowTurnLock(false);
      setPausePhase(false);
    } else if (battleResult && showingBattleForPlayer !== null) {
      setShowTurnLock(false);
      setShowBattleReport(true);
    } else {
      setShowTurnLock(false);
    }
  };

  const placeOnBoard = (r, c, rank) => {
    if (board[r][c]) return;
    const nb = board.map(row => [...row]);
    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    nb[r][c] = { r: rank, p: currentPlayer, id: currentPlayer * 100 + Math.random() };
    setBoard(nb);
    setInventory({ ...inventory, [rank]: inventory[rank] - 1 });
    setShowPicker(null);
    
    if (multiplayerMode === 'online') {
      const piecesPlaced = nb.flat().filter(cell => cell?.p === playerId).length;
      WebSocketManager.send({
        type: 'deploymentUpdate',
        roomId,
        playerId,
        piecesPlaced,
        board: nb
      });
    }
  };

  const removeFromBoard = (r, c) => {
    const piece = board[r][c];
    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    if (!piece || piece.p !== currentPlayer) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = null;
    setBoard(nb);
    setInventory({ ...inventory, [piece.r]: inventory[piece.r] + 1 });
    
    if (multiplayerMode === 'online') {
      const piecesPlaced = nb.flat().filter(cell => cell?.p === playerId).length;
      WebSocketManager.send({
        type: 'deploymentUpdate',
        roomId,
        playerId,
        piecesPlaced,
        board: nb
      });
    }
  };

  const handleSetupClick = (r, c) => {
    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    const allowedRows = currentPlayer === 1 ? [7, 6, 5] : [0, 1, 2];
    if (!allowedRows.includes(r)) return;
    
    if (board[r][c]) {
      removeFromBoard(r, c);
    } else {
      setShowPicker([r, c]);
    }
  };

  const handlePlayClick = (r, c) => {
    const modeHandler = mode === 'ai' ? GameModes.ai : (multiplayerMode === 'online' ? GameModes.online : GameModes.local);
    
    if (!modeHandler.canMove(turn, playerId)) return;
    
    if (!sel) {
      if (board[r][c]?.p === turn) {
        setSel([r, c]);
        setMoves(GameLogic.validMoves(board, r, c));
      }
    } else {
      const [sr, sc] = sel;
      const validMove = moves.some(([mr, mc]) => mr === r && mc === c);
      
      if (validMove) {
        setLastMove(null);
        
        const nb = board.map(row => [...row]);
        const attacker = nb[sr][sc];
        const defender = nb[r][c];
        const newDefeated = { ...defeated };
        let newBattleResult = null;
        
        if (defender) {
          const res = GameLogic.battle(attacker, defender);
          
          if (res === 'win') {
            nb[r][c] = attacker;
            nb[sr][sc] = null;
            newDefeated[defender.p] = [...newDefeated[defender.p], defender.r];
            newBattleResult = { attacker: attacker.r, defender: defender.r, result: 'win', player: turn };
            
            if (defender.r === 'FLAG') {
              setBoard(nb);
              setMoves([]);
              setSel(null);
              setDefeated(newDefeated);
              setPhase('ended');
              setVictoryData({ winner: turn, victoryType: 'flag_captured' });
              setShowVictory(true);
              console.log('Victory triggered - flag captured by player', turn);
              if (multiplayerMode === 'online') {
                WebSocketManager.send({
                  type: 'gameEnd',
                  roomId,
                  winner: turn,
                  victoryType: 'flag_captured',
                  message: `Victory - Commander ${turn}!`
                });
              }
              return;
            }
          } else if (res === 'lose') {
            nb[sr][sc] = null;
            newDefeated[attacker.p] = [...newDefeated[attacker.p], attacker.r];
            newBattleResult = { attacker: attacker.r, defender: defender.r, result: 'lose', player: turn };
            
            if (attacker.r === 'FLAG') {
              const winner = turn === 1 ? 2 : 1;
              setBoard(nb);
              setMoves([]);
              setSel(null);
              setDefeated(newDefeated);
              setPhase('ended');
              setVictoryData({ winner, victoryType: 'flag_captured' });
              setShowVictory(true);
              console.log('Victory triggered - flag captured by player', winner);
              if (multiplayerMode === 'online') {
                WebSocketManager.send({
                  type: 'gameEnd',
                  roomId,
                  winner,
                  victoryType: 'flag_captured',
                  message: `Victory - Commander ${winner}!`
                });
              }
              return;
            }
          } else {
            nb[r][c] = null;
            nb[sr][sc] = null;
            newDefeated[attacker.p] = [...newDefeated[attacker.p], attacker.r];
            newDefeated[defender.p] = [...newDefeated[defender.p], defender.r];
            newBattleResult = { attacker: attacker.r, defender: defender.r, result: 'draw', player: turn };
          }
          setDefeated(newDefeated);
          setBattleResult(newBattleResult);
        } else {
          nb[r][c] = attacker;
          nb[sr][sc] = null;
        }
        
        setBoard(nb);
        setSel(null);
        setMoves([]);
        
        // Check for flag reaching enemy territory victory
        if (attacker.r === 'FLAG') {
          const flagVictory = GameLogic.checkFlagVictory(nb, turn);
          console.log('Checking flag victory for player', turn, ':', flagVictory);
          if (flagVictory) {
            setPhase('ended');
            setVictoryData({ winner: turn, victoryType: 'flag_reached' });
            setShowVictory(true);
            console.log('Victory triggered - flag reached territory by player', turn);
            if (multiplayerMode === 'online') {
              WebSocketManager.send({
                type: 'gameEnd',
                roomId,
                winner: turn,
                victoryType: 'flag_reached',
                message: `Victory - Commander ${turn}!`
              });
            }
            return;
          }
        }
        
        const moveData = { from: [sr, sc], to: [r, c], turn };
        setLastMove(moveData);
        
        const gameState = {
          board: nb,
          turn,
          defeated: newDefeated,
          lastMove: moveData,
          battleResult: newBattleResult
        };
        
        const setters = {
          setBoard,
          setTurn,
          setMsg,
          setDefeated,
          setLastMove,
          setSel,
          setMoves,
          setShowTurnLock,
          setShowingBattleForPlayer,
          setShowBattleReport,
          setPhase,
          setVictoryData,
          setShowVictory
        };
        
        modeHandler.afterMove(gameState, setters, defender !== null, WebSocketManager, roomId);
      } else {
        setSel(null);
        setMoves([]);
      }
    }
  };

  const handleCellClick = (r, c) => {
    if (phase === 'setup') {
      handleSetupClick(r, c);
    } else if (phase === 'playing') {
      handlePlayClick(r, c);
    }
  };

  const handleAutoSetup = () => {
    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    const freshBoard = board.map(row => [...row]);
    const nb = GameLogic.autoSetup(freshBoard, currentPlayer);
    setBoard(nb);
    const inv = {};
    RANKS.forEach(({ r }) => { inv[r] = 0; });
    setInventory(inv);
    
    if (multiplayerMode === 'online') {
      WebSocketManager.send({
        type: 'deploymentUpdate',
        roomId,
        playerId,
        piecesPlaced: 21,
        board: nb
      });
    }
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setConnectionStatus('connecting');
    setPlayers([null, null]);
    setIsRoomReady(false);
    setMyReadyState(false);
    setOpponentReadyState(false);
    setScreen('room');
  };

  const joinRoom = (id) => {
    setRoomId(id);
    setConnectionStatus('connecting');
    setPlayers([null, null]);
    setIsRoomReady(false);
    setMyReadyState(false);
    setOpponentReadyState(false);
    setScreen('room');
  };

  const toggleReady = () => {
    const newReadyState = !myReadyState;
    const currentPlayerId = playerIdRef.current || playerId;
    
    if (!currentPlayerId) return;
    
    setMyReadyState(newReadyState);
    
    WebSocketManager.send({
      type: 'toggleReady',
      roomId,
      playerId: currentPlayerId,
      isReady: newReadyState
    });
  };

  const startOnlineGame = () => {
    if (!isRoomReady) return;
    WebSocketManager.send({
      type: 'startGame',
      roomId
    });
  };

  // Debug effect to log victory state changes
  useEffect(() => {
    console.log('Victory state changed:', { showVictory, victoryData, phase });
  }, [showVictory, victoryData, phase]);

  // ============================================
  // RENDER
  // ============================================
  if (screen === 'home') {
    return <HomeScreen 
      onModeSelect={(m, mp) => m === 'multiplayer' ? setScreen('multiplayer') : startSetup(m, mp)} 
      devMode={devMode} 
      setDevMode={setDevMode} 
    />;
  }

  if (screen === 'multiplayer') {
    return <MultiplayerLobby 
      onBack={() => setScreen('home')} 
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      roomId={roomId}
      setRoomId={setRoomId}
      availableRooms={availableRooms}
    />;
  }

  if (screen === 'room') {
    return <RoomWaiting 
      roomId={roomId}
      onLeave={() => { 
        setScreen('multiplayer'); 
        setRoomId(''); 
        setPlayerId(null);
        setPlayers([null, null]);
        setConnectionStatus('disconnected'); 
        setMyReadyState(false); 
        setOpponentReadyState(false); 
        setIsRoomReady(false);
        WebSocketManager.disconnect(); 
      }}
      onStart={startOnlineGame}
      onToggleReady={toggleReady}
      players={players}
      isReady={isRoomReady}
      myReady={myReadyState}
      opponentReady={opponentReadyState}
      playerId={playerId}
      connectionStatus={connectionStatus}
    />;
  }

  if (screen === 'onlineGame' || screen === 'game') {
    return (
      <div className="h-screen w-screen flex flex-col lg:flex-row bg-black overflow-hidden">
        <div className="order-1 flex-1 flex items-center justify-center p-1 md:p-2 bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 min-h-0">
          <div className="w-full h-full max-w-[min(98vw,calc(98vh*1.125))] max-h-[min(98vw/1.125,98vh)] flex flex-col rounded-lg shadow-[0_0_40px_rgba(212,175,55,0.3)] overflow-hidden border-4 border-yellow-700">
            <GameBoard 
              board={board}
              phase={phase}
              mode={mode}
              multiplayerMode={multiplayerMode}
              turn={turn}
              setupPlayer={multiplayerMode === 'online' ? playerId : setupPlayer}
              sel={sel}
              moves={moves}
              lastMove={lastMove}
              devMode={devMode}
              playerId={playerId}
              opponentLastSelected={opponentLastSelected}
              onCellClick={handleCellClick}
              GameModes={GameModes}
              RANKS={RANKS}
            />
          </div>
        </div>

        <Sidebar 
          phase={phase}
          mode={mode}
          multiplayerMode={multiplayerMode}
          msg={msg}
          roomId={roomId}
          inventory={inventory}
          defeated={defeated}
          setupPlayer={multiplayerMode === 'online' ? playerId : setupPlayer}
          turn={turn}
          board={board}
          devMode={devMode}
          lastMove={lastMove}
          opponentPiecesPlaced={opponentPiecesPlaced}
          onFinishSetup={finishSetup}
          onAutoSetup={handleAutoSetup}
          onReset={resetGame}
        />

        {showVictory && victoryData && (
          <VictoryModal 
            winner={victoryData.winner}
            victoryType={victoryData.victoryType}
            onBackToHome={resetGame}
          />
        )}

        {showPicker && (
          <UnitPicker 
            inventory={inventory}
            setupPlayer={multiplayerMode === 'online' ? playerId : setupPlayer}
            onSelect={(rank) => placeOnBoard(showPicker[0], showPicker[1], rank)}
            onCancel={() => setShowPicker(null)}
            RANKS={RANKS}
          />
        )}

        {showBattleReport && battleResult && (
          <BattleReportModal 
            battleResult={battleResult}
            showingBattleForPlayer={showingBattleForPlayer}
            onContinue={confirmTurn}
            RANKS={RANKS}
          />
        )}

        {showTurnLock && (
          <TurnLockModal 
            pausePhase={pausePhase}
            setupPlayer={setupPlayer}
            mode={mode}
            multiplayerMode={multiplayerMode}
            turn={turn}
            battleResult={battleResult}
            onConfirm={confirmTurn}
          />
        )}
      </div>
    );
  }

  return null;
}