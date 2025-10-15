// ============================================
// jsx/components/ServerSettings.jsx
// ============================================

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-zinc-950 rounded-sm w-full max-w-md border-4 border-zinc-800" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative z-10 flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-zinc-100 tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 15px rgba(161,161,170,0.6)' }}>SERVER CONFIG</h2>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 text-3xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom min-h-0">
            <div className="space-y-6 pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>CLOUD SERVERS</h3>
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div key={server.type} className="bg-zinc-900 rounded-sm p-4 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={server.enabled}
                            onChange={() => handleToggleServer(server.type)}
                            className="w-5 h-5 mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-zinc-200 font-semibold text-sm uppercase tracking-wide" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                              {server.name}
                            </div>
                            <div className="text-xs text-zinc-600 font-mono">
                              {server.url}
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {server.enabled && (
                        <button
                          onClick={() => handleTestCloudConnection(server)}
                          disabled={isTestingIP === server.url}
                          className="mt-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-sm disabled:opacity-50 uppercase tracking-wider"
                          style={{ fontFamily: 'Courier New, monospace' }}
                        >
                          {isTestingIP === server.url ? '⏳ TESTING...' : '🔌 TEST'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Courier New, monospace' }}>LOCAL SERVERS</h3>
                
                <div className="bg-zinc-900 rounded-sm border border-zinc-800">
                  <div className="p-4 border-b border-zinc-800">
                    <p className="text-zinc-400 text-xs mb-2 uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>ADD LOCAL SERVER</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newServerIP}
                        onChange={(e) => setNewServerIP(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLocalServer()}
                        placeholder="192.168.1.5"
                        className="flex-1 px-3 py-2 bg-black text-zinc-200 border-2 border-zinc-800 focus:border-zinc-700 rounded-sm font-mono text-sm placeholder-zinc-700"
                        disabled={!!isTestingIP}
                      />
                      <button
                        onClick={handleAddLocalServer}
                        disabled={!newServerIP.trim() || !!isTestingIP}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTestingIP === newServerIP ? '⏳' : '➕'}
                      </button>
                    </div>
                    {testResult && (
                      <p className="text-xs mt-2 text-center text-zinc-400">{testResult}</p>
                    )}
                  </div>

                  <div className="overflow-y-auto scrollbar-custom" style={{ maxHeight: '200px' }}>
                    {localServers.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-zinc-500 text-xs uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>NO LOCAL SERVERS</p>
                        <p className="text-zinc-600 text-xs mt-1">Add a server IP to get started</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {localServers.map((server) => (
                          <div key={server.ip} className="bg-black rounded-sm p-3 mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={server.enabled}
                                  onChange={() => handleToggleLocalServer(server.ip)}
                                  className="w-4 h-4 mr-3"
                                />
                                <div className="flex-1">
                                  <div className="text-zinc-200 font-semibold text-sm uppercase tracking-wide" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                                    {server.name}
                                  </div>
                                  <div className="text-xs text-zinc-600 font-mono">
                                    {server.ip}
                                  </div>
                                </div>
                              </label>
                              <button
                                onClick={() => handleRemoveLocalServer(server.ip)}
                                className="text-red-700 hover:text-red-600 text-xl ml-2"
                                title="Remove server"
                              >
                                🗑️
                              </button>
                            </div>
                            
                            {server.enabled && (
                              <button
                                onClick={() => handleTestLocalConnection(server)}
                                disabled={isTestingIP === server.ip}
                                className="w-full mt-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-sm disabled:opacity-50 uppercase tracking-wider"
                                style={{ fontFamily: 'Courier New, monospace' }}
                              >
                                {isTestingIP === server.ip ? '⏳ TESTING...' : '🔌 TEST'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-zinc-900 bg-opacity-50 rounded-sm border border-zinc-800">
                  <p className="text-zinc-500 text-xs" style={{ fontFamily: 'Courier New, monospace' }}>
                    💡 Run <span className="font-mono bg-black px-1 text-zinc-400">node server.js</span> to start local server
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white font-bold rounded-sm border-2 border-zinc-600 hover:border-red-700 uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)]"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              💾 SAVE
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold rounded-sm border-2 border-zinc-800 uppercase tracking-wider transition-all"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
          border-radius: 0;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.8);
          border-radius: 0;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 1);
        }
      `}</style>
    </div>
  );
}