import React, { useState, useEffect } from 'react';

export default function ServerSettings({ WebSocketManager, onClose, onSave }) {
  const [servers, setServers] = useState([]);
  const [localServers, setLocalServers] = useState([]);
  const [newServerIP, setNewServerIP] = useState('');
  const [isTestingIP, setIsTestingIP] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  const loadSettings = () => {
    const settings = WebSocketManager.getStoredSettings();
    const defaultServers = WebSocketManager.getDefaultServers();

    if (settings) {
      if (settings.servers) {
        const merged = defaultServers.map(server => {
          const saved = settings.servers.find(s => s.type === server.type);
          return saved ? { ...server, enabled: saved.enabled } : server;
        });
        setServers(merged);
      } else {
        setServers(defaultServers);
      }

      if (settings.localServers) {
        setLocalServers(settings.localServers);
      }
    } else {
      setServers(defaultServers);
    }
  };

  const handleSaveSettings = () => {
    const settings = {
      servers: servers.map(s => ({ type: s.type, enabled: s.enabled })),
      localServers: localServers
    };

    WebSocketManager.saveSettings(settings);
    
    WebSocketManager.discoveredServers = [];
    
    localServers.filter(s => s.enabled).forEach(server => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${server.ip}:8080`;
      
      WebSocketManager.discoveredServers.push({
        name: server.name,
        url: wsUrl,
        type: 'manual',
        enabled: true,
        ip: server.ip
      });
    });
    
    if (onSave) onSave();
    if (onClose) onClose();
  };

  // ============================================
  // CLOUD SERVERS
  // ============================================

  const handleToggleServer = (type) => {
    setServers(prev => prev.map(server => 
      server.type === type ? { ...server, enabled: !server.enabled } : server
    ));
  };

  const handleTestCloudConnection = async (server) => {
    setIsTestingIP(server.url);
    try {
      const rooms = await WebSocketManager.fetchRoomsFromServer(server.url, server.name);
      alert(`✅ Connected to ${server.name}!\nFound ${rooms.length} rooms.`);
    } catch (error) {
      alert(`❌ Failed to connect to ${server.name}\n${error.message}`);
    } finally {
      setIsTestingIP('');
    }
  };

  // ============================================
  // LOCAL SERVERS
  // ============================================

  const handleAddLocalServer = async () => {
    if (!newServerIP.trim()) return;
    
    setIsTestingIP(newServerIP);
    setTestResult('Testing connection...');

    const server = await WebSocketManager.connectToManualIP(newServerIP.trim());
    
    if (server) {
      const exists = localServers.some(s => s.ip === server.ip);
      if (!exists) {
        setLocalServers(prev => [...prev, {
          ip: server.ip,
          name: server.name,
          enabled: true,
          addedAt: Date.now()
        }]);
        setTestResult('✅ Server added successfully!');
        setNewServerIP('');
      } else {
        setTestResult('⚠️ Server already exists');
      }
    } else {
      setTestResult('❌ Cannot connect to server');
    }

    setIsTestingIP('');
    setTimeout(() => setTestResult(''), 3000);
  };

  const handleRemoveLocalServer = (ip) => {
    setLocalServers(prev => prev.filter(s => s.ip !== ip));
  };

  const handleToggleLocalServer = (ip) => {
    setLocalServers(prev => prev.map(s => 
      s.ip === ip ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleTestLocalConnection = async (server) => {
    setIsTestingIP(server.ip);
    
    const testServer = await WebSocketManager.connectToManualIP(server.ip);
    
    if (testServer) {
      alert(`✅ Connected to ${server.name}!\nIP: ${server.ip}`);
    } else {
      alert(`❌ Failed to connect to ${server.name}\n\nMake sure:\n• Server is running (node server.js)\n• You're on the same WiFi network\n• IP address is correct`);
    }
    
    setIsTestingIP('');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-lg w-full max-w-md border-4 border-yellow-700" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-yellow-400">Server Settings</h2>
            <button 
              onClick={onClose}
              className="text-yellow-600 hover:text-yellow-400 text-3xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom min-h-0">
            <div className="space-y-6 pb-2">
              <div>
                <h3 className="text-lg font-serif font-bold text-yellow-400 mb-3">Cloud Servers</h3>
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div key={server.type} className="bg-zinc-800 rounded-lg p-4 border border-yellow-900">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={server.enabled}
                            onChange={() => handleToggleServer(server.type)}
                            className="w-5 h-5 mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-yellow-400 font-semibold">
                              {server.name}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {server.url}
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {server.enabled && (
                        <button
                          onClick={() => handleTestCloudConnection(server)}
                          disabled={isTestingIP === server.url}
                          className="mt-2 px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                        >
                          {isTestingIP === server.url ? '⏳ Testing...' : '🔌 Test Connection'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-serif font-bold text-yellow-400 mb-3">Local Servers</h3>
                
                <div className="bg-zinc-800 rounded-lg border border-yellow-900">
                  <div className="p-4 border-b border-yellow-900">
                    <p className="text-yellow-600 text-xs mb-2">Add Local Server</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newServerIP}
                        onChange={(e) => setNewServerIP(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLocalServer()}
                        placeholder="e.g., 192.168.1.5"
                        className="flex-1 px-3 py-2 bg-black text-yellow-400 border-2 border-yellow-800 rounded font-mono text-sm"
                        disabled={!!isTestingIP}
                      />
                      <button
                        onClick={handleAddLocalServer}
                        disabled={!newServerIP.trim() || !!isTestingIP}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTestingIP === newServerIP ? '⏳' : '➕'}
                      </button>
                    </div>
                    {testResult && (
                      <p className="text-xs mt-2 text-center text-yellow-400">{testResult}</p>
                    )}
                  </div>

                  <div className="overflow-y-auto scrollbar-custom" style={{ maxHeight: '200px' }}>
                    {localServers.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 text-sm">No local servers added</p>
                        <p className="text-gray-600 text-xs mt-1">Add a server IP to get started</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {localServers.map((server) => (
                          <div key={server.ip} className="bg-black rounded-lg p-3 mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={server.enabled}
                                  onChange={() => handleToggleLocalServer(server.ip)}
                                  className="w-4 h-4 mr-3"
                                />
                                <div className="flex-1">
                                  <div className="text-yellow-400 font-semibold text-sm">
                                    {server.name}
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono">
                                    {server.ip}
                                  </div>
                                </div>
                              </label>
                              <button
                                onClick={() => handleRemoveLocalServer(server.ip)}
                                className="text-red-500 hover:text-red-400 text-xl ml-2"
                                title="Remove server"
                              >
                                🗑️
                              </button>
                            </div>
                            
                            {server.enabled && (
                              <button
                                onClick={() => handleTestLocalConnection(server)}
                                disabled={isTestingIP === server.ip}
                                className="w-full mt-2 px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                              >
                                {isTestingIP === server.ip ? '⏳ Testing...' : '🔌 Test Connection'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-900 bg-opacity-20 rounded border border-blue-800">
                  <p className="text-blue-400 text-xs">
                    💡 <strong>Tip:</strong> Run <span className="font-mono bg-black px-1">node server.js</span> on a computer to start a local server. The IP will be displayed in the console.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-yellow-900">
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-serif font-bold rounded-lg border-2 border-green-600"
            >
              💾 Save Settings
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 font-serif font-bold rounded-lg border-2 border-yellow-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(202, 138, 4, 0.5);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(202, 138, 4, 0.7);
        }
      `}</style>
    </div>
  );
}