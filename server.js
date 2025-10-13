// ============================================
// WEBSOCKET SERVER
// ============================================

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

console.log('🎮 Salpakan Server running on ws://localhost:8080');

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

// ============================================
// HANDLERS
// ============================================

function handleGetRooms(ws) {
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
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
  
  broadcastToRoom(roomId, {
    type: 'playerJoined',
    players: room.players,
    readyStates: room.readyStates
  }, playerId);
}

function handleToggleReady(ws, data) {
  const { roomId, playerId, isReady } = data;
  const room = rooms.get(roomId);
  
  if (!room) return;
  
  room.readyStates[playerId] = isReady;
  const allReady = room.readyStates[1] && room.readyStates[2] && room.players.filter(p => p !== null).length === 2;
  
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

// ============================================
// UTILITIES
// ============================================

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