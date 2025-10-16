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
      const { board, defeated, flagWasChallenged, battleResult } = gameState;
      const { setBoard, setTurn, setMsg, setDefeated, setLastMove, setPhase, setVictoryData, setShowVictory } = setters;
      
      if (flagWasChallenged && battleResult?.result === 'win') {
        setMsg('Bonus Turn! Flag defended!');
        return;
      }
      
      setTurn(2);
      setMsg('AI Calculating...');
      
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
          setMsg('Your Turn');
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
              setBoard(nb2); 
              setDefeated(newDefeated2); 
              setPhase('ended');
              setVictoryData({ winner: 2, victoryType: 'flag_captured' });
              setShowVictory(true);
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
        
        if (aiA.r === 'FLAG') {
          const flagVictory = GameLogic.checkFlagVictory(nb2, 2);
          if (flagVictory) {
            setBoard(nb2);
            setDefeated(newDefeated2);
            setPhase('ended');
            setVictoryData({ winner: 2, victoryType: 'flag_reached' });
            setShowVictory(true);
            return;
          }
        }
        
        setBoard(nb2);
        setDefeated(newDefeated2);
        setLastMove({ from: [ar, ac], to: [tr, tc], turn: 2 });
        setTurn(1);
        setMsg('Your Turn');
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
      const { turn, flagWasChallenged, battleResult } = gameState;
      const { setTurn, setShowTurnLock, setShowingBattleForPlayer, setShowBattleReport, setMsg } = setters;
      
      if (hasDefender) {
        if (flagWasChallenged && battleResult?.result === 'win') {
          setShowBattleReport(true);
          setShowingBattleForPlayer(turn);
          setMsg(`Commander ${turn} - Bonus Turn!`);
        } else {
          setShowBattleReport(true);
          setShowingBattleForPlayer(turn);
        }
      } else {
        const nextTurn = turn === 1 ? 2 : 1;
        setTurn(nextTurn);
        setMsg(`Commander ${nextTurn}'s Turn`);
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
      const { board, turn, defeated, lastMove, battleResult, flagWasChallenged } = gameState;
      const { setTurn, setMsg } = setters;
      
      const nextTurn = (flagWasChallenged && battleResult?.result === 'win') ? turn : (turn === 1 ? 2 : 1);
      
      WebSocketManager.send({
        type: 'move',
        roomId,
        playerId: turn,
        board,
        turn: nextTurn,
        lastMove,
        battleResult: hasDefender ? battleResult : null,
        defeated,
        bonusTurn: flagWasChallenged && battleResult?.result === 'win'
      });
      
      setTurn(nextTurn);
      
      if (flagWasChallenged && battleResult?.result === 'win' && nextTurn === turn) {
        setMsg('Bonus Turn! Flag defended!');
      } else {
        setMsg(nextTurn === turn ? 'Your Turn' : 'Opponent Turn');
      }
    }
  }
};

export default GameModes;