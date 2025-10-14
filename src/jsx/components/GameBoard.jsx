// ============================================
// jsx/components/GameBoard.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function GameBoard({ 
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