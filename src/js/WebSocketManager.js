const WebSocketManager = {
  ws: null,
  callbacks: {},
  currentServer: null,
  currentRoomId: null,
  debugLog: true,
  discoveredServers: [],
  
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
    const servers = [
      { 
        name: 'Cloud', 
        url: 'wss://salpakan-game.onrender.com', 
        type: 'cloud',
        enabled: true 
      }
    ];
    
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
    const settings = this.getStoredSettings();
    const configured = this.getConfiguredServers();
    
    if (settings && settings.localServers) {
      const localServers = settings.localServers
        .filter(s => s.enabled)
        .map(s => {
          // For local servers, always use ws:// (not wss://)
          return {
            name: s.name,
            url: `ws://${s.ip}:8080`,
            type: 'manual',
            enabled: true,
            ip: s.ip
          };
        });
      
      return [...configured, ...localServers, ...this.discoveredServers];
    }
    
    return [...configured, ...this.discoveredServers];
  },

  getEnabledServers() {
    return this.getAllServers().filter(s => s.enabled);
  },

  // ============================================
  // MANUAL SERVER CONNECTION
  // ============================================

  getCachedServerIP() {
    try {
      return localStorage.getItem('lastLocalServerIP');
    } catch (e) {
      return null;
    }
  },

  cacheServerIP(ip) {
    try {
      localStorage.setItem('lastLocalServerIP', ip);
      this.log('Cached server IP', ip);
    } catch (e) {}
  },

  async connectToManualIP(ip) {
    this.log('Attempting manual connection to', ip);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://${ip}:8080/discover`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Local servers always use ws://
        const wsUrl = `ws://${ip}:${data.wsPort || 8080}`;
        
        const server = {
          name: data.serverName || `Local Server (${ip})`,
          url: wsUrl,
          type: 'manual',
          enabled: true,
          ip: ip
        };
        
        this.discoveredServers = [server];
        this.cacheServerIP(ip);
        this.log('Successfully connected to server', server);
        return server;
      }
    } catch (error) {
      this.log('Failed to connect', error);
      return null;
    }
    return null;
  },

  // ============================================
  // ROOM FETCHING
  // ============================================
  
  getServerUrl() {
    // FIXED: Always return the cloud server URL with wss://
    // This works in both browser and APK
    return 'wss://salpakan-game.onrender.com';
  },

  async getRoomsFromAllServers() {
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
      // FIXED: Don't try fallback from wss to ws for cloud servers
      const isCloudServer = serverUrl.includes('render.com') || serverUrl.includes('herokuapp.com');
      
      const attemptFetch = (url, isRetry = false) => {
        this.log(`Attempting fetch from ${url} (retry: ${isRetry})`);
        const ws = new WebSocket(url);
        const timeoutId = setTimeout(() => {
          this.log(`Timeout on ${url}`);
          ws.close();
          
          // Only try fallback for non-cloud servers (local servers)
          if (!isRetry && !isCloudServer && url.startsWith('wss://')) {
            const fallbackUrl = url.replace('wss://', 'ws://');
            this.log(`Trying WS fallback: ${fallbackUrl}`);
            attemptFetch(fallbackUrl, true);
          } else {
            reject(new Error(`Timeout connecting to ${serverName}`));
          }
        }, 5000); // Increased timeout for cloud servers

        ws.onopen = () => {
          clearTimeout(timeoutId);
          this.log(`Connected to ${serverName} for room list`);
          ws.send(JSON.stringify({ type: 'getRooms' }));
        };

        ws.onmessage = (event) => {
          clearTimeout(timeoutId);
          const data = JSON.parse(event.data);
          if (data.type === 'roomList') {
            const roomsWithServer = data.rooms.map(room => ({
              ...room,
              server: serverName,
              serverUrl: url
            }));
            ws.close();
            resolve(roomsWithServer);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          this.log(`Error on ${url}`, error);
          ws.close();
          
          // Only try fallback for non-cloud servers
          if (!isRetry && !isCloudServer && url.startsWith('wss://')) {
            const fallbackUrl = url.replace('wss://', 'ws://');
            this.log(`Error, trying WS fallback: ${fallbackUrl}`);
            attemptFetch(fallbackUrl, true);
          } else {
            resolve([]);
          }
        };

        ws.onclose = () => {
          clearTimeout(timeoutId);
        };
      };

      attemptFetch(serverUrl);
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
    this.attemptConnection(url, roomId, playerId, false);
    
    return this.ws;
  },

  attemptConnection(url, roomId, playerId, isRetry) {
    this.log(`Attempt connection to ${url} (retry: ${isRetry})`);
    
    // FIXED: Don't try fallback from wss to ws for cloud servers
    const isCloudServer = url.includes('render.com') || url.includes('herokuapp.com');
    
    const ws = new WebSocket(url);
    this.ws = ws;

    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        this.log(`Connection timeout on ${url}`);
        ws.close();
        
        // Only try fallback for non-cloud servers
        if (!isRetry && !isCloudServer && url.startsWith('wss://')) {
          const fallbackUrl = url.replace('wss://', 'ws://');
          this.log(`Timeout, trying WS fallback: ${fallbackUrl}`);
          this.currentServer = fallbackUrl;
          this.attemptConnection(fallbackUrl, roomId, playerId, true);
        }
      }
    }, 8000); // Increased timeout for cloud servers

    ws.onopen = () => {
      clearTimeout(timeout);
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
      clearTimeout(timeout);
      this.log('Connection error', error);
      
      // Only try fallback for non-cloud servers
      if (!isRetry && !isCloudServer && url.startsWith('wss://')) {
        const fallbackUrl = url.replace('wss://', 'ws://');
        this.log(`Error, trying WS fallback: ${fallbackUrl}`);
        this.currentServer = fallbackUrl;
        this.attemptConnection(fallbackUrl, roomId, playerId, true);
      }
    };
    
    ws.onclose = (event) => {
      clearTimeout(timeout);
      this.log('Connection closed', { code: event.code, reason: event.reason });
      this.ws = null;
      this.currentRoomId = null;
    };
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