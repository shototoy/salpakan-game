# Salpakan: Imperium - Multiplayer Setup

## Overview
This is a modularized version of Salpakan: Imperium with WebSocket-based multiplayer support.

## Features
- **Modular Architecture**: Clean separation of concerns with component-based structure
- **AI Mode**: Play against computer opponent
- **Local Multiplayer**: Hot-seat mode on same device
- **Online Multiplayer**: Play over network using WebSocket

## Project Structure
```
salpakan-imperium/
├── index.html          # Main game client (modular React app)
├── server.js           # WebSocket server
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Setup Instructions

### 1. Install Node.js
Make sure you have Node.js installed (v14 or higher)
- Download from: https://nodejs.org/

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the WebSocket Server
```bash
npm start
```

The server will run on `ws://localhost:8080`

For development with auto-restart:
```bash
npm run dev
```

### 4. Open the Game Client
Simply open `index.html` in your browser. You can:
- Double-click the file
- Use a local server: `npx serve .` or `python -m http.server`

## How to Play Multiplayer

### Online Mode (Network):
1. **Player 1**: Click "VS NETWORK COMMANDER" → "CREATE ROOM"
2. Share the 6-character Room ID with Player 2
3. **Player 2**: Click "VS NETWORK COMMANDER" → Enter Room ID → "JOIN ROOM"
4. Both players click "START BATTLE"
5. Deploy your forces (arrange pieces on your side)
6. Take turns making moves

### Local Mode:
1. Click "VS LOCAL COMMANDER"
2. Player 1 deploys forces → Pass device to Player 2
3. Player 2 deploys forces
4. Players alternate turns (device is passed between turns)

### AI Mode:
1. Click "VS MACHINE"
2. Deploy your forces
3. Play against the computer AI

## Game Rules

### Piece Hierarchy (Strongest to Weakest):
1. 5★ General (1)
2. 4★ General (1)
3. 3★ General (1)
4. 2★ General (1)
5. 1★ General (1)
6. Colonel (1)
7. Lt. Colonel (1)
8. Major (1)
9. Captain (1)
10. 1st Lieutenant (1)
11. 2nd Lieutenant (1)
12. Sergeant (2)
13. Private (5)
14. Spy (2) - Can eliminate all except Private
15. Flag (1) - Cannot move, capturing it wins the game

### Special Rules:
- **Spy** defeats all pieces except Private
- **Private** defeats Spy
- **Equal ranks** result in both pieces being eliminated
- **Flag** cannot move and loses to any piece

### How to Win:
- Capture the opponent's Flag
- Eliminate all opponent pieces that can move

## Development Notes

### Modular Components:
- `GameLogic`: Core game mechanics (board, pieces, battle system)
- `WebSocketManager`: Network communication handler
- `PieceIcon`: SVG-based piece renderer
- `HomeScreen`: Main menu
- `MultiplayerLobby`: Room creation/joining
- `RoomWaiting`: Waiting room for players
- `GameBoard`: Main game board renderer
- `Sidebar`: Game info and controls
- `UnitPicker`: Piece selection during setup
- `BattleReportModal`: Combat result display
- `TurnLockModal`: Turn transition screen

### WebSocket Events:
- `join`: Player joins a room
- `roomJoined`: Confirmation of room join
- `playerJoined`: Another player joined
- `startGame`: Game initialization
- `setupComplete`: Player finished setup
- `move`: Player made a move
- `gameEnd`: Game over

## Troubleshooting

### WebSocket Connection Failed:
- Ensure server is running (`npm start`)
- Check that port 8080 is not in use
- Verify firewall settings allow WebSocket connections

### Game Not Loading:
- Check browser console for errors
- Ensure all files are in the same directory
- Try using a local web server instead of file:// protocol

### Network Play Issues:
- Both players must connect to same server
- For LAN play: Use server's local IP (e.g., `ws://192.168.1.x:8080`)
- For internet play: Configure port forwarding or use a VPS

## Future Enhancements
- [ ] Add chat functionality
- [ ] Implement game replay system
- [ ] Add ranked matchmaking
- [ ] Create lobby system with multiple rooms
- [ ] Add sound effects and music
- [ ] Implement different game modes
- [ ] Add timer per turn
- [ ] Create spectator mode

## Credits
Traditional Filipino strategy game adapted to modern web platform.

## License
MIT License