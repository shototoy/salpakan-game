const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const port = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

// Minified compact dashboard - loads quickly
const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Salpakan Server</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:monospace;background:#0a0a0a;color:#fbbf24;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.container{background:rgba(0,0,0,.9);border:3px solid #ca8a04;border-radius:8px;padding:30px;max-width:600px;width:100%;box-shadow:0 10px 40px rgba(251,191,36,.2)}
h1{font-size:32px;margin-bottom:10px;text-align:center;letter-spacing:2px}
.status{color:#10b981;text-align:center;margin-bottom:20px;font-size:14px}
.type{background:${isProduction?'#7c3aed':'#3b82f6'};padding:12px;margin:15px 0;text-align:center;border-radius:6px;font-weight:bold;font-size:18px}
.ip-box{background:#000;border:2px solid #fbbf24;border-radius:6px;padding:15px;margin:20px 0;text-align:center}
.ip-label{font-size:12px;opacity:.7;margin-bottom:8px}
.ip{font-size:${isProduction?'20px':'32px'};font-weight:bold;letter-spacing:1px;word-break:break-all}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}
.stat{text-align:center;padding:12px;background:rgba(251,191,36,.1);border:1px solid #ca8a04;border-radius:6px}
.stat-value{font-size:24px;font-weight:bold}
.stat-label{font-size:11px;opacity:.7;margin-top:4px}
.rooms{margin-top:15px;max-height:150px;overflow-y:auto;background:rgba(0,0,0,.6);border-radius:6px;padding:10px}
.room{background:rgba(251,191,36,.1);border:1px solid #fbbf24;border-radius:4px;padding:8px;margin:4px 0;display:flex;justify-content:space-between;font-size:11px}
.info{background:rgba(59,130,246,.1);border:1px solid #3b82f6;border-radius:6px;padding:12px;margin-top:15px;font-size:12px;color:#93c5fd}
.uptime{text-align:center;font-size:11px;opacity:.6;margin-top:15px}
.refresh{background:#ca8a04;color:#000;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;width:100%;margin-top:10px}
.refresh:hover{background:#fbbf24}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#ca8a04;border-radius:3px}
</style>
</head>
<body>
<div class="container">
<h1>🎮 SALPAKAN</h1>
<div class="status">● SERVER ONLINE</div>
<div class="type">${isProduction?'☁️ CLOUD':'🏠 LOCAL'} SERVER</div>
<div class="ip-box">
<div class="ip-label">${isProduction?'WEBSOCKET URL':'SERVER IP'}</div>
<div class="ip">${isProduction?'wss://salpakan-game.onrender.com':localIP}</div>
</div>
<div class="stats">
<div class="stat"><div class="stat-value" id="rooms">0</div><div class="stat-label">ROOMS</div></div>
<div class="stat"><div class="stat-value" id="players">0</div><div class="stat-label">PLAYERS</div></div>
<div class="stat"><div class="stat-value" id="conns">0</div><div class="stat-label">CONNECTIONS</div></div>
</div>
<div class="rooms" id="roomsList"><div style="opacity:.5;padding:15px;text-align:center;font-size:11px">No active rooms</div></div>
<button class="refresh" onclick="updateStats()">🔄 REFRESH</button>
${isProduction?`<div class="info">💡 Free tier: May sleep after 15min inactivity. First connection takes ~30s to wake.</div>`:`<div class="info">💡 Connect from same WiFi: Settings → Add Local Server → Enter IP: <strong>${localIP}</strong></div>`}
<div class="uptime" id="uptime">Uptime: 0s</div>
</div>
<script>
const start=Date.now();
let ws;
function connect(){
const p=location.protocol==='https:'?'wss:':'ws:';
ws=new WebSocket(\`\${p}//\${location.host}\`);
ws.onopen=()=>{ws.send(JSON.stringify({type:'getRooms'}))};
ws.onmessage=(e)=>{
const d=JSON.parse(e.data);
if(d.type==='roomList')updateRooms(d.rooms);
};
ws.onclose=()=>setTimeout(connect,3000);
}
function updateRooms(rooms){
document.getElementById('rooms').textContent=rooms.length;
document.getElementById('conns').textContent=${isProduction?'wss.clients.size':'\'N/A\''};
const total=rooms.reduce((s,r)=>s+r.players,0);
document.getElementById('players').textContent=total;
const list=document.getElementById('roomsList');
if(rooms.length===0){
list.innerHTML='<div style="opacity:.5;padding:15px;text-align:center;font-size:11px">No active rooms</div>';
}else{
list.innerHTML=rooms.map(r=>\`<div class="room"><span>Room: \${r.id}</span><span>Players: \${r.players}</span></div>\`).join('');
}
}
function updateStats(){
if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'getRooms'}));
}
function updateUptime(){
const u=Math.floor((Date.now()-start)/1000);
const h=Math.floor(u/3600);
const m=Math.floor((u%3600)/60);
const s=u%60;
document.getElementById('uptime').textContent=\`Uptime: \${h}h \${m}m \${s}s\`;
}
setInterval(updateStats,5000);
setInterval(updateUptime,1000);
connect();
updateUptime();
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

console.log('\n' + '='.repeat(50));
console.log('🎮  SALPAKAN SERVER');
console.log('='.repeat(50));
console.log(`📍  Type: ${isProduction ? 'CLOUD (Render)' : 'LOCAL'}`);
if (isProduction) {
  console.log(`🌐  URL: https://salpakan-game.onrender.com`);
  console.log(`🔌  WSS: wss://salpakan-game.onrender.com`);
} else {
  console.log(`📍  IP: ${localIP}`);
  console.log(`🌐  URL: http://${localIP}:${port}`);
  console.log(`🔌  WS: ws://${localIP}:${port}`);
}
console.log('='.repeat(50) + '\n');

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Ready on port ${port}\n`);
});

const rooms = new Map();

setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    if (!room.lastActivity) room.lastActivity = now;
    if (now - room.lastActivity > 30 * 60 * 1000) {
      if (Object.keys(room.players).length === 0) {
        rooms.delete(roomId);
        console.log(`🗑️  Cleaned: ${roomId}`);
      }
    }
  });
}, 5 * 60 * 1000);

wss.on('connection', (ws, req) => {
  console.log(`📡 Connection from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
  
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }, 30000);
  
  ws.on('pong', () => { ws.isAlive = true; });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
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
    handleDisconnect(ws);
  });

  ws.on('error', (error) => console.error('❌ WS error:', error));
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

function handleGetRooms(ws) {
  const roomList = Array.from(rooms.entries())
    .filter(([id, room]) => Object.keys(room.players).length > 0)
    .map(([id, room]) => ({
      id,
      players: Object.keys(room.players).length
    }));
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
  console.log(`🆕 Room: ${roomId} (${roomType})`);
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
  if (Object.keys(room.players).length >= maxPlayers) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
    return;
  }
  
  let playerId = 1;
  const existingIds = Object.keys(room.players).map(Number);
  while (existingIds.includes(playerId)) playerId++;
  
  room.clients.set(playerId, ws);
  ws.roomId = roomId;
  ws.playerId = playerId;
  ws.isAlive = true;
  
  console.log(`✅ P${playerId} → ${roomId}`);
  
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
  if (!room) return;
  
  if (Object.values(room.players).includes(slotNum)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Slot taken' }));
    return;
  }
  
  if (room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'Already have slot' }));
    return;
  }
  
  room.lastActivity = Date.now();
  room.players[playerId] = slotNum;
  room.readyStates[playerId] = false;
  
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
  if (!room) return;
  
  if (!room.players[playerId]) {
    ws.send(JSON.stringify({ type: 'error', message: 'Select slot first' }));
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
    allReady = fullRoom && slot1Player && slot2Player && 
               room.readyStates[slot1Player] && room.readyStates[slot2Player];
  } else {
    allReady = fullRoom && Object.values(room.readyStates).every(r => r);
  }
  
  broadcastToRoom(roomId, {
    type: 'playerReady',
    playerId,
    isReady,
    allReady,
    readyStates: room.readyStates
  });
}

function handleStartGame(data) {
  broadcastToRoom(data.roomId, { type: 'gameStart' });
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
  
  broadcastToRoom(roomId, { type: 'opponentSetupComplete', playerId }, playerId);
  
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
    broadcastToRoom(roomId, { type: 'bothPlayersReady' });
  }
}

function handleMove(data) {
  const { roomId, playerId } = data;
  const room = rooms.get(roomId);
  if (!room) return;
  room.lastActivity = Date.now();
  broadcastToRoom(roomId, { type: 'move', ...data }, playerId);
}

function handleGameEnd(data) {
  const { roomId } = data;
  broadcastToRoom(roomId, { type: 'gameEnd', ...data });
  setTimeout(() => rooms.delete(roomId), 5000);
}

function handleDisconnect(ws) {
  if (!ws.roomId || !ws.playerId) return;
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
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
  console.log('\n⚠️  Shutting down...');
  wss.clients.forEach(ws => ws.close(1000, 'Server shutdown'));
  wss.close(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000);
});

process.on('SIGINT', () => {
  console.log('\n👋 Bye');
  wss.close(() => process.exit(0));
});

setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000 / 60);
  console.log(`📊 ${rooms.size} rooms, ${wss.clients.size} conns, ${uptime}m up`);
}, 5 * 60 * 1000);