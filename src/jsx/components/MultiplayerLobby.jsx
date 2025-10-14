import React, { useState, useEffect } from 'react';
import ServerSettings from './ServerSettings';

export default function MultiplayerLobby({ onBack, onCreateRoom, onJoinRoom, roomId, setRoomId, WebSocketManager, onRefreshRooms }) {
  const [showServerSelect, setShowServerSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const servers = WebSocketManager.getAllServers();

  useEffect(() => {
    fetchAllRooms();
    const interval = setInterval(fetchAllRooms, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const handleJoinRoom = (room) => {
    onJoinRoom(room.id, room.serverUrl);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-lg shadow-2xl max-w-md w-full border-4 border-yellow-700">
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

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌐</div>
          <h2 className="text-3xl font-serif font-black text-yellow-400 mb-2 tracking-wider">ONLINE BATTLE</h2>
        </div>

        {showServerSelect ? (
          <div>
            <button onClick={() => setShowServerSelect(false)} className="mb-4 text-yellow-600 hover:text-yellow-400 font-serif text-sm">
              ← Back to Lobby
            </button>
            <h3 className="text-xl font-serif font-bold text-yellow-400 mb-4 text-center">Select Server</h3>
            <div className="flex flex-col gap-3">
              {servers.filter(s => s.enabled).map(server => (
                <button 
                  key={server.url}
                  onClick={() => handleCreateRoom(server.url)}
                  className={`w-full px-6 py-4 text-white text-lg font-serif font-bold rounded border-2 shadow-lg hover:opacity-90 transition-all ${
                    server.type === 'cloud'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-800 border-purple-600'
                      : server.type === 'discovered'
                      ? 'bg-gradient-to-r from-blue-700 to-blue-800 border-blue-600'
                      : 'bg-gradient-to-r from-green-700 to-green-800 border-green-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span>
                      {server.type === 'cloud' ? '☁️' : server.type === 'discovered' ? '🏠' : '🔧'} {server.name}
                    </span>
                    <span className="text-xs opacity-75">
                      {server.type === 'cloud' ? 'Cloud' : 'LAN'}
                    </span>
                  </div>
                </button>
              ))}
              {servers.filter(s => s.enabled).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-yellow-600 mb-2">No servers enabled</p>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Configure servers →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setShowServerSelect(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white text-xl font-serif font-bold rounded border-2 border-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg mb-4">
              ➕ CREATE ROOM
            </button>

            {availableRooms && availableRooms.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-yellow-600 font-serif text-sm">Available Rooms ({availableRooms.length})</p>
                  <button 
                    onClick={handleRefresh}
                    className={`text-yellow-600 hover:text-yellow-400 text-sm ${isLoading ? 'animate-spin' : ''}`}
                  >
                    🔄
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableRooms.map((room, idx) => (
                    <button 
                      key={`${room.serverUrl}-${room.id}-${idx}`} 
                      onClick={() => handleJoinRoom(room)}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded border border-yellow-800 font-mono mb-2 text-left transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">{room.id}</span>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            room.server === 'Cloud' 
                              ? 'bg-purple-900 text-purple-300'
                              : room.server && room.server.includes('Local')
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-green-900 text-green-300'
                          }`}>
                            {room.server}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">{room.players}/2</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && (!availableRooms || availableRooms.length === 0) && (
              <div className="mb-4 p-4 bg-zinc-800 rounded border border-yellow-900 text-center">
                <p className="text-yellow-600 text-sm">No rooms available</p>
                <p className="text-gray-500 text-xs mt-1">Create one or join by ID</p>
              </div>
            )}

            {isLoading && (
              <div className="mb-4 p-4 bg-zinc-800 rounded border border-yellow-900 text-center">
                <p className="text-yellow-600 text-sm">Discovering rooms...</p>
              </div>
            )}

            <div className="border-t border-yellow-900 pt-4 mt-4">
              <p className="text-yellow-600 font-serif text-xs mb-2 text-center">Join by Room ID</p>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-black text-yellow-400 border-2 border-yellow-800 rounded font-mono text-lg text-center mb-2"
                maxLength={6}
              />
              <button
                onClick={() => roomId.length === 6 && handleJoinRoom({ id: roomId, serverUrl: WebSocketManager.getServerUrl() })}
                disabled={roomId.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-700 to-yellow-800 text-black text-lg font-serif font-bold rounded border-2 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-yellow-700">
                🚪 JOIN ROOM
              </button>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <ServerSettings 
          WebSocketManager={WebSocketManager}
          onClose={() => setShowSettings(false)}
          onSave={() => {
            setShowSettings(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}