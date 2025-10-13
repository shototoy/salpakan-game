// ============================================
// GAME MODE CONTROLLERS
// ============================================
import { GameLogic } from './gameLogic.js';

const GameModes = {
  ai: {
    canMove: (turn, playerId) => turn === 1,
    
    shouldShowPiece: (piece, turn, playerId, devMode) => {
      if (!piece || devMode) return true;
      return piece.p === 1;
    },
    
    getBoardPerspective: (phase, turn, setupPlayer, playerId) => 1,
    
    afterMove: (gameState, setters) => {
      const { board, defeated } = gameState;
      const { setBoard, setTurn, setMsg, setDefeated, setLastMove, setPhase } = setters;
      
      setTurn(2);
      setMsg('Enemy Calculating...');
      
      setTimeout(() => {
        const aiM = GameLogic.aiMove(board);
        if (!aiM) { 
          setMsg('Imperial Victory!'); 
          setTurn(1);
          return; 
        }
        
        const nb2 = board.map(row => [...row]);
        const [ar, ac] = aiM.from;
        const [tr, tc] = aiM.to;
        const aiA = nb2[ar][ac];
        
        if (!aiA) {
          setTurn(1);
          setMsg('Engage the Enemy');
          return;
        }
        
        const def = nb2[tr][tc];
        const newDefeated2 = { ...defeated };
        
        if (def) {
          const res = GameLogic.battle(aiA, def);
          if (res === 'win') {
            nb2[tr][tc] = aiA;
            nb2[ar][ac] = null;
            newDefeated2[def.p] = [...newDefeated2[def.p], def.r];
            if (def.r === 'FLAG') { 
              setMsg('Defeat - Enemy Prevails'); 
              setBoard(nb2); 
              setDefeated(newDefeated2); 
              setPhase('ended');
              return; 
            }
          } else if (res === 'lose') {
            nb2[ar][ac] = null;
            newDefeated2[aiA.p] = [...newDefeated2[aiA.p], aiA.r];
          } else {
            nb2[tr][tc] = null;
            nb2[ar][ac] = null;
            newDefeated2[aiA.p] = [...newDefeated2[aiA.p], aiA.r];
            newDefeated2[def.p] = [...newDefeated2[def.p], def.r];
          }
        } else {
          nb2[tr][tc] = aiA;
          nb2[ar][ac] = null;
        }
        
        setBoard(nb2);
        setDefeated(newDefeated2);
        setLastMove({ from: [ar, ac], to: [tr, tc], turn: 2 });
        setTurn(1);
        setMsg('Engage the Enemy');
      }, 300);
    }
  },
  
  local: {
    canMove: (turn, playerId) => true,
    
    shouldShowPiece: (piece, turn, playerId, devMode) => {
      if (!piece || devMode) return true;
      return piece.p === turn;
    },
    
    getBoardPerspective: (phase, turn, setupPlayer, playerId) => {
      return phase === 'setup' ? setupPlayer : turn;
    },
    
    afterMove: (gameState, setters, hasDefender) => {
      const { turn } = gameState;
      const { setTurn, setShowTurnLock, setShowingBattleForPlayer, setShowBattleReport } = setters;
      
      if (hasDefender) {
        setShowBattleReport(true);
        setShowingBattleForPlayer(turn);
      } else {
        const nextTurn = turn === 1 ? 2 : 1;
        setTurn(nextTurn);
        setShowTurnLock(true);
      }
    }
  },
  
  online: {
    canMove: (turn, playerId) => turn === playerId,
    
    shouldShowPiece: (piece, turn, playerId, devMode) => {
      if (!piece || devMode) return true;
      return piece.p === playerId;
    },
    
    getBoardPerspective: (phase, turn, setupPlayer, playerId) => playerId,
    
    afterMove: (gameState, setters, hasDefender, WebSocketManager, roomId) => {
      const { board, turn, defeated, lastMove, battleResult } = gameState;
      const { setTurn } = setters;
      
      WebSocketManager.send({
        type: 'move',
        roomId,
        playerId: turn,
        board,
        turn: turn === 1 ? 2 : 1,
        lastMove,
        battleResult: hasDefender ? battleResult : null,
        defeated
      });
      setTurn(turn === 1 ? 2 : 1);
    }
  }
};

export default GameModes;