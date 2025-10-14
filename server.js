const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  if (req.url === '/discover') {
    const roomList = Array.from(rooms.entries())
      .filter(([id, room]) => room.players.filter(p => p !== null).length > 0)
      .map(([id, room]) => ({
        id,
        players: room.players.filter(p => p !== null).length
      }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      type: 'serverFound',
      ip: localIP,
      wsPort: port,
      serverName: 'Salpakan Local Server',
      rooms: roomList,
      timestamp: Date.now()
    }));
    console.log(`🔍 Discovery from ${req.socket.remoteAddress}`);
    return;
  }

  if (req.url === '/' || req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salpakan Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: #fbbf24;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(0, 0, 0, 0.8);
      border: 4px solid #ca8a04;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(251, 191, 36, 0.3);
    }
    h1 {
      font-size: 36px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .status {
      color: #10b981;
      font-size: 18px;
      margin-bottom: 30px;
    }
    .ip-box {
      background: #000;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .ip-label {
      font-size: 14px;
      opacity: 0.7;
      margin-bottom: 10px;
    }
    .ip-address {
      font-size: 48px;
      font-weight: bold;
      color: #fbbf24;
      letter-spacing: 2px;
      text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
    }
    .qr-placeholder {
      background: #fff;
      width: 200px;
      height: 200px;
      margin: 20px auto;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #000;
    }
    .info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
      color: #93c5fd;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 30px;
      gap: 20px;
    }
    .stat {
      flex: 1;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 SALPAKAN</h1>
    <div class="status">● SERVER RUNNING</div>
    
    <div class="ip-box">
      <div class="ip-label">SERVER IP ADDRESS</div>
      <div class="ip-address">${localIP}</div>
    </div>

    <div class="info">
      💡 <strong>To connect:</strong><br>
      1. Make sure your device is on the same WiFi network<br>
      2. Open Salpakan game on your phone<br>
      3. Tap "Create Room" → "Local Network Discovery"<br>
      4. Enter this IP: <strong>${localIP}</strong>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="rooms">0</div>
        <div class="stat-label">Active Rooms</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="players">0</div>
        <div class="stat-label">Players Online</div>
      </div>
    </div>
  </div>

  <script>
    function updateStats() {
      fetch('/discover')
        .then(r => r.json())
        .then(data => {
          document.getElementById('rooms').textContent = data.rooms.length;
          const totalPlayers = data.rooms.reduce((sum, r) => sum + r.players, 0);
          document.getElementById('players').textContent = totalPlayers;
        })
        .catch(() => {});
    }
    setInterval(updateStats, 2000);
    updateStats();
  </script>
</body>
</html>
    `);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocket.Server({ server });

// ============================================
// NETWORK UTILITIES
// ============================================

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

// ============================================
// WEBSOCKET SERVER
// ============================================

console.log('\n' + '='.repeat(60));
console.log('🎮  SALPAKAN LOCAL SERVER');
console.log('='.repeat(60));
console.log(`\n📍  SERVER IP: ${localIP}\n`);
console.log('📱  To connect from your phone:');
console.log(`    1. Connect to the same WiFi network`);
console.log(`    2. Open Salpakan → Create Room → Local Network`);
console.log(`    3. Enter IP: ${localIP}\n`);
console.log(`🌐  Status page: http://${localIP}:${port}`);
console.log(`🔌  WebSocket: ws://${localIP}:${port}`);
console.log(`🔍  Discovery: http://${localIP}:${port}/discover`);
console.log('='.repeat(60) + '\n');

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server ready on port ${port}\n`);
});

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('📡 New connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type);
      
      switch (data.type) {
        case 'getRooms': handleGetRooms(ws); break;
        case 'join': handleJoin(ws, data); break;
        case 'toggleReady': handleToggleReady(ws, data); break;
        case 'startGame': handleStartGame(data); break;
        case 'setupComplete': handleSetupComplete(data); break;
        case 'deploymentUpdate': handleDeploymentUpdate(data); break;
        case 'move': handleMove(data); break;
        case 'gameEnd': handleGameEnd(data); break;
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Connection closed');
    handleDisconnect(ws);
  });
});

function handleGetRooms(ws) {
  const roomList = Array.from(rooms.entries())
    .filter(([id, room]) => {
      const activePlayers = room.players.filter(p => p !== null).length;
      return activePlayers > 0;
    })
    .map(([id, room]) => ({
      id,
      players: room.players.filter(p => p !== null).length,
      isFull: room.players.filter(p => p !== null).length >= 2
    }));
  
  ws.send(JSON.stringify({ type: 'roomList', rooms: roomList }));
}

function handleJoin(ws, data) {
  const { roomId } = data;
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: [null, null],
      clients: new Map(),
      readyStates: { 1: false, 2: false },
      setupComplete: { 1: false, 2: false }
    });
    console.log(`🆕 Room created: ${roomId}`);
  }
  
  const room = rooms.get(roomId);
  
  let playerId = null;
  if (room.players[0] === null) {
    playerId = 1;
    room.players[0] = 1;
  } else if (room.players[1] === null) {
    playerId = 2;
    room.players[1] = 2;
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
    return;
  }
  
  room.clients.set(playerId, ws);
  ws.roomId = roomId;
  ws.playerId = playerId;
  
  console.log(`✅ Player ${playerId} joined room ${roomId}`);
  
  ws.send(JSON.stringify({
    type: 'roomJoined',
    roomId,
    playerId,
    players: room.players,
    readyStates: room.readyStates
  }));
  
  const opponentId = playerId === 1 ? 2 : 1;
  const opponentWs = room.clients.get(opponentId);
  
  if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
    opponentWs.send(JSON.stringify({
      type: 'playerJoined',
      players: room.players,
      readyStates: room.readyStates
    }));
  }
}

function handleToggleReady(ws, data) {
  const { roomId, playerId, isReady } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    console.log(`❌ Room ${roomId} not found`);
    return;
  }
  
  room.readyStates[playerId] = isReady;
  const allReady = room.readyStates[1] && room.readyStates[2] && room.players.filter(p => p !== null).length === 2;
  
  console.log(`🎯 Player ${playerId} ready: ${isReady}, all ready: ${allReady}`);
  
  const message = {
    type: 'playerReady',
    playerId,
    isReady,
    allReady,
    readyStates: room.readyStates
  };
  
  room.clients.forEach((clientWs, clientPlayerId) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(message));
    }
  });
}

function handleStartGame(data) {
  const { roomId } = data;
  console.log(`🎮 Game starting: ${roomId}`);
  broadcastToRoom(roomId, { type: 'gameStart' });
}

function handleDeploymentUpdate(data) {
  const { roomId, playerId, piecesPlaced, board } = data;
  const room = rooms.get(roomId);
  if (!room) return;
  
  const opponentId = playerId === 1 ? 2 : 1;
  const opponentWs = room.clients.get(opponentId);
  
  if (opponentWs) {
    opponentWs.send(JSON.stringify({
      type: 'opponentDeploymentUpdate',
      piecesPlaced,
      board
    }));
  }
}

function handleSetupComplete(data) {
  const { roomId, playerId } = data;
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.setupComplete[playerId] = true;
  console.log(`✅ Player ${playerId} setup complete`);
  
  const opponentId = playerId === 1 ? 2 : 1;
  const opponentWs = room.clients.get(opponentId);
  
  if (opponentWs) {
    opponentWs.send(JSON.stringify({
      type: 'opponentSetupComplete',
      playerId
    }));
  }
  
  if (room.setupComplete[1] && room.setupComplete[2]) {
    console.log(`🎮 Both players ready: ${roomId}`);
    broadcastToRoom(roomId, { type: 'bothPlayersReady' });
  }
}

function handleMove(data) {
  const { roomId, playerId } = data;
  console.log(`♟️  Move by Player ${playerId}`);
  
  const opponentId = playerId === 1 ? 2 : 1;
  const room = rooms.get(roomId);
  if (!room) return;
  
  const opponentWs = room.clients.get(opponentId);
  if (opponentWs) {
    opponentWs.send(JSON.stringify({ type: 'move', ...data }));
  }
}

function handleGameEnd(data) {
  const { roomId } = data;
  console.log(`🏆 Game ended: ${roomId}`);
  broadcastToRoom(roomId, { type: 'gameEnd', ...data });
  
  setTimeout(() => {
    rooms.delete(roomId);
    console.log(`🗑️  Room deleted: ${roomId}`);
  }, 5000);
}

function handleDisconnect(ws) {
  if (!ws.roomId || !ws.playerId) return;
  
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
  console.log(`👋 Player ${ws.playerId} left`);
  
  const playerIndex = ws.playerId - 1;
  room.players[playerIndex] = null;
  room.clients.delete(ws.playerId);
  room.readyStates[ws.playerId] = false;
  
  broadcastToRoom(ws.roomId, {
    type: 'playerLeft',
    playerId: ws.playerId,
    players: room.players
  });
  
  if (room.players.every(p => p === null)) {
    rooms.delete(ws.roomId);
    console.log(`🗑️  Empty room deleted`);
  }
}

function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.clients.forEach((ws, playerId) => {
    if (playerId !== excludePlayerId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});