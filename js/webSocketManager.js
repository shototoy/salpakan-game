(function() {
  if (window.WebSocketManager) return;

  const WebSocketManager = {
    ws: null,
    callbacks: {},
    currentServer: null,
    
    getServerUrl() {
      const isMobile = typeof window.Capacitor !== 'undefined';
      if (isMobile || window.location.protocol === 'https:') {
        return 'wss://salpakan-game.onrender.com';
      }
      return `ws://${window.location.hostname}:8080`;
    },

    getAllServers() {
      return [
        { name: 'Local', url: 'ws://localhost:8080' },
        { name: 'Render', url: 'wss://salpakan-game.onrender.com' }
      ];
    },

    async getRoomsFromAllServers() {
      const servers = this.getAllServers();
      const allRooms = [];

      for (const server of servers) {
        try {
          const rooms = await this.fetchRoomsFromServer(server.url, server.name);
          allRooms.push(...rooms);
        } catch (error) {
          console.warn(`Could not fetch rooms from ${server.name}:`, error);
        }
      }

      return allRooms;
    },

    fetchRoomsFromServer(serverUrl, serverName) {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(serverUrl);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error(`Timeout connecting to ${serverName}`));
        }, 5000);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'getRooms' }));
        };

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          const data = JSON.parse(event.data);
          if (data.type === 'roomList') {
            const roomsWithServer = data.rooms.map(room => ({
              ...room,
              server: serverName,
              serverUrl: serverUrl
            }));
            ws.close();
            resolve(roomsWithServer);
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          resolve([]);
        };
      });
    },

    connect(roomId, playerId, serverUrl = null) {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      const url = serverUrl || this.getServerUrl();
      console.log(`Connecting to: ${url}`);
      this.currentServer = url;
      
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.log('✅ Connected');
        ws.send(JSON.stringify({ type: 'join', roomId, playerId }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const callback = this.callbacks[data.type];
        if (callback) callback(data);
      };

      ws.onerror = (error) => console.error('WebSocket error:', error);
      ws.onclose = () => {
        console.log('Connection closed');
        this.ws = null;
      };

      return ws;
    },

    send(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Sending message:', data);
        this.ws.send(JSON.stringify(data));
      } else {
        console.error('WebSocket not ready! State:', this.ws?.readyState);
      }
    },

    on(type, callback) {
      this.callbacks[type] = callback;
    },

    off(type) {
      delete this.callbacks[type];
    },

    disconnect() {
      console.log('Disconnecting WebSocket');
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.callbacks = {};
      this.currentServer = null;
    }
  };

  window.WebSocketManager = WebSocketManager;
})();