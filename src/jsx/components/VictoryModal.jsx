import React from 'react';

export default function VictoryModal({ winner, victoryType, onBackToHome, playerId }) {
  const isVictor = playerId && winner === playerId;
  const isDefeated = playerId && winner && winner !== playerId;

  const getVictoryMessage = () => {
    if (isVictor) {
      switch (victoryType) {
        case 'flag_captured':
          return 'You Captured the Enemy Flag!';
        case 'flag_defeated':
          return 'You Destroyed the Enemy Flag!';
        case 'flag_reached_end':
          return 'Your Flag Crossed Enemy Lines Unchallenged!';
        case 'flag_challenged':
          return 'You Destroyed the Enemy Flag at Their Base!';
        default:
          return 'You are Victorious!';
      }
    } else if (isDefeated) {
      switch (victoryType) {
        case 'flag_captured':
          return 'Your Flag Was Captured!';
        case 'flag_defeated':
          return 'Your Flag Was Destroyed!';
        case 'flag_reached_end':
          return 'Enemy Flag Crossed Your Lines Unchallenged!';
        case 'flag_challenged':
          return 'Your Flag Was Destroyed at Enemy Base!';
        default:
          return 'Defeat';
      }
    } else {
      switch (victoryType) {
        case 'flag_captured':
          return `Commander ${winner} Captured the Enemy Flag!`;
        case 'flag_defeated':
          return `Commander ${winner} Destroyed the Enemy Flag!`;
        case 'flag_reached_end':
          return `Commander ${winner}'s Flag Crossed Enemy Lines!`;
        case 'flag_challenged':
          return `Commander ${winner} Destroyed Flag at Enemy Base!`;
        default:
          return 'Victory Achieved!';
      }
    }
  };

  const getVictoryEmoji = () => {
    if (!winner) return '⚔️';
    if (isDefeated) {
      if (victoryType === 'flag_defeated' || victoryType === 'flag_challenged') return '💀';
      return '☠️';
    }
    
    switch (victoryType) {
      case 'flag_captured':
        return '🏴';
      case 'flag_defeated':
        return '💥';
      case 'flag_reached_end':
        return '🎯';
      case 'flag_challenged':
        return '⚡';
      default:
        return '👑';
    }
  };

  const getHeaderText = () => {
    if (isVictor) return 'VICTORY!';
    if (isDefeated) return 'DEFEAT!';
    return winner ? `COMMANDER ${winner} WINS!` : 'BATTLE ENDED';
  };

  const getGradientColors = () => {
    if (isVictor) return 'from-emerald-950/20 via-transparent to-black/30';
    if (isDefeated) return 'from-red-950/30 via-transparent to-black/40';
    return 'from-red-950/10 via-transparent to-black/30';
  };

  const getSubtitle = () => {
    if (isVictor) {
      switch (victoryType) {
        case 'flag_reached_end':
          return 'Flawless Infiltration';
        case 'flag_challenged':
          return 'Tactical Superiority';
        case 'flag_captured':
          return 'Objective Secured';
        case 'flag_defeated':
          return 'Enemy Eliminated';
        default:
          return 'Mission Complete';
      }
    } else if (isDefeated) {
      switch (victoryType) {
        case 'flag_reached_end':
          return 'Defense Breached';
        case 'flag_challenged':
          return 'Last Stand Failed';
        case 'flag_captured':
          return 'Position Lost';
        case 'flag_defeated':
          return 'Total Defeat';
        default:
          return 'Mission Failed';
      }
    }
    return 'Battle Complete';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 rounded-sm shadow-2xl max-w-md w-full border-4 border-zinc-800 text-center animate-scaleIn">
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColors()} pointer-events-none rounded-sm`}></div>
        
        <div className="relative text-6xl mb-4 animate-bounce">
          <span style={{ 
            filter: isVictor 
              ? 'drop-shadow(0 0 20px rgba(16,185,129,0.8)) drop-shadow(0 0 40px rgba(16,185,129,0.6))'
              : isDefeated
              ? 'drop-shadow(0 0 20px rgba(127,29,29,0.8)) drop-shadow(0 0 40px rgba(127,29,29,0.6))'
              : 'drop-shadow(0 0 20px rgba(220,38,38,0.8)) drop-shadow(0 0 40px rgba(220,38,38,0.6))'
          }}>
            {getVictoryEmoji()}
          </span>
        </div>

        <h2 className="relative text-4xl font-black text-zinc-100 mb-2 uppercase tracking-widest" style={{ 
          fontFamily: 'Impact, "Arial Black", sans-serif', 
          textShadow: isVictor
            ? '3px 3px 0px rgba(0,0,0,1), 0 0 30px rgba(16,185,129,0.6), 0 0 5px rgba(161,161,170,1)'
            : isDefeated
            ? '3px 3px 0px rgba(0,0,0,1), 0 0 30px rgba(127,29,29,0.6), 0 0 5px rgba(161,161,170,1)'
            : '3px 3px 0px rgba(0,0,0,1), 0 0 30px rgba(220,38,38,0.6), 0 0 5px rgba(161,161,170,1)'
        }}>
          {getHeaderText()}
        </h2>

        <p className="relative text-sm text-zinc-400 mb-6 uppercase tracking-widest" style={{ 
          fontFamily: 'Impact, "Arial Black", sans-serif',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          {getSubtitle()}
        </p>

        <div className="relative mb-6 p-4 bg-black rounded-sm border-2 border-zinc-800 shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]">
          <p className="text-lg text-zinc-300 font-bold uppercase tracking-wider" style={{ 
            fontFamily: 'Impact, "Arial Black", sans-serif' 
          }}>
            {getVictoryMessage()}
          </p>
        </div>

        <button 
          onClick={onBackToHome}
          className="relative w-full px-8 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-xl font-black rounded-sm border-2 border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] uppercase tracking-wider transition-all transform hover:scale-105" 
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
          RETURN TO COMMAND CENTER
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}