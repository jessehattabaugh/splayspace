export async function get(req) {
  try {
    // Determine WebSocket URL for the environment
    const stage = process.env.NODE_ENV === 'production' ? 'production' : 
                 (process.env.NODE_ENV === 'staging' ? 'staging' : '');
    
    // Array of possible WSS URLs to try, in order of preference
    const wsUrls = [];
    
    // 1. Use environment-provided URL first
    if (process.env.ARC_WSS_URL) {
      // For API Gateway WebSockets, the URL format might be different
      // It should include the stage in the path, not just domain
      if (process.env.ARC_WSS_URL.includes('execute-api')) {
        // AWS API Gateway WebSocket URL format
        wsUrls.push(`wss://${process.env.ARC_WSS_URL}${stage ? `/${stage}` : ''}`);
        // Try also with explicit WebSocket path
        wsUrls.push(`wss://${process.env.ARC_WSS_URL}/websocket${stage ? `/${stage}` : ''}`);
      } else {
        // Standard WebSocket URL
        wsUrls.push(`wss://${process.env.ARC_WSS_URL}${stage ? `/${stage}` : ''}`);
      }
    }
    
    // 2. For API Gateway URLs, construct alternatives with and without stages
    if (req.headers?.host?.includes('execute-api')) {
      const apiId = req.headers.host.split('.')[0];
      const region = req.headers.host.split('.')[2] || 'us-west-2';
      
      // Try both with and without explicit stages
      wsUrls.push(`wss://${apiId}.execute-api.${region}.amazonaws.com/${stage || 'staging'}`);
      wsUrls.push(`wss://${apiId}.execute-api.${region}.amazonaws.com/${stage || 'staging'}/websocket`);
      wsUrls.push(`wss://${apiId}.execute-api.${region}.amazonaws.com/websocket`);
    }
    
    // 3. For local testing, use localhost with port 3333
    if (process.env.NODE_ENV === 'testing' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      wsUrls.push('ws://localhost:3333');
    }
    
    // 4. Try to construct a URL from the request host
    const reqHost = req.headers?.host;
    if (reqHost) {
      // If we're on HTTPS, use WSS
      const reqProtocol = req.headers?.['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
      wsUrls.push(`${reqProtocol}://${reqHost}`);
      
      // If this is API Gateway, try with the WebSocket path too
      if (reqHost.includes('execute-api')) {
        wsUrls.push(`${reqProtocol}://${reqHost}/websocket`);
      }
    }
    
    // 5. Fallback to a hardcoded staging URL
    wsUrls.push('wss://staging.splayspace.com');
    
    // Use the first URL in our list
    const wsUrl = wsUrls[0];
    
    // Log the URL we're using for debugging
    console.log(`Providing WebSocket URL options: ${wsUrls.join(', ')} (environment: ${process.env.NODE_ENV || 'development'})`);
      
    // Game configuration options for the client
    const gameConfig = {
      chunkSize: 100,
      renderDistance: 3,
      resourceSpawnRate: 0.3,
      defaultInventorySize: 20,
      defaultOwnershipWindow: { width: 10, height: 10, level: 'basic' }
    };
    
    return {
      json: { 
        wsUrl,
        allWsUrls: wsUrls, // Provide all potential URLs so client can try fallbacks if needed
        gameConfig,
        env: process.env.NODE_ENV || 'development',
        serverTime: Date.now()
      }
    };
  } catch (error) {
    console.error('Error in API handler:', error);
    return {
      statusCode: 500,
      json: {
        error: 'Internal server error',
        wsUrl: 'ws://localhost:3333', // Fallback for emergencies
        allWsUrls: ['ws://localhost:3333'],
        serverTime: Date.now()
      }
    };
  }
}
