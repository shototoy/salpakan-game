const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const port = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salpakan Game Server</title>
    <style>
        /* ============================================
           RESET & BASE
           ============================================ */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #000000 0%, #18181b 50%, #000000 100%);
            color: #e4e4e7;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #09090b;
            border: 4px solid #27272a;
            border-radius: 4px;
            box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
            overflow: hidden;
        }

        /* ============================================
           HEADER
           ============================================ */
        header {
            background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 4px solid #27272a;
            position: relative;
        }

        header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%);
            pointer-events: none;
        }

        h1 {
            font-family: Impact, 'Arial Black', sans-serif;
            font-size: 48px;
            color: #e4e4e7;
            text-shadow: 2px 2px 0px rgba(0, 0, 0, 1),
                         0 0 20px rgba(220, 38, 38, 0.5),
                         0 0 3px rgba(161, 161, 170, 0.8);
            letter-spacing: 4px;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 14px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        /* ============================================
           SERVER INFO SECTION
           ============================================ */
        .server-info {
            padding: 30px;
            background: #18181b;
            border-bottom: 2px solid #27272a;
        }

        .server-info h2 {
            font-family: Impact, 'Arial Black', sans-serif;
            font-size: 24px;
            color: #a1a1aa;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .info-item {
            background: #09090b;
            padding: 15px 20px;
            border: 2px solid #27272a;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            animation: fadeIn 0.4s ease;
        }

        .info-item:hover {
            border-color: #3f3f46;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .label {
            font-size: 12px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .value {
            font-size: 18px;
            font-weight: bold;
            color: #e4e4e7;
        }

        .status-online {
            color: #22c55e;
        }

        .status-offline {
            color: #ef4444;
        }

        .status-waiting {
            color: #eab308;
        }

        /* ============================================
           ROOMS SECTION
           ============================================ */
        .rooms-section {
            padding: 30px;
            background: #09090b;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .section-header h2 {
            font-family: Impact, 'Arial Black', sans-serif;
            font-size: 24px;
            color: #a1a1aa;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .refresh-btn {
            background: linear-gradient(to bottom, #3f3f46, #27272a);
            color: #e4e4e7;
            border: 2px solid #52525b;
            padding: 8px 16px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.3s ease;
        }

        .refresh-btn:hover {
            background: linear-gradient(to bottom, #450a0a, #7f1d1d);
            border-color: #dc2626;
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
        }

        .rooms-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            min-height: 200px;
        }

        .room-card {
            background: #18181b;
            border: 2px solid #27272a;
            border-radius: 4px;
            padding: 20px;
            transition: all 0.3s ease;
            animation: fadeIn 0.3s ease;
        }

        .room-card:hover {
            border-color: #52525b;
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        }

        .room-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #27272a;
        }

        .room-id {
            font-family: Impact, 'Arial Black', sans-serif;
            font-size: 24px;
            color: #e4e4e7;
            letter-spacing: 2px;
        }

        .room-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .players-count {
            font-size: 14px;
            color: #a1a1aa;
        }

        .no-rooms,
        .loading {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #71717a;
            font-size: 16px;
            background: #18181b;
            border: 2px dashed #27272a;
            border-radius: 4px;
        }

        /* ============================================
           INSTRUCTIONS
           ============================================ */
        .instructions {
            padding: 30px;
            background: #18181b;
            border-top: 2px solid #27272a;
        }

        .instructions h2 {
            font-family: Impact, 'Arial Black', sans-serif;
            font-size: 24px;
            color: #a1a1aa;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .instruction-card {
            background: #09090b;
            border: 2px solid #27272a;
            border-radius: 4px;
            padding: 20px;
        }

        .instruction-card h3 {
            color: #e4e4e7;
            font-size: 18px;
            margin-bottom: 15px;
            font-family: Impact, 'Arial Black', sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .instruction-card p {
            color: #a1a1aa;
            line-height: 1.6;
            margin-bottom: 15px;
        }

        .instruction-card ol {
            color: #a1a1aa;
            line-height: 1.8;
            margin-left: 25px;
        }

        .instruction-card li {
            margin-bottom: 8px;
        }

        /* ============================================
           FOOTER
           ============================================ */
        footer {
            padding: 30px;
            text-align: center;
            background: #09090b;
            border-top: 4px solid #27272a;
        }

        footer p {
            color: #71717a;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }

        .version {
            color: #52525b;
            font-size: 10px;
        }

        /* ============================================
           ANIMATIONS
           ============================================ */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* ============================================
           SCROLLBAR
           ============================================ */
        ::-webkit-scrollbar {
            width: 10px;
        }

        ::-webkit-scrollbar-track {
            background: #09090b;
        }

        ::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
            h1 {
                font-size: 32px;
            }

            .info-grid {
                grid-template-columns: 1fr;
            }

            .rooms-list {
                grid-template-columns: 1fr;
            }

            .section-header {
                flex-direction: column;
                gap: 15px;
                align-items: stretch;
            }

            .refresh-btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>SALPAKAN GAME SERVER</h1>
            <p class="subtitle">Multiplayer Strategy Game</p>
        </header>

        <div class="server-info">
            <h2>📊 Server Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value status-online" id="serverStatus">🟢 ONLINE</span>
                </div>
                <div class="info-item">
                    <span class="label">Active Rooms:</span>
                    <span class="value" id="roomCount">0</span>
                </div>
                <div class="info-item">
                    <span class="label">Connected Players:</span>
                    <span class="value" id="playerCount">0</span>
                </div>
                <div class="info-item">
                    <span class="label">Uptime:</span>
                    <span class="value" id="uptime">0m</span>
                </div>
            </div>
        </div>

        <div class="rooms-section">
            <div class="section-header">
                <h2>🎮 Active Rooms</h2>
                <button class="refresh-btn" onclick="refreshRooms()">🔄 Refresh</button>
            </div>
            <div id="roomsList" class="rooms-list">
                <div class="loading">Loading rooms...</div>
            </div>
        </div>

        <div class="instructions">
            <h2>ℹ️ How to Connect</h2>
            <div class="instruction-card">
                <h3>For Players:</h3>
                <p>Use the Salpakan game client to connect to this server:</p>
                <ol>
                    <li>Open the game client</li>
                    <li>Go to Multiplayer → Settings</li>
                    <li>Add this server's WebSocket URL</li>
                    <li>Create or join a room</li>
                </ol>
            </div>
        </div>

        <footer>
            <p>🇵🇭 Game of the Generals • Philippine Strategy Game</p>
            <p class="version">Server v1.0.0</p>
        </footer>
    </div>

    <script>
        let ws;
        let startTime = Date.now();
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('Connected to server');
                document.getElementById('serverStatus').innerHTML = '🟢 ONLINE';
                document.getElementById('serverStatus').className = 'value status-online';
                ws.send(JSON.stringify({ type: 'getRooms' }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'roomList') {
                    updateRoomsList(data.rooms);
                }
            };
            
            ws.onerror = () => {
                document.getElementById('serverStatus').innerHTML = '🔴 ERROR';
                document.getElementById('serverStatus').className = 'value status-offline';
            };
            
            ws.onclose = () => {
                document.getElementById('serverStatus').innerHTML = '🟡 RECONNECTING...';
                document.getElementById('serverStatus').className = 'value status-waiting';
                setTimeout(connect, 3000);
            };
        }

        function updateRoomsList(rooms) {
            const roomsList = document.getElementById('roomsList');
            const roomCount = document.getElementById('roomCount');
            
            roomCount.textContent = rooms.length;
            
            const totalPlayers = rooms.reduce((sum, room) => sum + room.players, 0);
            document.getElementById('playerCount').textContent = totalPlayers;
            
            if (rooms.length === 0) {
                roomsList.innerHTML = '<div class="no-rooms">No active rooms. Create one in the game client!</div>';
                return;
            }
            
            roomsList.innerHTML = rooms.map(room => \`
                <div class="room-card">
                    <div class="room-header">
                        <span class="room-id">\${room.id}</span>
                    </div>
                    <div class="room-info">
                        <div class="info-row">
                            <span class="players-count">👥 Players: \${room.players}</span>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function refreshRooms() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'getRooms' }));
            }
        }

        function updateUptime() {
            const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
            document.getElementById('uptime').textContent = \`\${elapsed}m\`;
        }

        setInterval(refreshRooms, 5000);
        setInterval(updateUptime, 60000);
        connect();
    </script>
</body>
</html>`;

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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(dashboardHTML);
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
      const playerCount = Object.keys(room.players).length;
      return { id, players: playerCount };
    });
  
  ws.send(JSON.stringify({ type: 'roomList', rooms: roomList }));
}

function handleCreateRoom(ws, data) {
  const { roomType = '2player' } = data;
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  rooms.set(roomId, {
    roomType,
    players: {},
    clients: new Map(),
    readyStates: {},
    setupComplete: {},
    playerNames: {},
    lastActivity: Date.now()
  });
  
  console.log(`🆕 Room created: ${roomId} (${roomType})`);
  
  ws.send(JSON.stringify({ type: 'roomCreated', roomId, roomType }));
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
  
  let playerId = 1;
  const existingIds = Object.keys(room.players).map(Number);
  while (existingIds.includes(playerId)) {
    playerId++;
  }
  
  room.clients.set(playerId, ws);
  ws.roomId = roomId;
  ws.playerId = playerId;
  ws.isAlive = true;
  
  console.log(`✅ Player ${playerId} joined room ${roomId}`);
  
  ws.send(JSON.stringify({
    type: 'roomJoined',
    roomId,
    playerId,
    players: room.players,
    readyStates: room.readyStates,
    roomType: room.roomType,
    playerNames: room.playerNames
  }));
  
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
  
  const slotTaken = Object.values(room.players).includes(slotNum);
  if (slotTaken) {
    ws.send(JSON.stringify({ type: 'error', message: 'Slot already taken' }));
    return;
  }
  
  if (room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'You already have a slot' }));
    return;
  }
  
  room.lastActivity = Date.now();
  room.players[playerId] = slotNum;
  room.readyStates[playerId] = false;
  
  console.log(`🎯 Player ${playerId} selected slot ${slotNum}`);
  
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
  
  if (!room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'Select a slot first' }));
    return;
  }
  
  room.lastActivity = Date.now();
  room.readyStates[playerId] = isReady;
  
  const maxPlayers = room.roomType === '3player' ? 3 : 2;
  const playerCount = Object.keys(room.players).length;
  const fullRoom = playerCount >= maxPlayers;
  
  let allReady = false;
  if (room.roomType === '3player') {
    const slot1Player = Object.keys(room.players).find(pid => room.players[pid] === 1);
    const slot2Player = Object.keys(room.players).find(pid => room.players[pid] === 2);
    allReady = fullRoom && slot1Player && slot2Player && room.readyStates[slot1Player] && room.readyStates[slot2Player];
  } else {
    allReady = fullRoom && Object.values(room.readyStates).every(ready => ready);
  }
  
  console.log(`🎯 Player ${playerId} ready: ${isReady}`);
  
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
  
  broadcastToRoom(roomId, { type: 'opponentSetupComplete', playerId }, playerId);
  
  let bothReady = false;
  if (room.roomType === '3player') {
    const slot1Player = Object.keys(room.players).find(pid => room.players[pid] === 1);
    const slot2Player = Object.keys(room.players).find(pid => room.players[pid] === 2);
    bothReady = slot1Player && slot2Player && room.setupComplete[slot1Player] && room.setupComplete[slot2Player];
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