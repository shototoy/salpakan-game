// ============================================
// jsx/components/MultiplayerLobby.jsx
// ============================================

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
      return { emoji: '☁️', label: 'CLOUD', color: 'from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black border-zinc-600 hover:border-red-700' };
    } else if (server.type === 'manual') {
      return { emoji: '🏠', label: 'LAN', color: 'from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black border-zinc-600 hover:border-red-700' };
    } else {
      return { emoji: '🔧', label: 'CUSTOM', color: 'from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black border-zinc-600 hover:border-red-700' };
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-4">
      <div className="relative bg-zinc-950 p-10 rounded-sm shadow-2xl w-full max-w-md border-4 border-zinc-800" style={{ height: '600px', maxHeight: '90vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-black/30 pointer-events-none rounded-sm"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="text-zinc-400 hover:text-zinc-100 text-xs uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>
              ← RETURN
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-zinc-400 hover:text-zinc-100 text-xs uppercase tracking-wider"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              ⚙ CONFIG
            </button>
          </div>

          <div className="text-center mb-4">
            <div className="text-4xl mb-2 filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">🌐</div>
            <h2 className="text-2xl font-black text-zinc-100 mb-1 tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '2px 2px 0px rgba(0,0,0,1), 0 0 20px rgba(220,38,38,0.5), 0 0 3px rgba(161,161,170,0.8)' }}>
              NETWORK BATTLE
            </h2>
          </div>

          {showServerSelect ? (
            <div className="flex-1 flex flex-col min-h-0">
              <button onClick={() => setShowServerSelect(false)} className="mb-4 text-zinc-400 hover:text-zinc-100 text-xs uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>
                ← RETURN
              </button>
              <h3 className="text-lg font-black text-zinc-200 mb-4 text-center tracking-widest uppercase" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: '1px 1px 0px rgba(0,0,0,1), 0 0 10px rgba(161,161,170,0.6)' }}>SELECT SERVER</h3>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom">
                <div className="flex flex-col gap-3 pb-2">
                  {enabledServers.map(server => {
                    const info = getServerTypeInfo(server);
                    return (
                      <button 
                        key={server.url}
                        onClick={() => handleCreateRoom(server.url)}
                        className={`w-full px-6 py-4 bg-gradient-to-b text-zinc-100 hover:text-white text-base font-bold rounded-sm border-2 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_20px_rgba(161,161,170,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.4)] transform scale-95 hover:scale-100 transition-all uppercase tracking-wider ${info.color}`}
                        style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                        <div className="flex items-center justify-between">
                          <span>{info.emoji} {server.name}</span>
                          <span className="text-xs opacity-75">{info.label}</span>
                        </div>
                        {server.ip && (
                          <div className="text-xs opacity-75 mt-1 font-mono normal-case tracking-normal">{server.ip}</div>
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
                className="w-full px-5 py-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-lg font-bold rounded-sm border-2 border-zinc-600 hover:border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] mb-3 uppercase tracking-wider transition-all transform hover:scale-105"
                style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                ➕ CREATE ROOM
              </button>

              <div className="flex-1 flex flex-col min-h-0 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>AVAILABLE ROOMS ({availableRooms.length})</p>
                  <button 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className={`text-zinc-400 hover:text-zinc-100 text-xs ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            className="w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 scale-95 hover:scale-100 text-zinc-200 hover:text-zinc-100 rounded-sm border border-zinc-800 hover:border-zinc-700 font-mono mb-1.5 text-left transition-all overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold truncate">{room.id}</span>
                              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-sm whitespace-nowrap bg-zinc-800 text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>
                                  {info.emoji} {room.server}
                                </span>
                                <span className="text-xs text-zinc-600 mt-1">{room.players}/2</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center px-1">
                      <div className="w-full p-4 bg-zinc-900 rounded-sm border border-zinc-800 text-center">
                        <p className="text-zinc-400 text-sm uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>NO ROOMS AVAILABLE</p>
                        <p className="text-zinc-600 text-xs mt-1">Create one or join by ID</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <p className="text-zinc-400 text-xs mb-2 text-center uppercase tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>JOIN BY ROOM ID</p>
                <input
                  type="text"
                  placeholder="ENTER ROOM ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-black text-zinc-200 border-2 border-zinc-800 focus:border-zinc-700 rounded-sm font-mono text-base text-center mb-2 placeholder-zinc-700"
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
                  className="w-full px-5 py-2.5 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 hover:from-red-950 hover:via-red-900 hover:to-black text-zinc-100 hover:text-white text-lg font-bold rounded-sm border-2 border-zinc-600 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_15px_rgba(161,161,170,0.3),inset_0_1px_0_rgba(161,161,170,0.2)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.8),0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(239,68,68,0.3)] uppercase tracking-wider transition-all"
                  style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
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