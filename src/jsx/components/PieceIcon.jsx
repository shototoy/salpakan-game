// ============================================
// jsx/components/PieceIcon.jsx
// ============================================

import React, { useState, useEffect } from 'react';

export default function PieceIcon({ rank, player, RANKS, isHidden, useSVG = true }) {
  const [imageError, setImageError] = useState(false);
  const [tilesetConfig, setTilesetConfig] = useState(null);
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await import('../../constants/config');
        setTilesetConfig(config.TILESET_CONFIG);
      } catch (e) {
        setImageError(true);
      }
    };
    loadConfig();
  }, []);
  
  const rankData = isHidden ? { tileX: 0, tileY: 3 } : RANKS?.find(r => r.r === rank);
  
  const shouldUseSVG = useSVG && tilesetConfig && !imageError && rankData;

  if (!shouldUseSVG) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-xs md:text-sm font-black ${
        player === 2 
          ? 'text-blue-300 bg-gradient-to-br from-blue-900 to-blue-950 border-blue-700' 
          : 'text-red-300 bg-gradient-to-br from-red-900 to-red-950 border-red-700'
      } rounded-sm border-2 uppercase tracking-wider shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`} 
      style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
        {isHidden ? '?' : rank}
      </div>
    );
  }

  const { tileX, tileY } = rankData;
  const padding = 30;
  const extractX = tileX * 240 + padding;
  const extractY = tileY * 200 + padding;
  const extractWidth = 240 - (padding * 2);
  const extractHeight = 200 - (padding * 2);

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
        href={tilesetConfig.url}
        width={tilesetConfig.totalWidth}
        height={tilesetConfig.totalHeight}
        style={{ imageRendering: 'crisp-edges' }}
        onError={() => {
          setImageError(true);
        }}
      />
    </svg>
  );
}