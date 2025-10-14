// ============================================
// jsx/components/PieceIcon.jsx
// ============================================

import React, { useState } from 'react';
import { TILESET_CONFIG } from '../../constants/config';

export default function PieceIcon({ rank, player, RANKS, isHidden }) {
  const [hasError, setHasError] = useState(false);
  
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
        href={TILESET_CONFIG.url}
        width={TILESET_CONFIG.totalWidth}
        height={TILESET_CONFIG.totalHeight}
        style={{ imageRendering: 'crisp-edges' }}
        onError={(e) => {
          console.error('Image load error', e);
          setHasError(true);
        }}
      />
    </svg>
  );
}
