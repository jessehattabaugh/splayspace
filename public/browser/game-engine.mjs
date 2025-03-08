// Game engine for rendering and updating the game state

/**
 * Initialize the game engine
 * @param {Object} gameState - The shared game state object
 * @returns {Object} - Game engine functions
 */
export function initGame(gameState) {
  // Get canvas and context
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  
  // Get mini-map canvas and context
  const miniMapCanvas = document.getElementById('mini-map-canvas');
  const miniMapCtx = miniMapCanvas.getContext('2d');
  
  // Set up canvas sizes based on window
  function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  // Handle window resize
  window.addEventListener('resize', setupCanvas);
  setupCanvas();
  
  // Tile size in pixels
  const tileSize = 32;
  
  // Camera position (centered on player)
  const camera = {
    x: 0,
    y: 0
  };
  
  // Colors for different terrain types
  const terrainColors = {
    water: '#0077be',
    sand: '#c2b280',
    grass: '#567d46',
    forest: '#2e4600',
    mountain: '#6b6b6b',
    snow: '#ffffff',
    rock: '#75715e',
    dirt: '#8b4513',
    path: '#d2b48c'
  };
  
  // Colors for resources
  const resourceColors = {
    stone: '#808080',
    wood: '#8b4513',
    metal: '#a9a9a9',
    crystal: '#add8e6',
    fabric: '#f5deb3',
    art: '#ff69b4'
  };
  
  // Update game state
  function update(deltaTime) {
    // Update camera position to follow player
    if (gameState.player) {
      camera.x = gameState.player.position.x * tileSize;
      camera.y = gameState.player.position.y * tileSize;
      
      // Update coordinates display
      const coordsElement = document.getElementById('player-coordinates');
      coordsElement.textContent = `X: ${Math.floor(gameState.player.position.x)} Y: ${Math.floor(gameState.player.position.y)}`;
      
      // Request nearby chunks if they don't exist
      const chunkSize = gameState.settings.chunkSize;
      const renderDistance = gameState.settings.renderDistance;
      const playerChunkX = Math.floor(gameState.player.position.x / chunkSize);
      const playerChunkY = Math.floor(gameState.player.position.y / chunkSize);
      
      // Check for chunks in render distance and request if needed
      for (let y = -renderDistance; y <= renderDistance; y++) {
        for (let x = -renderDistance; x <= renderDistance; x++) {
          const chunkX = playerChunkX + x;
          const chunkY = playerChunkY + y;
          const chunkKey = `${chunkX}:${chunkY}`;
          
          if (!gameState.world.has(chunkKey)) {
            gameState.world.set(chunkKey, { loading: true });
            
            // Request this chunk from server
            if (gameState.webSocket) {
              gameState.webSocket.requestWorldChunk(chunkX, chunkY);
            }
          }
        }
      }
    }
    
    // Update mini-map
    updateMiniMap();
  }
  
  // Render the game world
  function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!gameState.player) return;
    
    // Calculate viewport dimensions
    const viewportWidth = canvas.width;
    const viewportHeight = canvas.height;
    
    // Calculate camera offset (centered on player)
    const cameraOffsetX = Math.floor(viewportWidth / 2);
    const cameraOffsetY = Math.floor(viewportHeight / 2);
    
    // Calculate visible tile range
    const tilesX = Math.ceil(viewportWidth / tileSize) + 1;
    const tilesY = Math.ceil(viewportHeight / tileSize) + 1;
    const halfTilesX = Math.floor(tilesX / 2);
    const halfTilesY = Math.floor(tilesY / 2);
    
    // Calculate player position in tile coordinates
    const playerTileX = Math.floor(gameState.player.position.x);
    const playerTileY = Math.floor(gameState.player.position.y);
    
    // Render visible terrain
    for (let y = -halfTilesY; y <= halfTilesY; y++) {
      for (let x = -halfTilesX; x <= halfTilesX; x++) {
        const tileX = playerTileX + x;
        const tileY = playerTileY + y;
        
        // Calculate the screen position
        const screenX = cameraOffsetX + (x * tileSize);
        const screenY = cameraOffsetY + (y * tileSize);
        
        // Get terrain at this position
        const terrain = getTerrainAt(tileX, tileY);
        
        // Draw terrain tile
        if (terrain) {
          ctx.fillStyle = terrainColors[terrain.type] || '#333';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          
          // Add a subtle grid
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        } else {
          // Unknown terrain, draw placeholder
          ctx.fillStyle = '#333';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
      }
    }
    
    // Render resources
    gameState.resources.forEach(resource => {
      // Calculate screen position of resource
      const screenX = cameraOffsetX + ((resource.position.x - playerTileX) * tileSize);
      const screenY = cameraOffsetY + ((resource.position.y - playerTileY) * tileSize);
      
      // Check if resource is on screen
      if (screenX >= -tileSize && screenX <= viewportWidth + tileSize &&
          screenY >= -tileSize && screenY <= viewportHeight + tileSize) {
        
        // Draw resource
        if (resource.type === 'art' && resource.data) {
          // Render art from pixel data
          renderArt(ctx, resource.data, screenX, screenY, tileSize);
        } else {
          // Render regular resource
          ctx.fillStyle = resourceColors[resource.type] || '#fff';
          ctx.beginPath();
          ctx.arc(screenX + tileSize/2, screenY + tileSize/2, tileSize/3, 0, Math.PI * 2);
          ctx.fill();
          
          // Add quantity if more than 1
          if (resource.quantity > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(resource.quantity, screenX + tileSize/2, screenY + tileSize/2 + 4);
          }
        }
      }
    });
    
    // Render other players
    gameState.users.forEach(user => {
      if (user.userId === gameState.player.userId) return; // Skip self
      
      // Calculate screen position of other player
      const screenX = cameraOffsetX + ((user.position.x - playerTileX) * tileSize);
      const screenY = cameraOffsetY + ((user.position.y - playerTileY) * tileSize);
      
      // Check if user is on screen
      if (screenX >= -tileSize && screenX <= viewportWidth + tileSize &&
          screenY >= -tileSize && screenY <= viewportHeight + tileSize) {
        
        // Draw player avatar
        ctx.fillStyle = user.color || '#ff0000';
        ctx.beginPath();
        ctx.arc(screenX + tileSize/2, screenY + tileSize/2, tileSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Render player in the center
    ctx.fillStyle = gameState.player.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(cameraOffsetX + tileSize/2, cameraOffsetY + tileSize/2, tileSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw ownership window if enabled
    if (gameState.player.ownershipWindow) {
      const { width, height } = gameState.player.ownershipWindow;
      const windowX = cameraOffsetX - (width * tileSize / 2);
      const windowY = cameraOffsetY - (height * tileSize / 2);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(windowX, windowY, width * tileSize, height * tileSize);
      ctx.setLineDash([]);
    }
    
    // Draw interaction indicator if nearby resources or players
    const nearestEntity = findNearestInteractable();
    if (nearestEntity) {
      const interactX = cameraOffsetX + ((nearestEntity.position.x - playerTileX) * tileSize);
      const interactY = cameraOffsetY + ((nearestEntity.position.y - playerTileY) * tileSize);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(interactX + tileSize/2, interactY - 10);
      ctx.lineTo(interactX + tileSize/2 + 5, interactY - 5);
      ctx.lineTo(interactX + tileSize/2 - 5, interactY - 5);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Update the mini-map
  function updateMiniMap() {
    if (!gameState.player) return;
    
    // Clear mini-map
    miniMapCtx.fillStyle = '#000';
    miniMapCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    const miniMapSize = miniMapCanvas.width;
    const miniMapCenter = miniMapSize / 2;
    const scaleFactor = 5; // Each pixel represents 5 world tiles
    
    // Draw world chunks
    gameState.world.forEach((chunk, key) => {
      if (chunk.loading) return;
      
      const [chunkX, chunkY] = key.split(':').map(Number);
      const chunkSize = gameState.settings.chunkSize;
      
      // Determine chunk color based on predominant terrain
      let waterCount = 0;
      let landCount = 0;
      let mountainCount = 0;
      
      if (chunk.terrain) {
        // Sample terrain to determine color
        for (let y = 0; y < chunk.terrain.length; y += 10) {
          for (let x = 0; x < chunk.terrain[y].length; x += 10) {
            const tile = chunk.terrain[y][x];
            if (tile.type === 'water') waterCount++;
            else if (tile.type === 'mountain' || tile.type === 'snow') mountainCount++;
            else landCount++;
          }
        }
      }
      
      // Choose color based on terrain counts
      let chunkColor;
      if (waterCount > landCount && waterCount > mountainCount) {
        chunkColor = '#0077be';
      } else if (mountainCount > landCount && mountainCount > waterCount) {
        chunkColor = '#6b6b6b';
      } else {
        chunkColor = '#567d46';
      }
      
      // Calculate chunk position relative to player
      const playerChunkX = Math.floor(gameState.player.position.x / chunkSize);
      const playerChunkY = Math.floor(gameState.player.position.y / chunkSize);
      
      const relX = (chunkX - playerChunkX) * (chunkSize / scaleFactor);
      const relY = (chunkY - playerChunkY) * (chunkSize / scaleFactor);
      
      // Draw chunk on mini-map
      miniMapCtx.fillStyle = chunkColor;
      miniMapCtx.fillRect(
        miniMapCenter + relX,
        miniMapCenter + relY,
        chunkSize / scaleFactor,
        chunkSize / scaleFactor
      );
    });
    
    // Draw resources as dots
    miniMapCtx.fillStyle = '#ffff00';
    gameState.resources.forEach(resource => {
      const rx = (resource.position.x - gameState.player.position.x) / scaleFactor + miniMapCenter;
      const ry = (resource.position.y - gameState.player.position.y) / scaleFactor + miniMapCenter;
      
      if (rx >= 0 && rx < miniMapSize && ry >= 0 && ry < miniMapSize) {
        miniMapCtx.fillRect(rx, ry, 2, 2);
      }
    });
    
    // Draw other players
    gameState.users.forEach(user => {
      if (user.userId === gameState.player.userId) return;
      
      const ux = (user.position.x - gameState.player.position.x) / scaleFactor + miniMapCenter;
      const uy = (user.position.y - gameState.player.position.y) / scaleFactor + miniMapCenter;
      
      if (ux >= 0 && ux < miniMapSize && uy >= 0 && uy < miniMapSize) {
        miniMapCtx.fillStyle = user.color || '#ff0000';
        miniMapCtx.beginPath();
        miniMapCtx.arc(ux, uy, 2, 0, Math.PI * 2);
        miniMapCtx.fill();
      }
    });
    
    // Draw player in center
    miniMapCtx.fillStyle = '#ffffff';
    miniMapCtx.beginPath();
    miniMapCtx.arc(miniMapCenter, miniMapCenter, 2, 0, Math.PI * 2);
    miniMapCtx.fill();
  }
  
  // Helper function to get terrain at a specific world position
  function getTerrainAt(x, y) {
    const chunkSize = gameState.settings.chunkSize;
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    const chunkKey = `${chunkX}:${chunkY}`;
    
    const chunk = gameState.world.get(chunkKey);
    
    if (!chunk || chunk.loading || !chunk.terrain) {
      return null;
    }
    
    // Convert world coordinates to chunk-local coordinates
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    const localY = ((y % chunkSize) + chunkSize) % chunkSize;
    
    // Ensure we are within bounds of the terrain array
    if (chunk.terrain[localY] && chunk.terrain[localY][localX]) {
      return chunk.terrain[localY][localX];
    }
    
    return null;
  }
  
  // Render art from pixel data
  function renderArt(ctx, artData, x, y, size) {
    if (!artData || !artData.pixels || !artData.width || !artData.height) return;
    
    const pixelSize = size / Math.max(artData.width, artData.height);
    
    // Draw each pixel
    for (let py = 0; py < artData.height; py++) {
      for (let px = 0; px < artData.width; px++) {
        const colorIndex = py * artData.width + px;
        const color = artData.pixels[colorIndex];
        
        if (color) {  // Skip transparent pixels
          ctx.fillStyle = color;
          ctx.fillRect(
            x + (px * pixelSize),
            y + (py * pixelSize),
            pixelSize,
            pixelSize
          );
        }
      }
    }
    
    // Add a border around the art
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeRect(x, y, size, size);
  }
  
  // Find the nearest interactable entity (resource or player)
  function findNearestInteractable() {
    if (!gameState.player) return null;
    
    const playerPos = gameState.player.position;
    let nearest = null;
    let nearestDist = 2;  // Max interaction distance
    
    // Check resources
    gameState.resources.forEach(resource => {
      const dx = resource.position.x - playerPos.x;
      const dy = resource.position.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearest = resource;
        nearestDist = dist;
      }
    });
    
    // Check players
    gameState.users.forEach(user => {
      if (user.userId === gameState.player.userId) return;
      
      const dx = user.position.x - playerPos.x;
      const dy = user.position.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearest = user;
        nearestDist = dist;
      }
    });
    
    return nearest;
  }
  
  return {
    update,
    render,
    getTerrainAt
  };
}
