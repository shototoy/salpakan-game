const WebSocketManager = {
  ws: null,
  callbacks: {},
  currentServer: null,
  currentRoomId: null,
  debugLog: true,
  discoveredServers: [],
  discoveryTimeout: null,
  cachedLocalIP: null,
  
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
      },
      {
        name: 'Local Network Discovery',
        url: 'local-discovery',
        type: 'local',
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
    return [...this.getConfiguredServers(), ...this.discoveredServers];
  },

  getEnabledServers() {
    return this.getAllServers().filter(s => s.enabled);
  },

  // ============================================
  // WEBRTC LOCAL IP DETECTION
  // ============================================

  async detectLocalIP() {
    if (this.cachedLocalIP) {
      return this.cachedLocalIP;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.log('WebRTC IP detection timeout');
        resolve(null);
      }, 2000);

      try {
        const pc = new RTCPeerConnection({
          iceServers: []
        });

        pc.createDataChannel('');

        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            return;
          }

          const candidate = ice.candidate.candidate;
          const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(candidate);
          
          if (ipMatch && ipMatch[1]) {
            const ip = ipMatch[1];
            if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
              this.cachedLocalIP = ip;
              this.log('Local IP detected via WebRTC', ip);
              clearTimeout(timeout);
              pc.close();
              resolve(ip);
            }
          }
        };

        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(err => {
            this.log('WebRTC offer failed', err);
            clearTimeout(timeout);
            resolve(null);
          });

      } catch (error) {
        this.log('WebRTC not available', error);
        clearTimeout(timeout);
        resolve(null);
      }
    });
  },

  // ============================================
  // SERVER DISCOVERY
  // ============================================

  async startServerDiscovery(timeout = 6000) {
    this.discoveredServers = [];
    this.log('Starting network discovery');
    
    const localIP = await this.detectLocalIP();
    return this.scanNetwork(localIP, timeout);
  },

  scanNetwork(localIP, timeout) {
    return new Promise((resolve) => {
      const discovered = new Map();
      let completedScans = 0;
      let totalScans = 0;

      const addServer = (ip, data) => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${ip}:${data.wsPort || 8080}`;
        const key = `${ip}:${data.wsPort || 8080}`;
        
        if (!discovered.has(key)) {
          discovered.set(key, {
            name: data.serverName || `Local Server (${ip})`,
            url: wsUrl,
            type: 'discovered',
            enabled: true,
            discoveredAt: Date.now(),
            ip: ip
          });
          this.log(`✅ Found server at ${ip}`);
          
          const results = Array.from(discovered.values());
          this.discoveredServers = results;
        }
      };

      const checkServer = async (ip) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);

          const response = await fetch(`http://${ip}:8080/discover`, {
            method: 'GET',
            signal: controller.signal,
            mode: 'cors'
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            addServer(data.ip || ip, data);
          }
        } catch (error) {
        } finally {
          completedScans++;
        }
      };

      const generateIPRanges = () => {
        const ranges = [];
        
        if (localIP) {
          const subnet = localIP.substring(0, localIP.lastIndexOf('.'));
          const lastOctet = parseInt(localIP.substring(localIP.lastIndexOf('.') + 1));
          
          ranges.push({ 
            prefix: subnet, 
            priority: 1,
            ips: this.getSmartRange(lastOctet)
          });
          
          this.log(`Prioritizing subnet ${subnet}.x`);
        }

        ranges.push(
          { prefix: '192.168.1', priority: 2, ips: this.getCommonIPs() },
          { prefix: '192.168.0', priority: 3, ips: this.getCommonIPs() },
          { prefix: '10.0.0', priority: 4, ips: this.getCommonIPs() },
          { prefix: '172.16.0', priority: 5, ips: this.getCommonIPs() }
        );

        return ranges;
      };

      const scanInBatches = async () => {
        const ranges = generateIPRanges();
        const batchSize = 15;

        for (const range of ranges) {
          const ips = range.ips.map(n => `${range.prefix}.${n}`);
          totalScans += ips.length;

          for (let i = 0; i < ips.length; i += batchSize) {
            const batch = ips.slice(i, i + batchSize);
            await Promise.all(batch.map(ip => checkServer(ip)));
            
            if (range.priority === 1 && discovered.size > 0) {
              this.log('Server found in priority subnet, finishing early');
              finishDiscovery();
              return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          if (discovered.size > 0 && range.priority <= 2) {
            this.log('Servers found, skipping remaining ranges');
            break;
          }
        }
      };

      const finishDiscovery = () => {
        const results = Array.from(discovered.values());
        this.discoveredServers = results;
        this.log(`Discovery complete: found ${results.length} servers (${completedScans}/${totalScans} scanned)`);
        resolve(results);
      };

      scanInBatches().then(finishDiscovery);

      setTimeout(finishDiscovery, timeout);
    });
  },

  getSmartRange(clientLastOctet) {
    const range = [];
    const radius = 10;
    
    for (let offset = 0; offset <= radius; offset++) {
      if (offset === 0) {
        range.push(clientLastOctet);
      } else {
        if (clientLastOctet + offset <= 254) range.push(clientLastOctet + offset);
        if (clientLastOctet - offset >= 1) range.push(clientLastOctet - offset);
      }
    }
    
    range.push(1);
    
    return [...new Set(range)];
  },

  getCommonIPs() {
    return [1, 2, 3, 4, 5, 10, 20, 50, 100, 254];
  },

  // ============================================
  // ROOM FETCHING
  // ============================================
  
  getServerUrl() {
    if (window.location.protocol === 'https:') {
      return 'wss://salpakan-game.onrender.com';
    }
    return `ws://${window.location.hostname}:8080`;
  },

  async getRoomsFromAllServers() {
    await this.startServerDiscovery(6000);
    
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
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error(`Timeout connecting to ${serverName}`));
      }, 2000);

      ws.onopen = () => {
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
            serverUrl: serverUrl
          }));
          ws.close();
          resolve(roomsWithServer);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        this.log(`Error fetching from ${serverName}`);
        ws.close();
        resolve([]);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
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