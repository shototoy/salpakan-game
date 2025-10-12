const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

function getRoomsList() {
  const roomsList = [];
  rooms.forEach((room, roomId) => {
    roomsList.push({
      id: roomId,
      players: room.players.length,
      isFull: room.players.length >= 2
    });
  });
  return roomsList;
}

function broadcast(room, message, excludeWs = null) {
  room.players.forEach(player => {
    if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToAll(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  let currentRoom = null;
  let currentPlayerId = null;

  ws.send(JSON.stringify({
    type: 'roomList',
    rooms: getRoomsList()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'getRooms': {
          ws.send(JSON.stringify({
            type: 'roomList',
            rooms: getRoomsList()
          }));
          break;
        }
        
        case 'join': {
          const { roomId } = data;
          
          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              id: roomId,
              players: [],
              gameState: null
            });
            console.log(`Created new room: ${roomId}`);
          }
          
          const room = rooms.get(roomId);
          
          if (room.players.length >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
          }
          
          const playerId = generatePlayerId();
          currentPlayerId = playerId;
          currentRoom = roomId;
          
          const playerNumber = room.players.length + 1;
          room.players.push({
            id: playerId,
            ws: ws,
            number: playerNumber,
            ready: false
          });
          
          ws.send(JSON.stringify({
            type: 'roomJoined',
            roomId,
            playerId: playerNumber,
            players: room.players.map(p => p.number)
          }));
          
          broadcast(room, {
            type: 'playerJoined',
            players: room.players.map(p => p.number)
          }, ws);
          
          broadcastToAll({
            type: 'roomList',
            rooms: getRoomsList()
          });
          
          console.log(`Player ${playerId} joined room ${roomId} as Player ${playerNumber} (${room.players.length}/2)`);
          break;
        }
        
        case 'startGame': {
          const { roomId } = data;
          const room = rooms.get(roomId);
          
          if (!room || room.players.length !== 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cannot start game - need 2 players' }));
            console.log(`Cannot start game in room ${roomId}: only ${room?.players.length || 0} players`);
            return;
          }
          
          broadcast(room, {
            type: 'gameStart',
            message: 'Game starting...'
          });
          
          console.log(`Game started in room ${roomId}`);
          break;
        }
        
        case 'setupComplete': {
          const { roomId, playerId, board } = data;
          const room = rooms.get(roomId);
          
          if (!room) return;
          
          const player = room.players.find(p => p.number === playerId);
          if (player) {
            player.ready = true;
            player.board = board;
          }
          
          broadcast(room, {
            type: 'setupComplete',
            playerId
          }, ws);
          
          console.log(`Player ${playerId} setup complete in room ${roomId}`);
          break;
        }
        
        case 'move': {
          const { roomId, playerId, board, turn, lastMove, battleResult, defeated } = data;
          const room = rooms.get(roomId);
          
          if (!room) return;
          
          broadcast(room, {
            type: 'move',
            playerId,
            board,
            turn,
            lastMove,
            battleResult,
            defeated
          }, ws);
          
          console.log(`Move made by Player ${playerId} in room ${roomId}`);
          break;
        }
        
        case 'gameEnd': {
          const { roomId, winner, message } = data;
          const room = rooms.get(roomId);
          
          if (!room) return;
          
          broadcast(room, {
            type: 'gameEnd',
            winner,
            message
          });
          
          console.log(`Game ended in room ${roomId}, winner: Player ${winner}`);
          break;
        }
        
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      const leavingPlayer = room.players.find(p => p.ws === ws);
      room.players = room.players.filter(p => p.ws !== ws);
      
      if (room.players.length === 0) {
        rooms.delete(currentRoom);
        console.log(`Room ${currentRoom} deleted (empty)`);
      } else {
        console.log(`Player left room ${currentRoom}. Remaining: ${room.players.length}`);
        broadcast(room, {
          type: 'playerLeft',
          players: room.players.map(p => p.number)
        });
      }
      
      broadcastToAll({
        type: 'roomList',
        rooms: getRoomsList()
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log('Waiting for connections...');n