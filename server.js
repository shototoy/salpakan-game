const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

function broadcast(room, message, excludeWs = null) {
  room.players.forEach(player => {
    if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  let currentRoom = null;
  let currentPlayerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join': {
          const { roomId } = data;
          
          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              id: roomId,
              players: [],
              gameState: null
            });
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
            players: room.players.map(p => p ? p.number : null)
          }));
          
          broadcast(room, {
            type: 'playerJoined',
            players: room.players.map(p => p ? p.number : null)
          });
          
          console.log(`Player ${playerId} joined room ${roomId} as Player ${playerNumber}`);
          break;
        }
        
        case 'startGame': {
          const { roomId } = data;
          const room = rooms.get(roomId);
          
          if (!room || room.players.length !== 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cannot start game' }));
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
      room.players = room.players.filter(p => p.ws !== ws);
      
      if (room.players.length === 0) {
        rooms.delete(currentRoom);
        console.log(`Room ${currentRoom} deleted (empty)`);
      } else {
        broadcast(room, {
          type: 'playerLeft',
          players: room.players.map(p => p ? p.number : null)
        });
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log('Waiting for connections...');