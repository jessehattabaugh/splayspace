export default function ArtEditor({ html }) {
  return html`
    <div id="art-editor" class="art-editor hidden">
      <div class="editor-header">
        <h3>Raster Art Editor</h3>
        <div class="editor-tools">
          <button id="pencil-tool" class="tool-button active">✏️</button>
          <button id="eraser-tool" class="tool-button">🧽</button>
          <button id="fill-tool" class="tool-button">🪣</button>
          <button id="eyedropper-tool" class="tool-button">👁️</button>
        </div>
        <button id="close-editor" class="close-button">×</button>
      </div>
      
      <div class="editor-workspace">
        <div class="color-picker">
          <div class="current-color">
            <div id="current-color-display"></div>
            <label>Color</label>
          </div>
          <div class="color-palette" id="color-palette">
            <div class="color-swatch" style="background-color: #000000;"></div>
            <div class="color-swatch" style="background-color: #ffffff;"></div>
            <div class="color-swatch" style="background-color: #ff0000;"></div>
            <div class="color-swatch" style="background-color: #00ff00;"></div>
            <div class="color-swatch" style="background-color: #0000ff;"></div>
            <div class="color-swatch" style="background-color: #ffff00;"></div>
            <div class="color-swatch" style="background-color: #ff00ff;"></div>
            <div class="color-swatch" style="background-color: #00ffff;"></div>
          </div>
        </div>
        
        <div class="canvas-container">
          <canvas id="art-canvas" width="32" height="32"></canvas>
        </div>
        
        <div class="canvas-controls">
          <div>
            <label for="brush-size">Size:</label>
            <input type="range" id="brush-size" min="1" max="8" value="1">
          </div>
          <div>
            <button id="clear-canvas">Clear</button>
          </div>
        </div>
      </div>
      
      <div class="editor-footer">
        <button id="save-art">Save as Resource</button>
        <button id="copy-art">Copy to Clipboard</button>
      </div>
    </div>
    
    <style>
      .art-editor {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        height: 80%;
        max-height: 500px;
        background: rgba(30, 30, 40, 0.95);
        color: white;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        z-index: 200;
      }
      
      .hidden {
        display: none;
      }
      
      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #444;
      }
      
      .editor-header h3 {
        margin: 0;
      }
      
      .editor-tools {
        display: flex;
        gap: 5px;
      }
      
      .tool-button {
        width: 36px;
        height: 36px;
        background: #333;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 18px;
      }
      
      .tool-button.active {
        background: #0066cc;
      }
      
      .editor-workspace {
        display: flex;
        flex-grow: 1;
        padding: 15px;
        gap: 15px;
      }
      
      .color-picker {
        width: 80px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .current-color {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      #current-color-display {
        width: 40px;
        height: 40px;
        border: 2px solid #fff;
        border-radius: 3px;
        background-color: #000000;
      }
      
      .color-palette {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
      }
      
      .color-swatch {
        width: 30px;
        height: 30px;
        border-radius: 3px;
        cursor: pointer;
      }
      
      .canvas-container {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      #art-canvas {
        background-color: #fff;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        border: 2px solid #555;
        width: 256px;
        height: 256px;
      }
      
      .canvas-controls {
        width: 80px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .editor-footer {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-top: 1px solid #444;
      }
      
      .editor-footer button {
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 8px 12px;
        cursor: pointer;
      }
    </style>
  `;
}
