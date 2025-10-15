const WebSocketManager = {
  ws: null,
  callbacks: {},
  currentServer: null,
  currentRoomId: null,
  debugLog: true,
  discoveredServers: [],
  isApk: false,
  
  init() {
    this.isApk = typeof cordova !== 'undefined' || 
                 typeof Capacitor !== 'undefined' || 
                 window.location.protocol === 'file:' || 
                 window.navigator.userAgent.includes('wv') ||
                 /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.log(`Platform: ${this.isApk ? 'Mobile APK' : 'Web Browser'}`);
  },

  log(message, data = null) {
    if (this.debugLog) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      if (data) {
        console.log(`[${timestamp}][WS] ${message}`, data);
      } else {
        console.log(`[${timestamp}][WS] ${message}`);
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
    const cloudUrl = this.isApk 
      ? 'ws://salpakan-game.onrender.com'
      : (window.location.protocol === 'https:' 
          ? 'wss://salpakan-game.onrender.com' 
          : 'ws://salpakan-game.onrender.com');
    
    const servers = [
      { 
        name: 'Cloud', 
        url: cloudUrl,
        type: 'cloud',
        enabled: true 
      }
    ];
    
    this.log('Default cloud server URL', cloudUrl);
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
          return {
            name: s.name,
            url: `ws://${s.ip}:8080`,
            type: 'manual',
            enabled: true,
            ip: s.ip
          };
        });
      
      this.log('Local servers loaded', localServers);
      return [...configured, ...localServers, ...this.discoveredServers];
    }
    
    return [...configured, ...this.discoveredServers];
  },

  getEnabledServers() {
    const enabled = this.getAllServers().filter(s => s.enabled);
    this.log('Enabled servers', enabled);
    return enabled;
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
    this.log('Testing connection to', ip);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${ip}:8080/discover`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
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
        this.log('Manual server connected', server);
        return server;
      } else {
        this.log('Server responded with error', response.status);
      }
    } catch (error) {
      this.log('Manual connection failed', error.message);
      return null;
    }
    return null;
  },

  // ============================================
  // ROOM FETCHING
  // ============================================
  
  getServerUrl() {
    if (this.isApk) {
      return 'ws://salpakan-game.onrender.com';
    }
    if (window.location.protocol === 'https:') {
      return 'wss://salpakan-game.onrender.com';
    }
    return `ws://${window.location.hostname}:8080`;
  },

  async getRoomsFromAllServers() {
    const servers = this.getEnabledServers();
    const allRooms = [];

    this.log(`Fetching rooms from ${servers.length} server(s)`);

    const roomFetchPromises = servers.map(async (server) => {
      try {
        this.log(`Fetching from ${server.name} (${server.url})`);
        const rooms = await this.fetchRoomsFromServer(server.url, server.name);
        this.log(`${server.name}: ${rooms.length} room(s) found`);
        return rooms;
      } catch (error) {
        this.log(`${server.name} fetch failed: ${error.message}`);
        return [];
      }
    });

    const results = await Promise.all(roomFetchPromises);
    results.forEach(rooms => allRooms.push(...rooms));

    this.log(`Total available rooms: ${allRooms.length}`);
    return allRooms;
  },

  fetchRoomsFromServer(serverUrl, serverName) {
    return new Promise((resolve, reject) => {
      this.log(`Opening WS to ${serverName}`);
      const ws = new WebSocket(serverUrl);
      const timeoutId = setTimeout(() => {
        this.log(`${serverName} fetch timeout`);
        ws.close();
        reject(new Error(`Timeout: ${serverName}`));
      }, 5000);

      ws.onopen = () => {
        this.log(`${serverName} WS opened, requesting rooms`);
        ws.send(JSON.stringify({ type: 'getRooms' }));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeoutId);
        const data = JSON.parse(event.data);
        this.log(`${serverName} response`, data.type);
        
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

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        this.log(`${serverName} WS error`, error);
        ws.close();
        resolve([]);
      };

      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        if (event.code !== 1000) {
          this.log(`${serverName} closed unexpectedly`, event.code);
        }
      };
    });
  },

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  connect(roomId, playerId = null, serverUrl = null) {
    const url = serverUrl || this.getServerUrl();
    
    this.log(`Connect request: Room=${roomId}, Server=${url}`);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN && 
        this.currentServer === url && this.currentRoomId === roomId) {
      this.log('Already connected to this room');
      return this.ws;
    }

    if (this.ws) {
      this.log('Closing previous connection');
      this.ws.close();
      this.ws = null;
    }

    this.currentServer = url;
    this.currentRoomId = roomId;
    
    this.log(`Opening WebSocket to ${url}`);
    const ws = new WebSocket(url);
    this.ws = ws;

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        this.log('Connection timeout - closing');
        ws.close();
        this.ws = null;
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      this.log('WebSocket OPEN - sending join request');
      const joinMsg = { type: 'join', roomId, playerId };
      this.log('Join message', joinMsg);
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.log(`⬇ Received: ${data.type}`, data);
      const callback = this.callbacks[data.type];
      if (callback) {
        callback(data);
      } else {
        this.log(`⚠ No handler for: ${data.type}`);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      this.log('❌ WebSocket ERROR', error);
    };
    
    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      this.log('WebSocket CLOSED', { 
        code: event.code, 
        reason: event.reason || 'No reason',
        wasClean: event.wasClean 
      });
      this.ws = null;
      this.currentRoomId = null;
    };

    return ws;
  },

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log(`⬆ Sending: ${data.type}`, data);
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      const state = this.ws ? this.ws.readyState : 'null';
      this.log(`⚠ Cannot send (state=${state})`, data);
      return false;
    }
  },

  on(type, callback) {
    this.log(`Registered handler: ${type}`);
    this.callbacks[type] = callback;
  },

  off(type) {
    this.log(`Removed handler: ${type}`);
    delete this.callbacks[type];
  },

  disconnect() {
    this.log('Disconnecting all');
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
    this.log('Disconnected');
  }
};

WebSocketManager.init();

export default WebSocketManager;