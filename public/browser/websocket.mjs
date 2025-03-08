// WebSocket connection handling

// Use server-provided WebSocket URL or fall back to auto-detection
function getWebSocketUrl() {
  // Use the URL provided by the server if available
  if (window.WS_URL) {
    return window.WS_URL;
  }
  
  // Otherwise auto-detect based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
}

/**
 * Initialize the WebSocket connection
 * @param {Object} gameState - The shared game state object
 * @returns {Object} - WebSocket interface
 */
export async function initWebSocket(gameState) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(getWebSocketUrl());
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    // WebSocket event handlers
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      reconnectAttempts = 0;
      resolve(createWebSocketInterface(socket, gameState));
    });
    
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      if (reconnectAttempts === 0) {
        reject(new Error('Failed to connect to game server'));
      }
    });
    
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, 5000);
        
        addNotification(`Connection lost. Reconnecting in ${delay/1000}s...`, 'error');
        
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          initWebSocket(gameState).catch(err => {
            console.error('Reconnection failed:', err);
          });
        }, delay);
      } else {
        addNotification('Could not reconnect to the server. Please refresh the page.', 'error');
      }
    });
    
    socket.addEventListener('message', (event) => {
      handleServerMessage(JSON.parse(event.data), gameState);
    });
  });
}

/**
 * Create a WebSocket interface for sending messages
 */
function createWebSocketInterface(socket, gameState) {
  return {
    sendMove: (x, y) => {
      socket.send(JSON.stringify({
        type: 'MOVE',
        payload: { x, y }
      }));
    },
    
    requestWorldChunk: (chunkX, chunkY) => {
      socket.send(JSON.stringify({
        type: 'GET_WORLD_CHUNK',
        payload: { chunkX, chunkY }
      }));
    },
    
    sendChatMessage: (message) => {
      socket.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        payload: { message }
      }));
    },
    
    collectResource: (resourceId) => {
      socket.send(JSON.stringify({
        type: 'COLLECT_RESOURCE',
        payload: { resourceId }
      }));
    },
    
    createArt: (art, position) => {
      socket.send(JSON.stringify({
        type: 'CREATE_ART',
        payload: { art, position }
      }));
    }
  };
}

/**
 * Handle messages received from the server
 */
function handleServerMessage(message, gameState) {
  const { type } = message;
  
  switch (type) {
    case 'USER_JOINED':
      handleUserJoined(message, gameState);
      break;
      
    case 'USER_LEFT':
      handleUserLeft(message, gameState);
      break;
      
    case 'USER_MOVED':
      handleUserMoved(message, gameState);
      break;
      
    case 'WORLD_CHUNK_DATA':
      handleWorldChunkData(message, gameState);
      break;
      
    case 'CHAT_MESSAGE':
      handleChatMessage(message);
      break;
      
    case 'RESOURCE_COLLECTED':
      handleResourceCollected(message, gameState);
      break;
      
    case 'NEW_ART_CREATED':
      handleNewArtCreated(message, gameState);
      break;
      
    default:
      console.warn('Unknown message type received:', type);
  }
}

// Individual message handlers
function handleUserJoined(message, gameState) {
  const { user } = message;
  gameState.users.set(user.userId, user);
  
  updateOnlineUserCount(gameState);
  addNotification(`Player joined the world`, 'info');
}

function handleUserLeft(message, gameState) {
  const { userId } = message;
  gameState.users.delete(userId);
  
  updateOnlineUserCount(gameState);
  addNotification(`Player left the world`, 'info');
}

function handleUserMoved(message, gameState) {
  const { userId, position } = message;
  const user = gameState.users.get(userId);
  
  if (user) {
    user.position = position;
  }
}

function handleWorldChunkData(message, gameState) {
  const { chunkX, chunkY, data } = message;
  const chunkKey = `${chunkX}:${chunkY}`;
  
  gameState.world.set(chunkKey, data);
  
  // Add resources to the resource map
  if (data.resources) {
    data.resources.forEach(resource => {
      gameState.resources.set(resource.id, {
        ...resource,
        chunkX,
        chunkY
      });
    });
  }
}

function handleChatMessage(message) {
  const chatMessages = document.getElementById('chat-messages');
  const { userId, message: text, timestamp } = message;
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${userId === gameState.player?.userId ? 'self' : 'other'}`;
  
  const time = new Date(timestamp).toLocaleTimeString();
  messageElement.innerHTML = `<span class="time">[${time}]</span> ${text}`;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // If chat is hidden, show a notification
  const chatPanel = document.getElementById('chat-panel');
  if (chatPanel.classList.contains('hidden')) {
    addNotification('New chat message received', 'info');
  }
}

function handleResourceCollected(message, gameState) {
  const { resourceId, resource } = message;
  
  // Remove resource from the map
  gameState.resources.delete(resourceId);
  
  // Update inventory UI
  updateInventory(gameState);
  
  addNotification(`Collected ${resource.type}`, 'success');
}

function handleNewArtCreated(message, gameState) {
  const { resourceId, creator, position, data } = message;
  
  // Add to resources
  gameState.resources.set(resourceId, {
    id: resourceId,
    type: 'art',
    position,
    data,
    creator
  });
  
  addNotification('New artwork was created nearby!', 'info');
}

// Helper functions
function updateOnlineUserCount(gameState) {
  const onlineCount = document.getElementById('online-count');
  onlineCount.textContent = gameState.users.size.toString();
}

function addNotification(message, type = 'info') {
  const notifications = document.getElementById('notifications');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notifications.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
}

function updateInventory(gameState) {
  const inventorySlots = document.getElementById('inventory-slots');
  
  // Clear existing slots
  inventorySlots.innerHTML = '';
  
  if (!gameState.player || !gameState.player.inventory) return;
  
  // Create slots for each inventory item
  gameState.player.inventory.forEach(item => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    
    // Create icon based on resource type
    const icon = document.createElement('div');
    icon.className = `resource-icon ${item.type}`;
    
    // Add quantity if applicable
    if (item.quantity > 1) {
      const quantity = document.createElement('div');
      quantity.className = 'quantity';
      quantity.textContent = item.quantity.toString();
      slot.appendChild(quantity);
    }
    
    slot.appendChild(icon);
    inventorySlots.appendChild(slot);
  });
}
