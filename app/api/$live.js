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
  
  // Check if running in AWS environment
  const isAws = process.env.ARC_WSS_URL;
  if (isAws) {
    const stage = process.env.NODE_ENV || 'staging';
    return `wss://${process.env.ARC_WSS_URL}/${stage}`;
  }
  
  // Local development default
  return 'ws://localhost:3333';
}
