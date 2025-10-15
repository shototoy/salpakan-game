// ============================================
// jsx/components/UnitPicker.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function UnitPicker({ inventory, setupPlayer, onSelect, onCancel, RANKS }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 rounded-sm shadow-2xl max-w-lg w-full border-4 border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <h2 className="relative text-2xl font-black text-zinc-100 mb-4 text-center tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 20px rgba(220,38,38,0.5), 0 0 3px rgba(161,161,170,0.8)' }}>
          SELECT UNIT
        </h2>
        
        <div className="relative grid grid-cols-5 gap-2">
          {RANKS.map(({ r }) => (
            inventory[r] > 0 && (
              <button key={r} onClick={() => onSelect(r)}
                className="px-2 py-3 rounded-sm border-2 bg-gradient-to-br from-zinc-700 to-zinc-800 border-zinc-600 hover:from-emerald-700 hover:to-emerald-800 hover:border-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.6)] transition-all">
                <div className="w-full h-12"><PieceIcon rank={r} player={setupPlayer} RANKS={RANKS} /></div>
                <div className="text-xs mt-1 bg-black bg-opacity-75 rounded-sm px-1 text-zinc-200 font-bold font-mono">×{inventory[r]}</div>
              </button>
            )
          ))}
        </div>
        
        <button onClick={onCancel} 
          className="relative mt-4 w-full px-4 py-2 bg-gradient-to-b from-red-900 to-red-950 hover:from-red-800 hover:to-red-900 text-zinc-100 hover:text-white font-bold rounded-sm border-2 border-red-800 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.6)] uppercase tracking-wider transition-all" 
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}