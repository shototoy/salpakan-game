const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const port = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

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
      .filter(([id, room]) => Object.keys(room.players).length > 0)
      .map(([id, room]) => ({
        id,
        players: Object.keys(room.players).length,
        roomType: room.roomType
      }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      type: 'serverFound',
      ip: isProduction ? 'Cloud Server' : localIP,
      wsPort: port,
      serverName: isProduction ? 'Salpakan Cloud Server (Render)' : 'Salpakan Local Server',
      rooms: roomList,
      timestamp: Date.now()
    }));
    console.log(`🔍 Discovery from ${req.socket.remoteAddress}`);
    return;
  }

  if (req.url === '/' || req.url === '/status') {
    const roomList = Array.from(rooms.entries())
      .filter(([id, room]) => Object.keys(room.players).length > 0)
      .map(([id, room]) => ({
        id,
        players: Object.keys(room.players).length,
        maxPlayers: room.roomType === '3player' ? 3 : 2,
        roomType: room.roomType
      }));

    const totalPlayers = roomList.reduce((sum, r) => sum + r.players, 0);
    const serverType = isProduction ? 'Cloud (Render)' : 'Local';

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salpakan Server - ${serverType}</title>
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
    .server-type {
      background: ${isProduction ? 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)'};
      border: 2px solid ${isProduction ? '#a78bfa' : '#60a5fa'};
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      font-size: 20px;
      font-weight: bold;
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
      font-size: ${isProduction ? '24px' : '48px'};
      font-weight: bold;
      color: #fbbf24;
      letter-spacing: 2px;
      text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
      word-break: break-all;
    }
    .info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
      color: #93c5fd;
      text-align: left;
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
    .rooms-list {
      margin-top: 20px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      padding: 10px;
    }
    .room-item {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid #fbbf24;
      border-radius: 4px;
      padding: 8px;
      margin: 5px 0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .uptime {
      font-size: 12px;
      opacity: 0.6;
      margin-top: 20px;
    }
  </style>
</head>
<body>  
  <div class="container">
    <h1>🎮 SALPAKAN</h1>
    <div class="status">● SERVER RUNNING</div>
    
    <div class="server-type">
      ${isProduction ? '☁️ CLOUD SERVER (Render)' : '🏠 LOCAL SERVER'}
    </div>

    ${isProduction ? `
    <div class="ip-box">
      <div class="ip-label">WEBSOCKET URL</div>
      <div class="ip-address">wss://salpakan-game.onrender.com</div>
    </div>

    <div class="info">
      💡 <strong>How to connect:</strong><br>
      1. Open Salpakan game on your phone or computer<br>
      2. The cloud server is automatically available<br>
      3. Create or join rooms from the multiplayer lobby<br>
      <br>
      <strong>Note:</strong> This is a free Render instance. It may sleep after 15 minutes of inactivity and take ~30 seconds to wake up on first connection.
    </div>
    ` : `
    <div class="ip-box">
      <div class="ip-label">SERVER IP ADDRESS</div>
      <div class="ip-address">${localIP}</div>
    </div>

    <div class="info">
      💡 <strong>To connect:</strong><br>
      1. Make sure your device is on the same WiFi network<br>
      2. Open Salpakan game on your phone<br>
      3. Go to Settings → Add Local Server<br>
      4. Enter this IP: <strong>${localIP}</strong>
    </div>
    `}

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="rooms">${roomList.length}</div>
        <div class="stat-label">Active Rooms</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="players">${totalPlayers}</div>
        <div class="stat-label">Players Online</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="connections">${wss.clients.size}</div>
        <div class="stat-label">Connections</div>
      </div>
    </div>

    <div class="rooms-list" id="roomsList">
      ${roomList.length > 0 ? roomList.map(room => `
        <div class="room-item">
          <span>Room: ${room.id} ${room.roomType === '3player' ? '👁️' : '⚔️'}</span>
          <span>Players: ${room.players}/${room.maxPlayers}</span>
        </div>
      `).join('') : '<div style="opacity: 0.5; padding: 20px;">No active rooms</div>'}
    </div>

    <div class="uptime" id="uptime">Uptime: 0s</div>
  </div>

  <script>
    const startTime = Date.now();
    
    function updateStats() {
      fetch('/discover')
        .then(r => r.json())
        .then(data => {
          document.getElementById('rooms').textContent = data.rooms.length;
          const totalPlayers = data.rooms.reduce((sum, r) => sum + r.players, 0);
          document.getElementById('players').textContent = totalPlayers;
          
          const roomsList = document.getElementById('roomsList');
          if (data.rooms.length > 0) {
            roomsList.innerHTML = data.rooms.map(room => {
              const maxPlayers = room.roomType === '3player' ? 3 : 2;
              const icon = room.roomType === '3player' ? '👁️' : '⚔️';
              return \`
                <div class="room-item">
                  <span>Room: \${room.id} \${icon}</span>
                  <span>Players: \${room.players}/\${maxPlayers}</span>
                </div>
              \`;
            }).join('');
          } else {
            roomsList.innerHTML = '<div style="opacity: 0.5; padding: 20px;">No active rooms</div>';
          }
        })
        .catch(() => {});
    }

    function updateUptime() {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      document.getElementById('uptime').textContent = 
        \`Uptime: \${hours}h \${minutes}m \${seconds}s\`;
    }

    setInterval(updateStats, 2000);
    setInterval(updateUptime, 1000);
    updateStats();
    updateUptime();
  </script>
</body>
</html>
    `);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: 100 * 1024
});

// ============================================
// NETWORK UTILITIES
// ============================================

function getLocalIP() {
  if (isProduction) return 'Cloud Server';
  
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
const startTime = Date.now();

// ============================================
// WEBSOCKET SERVER
// ============================================

console.log('\n' + '='.repeat(60));
console.log('🎮  SALPAKAN SERVER');
console.log('='.repeat(60));
console.log(`\n📍  Server Type: ${isProduction ? 'CLOUD (Render)' : 'LOCAL'}`);
if (!isProduction) {
  console.log(`📍  Server IP: ${localIP}`);
  console.log(`\n📱  To connect from your phone:`);
  console.log(`    1. Connect to the same WiFi network`);
  console.log(`    2. Open Salpakan → Settings → Add Local Server`);
  console.log(`    3. Enter IP: ${localIP}\n`);
  console.log(`🌐  Status page: http://${localIP}:${port}`);
  console.log(`🔌  WebSocket: ws://${localIP}:${port}`);
} else {
  console.log(`🌐  Status page: https://salpakan-game.onrender.com`);
  console.log(`🔌  WebSocket: wss://salpakan-game.onrender.com`);
}
console.log(`🔍  Discovery: /discover endpoint available`);
console.log('='.repeat(60) + '\n');

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server ready on port ${port}`);
  if (isProduction) {
    console.log(`☁️  Running on Render cloud platform\n`);
  } else {
    console.log(`🏠  Running on local network\n`);
  }
});

const rooms = new Map();

// Cleanup inactive rooms periodically
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    if (!room.lastActivity) room.lastActivity = now;
    
    if (now - room.lastActivity > 30 * 60 * 1000) {
      const hasPlayers = Object.keys(room.players).length > 0;
      if (!hasPlayers) {
        rooms.delete(roomId);
        console.log(`🗑️  Cleaned up inactive room: ${roomId}`);
      }
    }
  });
}, 5 * 60 * 1000);

wss.on('connection', (ws, req) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`📡 New connection from ${clientIP}`);
  
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received: ${data.type} ${data.roomId ? `(${data.roomId})` : ''}`);
      
      if (data.roomId && rooms.has(data.roomId)) {
        rooms.get(data.roomId).lastActivity = Date.now();
      }
      
      switch (data.type) {
        case 'getRooms': handleGetRooms(ws); break;
        case 'createRoom': handleCreateRoom(ws, data); break;
        case 'join': handleJoin(ws, data); break;
        case 'selectSlot': handleSelectSlot(ws, data); break;
        case 'toggleReady': handleToggleReady(ws, data); break;
        case 'startGame': handleStartGame(data); break;
        case 'setupComplete': handleSetupComplete(data); break;
        case 'deploymentUpdate': handleDeploymentUpdate(data); break;
        case 'move': handleMove(data); break;
        case 'gameEnd': handleGameEnd(data); break;
        case 'updateName': handleUpdateName(ws, data); break;
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('🔌 Connection closed');
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('💀 Terminating dead connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

function handleGetRooms(ws) {
  const roomList = Array.from(rooms.entries())
    .filter(([id, room]) => {
      const activePlayers = Object.keys(room.players).length;
      return activePlayers > 0;
    })
    .map(([id, room]) => {
      const maxPlayers = room.roomType === '3player' ? 3 : 2;
      const playerCount = Object.keys(room.players).length;
      return {
        id,
        players: playerCount,
        isFull: playerCount >= maxPlayers,
        roomType: room.roomType
      };
    });
  
  ws.send(JSON.stringify({ type: 'roomList', rooms: roomList }));
}

function handleCreateRoom(ws, data) {
  const { roomType = '2player' } = data;
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  rooms.set(roomId, {
    roomType,
    players: {}, // Changed from array to object: {playerId: slotNum}
    clients: new Map(),
    readyStates: {},
    setupComplete: {},
    playerNames: {},
    lastActivity: Date.now()
  });
  
  console.log(`🆕 Room created: ${roomId} (${roomType})`);
  
  ws.send(JSON.stringify({
    type: 'roomCreated',
    roomId,
    roomType
  }));
}

function handleJoin(ws, data) {
  const { roomId } = data;
  
  if (!rooms.has(roomId)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  
  const room = rooms.get(roomId);
  room.lastActivity = Date.now();
  
  const maxPlayers = room.roomType === '3player' ? 3 : 2;
  const currentPlayerCount = Object.keys(room.players).length;
  
  if (currentPlayerCount >= maxPlayers) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
    return;
  }
  
  // Assign a unique player ID
  let playerId = 1;
  const existingIds = Object.keys(room.players).map(Number);
  while (existingIds.includes(playerId)) {
    playerId++;
  }
  
  room.clients.set(playerId, ws);
  ws.roomId = roomId;
  ws.playerId = playerId;
  ws.isAlive = true;
  
  console.log(`✅ Player ${playerId} joined room ${roomId} (waiting to select slot)`);
  
  // Send room state to the joining player
  ws.send(JSON.stringify({
    type: 'roomJoined',
    roomId,
    playerId,
    players: room.players,
    readyStates: room.readyStates,
    roomType: room.roomType,
    playerNames: room.playerNames
  }));
  
  // Notify others that a player joined (but hasn't selected slot yet)
  broadcastToRoom(roomId, {
    type: 'playerJoined',
    players: room.players,
    readyStates: room.readyStates,
    playerNames: room.playerNames
  }, playerId);
}

function handleSelectSlot(ws, data) {
  const { roomId, playerId, slotNum } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    console.log(`❌ Room ${roomId} not found`);
    return;
  }
  
  // Check if slot is already taken
  const slotTaken = Object.values(room.players).includes(slotNum);
  if (slotTaken) {
    ws.send(JSON.stringify({ type: 'error', message: 'Slot already taken' }));
    return;
  }
  
  // Check if player already has a slot
  if (room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'You already have a slot' }));
    return;
  }
  
  room.lastActivity = Date.now();
  room.players[playerId] = slotNum;
  room.readyStates[playerId] = false;
  
  console.log(`🎯 Player ${playerId} selected slot ${slotNum} in room ${roomId}`);
  
  // Broadcast updated player list to all in room
  broadcastToRoom(roomId, {
    type: 'slotSelected',
    playerId,
    slotNum,
    players: room.players,
    readyStates: room.readyStates,
    playerNames: room.playerNames
  });
}

function handleUpdateName(ws, data) {
  const { roomId, playerId, name } = data;
  const room = rooms.get(roomId);
  
  if (!room) return;
  
  room.lastActivity = Date.now();
  room.playerNames[playerId] = name;
  
  console.log(`✏️ Player ${playerId} set name to "${name}"`);
  
  broadcastToRoom(roomId, {
    type: 'nameUpdated',
    playerId,
    name,
    playerNames: room.playerNames
  });
}

function handleToggleReady(ws, data) {
  const { roomId, playerId, isReady } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    console.log(`❌ Room ${roomId} not found`);
    return;
  }
  
  // Check if player has selected a slot
  if (!room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'Select a slot first' }));
    return;
  }
  
  room.lastActivity = Date.now();
  room.readyStates[playerId] = isReady;
  
  const maxPlayers = room.roomType === '3player' ? 3 : 2;
  const playerCount = Object.keys(room.players).length;
  const fullRoom = playerCount >= maxPlayers;
  
  // For 3-player, only check slots 1 and 2 for ready state (slot 3 is observer)
  let allReady = false;
  if (room.roomType === '3player') {
    const slot1Player = Object.keys(room.players).find(pid => room.players[pid] === 1);
    const slot2Player = Object.keys(room.players).find(pid => room.players[pid] === 2);
    allReady = fullRoom && slot1Player && slot2Player && 
               room.readyStates[slot1Player] && room.readyStates[slot2Player];
  } else {
    allReady = fullRoom && Object.values(room.readyStates).every(ready => ready);
  }
  
  console.log(`🎯 Player ${playerId} ready: ${isReady}, all ready: ${allReady}`);
  
  broadcastToRoom(roomId, {
    type: 'playerReady',
    playerId,
    isReady,
    allReady,
    readyStates: room.readyStates
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
  
  room.lastActivity = Date.now();
  
  broadcastToRoom(roomId, {
    type: 'opponentDeploymentUpdate',
    playerId,
    piecesPlaced,
    board
  }, playerId);
}

function handleSetupComplete(data) {
  const { roomId, playerId } = data;
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.lastActivity = Date.now();
  room.setupComplete[playerId] = true;
  console.log(`✅ Player ${playerId} setup complete`);
  
  broadcastToRoom(roomId, {
    type: 'opponentSetupComplete',
    playerId
  }, playerId);
  
  // For 3-player, only check slots 1 and 2
  let bothReady = false;
  if (room.roomType === '3player') {
    const slot1Player = Object.keys(room.players).find(pid => room.players[pid] === 1);
    const slot2Player = Object.keys(room.players).find(pid => room.players[pid] === 2);
    bothReady = slot1Player && slot2Player && 
                room.setupComplete[slot1Player] && room.setupComplete[slot2Player];
  } else {
    bothReady = Object.values(room.setupComplete).filter(Boolean).length === 2;
  }
  
  if (bothReady) {
    console.log(`🎮 Both players ready: ${roomId}`);
    broadcastToRoom(roomId, { type: 'bothPlayersReady' });
  }
}

function handleMove(data) {
  const { roomId, playerId } = data;
  console.log(`♟️  Move by Player ${playerId}`);
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.lastActivity = Date.now();
  
  broadcastToRoom(roomId, { type: 'move', ...data }, playerId);
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
  
  console.log(`👋 Player ${ws.playerId} left room ${ws.roomId}`);
  
  delete room.players[ws.playerId];
  room.clients.delete(ws.playerId);
  delete room.readyStates[ws.playerId];
  delete room.playerNames[ws.playerId];
  room.lastActivity = Date.now();
  
  broadcastToRoom(ws.roomId, {
    type: 'playerLeft',
    playerId: ws.playerId,
    players: room.players,
    readyStates: room.readyStates,
    playerNames: room.playerNames
  });
  
  if (Object.keys(room.players).length === 0) {
    rooms.delete(ws.roomId);
    console.log(`🗑️  Empty room deleted: ${ws.roomId}`);
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

process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000 / 60);
  console.log(`\n📊 Stats: ${rooms.size} rooms, ${wss.clients.size} connections, ${uptime}m uptime`);
}, 5 * 60 * 1000);