// ============================================
// WEBSOCKET MANAGER (Online Mode Only)
// ============================================

const WebSocketManager = {
  ws: null,
  callbacks: {},

  connect: (roomId, playerId) => {
    if (WebSocketManager.ws) {
      console.log('Closing existing WebSocket connection');
      WebSocketManager.ws.close();
      WebSocketManager.ws = null;
    }

    const host = window.location.hostname;
    const port = 8080;

    console.log(`Creating NEW WebSocket connection: ws://${host}:${port}`);
    const ws = new WebSocket(`ws://${host}:${port}`);
    WebSocketManager.ws = ws;

    ws.onopen = () => {
      console.log('WebSocket opened, joining room:', roomId);
      ws.send(JSON.stringify({ type: 'join', roomId, playerId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('🔵 WebSocket RAW message:', data.type);
      console.log('📦 Full data:', JSON.stringify(data));
      console.log('📋 Available handlers:', Object.keys(WebSocketManager.callbacks));
      
      const callback = WebSocketManager.callbacks[data.type];
      if (callback) {
        console.log(`✅ Handler found for: ${data.type}`);
        callback(data);
      } else {
        console.log(`❌ NO handler for: ${data.type}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
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