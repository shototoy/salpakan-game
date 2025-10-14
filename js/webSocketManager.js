(function() {
  if (window.WebSocketManager) return;

  const WebSocketManager = {
    ws: null,
    callbacks: {},
    currentServer: null,
    currentRoomId: null,
    debugLog: true,
    
    log(message, data = null) {
      if (this.debugLog) {
        if (data) {
          console.log(`[WS] ${message}`, data);
        } else {
          console.log(`[WS] ${message}`);
        }
      }
    },
    
    getServerUrl() {
      const isMobile = typeof window.Capacitor !== 'undefined';
      if (isMobile || window.location.protocol === 'https:') {
        return 'wss://salpakan-game.onrender.com';
      }
      return `ws://${window.location.hostname}:8080`;
    },

    getAllServers() {
      const isMobile = typeof window.Capacitor !== 'undefined';
      
      const servers = [
        { name: 'Render', url: 'wss://salpakan-game.onrender.com' }
      ];
      
      if (!isMobile) {
        servers.unshift({ name: 'Local', url: 'ws://localhost:8080' });
      }
      
      return servers;
    },

    async getRoomsFromAllServers() {
      const servers = this.getAllServers();
      const allRooms = [];

      this.log('Fetching rooms from all servers');

      const roomFetchPromises = servers.map(async (server) => {
        try {
          this.log(`Trying ${server.name} at ${server.url}`);
          const rooms = await this.fetchRoomsFromServer(server.url, server.name);
          this.log(`Got ${rooms.length} rooms from ${server.name}`, rooms);
          return rooms;
        } catch (error) {
          this.log(`Failed to fetch from ${server.name}: ${error.message}`);
          return [];
        }
      });

      const results = await Promise.all(roomFetchPromises);
      results.forEach(rooms => allRooms.push(...rooms));

      this.log(`Total rooms: ${allRooms.length}`, allRooms);
      return allRooms;
    },

    fetchRoomsFromServer(serverUrl, serverName) {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(serverUrl);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error(`Timeout connecting to ${serverName}`));
        }, 3000);

        ws.onopen = () => {
          this.log(`Connected to ${serverName} for room list`);
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
          this.log(`Error fetching from ${serverName}`);
          ws.close();
          resolve([]);
        };

        ws.onclose = () => {
          clearTimeout(timeout);
        };
      });
    },

    connect(roomId, playerId = null, serverUrl = null) {
      const url = serverUrl || this.getServerUrl();
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentServer === url && this.currentRoomId === roomId) {
        this.log('Already connected to same room and server');
        return this.ws;
      }

      if (this.ws) {
        this.log('Closing previous connection');
        this.ws.close();
        this.ws = null;
      }

      this.currentServer = url;
      this.currentRoomId = roomId;
      
      this.log(`Connecting to ${url} for room ${roomId}`);
      
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.log('Connection opened, joining room');
        ws.send(JSON.stringify({ type: 'join', roomId, playerId }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.log(`Received: ${data.type}`, data);
        const callback = this.callbacks[data.type];
        if (callback) {
          callback(data);
        } else {
          this.log(`No handler for ${data.type}`);
        }
      };

      ws.onerror = (error) => {
        this.log('Connection error', error);
      };
      
      ws.onclose = (event) => {
        this.log('Connection closed', { code: event.code, reason: event.reason });
        this.ws = null;
        this.currentRoomId = null;
      };

      return ws;
    },

    send(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.log(`Sending: ${data.type}`, data);
        this.ws.send(JSON.stringify(data));
      } else {
        this.log(`Cannot send, WS state: ${this.ws?.readyState}`, data);
      }
    },

    on(type, callback) {
      this.callbacks[type] = callback;
    },

    off(type) {
      delete this.callbacks[type];
    },

    disconnect() {
      this.log('Disconnecting');
      if (this.ws) {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
        this.ws = null;
      }
      this.callbacks = {};
      this.currentServer = null;
      this.currentRoomId = null;
    }
  };

  window.WebSocketManager = WebSocketManager;
})();