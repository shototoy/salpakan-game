// ============================================
// jsx/components/VictoryModal.jsx
// ============================================

import React from 'react';

export default function VictoryModal({ winner, victoryType, onBackToHome }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700 text-center">
        <div className="text-6xl mb-4">
          {winner ? '👑' : '⚔'}
        </div>
        <h2 className="text-4xl font-serif font-black text-yellow-400 mb-4">
          {winner ? `COMMANDER ${winner} WINS!` : 'BATTLE ENDED'}
        </h2>
        <div className="mb-6 p-4 bg-black rounded border-2 border-yellow-800">
          <p className="text-lg text-yellow-600 font-serif">
            {victoryType === 'flag_captured' && 'Enemy Flag Captured!'}
            {victoryType === 'flag_reached' && 'Flag Reached Enemy Territory!'}
          </p>
        </div>
        <button 
          onClick={onBackToHome}
          className="w-full px-8 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-xl font-serif font-bold rounded border-2 border-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg">
          RETURN TO COMMAND CENTER
        </button>
      </div>
    </div>
  );
}