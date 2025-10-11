const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const PORT = 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let gameState = {
  board: null,
  turn: 1,
  phase: 'setup',
  setupPlayer: 1,
  players: {}
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function broadcast(data, exclude = null) {
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  const playerId = Date.now() + Math.random();
  
  let playerNumber = null;
  if (!gameState.players[1]) {
    playerNumber = 1;
    gameState.players[1] = playerId;
  } else if (!gameState.players[2]) {
    playerNumber = 2;
    gameState.players[2] = playerId;
  }

  ws.send(JSON.stringify({
    type: 'connected',
    playerId,
    playerNumber,
    gameState
  }));

  broadcast({
    type: 'playerJoined',
    playerNumber,
    players: gameState.players
  }, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'updateBoard':
          gameState.board = data.board;
          broadcast({ type: 'boardUpdate', board: data.board }, ws);
          break;
          
        case 'updateTurn':
          gameState.turn = data.turn;
          broadcast({ type: 'turnUpdate', turn: data.turn }, ws);
          break;
          
        case 'updatePhase':
          gameState.phase = data.phase;
          gameState.setupPlayer = data.setupPlayer || gameState.setupPlayer;
          broadcast({ 
            type: 'phaseUpdate', 
            phase: data.phase,
            setupPlayer: data.setupPlayer 
          }, ws);
          break;
          
        case 'gameReset':
          gameState = {
            board: null,
            turn: 1,
            phase: 'setup',
            setupPlayer: 1,
            players: gameState.players
          };
          broadcast({ type: 'gameReset' }, ws);
          break;
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (gameState.players[1] === playerId) {
      delete gameState.players[1];
    } else if (gameState.players[2] === playerId) {
      delete gameState.players[2];
    }
    
    broadcast({
      type: 'playerLeft',
      players: gameState.players
    });
  });
});

server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('\n=================================');
  console.log('🎮 SALPAKAN: IMPERIUM LAN SERVER');
  console.log('=================================');
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`\n📡 Host IP Address: ${localIP}`);
  console.log(`\n🔗 Share this with other player:`);
  console.log(`   ws://${localIP}:${PORT}`);
  console.log('\n=================================\n');
});