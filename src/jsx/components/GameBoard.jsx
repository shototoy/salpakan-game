// ============================================
// jsx/components/GameBoard.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function GameBoard({ 
  board, phase, mode, multiplayerMode, turn, setupPlayer, sel, moves, lastMove, 
  devMode, playerId, opponentLastSelected, flaggedPiece, useSVG,
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
            isSelected ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-[inset_0_0_15px_rgba(217,119,6,0.6),0_0_10px_rgba(217,119,6,0.4)]' :
            isFlagged ? 'bg-gradient-to-br from-violet-700 to-violet-800 shadow-[inset_0_0_15px_rgba(109,40,217,0.6),0_0_10px_rgba(109,40,217,0.4)]' :
            isOpponentSelected ? 'bg-gradient-to-br from-orange-600 to-orange-700 shadow-[inset_0_0_15px_rgba(234,88,12,0.6),0_0_10px_rgba(234,88,12,0.4)]' :
            isValidMove ? 'bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 shadow-[inset_0_0_10px_rgba(4,120,87,0.5)]' :
            (isLastMoveFrom || isLastMoveTo) ? 'bg-gradient-to-br from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 shadow-[inset_0_0_15px_rgba(153,27,27,0.6),0_0_10px_rgba(220,38,38,0.4)]' :
            ((actualR + actualC) % 2 === 0) 
              ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 shadow-[inset_0_1px_0_rgba(161,161,170,0.1)]' 
              : 'bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 shadow-[inset_0_1px_0_rgba(0,0,0,0.3)]'
          } border-[0.5px] border-zinc-950/50`}
          style={{ flex: 1, aspectRatio: '1/1' }}
        >
          {cell ? (canSee ? (
            <div className="w-full h-full p-[2px] md:p-1" key={`${actualR}-${actualC}-${useSVG}`}>
              <PieceIcon rank={cell.r} player={cell.p} useSVG={useSVG} RANKS={RANKS} />
            </div>
          ) : (
            <div className="w-full h-full p-[2px] md:p-1" key={`${actualR}-${actualC}-hidden-${useSVG}`}>
              <PieceIcon rank={null} player={cell.p} useSVG={useSVG} RANKS={RANKS} isHidden={true} />
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