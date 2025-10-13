// ============================================
// CORE GAME LOGIC (Mode-Independent)
// ============================================

const POWER = {
  '5★': 15, '4★': 14, '3★': 13, '2★': 12, '1★': 11, 
  'COL': 10, 'LTC': 9, 'MAJ': 8, 'CPT': 7,
  '1LT': 6, '2LT': 5, 'SGT': 4, 'PVT': 2, 'SPY': 1, 'FLAG': 0
};

const RANKS = [
  { r: 'PVT', count: 5, tileX: 0, tileY: 0 },
  { r: 'SGT', count: 2, tileX: 1, tileY: 0 },
  { r: '2LT', count: 1, tileX: 2, tileY: 0 },
  { r: '1LT', count: 1, tileX: 3, tileY: 0 },
  { r: 'CPT', count: 1, tileX: 4, tileY: 0 },
  { r: 'MAJ', count: 1, tileX: 0, tileY: 1 },
  { r: 'LTC', count: 1, tileX: 1, tileY: 1 },
  { r: 'COL', count: 1, tileX: 2, tileY: 1 },
  { r: '1★', count: 1, tileX: 3, tileY: 1 },
  { r: '2★', count: 1, tileX: 4, tileY: 1 },
  { r: '3★', count: 1, tileX: 0, tileY: 2 },
  { r: '4★', count: 1, tileX: 1, tileY: 2 },
  { r: '5★', count: 1, tileX: 2, tileY: 2 },
  { r: 'SPY', count: 2, tileX: 3, tileY: 2 },
  { r: 'FLAG', count: 1, tileX: 4, tileY: 2 }
];

const GameLogic = {
  createPieces: (p) => {
    const pieces = [];
    let id = 0;
    RANKS.forEach(({ r, count }) => {
      for (let i = 0; i < count; i++) {
        pieces.push({ r, p, id: p * 100 + id++ });
      }
    });
    return pieces;
  },

  initBoard: () => Array(8).fill(null).map(() => Array(9).fill(null)),

  autoSetup: (b, p) => {
    const nb = b.map(row => [...row]);
    const rows = p === 1 ? [7, 6, 5] : [0, 1, 2];
    
    for (const r of rows) {
      for (let c = 0; c < 9; c++) {
        nb[r][c] = null;
      }
    }
    
    const pieces = GameLogic.createPieces(p).sort(() => Math.random() - 0.5);
    let idx = 0;
    
    for (const r of rows) {
      for (let c = 0; c < 9; c++) {
        if (idx < pieces.length) {
          nb[r][c] = pieces[idx++];
        }
      }
    }
    return nb;
  },

  battle: (a, d) => {
    if (d.r === 'FLAG') return 'win';
    if (a.r === 'FLAG') return 'lose';
    if (a.r === d.r) return 'draw';
    if (a.r === 'SPY' && d.r === 'PVT') return 'lose';
    if (a.r === 'SPY') return 'win';
    if (d.r === 'SPY' && a.r === 'PVT') return 'win';
    if (d.r === 'SPY') return 'lose';
    return POWER[a.r] > POWER[d.r] ? 'win' : 'lose';
  },

  validMoves: (b, r, c) => {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return dirs.map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 9 && (!b[nr][nc] || b[nr][nc].p !== b[r][c].p));
  },

  aiMove: (b) => {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c]?.p === 2) pieces.push([r, c]);
      }
    }
    
    if (pieces.length === 0) return null;
    
    const moves = [];
    pieces.forEach(([r, c]) => {
      const piece = b[r][c];
      if (!piece) return;
      
      const possibleMoves = GameLogic.validMoves(b, r, c);
      possibleMoves.forEach(to => {
        let score = Math.random() * 10;
        const target = b[to[0]][to[1]];
        
        if (target) {
          const result = GameLogic.battle(piece, target);
          score += result === 'win' ? 50 : result === 'draw' ? 20 : -30;
        }
        
        if (to[0] === 7) score += 30;
        if (piece.r === 'FLAG') score -= 100;
        
        moves.push({ from: [r, c], to, score });
      });
    });
    
    if (moves.length === 0) return null;
    
    moves.sort((a, b) => b.score - a.score);
    return { from: moves[0].from, to: moves[0].to };
  }
};

export { GameLogic, POWER, RANKS };