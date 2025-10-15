// ============================================
// src/GameController.jsx
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameLogic, RANKS } from '../js/gameLogic';
import GameModes from '../js/gameModes';
import WebSocketManager from '../js/WebSocketManager';
import { 
  HomeScreen,
  MultiplayerLobby,
  RoomWaiting,
  GameBoard,
  Sidebar,
  VictoryModal,
  UnitPicker,
  BattleReportModal,
  TurnLockModal
} from './components';

export default function GameController() {
  const playerIdRef = useRef(null);
  const longPressTimer = useRef(null);
  const [screen, setScreen] = useState('home');
  const [board, setBoard] = useState(GameLogic.initBoard());
  const [phase, setPhase] = useState('setup');
  const [mode, setMode] = useState(null);
  const [turn, setTurn] = useState(1);
  const [sel, setSel] = useState(null);
  const [moves, setMoves] = useState([]);
  const [msg, setMsg] = useState('Choose Mode');
  const [devMode, setDevMode] = useState(false);
  const [useSVG, setUseSVG] = useState(true);
  const [omniscience, setOmniscience] = useState(false);
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
  const [flaggedPiece, setFlaggedPiece] = useState(null);
  const [selectedServerUrl, setSelectedServerUrl] = useState(null);

  useEffect(() => {
    if (screen === 'multiplayer') {
      const fetchRooms = async () => {
        const rooms = await WebSocketManager.getRoomsFromAllServers();
        setAvailableRooms(rooms.filter(room => !room.isFull));
      };

      fetchRooms();
      const interval = setInterval(fetchRooms, 3000);

      return () => clearInterval(interval);
    } else if (screen !== 'room' && screen !== 'onlineGame') {
      setAvailableRooms([]);
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
        setMsg(data.message);
        setPhase('ended');
        setVictoryData({ 
          winner: data.winner, 
          victoryType: data.victoryType || 'flag_captured' 
        });
        setShowVictory(true);
      };

      WebSocketManager.on('roomJoined', handleRoomJoined);
      WebSocketManager.on('playerJoined', handlePlayerJoined);
      WebSocketManager.on('playerReady', handlePlayerReady);
      WebSocketManager.on('gameStart', handleGameStart);
      WebSocketManager.on('opponentDeploymentUpdate', handleOpponentDeploymentUpdate);
      WebSocketManager.on('opponentSetupComplete', handleOpponentSetupComplete);
      WebSocketManager.on('bothPlayersReady', handleBothPlayersReady);
      WebSocketManager.on('move', handleMove);
      WebSocketManager.on('gameEnd', handleGameEnd);

      if (screen === 'room') {
        const needsConnection = !WebSocketManager.ws || 
                               WebSocketManager.ws.readyState !== WebSocket.OPEN ||
                               WebSocketManager.currentRoomId !== roomId;
        
        if (needsConnection) {
          WebSocketManager.connect(roomId, null, selectedServerUrl);
        }
      }

      return () => {
        if (screen !== 'room' && screen !== 'onlineGame') {
          WebSocketManager.off('roomJoined');
          WebSocketManager.off('playerJoined');
          WebSocketManager.off('playerReady');
          WebSocketManager.off('gameStart');
          WebSocketManager.off('opponentDeploymentUpdate');
          WebSocketManager.off('opponentSetupComplete');
          WebSocketManager.off('bothPlayersReady');
          WebSocketManager.off('move');
          WebSocketManager.off('gameEnd');
          WebSocketManager.disconnect();
        }
      };
    }
  }, [screen, roomId, selectedServerUrl]);

  const handleCellPress = (r, c) => {
    if (phase !== 'playing') return;
    const cell = board[r][c];
    if (!cell || cell.p === turn) return;
    
    longPressTimer.current = setTimeout(() => {
      setFlaggedPiece([r, c]);
    }, 500);
  };

  const handleCellRelease = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

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

    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    const piecesOnBoard = board.flat().filter(cell => cell && cell.p === currentPlayer).length;
    if (piecesOnBoard !== 21) {
      setMsg('Deploy All 21 Units!');
      return;
    }

    if (mode === 'ai') {
      const clearedBoard = board.map((row, r) => 
        row.map((cell, c) => {
          if (cell && cell.p === 2) {
            return null;
          }
          return cell;
        })
      );
      const nb = GameLogic.autoSetup(clearedBoard, 2);
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
              setBoard(nb);
              setMoves([]);
              setSel(null);
              setDefeated(newDefeated);
              setPhase('ended');
              const loser = turn;
              const winner = turn === 1 ? 2 : 1;
              setVictoryData({ winner, victoryType: 'flag_defeated' });
              setShowVictory(true);
              if (multiplayerMode === 'online') {
                WebSocketManager.send({
                  type: 'gameEnd',
                  roomId,
                  winner,
                  victoryType: 'flag_defeated',
                  message: `Victory - Commander ${winner}! Enemy flag destroyed.`
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
            
            if (attacker.r === 'FLAG' || defender.r === 'FLAG') {
              setBoard(nb);
              setMoves([]);
              setSel(null);
              setDefeated(newDefeated);
              setPhase('ended');
              const loser = turn;
              const winner = turn === 1 ? 2 : 1;
              setVictoryData({ winner, victoryType: 'flag_defeated' });
              setShowVictory(true);
              if (multiplayerMode === 'online') {
                WebSocketManager.send({
                  type: 'gameEnd',
                  roomId,
                  winner,
                  victoryType: 'flag_defeated',
                  message: `Victory - Commander ${winner}! Enemy flag destroyed.`
                });
              }
              return;
            }
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
    handleCellRelease();
    if (phase === 'setup') {
      handleSetupClick(r, c);
    } else if (phase === 'playing') {
      handlePlayClick(r, c);
    }
  };

  const handleAutoSetup = () => {
    const currentPlayer = multiplayerMode === 'online' ? playerId : setupPlayer;
    
    const clearedBoard = board.map((row, r) => 
      row.map((cell, c) => {
        if (cell && cell.p === currentPlayer) {
          return null;
        }
        return cell;
      })
    );
    
    const nb = GameLogic.autoSetup(clearedBoard, currentPlayer);
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

  const createRoom = (serverUrl = null, roomType = '2player') => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setSelectedServerUrl(serverUrl);
    setConnectionStatus('connecting');
    setPlayers([null, null]);
    setIsRoomReady(false);
    setMyReadyState(false);
    setOpponentReadyState(false);
    WebSocketManager.createRoom(roomType, serverUrl);
    setScreen('room');
  };

  const joinRoom = (id, serverUrl = null) => {
    setRoomId(id);
    setSelectedServerUrl(serverUrl);
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
      WebSocketManager={WebSocketManager}
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
          <div className="w-full h-full max-w-[min(98vw,calc(98vh*1.125))] max-h-[min(98vw/1.125,98vh)] flex flex-col rounded-lg shadow-[0_0_40px_rgba(212,175,55,0.3)] overflow-hidden border-4 border-zinc-800">
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
              devMode={omniscience || devMode}
              playerId={playerId}
              opponentLastSelected={opponentLastSelected}
              flaggedPiece={flaggedPiece}
              useSVG={useSVG}
              onCellClick={handleCellClick}
              onCellPress={handleCellPress}
              onCellRelease={handleCellRelease}
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
          useSVG={useSVG}
          setUseSVG={setUseSVG}
          omniscience={omniscience}
          setOmniscience={setOmniscience}
          onFinishSetup={finishSetup}
          onAutoSetup={handleAutoSetup}
          onReset={resetGame}
          RANKS={RANKS}
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
            useSVG={useSVG}
            RANKS={RANKS}
          />
        )}

        {showBattleReport && battleResult && (
          <BattleReportModal 
            battleResult={battleResult}
            showingBattleForPlayer={showingBattleForPlayer}
            onContinue={confirmTurn}
            useSVG={useSVG}
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