import { initWebSocket } from './websocket.mjs';
import { initGame } from './game-engine.mjs';
import { setupInputHandlers } from './input-handlers.mjs';
import { initUI } from './ui-controller.mjs';
import { initArtEditor } from './art-editor.mjs';

// State management
let gameState = {
  player: null,
  users: new Map(),
  world: new Map(),
  resources: new Map(),
  settings: {
    chunkSize: 100,
    renderDistance: 2
  }
};

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', async () => {
  // Show the loading screen
  const loadingScreen = document.getElementById('loading-screen');
  const loadingMessage = document.getElementById('loading-message');
  const loadingProgress = document.getElementById('loading-progress');
  
  // Update progress function
  const updateProgress = (message, percent) => {
    loadingMessage.innerText = message;
    loadingProgress.style.width = `${percent}%`;
  };
  
  // Initialize components in sequence
  try {
    updateProgress('Connecting to server...', 10);
    const webSocket = await initWebSocket(gameState);
    
    updateProgress('Setting up game engine...', 30);
    const { render, update } = initGame(gameState);
    
    updateProgress('Setting up controls...', 50);
    setupInputHandlers(gameState, webSocket);
    
    updateProgress('Initializing user interface...', 70);
    initUI(gameState, webSocket);
    
    updateProgress('Setting up art editor...', 90);
    initArtEditor(gameState, webSocket);
    
    // Start the game loop
    updateProgress('Ready to play!', 100);
    
    // Animation loop
    let lastTime = 0;
    function gameLoop(timestamp) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      update(deltaTime);
      render();
      
      requestAnimationFrame(gameLoop);
    }
    
    // Hide loading screen and start game
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      requestAnimationFrame(gameLoop);
    }, 1000);
    
  } catch (error) {
    loadingMessage.innerText = `Error: ${error.message}. Please refresh the page.`;
    console.error('Game initialization error:', error);
  }
});

// Handle visibility change to conserve resources
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Game is inactive, can pause updates
  } else {
    // Game is active again, resume updates
  }
});

// Export for testing
export { gameState };
