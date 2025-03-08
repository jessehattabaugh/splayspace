const arc = require('@architect/functions');

exports.handler = async function handler(req) {
  // Get WebSocket URL from environment
  const stage = process.env.NODE_ENV !== 'testing' ? process.env.NODE_ENV : '';
  const wsUrl = process.env.ARC_WSS_URL ? 
    `wss://${process.env.ARC_WSS_URL}/${stage}` : 
    'ws://localhost:3333';
  
  // Return the Enhance page
  // Enhance will automatically find and use the app/pages/index.js template
  return {
    wsUrl
  };
};
