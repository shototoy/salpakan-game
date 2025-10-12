const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

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
      console.log('Server received:', data.type, 'from player', currentPlayerId);
      
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
              setupComplete: { 1: false, 2: false },
              boards: { 1: null, 2: null },
              readyStates: { 1: false, 2: false }
            });
            console.log(`Created new room: ${roomId}`);
          }
          
          const room = rooms.get(roomId);
          
          if (room.players.length >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
          }
          
          const playerNumber = room.players.length + 1;
          currentPlayerId = playerNumber;
          currentRoom = roomId;
          
          room.players.push({
            id: playerNumber,
            ws: ws,
            number: playerNumber
          });
          
          console.log(`Player ${playerNumber} joined room ${roomId} (${room.players.length}/2)`);
          
          ws.send(JSON.stringify({
            type: 'roomJoined',
            roomId,
            playerId: playerNumber,
            players: room.players.map(p => p.number),
            readyStates: room.readyStates
          }));
          
          broadcast(room, {
            type: 'playerJoined',
            players: room.players.map(p => p.number),
            readyStates: room.readyStates
          }, ws);
          
          broadcastToAll({
            type: 'roomList',
            rooms: getRoomsList()
          });
          
          break;
        }
        
        case 'toggleReady': {
          const { roomId, playerId, isReady } = data;
          console.log(`📨 toggleReady received: room=${roomId}, player=${playerId}, isReady=${isReady}`);
          
          const room = rooms.get(roomId);
          
          if (!room) {
            console.log(`❌ toggleReady: Room ${roomId} not found`);
            return;
          }
          
          const playerIdNum = typeof playerId === 'string' ? parseInt(playerId) : playerId;
          room.readyStates[playerIdNum] = isReady;
          const allReady = room.readyStates[1] && room.readyStates[2] && room.players.length === 2;
          
          console.log(`✅ Room ${roomId} ready states updated:`);
          console.log(`   P1=${room.readyStates[1]}, P2=${room.readyStates[2]}, AllReady=${allReady}`);
          
          const responseMessage = {
            type: 'playerReady',
            roomId: roomId,
            readyStates: { 1: room.readyStates[1], 2: room.readyStates[2] },
            allReady: allReady
          };
          
          console.log(`📤 Broadcasting playerReady to ${room.players.length} players:`, JSON.stringify(responseMessage));
          
          let sentCount = 0;
          room.players.forEach(player => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
              console.log(`   ✅ Sending to Player ${player.id}`);
              player.ws.send(JSON.stringify(responseMessage));
              sentCount++;
            } else {
              console.log(`   ❌ Cannot send to Player ${player.id} - WebSocket state: ${player.ws?.readyState}`);
            }
          });
          
          console.log(`📊 Sent to ${sentCount}/${room.players.length} players`);
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
            message: 'Game starting - deploy your forces!'
          });
          
          console.log(`Game started in room ${roomId}`);
          break;
        }
        
        case 'deploymentUpdate': {
          const { roomId, playerId, piecesPlaced, board } = data;
          const room = rooms.get(roomId);
          
          if (!room) return;
          
          room.boards[playerId] = board;
          
          const hiddenBoard = board.map(row => 
            row.map(cell => {
              if (cell && cell.p === playerId) {
                return { ...cell, r: '?' };
              }
              return cell;
            })
          );
          
          broadcast(room, {
            type: 'opponentDeploymentUpdate',
            playerId,
            piecesPlaced,
            board: hiddenBoard
          }, ws);
          
          console.log(`Player ${playerId} deployed ${piecesPlaced} pieces in room ${roomId}`);
          
          break;
        }

        case 'setupComplete': {
          const { roomId, playerId, board } = data;
          const room = rooms.get(roomId);
          
          if (!room) return;
          
          room.setupComplete[playerId] = true;
          room.boards[playerId] = board;
          
          console.log(`Player ${playerId} setup complete in room ${roomId}`);
          console.log(`Setup status: P1=${room.setupComplete[1]}, P2=${room.setupComplete[2]}`);
          
          broadcast(room, {
            type: 'opponentSetupComplete',
            playerId
          }, ws);
          
          if (room.setupComplete[1] && room.setupComplete[2]) {
            console.log('Both players ready, starting game');
            broadcast(room, {
              type: 'bothPlayersReady',
              message: 'Both players ready, game starting!',
              startingPlayer: 1
            });
          }
          
          break;
        }
        
       case 'move': {
        const { roomId, playerId, board, turn, lastMove, battleResult, defeated } = data;
        const room = rooms.get(roomId);
        
        if (!room) return;
        
        console.log(`Move by Player ${playerId} in room ${roomId}, next turn: ${turn}`);
        
        room.boards[playerId] = board;
        
        room.players.forEach(player => {
          if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            const mergedBoard = board.map((row, r) => 
              row.map((cell, c) => {
                if (!cell) return null;
                
                if (cell.p === player.number) {
                  const myPiece = room.boards[player.number]?.[r]?.[c];
                  return myPiece || cell;
                } else {
                  return { ...cell, r: '?' };
                }
              })
            );
            
            player.ws.send(JSON.stringify({
              type: 'move',
              playerId,
              board: mergedBoard,
              turn,
              lastMove,
              battleResult,
              defeated
            }));
          }
        });
        
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
console.log('Waiting for connections...');