/**
 * Manages the art editor functionality
 * @param {Object} gameState - Shared game state
 * @param {Object} webSocket - WebSocket interface for communication
 */
export function initArtEditor(gameState, webSocket) {
  // Editor state
  const editorState = {
    currentTool: 'pencil',
    currentColor: '#000000',
    brushSize: 1,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    canvasWidth: 32,
    canvasHeight: 32
  };

  // Get DOM elements
  const artEditor = document.getElementById('art-editor');
  const canvas = document.getElementById('art-canvas');
  const ctx = canvas.getContext('2d');
  const colorDisplay = document.getElementById('current-color-display');
  const brushSize = document.getElementById('brush-size');
  const clearBtn = document.getElementById('clear-canvas');
  const saveBtn = document.getElementById('save-art');
  const copyBtn = document.getElementById('copy-art');
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const toolButtons = document.querySelectorAll('.tool-button');

  // Initialize canvas
  function initCanvas() {
    // Set physical canvas size
    canvas.width = editorState.canvasWidth;
    canvas.height = editorState.canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up canvas for pixel art
    ctx.imageSmoothingEnabled = false;
  }

  // Set up event listeners
  function setupEventListeners() {
    // Tool selection
    toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all tools
        toolButtons.forEach(b => b.classList.remove('active'));
        
        // Add active class to selected tool
        button.classList.add('active');
        
        // Set current tool based on button ID
        editorState.currentTool = button.id.replace('-tool', '');
      });
    });
    
    // Color selection
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        editorState.currentColor = swatch.style.backgroundColor;
        colorDisplay.style.backgroundColor = editorState.currentColor;
      });
    });
    
    // Brush size
    brushSize.addEventListener('input', () => {
      editorState.brushSize = parseInt(brushSize.value, 10);
    });
    
    // Clear canvas
    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    // Save art
    saveBtn.addEventListener('click', saveArtwork);
    
    // Copy art
    copyBtn.addEventListener('click', copyArtToClipboard);
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
  }

  function startDrawing(e) {
    editorState.isDrawing = true;
    
    // Get canvas-relative coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    editorState.lastX = x;
    editorState.lastY = y;
    
    // Perform initial drawing operation
    handleDrawingOperation(x, y);
  }

  function draw(e) {
    if (!editorState.isDrawing) return;
    
    // Get canvas-relative coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Handle interpolation for continuous lines
    const dx = Math.abs(x - editorState.lastX);
    const dy = Math.abs(y - editorState.lastY);
    const steps = Math.max(dx, dy);
    
    if (steps > 1) {
      for (let i = 0; i < steps; i++) {
        const lerpX = Math.floor(editorState.lastX + (x - editorState.lastX) * (i / steps));
        const lerpY = Math.floor(editorState.lastY + (y - editorState.lastY) * (i / steps));
        handleDrawingOperation(lerpX, lerpY);
      }
    } else {
      handleDrawingOperation(x, y);
    }
    
    editorState.lastX = x;
    editorState.lastY = y;
  }

  function stopDrawing() {
    editorState.isDrawing = false;
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      
      // Convert touch to mouse event
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      
      startDrawing(mouseEvent);
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      
      // Convert touch to mouse event
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      
      draw(mouseEvent);
    }
  }

  function handleDrawingOperation(x, y) {
    switch (editorState.currentTool) {
      case 'pencil':
        drawPixel(x, y);
        break;
      case 'eraser':
        erasePixel(x, y);
        break;
      case 'fill':
        fillArea(x, y);
        break;
      case 'eyedropper':
        pickColor(x, y);
        break;
    }
  }

  function drawPixel(x, y) {
    const size = editorState.brushSize;
    const halfSize = Math.floor(size / 2);
    
    ctx.fillStyle = editorState.currentColor;
    
    // Draw all pixels in brush size
    for (let py = -halfSize; py < size - halfSize; py++) {
      for (let px = -halfSize; px < size - halfSize; px++) {
        const drawX = x + px;
        const drawY = y + py;
        
        // Check boundaries
        if (drawX >= 0 && drawX < canvas.width && 
            drawY >= 0 && drawY < canvas.height) {
          ctx.fillRect(drawX, drawY, 1, 1);
        }
      }
    }
  }

  function erasePixel(x, y) {
    const size = editorState.brushSize;
    const halfSize = Math.floor(size / 2);
    
    ctx.fillStyle = '#ffffff'; // Eraser uses white
    
    // Erase all pixels in brush size
    for (let py = -halfSize; py < size - halfSize; py++) {
      for (let px = -halfSize; px < size - halfSize; px++) {
        const eraseX = x + px;
        const eraseY = y + py;
        
        // Check boundaries
        if (eraseX >= 0 && eraseX < canvas.width && 
            eraseY >= 0 && eraseY < canvas.height) {
          ctx.fillRect(eraseX, eraseY, 1, 1);
        }
      }
    }
  }

  function fillArea(x, y) {
    // Get the pixel color at target position
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate index of target pixel
    const targetIndex = (y * canvas.width + x) * 4;
    const targetR = data[targetIndex];
    const targetG = data[targetIndex + 1];
    const targetB = data[targetIndex + 2];
    const targetA = data[targetIndex + 3];
    
    // Parse current color
    const tempDiv = document.createElement('div');
    tempDiv.style.backgroundColor = editorState.currentColor;
    document.body.appendChild(tempDiv);
    const computedStyle = getComputedStyle(tempDiv);
    document.body.removeChild(tempDiv);
    
    // Extract RGB values
    const colorMatch = computedStyle.backgroundColor.match(/\d+/g);
    const fillR = parseInt(colorMatch[0], 10);
    const fillG = parseInt(colorMatch[1], 10);
    const fillB = parseInt(colorMatch[2], 10);
    const fillA = 255;
    
    // Don't fill if target pixel is already fill color
    if (targetR === fillR && targetG === fillG && targetB === fillB) {
      return;
    }
    
    // Flood fill algorithm
    const stack = [[x, y]];
    const visited = new Set();
    const key = (px, py) => `${px},${py}`;
    
    while (stack.length > 0) {
      const [px, py] = stack.pop();
      const currentKey = key(px, py);
      
      if (visited.has(currentKey)) continue;
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
      
      const currentIndex = (py * canvas.width + px) * 4;
      const currentR = data[currentIndex];
      const currentG = data[currentIndex + 1];
      const currentB = data[currentIndex + 2];
      const currentA = data[currentIndex + 3];
      
      // Check if current pixel matches target color
      if (
        currentR === targetR &&
        currentG === targetG &&
        currentB === targetB &&
        currentA === targetA
      ) {
        // Set pixel to fill color
        data[currentIndex] = fillR;
        data[currentIndex + 1] = fillG;
        data[currentIndex + 2] = fillB;
        data[currentIndex + 3] = fillA;
        
        visited.add(currentKey);
        
        // Add adjacent pixels to stack
        stack.push([px + 1, py]);
        stack.push([px - 1, py]);
        stack.push([px, py + 1]);
        stack.push([px, py - 1]);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  function pickColor(x, y) {
    // Get color at pixel
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
    
    // Update current color
    editorState.currentColor = color;
    colorDisplay.style.backgroundColor = color;
    
    // Switch back to pencil tool
    editorState.currentTool = 'pencil';
    
    // Update active tool button
    toolButtons.forEach(button => {
      button.classList.remove('active');
      if (button.id === 'pencil-tool') {
        button.classList.add('active');
      }
    });
  }

  function saveArtwork() {
    // Convert artwork to pixel data
    const pixels = [];
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        
        // Skip white/transparent pixels
        const isWhite = imageData[index] === 255 && 
                        imageData[index + 1] === 255 && 
                        imageData[index + 2] === 255;
        
        if (!isWhite) {
          pixels.push(`rgb(${imageData[index]}, ${imageData[index + 1]}, ${imageData[index + 2]})`);
        } else {
          pixels.push(null);
        }
      }
    }
    
    // Create art data structure
    const artData = {
      pixels,
      width: canvas.width,
      height: canvas.height,
      createdAt: Date.now()
    };
    
    // Hide the editor
    artEditor.classList.add('hidden');
    
    // Ask for placement position
    const position = {
      x: gameState.player.position.x,
      y: gameState.player.position.y
    };
    
    // Send to server
    webSocket.createArt(artData, position);
    
    // Show notification
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Art placed in the world!';
    notifications.appendChild(notification);
    
    // Auto remove notification after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  function copyArtToClipboard() {
    // Create a temporary canvas with scaled-up art for better visibility
    const tempCanvas = document.createElement('canvas');
    const scale = 10; // Scale factor
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
    
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    // Draw scaled image
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Try to copy to clipboard
    try {
      tempCanvas.toBlob(blob => {
        // Create clipboard item
        const item = new ClipboardItem({ 'image/png': blob });
        
        navigator.clipboard.write([item]).then(() => {
          // Show success notification
          const notifications = document.getElementById('notifications');
          const notification = document.createElement('div');
          notification.className = 'notification success';
          notification.textContent = 'Art copied to clipboard!';
          notifications.appendChild(notification);
          
          // Auto remove notification
          setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
          }, 3000);
        }).catch(err => {
          console.error('Failed to copy art to clipboard:', err);
          alert('Failed to copy to clipboard. Try using "Save" instead.');
        });
      });
    } catch (err) {
      console.error('Clipboard API not supported:', err);
      alert('Copying to clipboard not supported in this browser.');
    }
  }

  // Initialize
  initCanvas();
  setupEventListeners();

  return {
    // Public methods
    clearCanvas: () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    
    setColor: (color) => {
      editorState.currentColor = color;
      colorDisplay.style.backgroundColor = color;
    },
    
    setTool: (tool) => {
      editorState.currentTool = tool;
      toolButtons.forEach(button => {
        button.classList.remove('active');
        if (button.id === `${tool}-tool`) {
          button.classList.add('active');
        }
      });
    },
    
    getArtData: () => {
      // Convert artwork to pixel data
      const pixels = [];
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          
          // Skip white/transparent pixels
          const isWhite = imageData[index] === 255 && 
                          imageData[index + 1] === 255 && 
                          imageData[index + 2] === 255;
          
          if (!isWhite) {
            pixels.push(`rgb(${imageData[index]}, ${imageData[index + 1]}, ${imageData[index + 2]})`);
          } else {
            pixels.push(null);
          }
        }
      }
      
      return {
        pixels,
        width: canvas.width,
        height: canvas.height
      };
    }
  };
}
