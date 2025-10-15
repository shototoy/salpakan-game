import React, { useState, useEffect } from 'react';
import ServerSettings from './ServerSettings';

export default function MultiplayerLobby({ onBack, onCreateRoom, onJoinRoom, roomId, setRoomId, WebSocketManager, onRefreshRooms }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showServerSelect, setShowServerSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enabledServers, setEnabledServers] = useState([]);

  useEffect(() => {
    loadEnabledServers();
    fetchAllRooms();
    const interval = setInterval(fetchAllRooms, 2000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // SERVER MANAGEMENT
  // ============================================

  const loadEnabledServers = () => {
    const servers = WebSocketManager.getEnabledServers();
    const uniqueServers = servers.reduce((acc, server) => {
      const exists = acc.find(s => s.url === server.url);
      if (!exists) {
        acc.push(server);
      }
      return acc;
    }, []);
    setEnabledServers(uniqueServers);
  };

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  const fetchAllRooms = async () => {
    setIsLoading(true);
    
    try {
      const rooms = await WebSocketManager.getRoomsFromAllServers();
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllRooms();
  };

  const handleCreateRoom = (serverUrl) => {
    onCreateRoom(serverUrl);
    setShowServerSelect(false);
  };

  const handleShowCreateRoom = () => {
    loadEnabledServers();
    const servers = WebSocketManager.getEnabledServers();
    const uniqueServers = servers.reduce((acc, server) => {
      const exists = acc.find(s => s.url === server.url);
      if (!exists) {
        acc.push(server);
      }
      return acc;
    }, []);
    
    if (uniqueServers.length === 0) {
      alert('No servers configured. Please add a server in Settings.');
      setShowSettings(true);
      return;
    }
    
    if (uniqueServers.length === 1) {
      handleCreateRoom(uniqueServers[0].url);
    } else {
      setShowServerSelect(true);
    }
  };

  // ============================================
  // UI HELPERS
  // ============================================

  const getServerTypeInfo = (server) => {
    if (server.type === 'cloud') {
      return { emoji: '☁️', label: 'Cloud', color: 'from-purple-700 to-purple-800 border-purple-600' };
    } else if (server.type === 'manual') {
      return { emoji: '🏠', label: 'LAN', color: 'from-blue-700 to-blue-800 border-blue-600' };
    } else {
      return { emoji: '🔧', label: 'Custom', color: 'from-green-700 to-green-800 border-green-600' };
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl w-full max-w-md border-4 border-yellow-700" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="text-yellow-600 hover:text-yellow-400 font-serif text-sm">
              ← Back
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-yellow-600 hover:text-yellow-400 font-serif text-sm"
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🌐</div>
            <h2 className="text-2xl font-serif font-black text-yellow-400 mb-1 tracking-wider">ONLINE BATTLE</h2>
          </div>

          {showServerSelect ? (
            <div className="flex-1 flex flex-col min-h-0">
              <button onClick={() => setShowServerSelect(false)} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">
                ← Back to Lobby
              </button>
              <h3 className="text-xl font-serif font-bold text-yellow-400 mb-4 text-center">Select Server</h3>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom">
                <div className="flex flex-col gap-3 pb-2">
                  {enabledServers.map(server => {
                    const info = getServerTypeInfo(server);
                    return (
                      <button 
                        key={server.url}
                        onClick={() => handleCreateRoom(server.url)}
                        className={`w-full px-6 py-4 text-white text-lg font-serif font-bold rounded border-2 shadow-lg hover:opacity-90 transition-all bg-gradient-to-r ${info.color}`}>
                        <div className="flex items-center justify-between">
                          <span>{info.emoji} {server.name}</span>
                          <span className="text-xs opacity-75">{info.label}</span>
                        </div>
                        {server.ip && (
                          <div className="text-xs opacity-75 mt-1 font-mono">{server.ip}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <button onClick={handleShowCreateRoom}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white text-xl font-serif font-bold rounded border-2 border-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg mb-4">
                ➕ CREATE ROOM
              </button>

              <div className="flex-1 flex flex-col min-h-0 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-yellow-600 font-serif text-sm">Available Rooms ({availableRooms.length})</p>
                  <button 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className={`text-yellow-600 hover:text-yellow-400 text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🔄
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom min-h-0">
                  {availableRooms && availableRooms.length > 0 ? (
                    <div className="py-1 px-1.5">
                      {availableRooms.map((room, idx) => {
                        const info = getServerTypeInfo({ 
                          type: room.server.includes('Cloud') ? 'cloud' : 'manual'
                        });
                        return (
                          <button 
                            key={`${room.serverUrl}-${room.id}-${idx}`} 
                            onClick={() => onJoinRoom(room.id, room.serverUrl)}
                            className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 scale-[0.92] hover:scale-100 text-yellow-400 rounded border border-yellow-800 font-mono mb-1.5 text-left transition-all overflow-hidden">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold truncate">{room.id}</span>
                              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                                  info.label === 'Cloud' 
                                    ? 'bg-purple-900 text-purple-300'
                                    : 'bg-blue-900 text-blue-300'
                                }`}>
                                  {info.emoji} {room.server}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">{room.players}/2</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center px-1">
                      <div className="w-full p-4 bg-zinc-800 rounded border border-yellow-900 text-center">
                        <p className="text-yellow-600 text-sm">No rooms available</p>
                        <p className="text-gray-500 text-xs mt-1">Create one or join by ID</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-yellow-900 pt-3">
                <p className="text-yellow-600 font-serif text-xs mb-2 text-center">Join by Room ID</p>
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-black text-yellow-400 border-2 border-yellow-800 rounded font-mono text-base text-center mb-2"
                  maxLength={6}
                />
                <button
                  onClick={() => {
                    if (roomId.length === 6) {
                      const enabledServers = WebSocketManager.getEnabledServers();
                      const uniqueServers = enabledServers.reduce((acc, server) => {
                        const exists = acc.find(s => s.url === server.url);
                        if (!exists) {
                          acc.push(server);
                        }
                        return acc;
                      }, []);
                      
                      if (uniqueServers.length === 0) {
                        alert('No servers configured. Please add a server in Settings.');
                        setShowSettings(true);
                        return;
                      }
                      const cloudServer = uniqueServers.find(s => s.type === 'cloud');
                      const serverUrl = cloudServer ? cloudServer.url : uniqueServers[0].url;
                      onJoinRoom(roomId, serverUrl);
                    }
                  }}
                  disabled={roomId.length !== 6}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-lg font-serif font-bold rounded border-2 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-yellow-700">
                  🚪 JOIN ROOM
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <ServerSettings 
          WebSocketManager={WebSocketManager}
          onClose={() => setShowSettings(false)}
          onSave={() => {
            setShowSettings(false);
            loadEnabledServers();
            handleRefresh();
          }}
        />
      )}

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