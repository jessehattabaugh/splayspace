import { initWebSocket } from './websocket.mjs';
import { initGame } from './game-engine.mjs';
import { setupInputHandlers } from './input-handlers.mjs';
import { initUI } from './ui-controller.mjs';
import { initArtEditor } from './art-editor.mjs';

// Main game state
const gameState = {
  player: null,
  users: new Map(),
  world: new Map(),
  resources: new Map(),
  settings: {
    chunkSize: 100,
    renderDistance: 2
  }
};

// Initialize components and start game
async function initializeGame() {
  try {
    const { updateProgress, hideLoadingScreen } = setupLoadingUI();
    
    // Initialize components in sequence
    updateProgress('Connecting to server...', 10);
    const webSocket = await initWebSocket(gameState);
    gameState.webSocket = webSocket;
    
    updateProgress('Setting up game engine...', 30);
    const gameEngine = initGame(gameState);
    gameState.getTerrainAt = gameEngine.getTerrainAt;
    
    updateProgress('Setting up controls...', 50);
    const inputHandlers = setupInputHandlers(gameState, webSocket);
    
    updateProgress('Initializing user interface...', 70);
    initUI(gameState, webSocket);
    
    updateProgress('Setting up art editor...', 90);
    initArtEditor(gameState, webSocket);
    
    updateProgress('Ready to play!', 100);
    
    // Start the game loop
    startGameLoop(gameEngine, inputHandlers);
    
    // Hide loading screen after a short delay
    setTimeout(hideLoadingScreen, 1000);
    
    // Set up visibility change handler
    handleVisibilityChanges();
    
  } catch (error) {
    showError(error.message);
  }
}

function setupLoadingUI() {
  const loadingScreen = document.getElementById('loading-screen');
  const loadingMessage = document.getElementById('loading-message');
  const loadingProgress = document.getElementById('loading-progress');
  
  return {
    updateProgress: (message, percent) => {
      loadingMessage.innerText = message;
      loadingProgress.style.width = `${percent}%`;
    },
    hideLoadingScreen: () => loadingScreen.classList.add('hidden')
  };
}

function showError(message) {
  const loadingMessage = document.getElementById('loading-message');
  loadingMessage.innerText = `Error: ${message}. Please refresh the page.`;
  console.error('Game initialization error:', message);
}

function startGameLoop(gameEngine, inputHandlers) {
  let lastTime = 0;
  
  function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Process user input
    inputHandlers.processInput();
    
    // Update game state
    gameEngine.update(deltaTime);
    
    // Render frame
    gameEngine.render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
  }
  
  // Start the loop
  requestAnimationFrame(gameLoop);
}

function handleVisibilityChanges() {
  document.addEventListener('visibilitychange', () => {
    // Pause/resume game processing based on visibility
    gameState.active = !document.hidden;
  });
}

// Start when DOM is ready
window.addEventListener('DOMContentLoaded', initializeGame);

// Export for testing
export { gameState };
