const WebSocketManager = {
  ws: null,
  callbacks: {},
  currentServer: null,
  currentRoomId: null,
  debugLog: true,
  discoveredServers: [],
  udpListener: null,
  discoveryTimeout: null,
  
  log(message, data = null) {
    if (this.debugLog) {
      if (data) {
        console.log(`[WS] ${message}`, data);
      } else {
        console.log(`[WS] ${message}`);
      }
    }
  },

  // ============================================
  // SERVER CONFIGURATION
  // ============================================
  
  getStoredSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('serverSettings') || 'null');
      return settings;
    } catch (error) {
      this.log('Failed to load settings', error);
      return null;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem('serverSettings', JSON.stringify(settings));
      this.log('Settings saved', settings);
    } catch (error) {
      this.log('Failed to save settings', error);
    }
  },

  getDefaultServers() {
    const isMobile = typeof window.Capacitor !== 'undefined';
    const hostname = window.location.hostname;
    
    const servers = [
      { 
        name: 'Cloud', 
        url: 'wss://salpakan-game.onrender.com', 
        type: 'cloud',
        enabled: true 
      }
    ];
    
    if (!isMobile) {
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        servers.unshift({ 
          name: 'LAN', 
          url: `ws://${hostname}:8080`, 
          type: 'lan',
          enabled: false 
        });
      } else {
        servers.unshift({ 
          name: 'Local', 
          url: `ws://localhost:8080`, 
          type: 'local',
          enabled: true 
        });
      }
    }
    
    return servers;
  },

  getConfiguredServers() {
    const settings = this.getStoredSettings();
    const defaults = this.getDefaultServers();

    if (!settings || !settings.servers) {
      return defaults;
    }

    return defaults.map(server => {
      const saved = settings.servers.find(s => s.type === server.type);
      return saved ? { ...server, enabled: saved.enabled } : server;
    });
  },

  getAllServers() {
    return [...this.getConfiguredServers(), ...this.discoveredServers];
  },

  getEnabledServers() {
    return this.getAllServers().filter(s => s.enabled);
  },

  // ============================================
  // SERVER DISCOVERY
  // ============================================

  startServerDiscovery(timeout = 3000) {
    return new Promise((resolve) => {
      this.discoveredServers = [];
      this.log('Starting server discovery');
      this.discoverViaConnectAttempts(timeout).then(resolve);
    });
  },

  discoverViaConnectAttempts(timeout) {
    return new Promise((resolve) => {
      const discovered = [];
      const commonIPs = this.getCommonLocalIPs();
      let completed = 0;

      const finish = () => {
        this.discoveredServers = discovered;
        this.log(`Discovery complete: found ${discovered.length} servers`, discovered);
        resolve(discovered);
      };

      if (commonIPs.length === 0) {
        finish();
        return;
      }

      commonIPs.forEach(ip => {
        const serverUrl = `ws://${ip}:8080`;
        
        this.testServerConnection(serverUrl)
          .then(() => {
            const existing = discovered.find(s => s.url === serverUrl);
            if (!existing) {
              discovered.push({
                name: `Local Server (${ip})`,
                url: serverUrl,
                type: 'discovered',
                enabled: true,
                discoveredAt: Date.now(),
                ip: ip
              });
              this.log(`Discovered server at ${ip}`);
            }
          })
          .catch(() => {})
          .finally(() => {
            completed++;
            if (completed === commonIPs.length) {
              finish();
            }
          });
      });

      setTimeout(finish, timeout);
    });
  },

  testServerConnection(serverUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(serverUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 1000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
      };

      ws.onclose = () => {
        clearTimeout(timeout);
      };
    });
  },

  getCommonLocalIPs() {
    const ips = [];
    for (let i = 1; i <= 20; i++) {
      ips.push(`192.168.1.${i}`);
      ips.push(`192.168.0.${i}`);
      ips.push(`10.0.0.${i}`);
    }
    return [...new Set(ips)];
  },

  // ============================================
  // ROOM FETCHING
  // ============================================
  
  getServerUrl() {
    const isMobile = typeof window.Capacitor !== 'undefined';
    if (isMobile || window.location.protocol === 'https:') {
      return 'wss://salpakan-game.onrender.com';
    }
    return `ws://${window.location.hostname}:8080`;
  },

  async getRoomsFromAllServers() {
    await this.startServerDiscovery(3000);
    
    const servers = this.getEnabledServers();
    const allRooms = [];

    this.log('Fetching rooms from enabled servers', servers);

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
      }, 2000);

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

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

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

export default WebSocketManager;