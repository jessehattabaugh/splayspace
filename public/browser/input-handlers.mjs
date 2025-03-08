/**
 * Sets up all input handlers for the game
 * @param {Object} gameState - The shared game state object
 * @param {Object} webSocket - WebSocket interface
 */
export function setupInputHandlers(gameState, webSocket) {
  // Store the current input state
  const inputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    movementSpeed: 0.1,  // Tiles per frame
    lastInteraction: 0
  };
  
  // Store gamepad state
  let gamepads = {};
  let gamepadConnected = false;
  
  // Set up keyboard handlers
  setupKeyboardHandlers();
  
  // Set up touch/mobile handlers
  setupTouchHandlers();
  
  // Set up mouse handlers
  setupMouseHandlers();
  
  // Set up gamepad handlers
  setupGamepadHandlers();
  
  // Process inputs on animation frame
  function processInput() {
    const now = Date.now();
    
    // Only process movement if enough time has passed (for performance)
    if (now - inputState.lastInteraction < 16) return; // ~60fps
    
    // Check if any movement keys are pressed
    if (inputState.up || inputState.down || inputState.left || inputState.right) {
      movePlayer();
      inputState.lastInteraction = now;
    }
    
    // Check for gamepad input if connected
    if (gamepadConnected) {
      updateGamepadInput();
    }
  }
  
  function movePlayer() {
    if (!gameState.player) return;
    
    // Calculate new position based on input
    let newX = gameState.player.position.x;
    let newY = gameState.player.position.y;
    
    if (inputState.up) newY -= inputState.movementSpeed;
    if (inputState.down) newY += inputState.movementSpeed;
    if (inputState.left) newX -= inputState.movementSpeed;
    if (inputState.right) newX += inputState.movementSpeed;
    
    // Check if new position is valid (not water/mountains)
    const terrain = gameState.getTerrainAt?.(Math.floor(newX), Math.floor(newY));
    if (!terrain || terrain.walkable) {
      // Update local position immediately for responsive feel
      gameState.player.position.x = newX;
      gameState.player.position.y = newY;
      
      // Send position to server (throttled)
      if (Date.now() - inputState.lastServerUpdate > 100) { // 10 updates per second
        webSocket.sendMove(newX, newY);
        inputState.lastServerUpdate = Date.now();
      }
    }
  }
  
  function setupKeyboardHandlers() {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputState.up = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputState.down = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputState.left = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputState.right = true;
          break;
        case ' ':
        case 'Enter':
          handleAction();
          break;
        case 'e':
        case 'E':
          toggleInventory();
          break;
        case 't':
        case 'T':
          toggleChat();
          break;
        case 'Escape':
          closeAllPanels();
          break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputState.up = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputState.down = false;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputState.left = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputState.right = false;
          break;
      }
    });
  }
  
  function setupTouchHandlers() {
    // D-pad controls for mobile
    const upBtn = document.getElementById('up');
    const downBtn = document.getElementById('down');
    const leftBtn = document.getElementById('left');
    const rightBtn = document.getElementById('right');
    const actionABtn = document.getElementById('action-a');
    const actionBBtn = document.getElementById('action-b');
    
    // Touch handlers for d-pad
    if (upBtn) {
      upBtn.addEventListener('touchstart', () => { inputState.up = true; });
      upBtn.addEventListener('touchend', () => { inputState.up = false; });
    }
    
    if (downBtn) {
      downBtn.addEventListener('touchstart', () => { inputState.down = true; });
      downBtn.addEventListener('touchend', () => { inputState.down = false; });
    }
    
    if (leftBtn) {
      leftBtn.addEventListener('touchstart', () => { inputState.left = true; });
      leftBtn.addEventListener('touchend', () => { inputState.left = false; });
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('touchstart', () => { inputState.right = true; });
      rightBtn.addEventListener('touchend', () => { inputState.right = false; });
    }
    
    if (actionABtn) {
      actionABtn.addEventListener('touchstart', handleAction);
    }
    
    if (actionBBtn) {
      actionBBtn.addEventListener('touchstart', toggleInventory);
    }
    
    // For mobile devices, enable touch drag on canvas for movement
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      let touchStartX = 0;
      let touchStartY = 0;
      
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      });
      
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          
          // Calculate direction based on drag
          const dx = touchX - touchStartX;
          const dy = touchY - touchStartY;
          const threshold = 10;
          
          inputState.left = dx < -threshold;
          inputState.right = dx > threshold;
          inputState.up = dy < -threshold;
          inputState.down = dy > threshold;
          
          e.preventDefault(); // Prevent scrolling
        }
      });
      
      canvas.addEventListener('touchend', () => {
        // Reset movement when touch ends
        inputState.left = false;
        inputState.right = false;
        inputState.up = false;
        inputState.down = false;
      });
    }
  }
  
  function setupMouseHandlers() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    // For click-to-move functionality
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Convert click position to world coordinates
      const viewportWidth = canvas.width;
      const viewportHeight = canvas.height;
      const tileSize = 32; // Match with game-engine tileSize
      
      const worldX = gameState.player.position.x + (clickX - viewportWidth/2) / tileSize;
      const worldY = gameState.player.position.y + (clickY - viewportHeight/2) / tileSize;
      
      // Check if we're clicking on an interactable entity
      const interactable = findInteractableAt(worldX, worldY);
      if (interactable) {
        interactWithEntity(interactable);
        return;
      }
      
      // Otherwise, check if the tile is walkable
      const terrain = gameState.getTerrainAt(Math.floor(worldX), Math.floor(worldY));
      if (terrain && terrain.walkable) {
        // TODO: Implement pathfinding for click-to-move
        // For now, just set target position
        gameState.targetPosition = { x: worldX, y: worldY };
      }
    });
  }
  
  function setupGamepadHandlers() {
    // Listen for gamepad connection/disconnection
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      gamepads[e.gamepad.index] = true;
      gamepadConnected = true;
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      delete gamepads[e.gamepad.index];
      gamepadConnected = Object.keys(gamepads).length > 0;
    });
  }
  
  function updateGamepadInput() {
    // Get gamepads
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // Check each connected gamepad
    for (const pad of pads) {
      if (!pad) continue;
      
      // Deadzone for analog sticks
      const deadzone = 0.2;
      
      // Left analog stick / D-pad
      if (Math.abs(pad.axes[0]) > deadzone) {
        inputState.left = pad.axes[0] < -deadzone;
        inputState.right = pad.axes[0] > deadzone;
      } else {
        // Digital D-pad
        inputState.left = pad.buttons[14]?.pressed;
        inputState.right = pad.buttons[15]?.pressed;
      }
      
      if (Math.abs(pad.axes[1]) > deadzone) {
        inputState.up = pad.axes[1] < -deadzone;
        inputState.down = pad.axes[1] > deadzone;
      } else {
        // Digital D-pad
        inputState.up = pad.buttons[12]?.pressed;
        inputState.down = pad.buttons[13]?.pressed;
      }
      
      // Action button (A button - index 0)
      if (pad.buttons[0]?.pressed && !inputState.action) {
        inputState.action = true;
        handleAction();
      } else if (!pad.buttons[0]?.pressed) {
        inputState.action = false;
      }
      
      // Inventory (B button - index 1)
      if (pad.buttons[1]?.pressed && !inputState.inventory) {
        inputState.inventory = true;
        toggleInventory();
      } else if (!pad.buttons[1]?.pressed) {
        inputState.inventory = false;
      }
      
      // Chat (Y button - index 3)
      if (pad.buttons[3]?.pressed && !inputState.chat) {
        inputState.chat = true;
        toggleChat();
      } else if (!pad.buttons[3]?.pressed) {
        inputState.chat = false;
      }
    }
  }
  
  // Interaction handling
  function handleAction() {
    if (!gameState.player) return;
    
    // Find nearest interactable entity
    const interactable = findNearestInteractable();
    if (interactable) {
      interactWithEntity(interactable);
    }
  }
  
  function findNearestInteractable() {
    if (!gameState.player) return null;
    
    const pos = gameState.player.position;
    let nearest = null;
    let nearestDist = 1.5; // Max interaction distance
    
    // Check resources first
    gameState.resources.forEach((resource, id) => {
      const dx = resource.position.x - pos.x;
      const dy = resource.position.y - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < nearestDist) {
        nearest = { type: 'resource', id, ...resource };
        nearestDist = dist;
      }
    });
    
    // Then check players
    gameState.users.forEach((user, userId) => {
      if (userId === gameState.player.userId) return; // Skip self
      
      const dx = user.position.x - pos.x;
      const dy = user.position.y - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < nearestDist) {
        nearest = { type: 'user', userId, ...user };
        nearestDist = dist;
      }
    });
    
    return nearest;
  }
  
  function findInteractableAt(x, y) {
    // Check if any resource is at this position
    let found = null;
    const interactRadius = 0.5;
    
    gameState.resources.forEach((resource, id) => {
      const dx = resource.position.x - x;
      const dy = resource.position.y - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < interactRadius) {
        found = { type: 'resource', id, ...resource };
      }
    });
    
    // Check players too
    gameState.users.forEach((user, userId) => {
      if (userId === gameState.player.userId) return;
      
      const dx = user.position.x - x;
      const dy = user.position.y - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < interactRadius) {
        found = { type: 'user', userId, ...user };
      }
    });
    
    return found;
  }
  
  function interactWithEntity(entity) {
    if (entity.type === 'resource') {
      // Collect resource
      webSocket.collectResource(entity.id);
      
      // Add notification
      const notifyElement = document.getElementById('notifications');
      if (notifyElement) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `Collecting ${entity.type}...`;
        notifyElement.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 500);
        }, 2000);
      }
    } else if (entity.type === 'user') {
      // Interact with user - open a trade or chat
      toggleChat();
      
      // Auto-fill chat with @username
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.value = `@${entity.userId.substring(0, 5)} `;
        chatInput.focus();
      }
    }
  }
  
  // UI toggle functions
  function toggleInventory() {
    const inventoryPanel = document.getElementById('inventory-panel');
    if (inventoryPanel) {
      inventoryPanel.classList.toggle('hidden');
    }
    
    // Close other panels
    closePanel('chat-panel');
    closePanel('art-editor');
  }
  
  function toggleChat() {
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
      chatPanel.classList.toggle('hidden');
      
      // Focus input if opening
      if (!chatPanel.classList.contains('hidden')) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
      }
    }
    
    // Close other panels
    closePanel('inventory-panel');
    closePanel('art-editor');
  }
  
  function toggleArtEditor() {
    const artEditor = document.getElementById('art-editor');
    if (artEditor) {
      artEditor.classList.toggle('hidden');
    }
    
    // Close other panels
    closePanel('inventory-panel');
    closePanel('chat-panel');
  }
  
  function closePanel(id) {
    const panel = document.getElementById(id);
    if (panel && !panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
    }
  }
  
  function closeAllPanels() {
    closePanel('inventory-panel');
    closePanel('chat-panel');
    closePanel('art-editor');
  }
  
  // Set up UI button handlers
  function setupUIHandlers() {
    // Button handlers
    const toggleInventoryBtn = document.getElementById('toggle-inventory');
    if (toggleInventoryBtn) {
      toggleInventoryBtn.addEventListener('click', toggleInventory);
    }
    
    const toggleChatBtn = document.getElementById('toggle-chat');
    if (toggleChatBtn) {
      toggleChatBtn.addEventListener('click', toggleChat);
    }
    
    const toggleEditorBtn = document.getElementById('toggle-editor');
    if (toggleEditorBtn) {
      toggleEditorBtn.addEventListener('click', toggleArtEditor);
    }
    
    // Close buttons
    const closeInventoryBtn = document.getElementById('close-inventory');
    if (closeInventoryBtn) {
      closeInventoryBtn.addEventListener('click', () => closePanel('inventory-panel'));
    }
    
    const closeChatBtn = document.getElementById('close-chat');
    if (closeChatBtn) {
      closeChatBtn.addEventListener('click', () => closePanel('chat-panel'));
    }
    
    const closeEditorBtn = document.getElementById('close-editor');
    if (closeEditorBtn) {
      closeEditorBtn.addEventListener('click', () => closePanel('art-editor'));
    }
    
    // Send chat message
    const sendMessageBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');
    if (sendMessageBtn && chatInput) {
      sendMessageBtn.addEventListener('click', sendChatMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }
  }
  
  function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput && chatInput.value.trim()) {
      webSocket.sendChatMessage(chatInput.value.trim());
      chatInput.value = '';
    }
  }
  
  // Initialize
  setupUIHandlers();
  
  // Return the necessary functions for the game loop
  return {
    processInput,
    toggleInventory,
    toggleChat,
    toggleArtEditor,
    closeAllPanels
  };
}
