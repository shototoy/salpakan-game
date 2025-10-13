// ============================================
// WEBSOCKET MANAGER (Online Mode Only)
// ============================================

const WebSocketManager = {
  ws: null,
  callbacks: {},
  getServerUrl() {
    const isMobile = typeof window.Capacitor !== 'undefined';
    if (isMobile || window.location.protocol === 'https:') {
      return 'wss://salpakan-game.onrender.com';  // ⚠️ CHANGE THIS
    }
    return `ws://${window.location.hostname}:8080`;
  },

  connect: (roomId, playerId) => {
    if (WebSocketManager.ws) {
      WebSocketManager.ws.close();
      WebSocketManager.ws = null;
    }

    const url = WebSocketManager.getServerUrl();
    console.log(`Connecting to: ${url}`);
    
    const ws = new WebSocket(url);
    WebSocketManager.ws = ws;

    ws.onopen = () => {
      console.log('✅ Connected');
      ws.send(JSON.stringify({ type: 'join', roomId, playerId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const callback = WebSocketManager.callbacks[data.type];
      if (callback) callback(data);
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => {
      console.log('Connection closed');
      WebSocketManager.ws = null;
    };

    return ws;
  },

  send: (data) => {
    if (WebSocketManager.ws && WebSocketManager.ws.readyState === WebSocket.OPEN) {
      console.log('Sending message:', data);
      WebSocketManager.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not ready! State:', WebSocketManager.ws?.readyState);
      console.error('Attempted to send:', data);
    }
  },

  on: (type, callback) => {
    console.log(`Registering handler for: ${type}`);
    WebSocketManager.callbacks[type] = callback;
  },

  off: (type) => {
    console.log(`Removing handler for: ${type}`);
    delete WebSocketManager.callbacks[type];
  },

  disconnect: () => {
    console.log('Disconnecting WebSocket');
    if (WebSocketManager.ws) {
      WebSocketManager.ws.close();
      WebSocketManager.ws = null;
    }
    WebSocketManager.callbacks = {};
  }
};

export default WebSocketManager;