// ============================================
// jsx/components/UnitPicker.jsx
// ============================================

import React from 'react';
import PieceIcon from './PieceIcon.jsx';

export default function UnitPicker({ inventory, setupPlayer, onSelect, onCancel, RANKS }) {
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
