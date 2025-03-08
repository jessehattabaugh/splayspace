/**
 * Live API handler for Enhance
 * Provides server-side data to the client
 */

export async function get(req) {
  // Determine WebSocket URL
  const wsUrl = getWebSocketUrl(req);
  
  // Prepare game settings
  const gameSettings = {
    chunkSize: 100,
    renderDistance: 2,
    initialPosition: { x: 0, y: 0 }
  };
  
  return {
    json: {
      wsUrl,
      gameSettings,
      serverTime: Date.now()
    }
  };
}

/**
 * Determine the appropriate WebSocket URL based on the environment
 */
function getWebSocketUrl(req) {
  // Use session value if available
  if (req.session?.wsUrl) {
    return req.session.wsUrl;
  }
  
  // Use param value if available (useful for testing)
  if (req.params?.wsUrl) {
    return req.params.wsUrl;
  }
  
  // Array of possible WSS URLs to try, in order of preference
  const wsUrls = [];
  
  // 1. Use environment-provided URL first
  const stage = process.env.NODE_ENV === 'production' ? 'production' : 
              (process.env.NODE_ENV === 'staging' ? 'staging' : '');
  
  if (process.env.ARC_WSS_URL) {
    wsUrls.push(`wss://${process.env.ARC_WSS_URL}${stage ? `/${stage}` : ''}`);
  }
  
  // 2. For local testing, use localhost with port 3333
  if (process.env.NODE_ENV === 'testing' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    wsUrls.push('ws://localhost:3333');
  }
  
  // 3. Try to construct a URL from the request host
  const reqHost = req.headers?.host;
  if (reqHost) {
    // If we're on HTTPS, use WSS
    const reqProtocol = req.headers?.['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
    wsUrls.push(`${reqProtocol}://${reqHost}`);
  }
  
  // 4. Fallback to a hardcoded staging URL
  wsUrls.push('wss://staging.splayspace.com');
  
  // Use the first URL in our list
  return wsUrls[0];
}
