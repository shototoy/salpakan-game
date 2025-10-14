// ============================================
// SERVER SETTINGS COMPONENT
// ============================================

import React, { useState, useEffect } from 'react';
import WebSocketManager from '../../js/WebSocketManager';

export default function ServerSettings({ WebSocketManager, onClose, onSave }) {
  const [servers, setServers] = useState([]);
  const [customLocal, setCustomLocal] = useState({
    enabled: false,
    ip: '',
    port: '8080'
  });

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

      if (settings.localServer) {
        setCustomLocal(settings.localServer);
      }
    } else {
      setServers(defaultServers);
    }
  };

  const handleToggleServer = (type) => {
    setServers(prev => prev.map(server => 
      server.type === type ? { ...server, enabled: !server.enabled } : server
    ));
  };

  const handleSaveSettings = () => {
    const settings = {
      servers: servers.map(s => ({ type: s.type, enabled: s.enabled })),
      localServer: customLocal
    };

    WebSocketManager.saveSettings(settings);
    
    if (onSave) onSave();
    if (onClose) onClose();
  };

  const handleTestConnection = async (server) => {
    try {
      const rooms = await WebSocketManager.fetchRoomsFromServer(server.url, server.name);
      alert(`✅ Connected to ${server.name}!\nFound ${rooms.length} rooms.`);
    } catch (error) {
      alert(`❌ Failed to connect to ${server.name}\n${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Server Settings</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {servers.map((server) => (
              <div key={server.type} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={() => handleToggleServer(server.type)}
                      className="w-5 h-5 mr-3"
                    />
                    <div>
                      <div className="text-white font-semibold">
                        {server.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {server.url}
                      </div>
                    </div>
                  </label>
                </div>
                
                {server.enabled && (
                  <button
                    onClick={() => handleTestConnection(server)}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Test Connection
                  </button>
                )}
              </div>
            ))}

            <div className="bg-gray-800 rounded-lg p-4">
              <label className="flex items-center cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={customLocal.enabled}
                  onChange={(e) => setCustomLocal(prev => ({ 
                    ...prev, 
                    enabled: e.target.checked 
                  }))}
                  className="w-5 h-5 mr-3"
                />
                <span className="text-white font-semibold">
                  Custom Local Server
                </span>
              </label>

              {customLocal.enabled && (
                <div className="ml-8 space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={customLocal.ip}
                      onChange={(e) => setCustomLocal(prev => ({ 
                        ...prev, 
                        ip: e.target.value 
                      }))}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={customLocal.port}
                      onChange={(e) => setCustomLocal(prev => ({ 
                        ...prev, 
                        port: e.target.value 
                      }))}
                      placeholder="8080"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded">
                    💡 Tip: Find the server's IP by running <code className="text-blue-400">ipconfig</code> on Windows or <code className="text-blue-400">ifconfig</code> on Mac/Linux
                  </div>

                  <button
                    onClick={() => handleTestConnection({ 
                      name: 'Custom Local', 
                      url: `ws://${customLocal.ip}:${customLocal.port}` 
                    })}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Test Custom Server
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
            >
              Save Settings
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}