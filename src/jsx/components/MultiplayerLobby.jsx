import React, { useState, useEffect } from 'react';

export default function AdvancedDiagnostics() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState([]);
  const logsEndRef = React.useRef(null);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check if files exist
  const checkCapacitorFiles = () => {
    addLog('=== CHECKING CONFIGURATION FILES ===', 'info');
    
    const checks = {
      capacitor: typeof window.Capacitor !== 'undefined',
      isNative: typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform(),
      platform: typeof window.Capacitor !== 'undefined' ? window.Capacitor.getPlatform() : 'web'
    };
    
    addLog(`Capacitor detected: ${checks.capacitor ? 'YES ✅' : 'NO ❌'}`, checks.capacitor ? 'success' : 'error');
    addLog(`Native platform: ${checks.isNative ? 'YES ✅' : 'NO ❌'}`, checks.isNative ? 'success' : 'warning');
    addLog(`Platform: ${checks.platform}`, 'info');
    
    return checks;
  };

  // Test fetch with detailed error
  const testFetchDetailed = async (url, protocol) => {
    addLog(`\n=== TESTING ${protocol.toUpperCase()} FETCH ===`, 'info');
    addLog(`URL: ${url}`, 'info');
    
    const result = {
      url,
      protocol,
      success: false,
      error: null,
      errorType: null,
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      addLog('Attempting fetch...', 'info');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addLog('Fetch timeout (10s)', 'error');
      }, 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      result.duration = Date.now() - startTime;
      
      addLog(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
      addLog(`Duration: ${result.duration}ms`, 'info');
      
      if (response.ok) {
        result.success = true;
        result.status = response.status;
        result.statusText = response.statusText;
        addLog(`✅ ${protocol.toUpperCase()} SUCCESS!`, 'success');
      } else {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        addLog(`❌ HTTP Error: ${result.error}`, 'error');
      }
      
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error.message;
      result.errorType = error.name;
      
      addLog(`❌ Error Type: ${error.name}`, 'error');
      addLog(`❌ Error Message: ${error.message}`, 'error');
      
      // Detailed error diagnosis
      if (error.name === 'TypeError') {
        addLog('💡 Network request failed - likely BLOCKED by Android', 'warning');
        addLog('💡 Need to configure AndroidManifest.xml', 'warning');
      } else if (error.name === 'AbortError') {
        addLog('💡 Request timed out - server may be asleep', 'warning');
      } else {
        addLog(`💡 Unknown error: ${error.toString()}`, 'error');
      }
    }
    
    return result;
  };

  // Test WebSocket with detailed logging
  const testWebSocketDetailed = (url, protocol) => {
    return new Promise((resolve) => {
      addLog(`\n=== TESTING ${protocol.toUpperCase()} WEBSOCKET ===`, 'info');
      addLog(`URL: ${url}`, 'info');
      
      const startTime = Date.now();
      let ws;
      const result = {
        url,
        protocol,
        attempted: true,
        opened: false,
        messageReceived: false,
        error: null,
        errorType: null,
        closeCode: null,
        closeReason: null,
        duration: 0
      };

      const timeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.CLOSED) {
          ws.close();
        }
        result.error = 'Timeout after 10 seconds';
        result.duration = Date.now() - startTime;
        addLog('❌ WebSocket timeout', 'error');
        resolve(result);
      }, 10000);

      try {
        addLog('Creating WebSocket...', 'info');
        ws = new WebSocket(url);
        addLog(`Initial readyState: ${ws.readyState} (0=CONNECTING)`, 'info');

        ws.onopen = () => {
          clearTimeout(timeout);
          result.opened = true;
          result.duration = Date.now() - startTime;
          addLog(`✅ WebSocket OPENED! (${result.duration}ms)`, 'success');
          addLog(`readyState: ${ws.readyState} (1=OPEN)`, 'success');
          
          try {
            const msg = JSON.stringify({ type: 'getRooms' });
            ws.send(msg);
            addLog('✅ Message sent: getRooms', 'success');
          } catch (e) {
            addLog(`❌ Failed to send: ${e.message}`, 'error');
          }
        };

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          result.messageReceived = true;
          result.duration = Date.now() - startTime;
          addLog(`✅ Message RECEIVED! (${result.duration}ms)`, 'success');
          
          try {
            const data = JSON.parse(event.data);
            result.responseType = data.type;
            addLog(`Response type: ${data.type}`, 'success');
            if (data.rooms) {
              addLog(`Rooms received: ${data.rooms.length}`, 'success');
            }
          } catch (e) {
            addLog(`Invalid JSON: ${e.message}`, 'error');
          }
          
          ws.close();
          resolve(result);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          result.error = 'WebSocket error event fired';
          result.errorType = 'WebSocket Error';
          result.duration = Date.now() - startTime;
          
          const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
          addLog(`❌ WebSocket ERROR!`, 'error');
          addLog(`readyState: ${ws.readyState} (${states[ws.readyState]})`, 'error');
          
          if (ws.readyState === 3) { // CLOSED
            addLog('💡 Connection closed immediately - likely BLOCKED', 'warning');
            addLog('💡 Android network security config needed', 'warning');
          }
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          result.closeCode = event.code;
          result.closeReason = event.reason || 'No reason provided';
          result.wasClean = event.wasClean;
          result.duration = Date.now() - startTime;
          
          addLog(`WebSocket CLOSED`, 'warning');
          addLog(`Code: ${event.code}`, 'warning');
          addLog(`Reason: ${result.closeReason}`, 'warning');
          addLog(`Clean: ${event.wasClean}`, 'warning');
          
          // Interpret close codes
          if (event.code === 1006) {
            addLog('💡 Code 1006 = ABNORMAL CLOSURE', 'error');
            addLog('💡 This means Android BLOCKED the connection', 'error');
            addLog('💡 NOT a server problem!', 'error');
          } else if (event.code === 1000) {
            addLog('💡 Code 1000 = Normal closure', 'success');
          }
          
          resolve(result);
        };

      } catch (e) {
        clearTimeout(timeout);
        result.error = `Exception: ${e.message}`;
        result.errorType = e.name;
        result.duration = Date.now() - startTime;
        addLog(`❌ Exception creating WebSocket: ${e.message}`, 'error');
        resolve(result);
      }
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults({});
    setLogs([]);
    
    addLog('🔍 STARTING COMPREHENSIVE DIAGNOSTICS', 'info');
    addLog('='.repeat(40), 'info');
    
    const testResults = {};

    // Check Capacitor
    testResults.capacitor = checkCapacitorFiles();
    
    // Environment
    addLog('\n=== ENVIRONMENT INFO ===', 'info');
    testResults.environment = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      online: navigator.onLine,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      webSocketSupport: typeof WebSocket !== 'undefined',
    };
    addLog(`Protocol: ${window.location.protocol}`, 'info');
    addLog(`Online: ${navigator.onLine ? 'YES ✅' : 'NO ❌'}`, navigator.onLine ? 'success' : 'error');

    // Test HTTPS
    testResults.https = await testFetchDetailed('https://salpakan-game.onrender.com/health', 'https');
    
    // Test HTTP (for comparison)
    testResults.http = await testFetchDetailed('http://salpakan-game.onrender.com/health', 'http');

    // Test WSS
    testResults.wss = await testWebSocketDetailed('wss://salpakan-game.onrender.com', 'wss');

    // Test WS (for comparison)
    testResults.ws = await testWebSocketDetailed('ws://salpakan-game.onrender.com', 'ws');

    // Summary
    addLog('\n=== TEST SUMMARY ===', 'info');
    addLog(`HTTPS: ${testResults.https.success ? '✅ PASS' : '❌ FAIL'}`, testResults.https.success ? 'success' : 'error');
    addLog(`WSS: ${testResults.wss.messageReceived ? '✅ PASS' : '❌ FAIL'}`, testResults.wss.messageReceived ? 'success' : 'error');
    
    if (!testResults.https.success && !testResults.wss.opened) {
      addLog('\n🚨 DIAGNOSIS: Android is BLOCKING network requests', 'error');
      addLog('📋 SOLUTION: Update Android configuration files', 'warning');
      addLog('   1. capacitor.config.ts', 'warning');
      addLog('   2. network_security_config.xml', 'warning');
      addLog('   3. AndroidManifest.xml', 'warning');
    }
    
    setResults(testResults);
    setTesting(false);
    addLog('\n✅ ALL TESTS COMPLETE', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-stone-950 to-zinc-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-lg border-4 border-yellow-700 p-6 mb-4">
          <h1 className="text-2xl font-serif font-bold text-yellow-400 mb-2 text-center">
            🔍 Mobile Network Diagnostics
          </h1>
          <p className="text-xs text-gray-400 text-center mb-4">
            Detailed logging for Android debugging
          </p>
          
          <button
            onClick={runTests}
            disabled={testing}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-xl font-serif font-bold rounded border-2 border-blue-600 disabled:opacity-50 mb-4 active:scale-95 transition-transform"
          >
            {testing ? '🔄 Running Tests...' : '▶️ Run Diagnostic Tests'}
          </button>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div className="bg-black rounded-lg p-4 mb-4 border-2 border-yellow-800 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-yellow-400 font-bold">Live Diagnostic Log:</h3>
                <span className="text-xs text-gray-500">{logs.length} entries</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className={`text-xs font-mono mb-1 leading-relaxed ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'warning' ? 'text-yellow-400' : 
                  'text-gray-400'
                }`}>
                  <span className="text-gray-600">[{log.time}]</span> {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Results Summary */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-3">
              {/* Quick Status */}
              <div className="bg-zinc-800 rounded-lg p-4 border-2 border-yellow-900">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">Quick Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`p-2 rounded ${results.https?.success ? 'bg-green-900' : 'bg-red-900'}`}>
                    <div className="font-bold">HTTPS</div>
                    <div>{results.https?.success ? '✅ Working' : '❌ Blocked'}</div>
                  </div>
                  <div className={`p-2 rounded ${results.wss?.messageReceived ? 'bg-green-900' : 'bg-red-900'}`}>
                    <div className="font-bold">WebSocket</div>
                    <div>{results.wss?.messageReceived ? '✅ Working' : '❌ Blocked'}</div>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              {results.https && !results.https.success && (
                <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 border-2 border-red-700">
                  <h3 className="text-lg font-bold text-red-400 mb-2">🚨 Problem Detected</h3>
                  <div className="text-sm text-red-300 space-y-1">
                    <p><strong>Issue:</strong> Android is blocking network requests</p>
                    <p><strong>Error:</strong> {results.https.error}</p>
                    <p><strong>Cause:</strong> Missing network security configuration</p>
                  </div>
                </div>
              )}

              {/* Solution */}
              {results.https && !results.https.success && (
                <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border-2 border-blue-700">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">💡 Solution</h3>
                  <div className="text-xs text-blue-300 space-y-1">
                    <p>You need to update 3 Android files:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                      <li><code className="bg-black px-1">capacitor.config.ts</code></li>
                      <li><code className="bg-black px-1">network_security_config.xml</code></li>
                      <li><code className="bg-black px-1">AndroidManifest.xml</code></li>
                    </ol>
                    <p className="mt-2">Then rebuild: <code className="bg-black px-1">npx cap sync android</code></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!testing && Object.keys(results).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Click "Run Diagnostic Tests" to check your connection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}