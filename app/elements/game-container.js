export default function GameContainer({ html }) {
  return html`
    <div id="game-container">
      <canvas id="game-canvas"></canvas>
      <div id="controls-overlay" class="controls-overlay">
        <div class="mobile-controls">
          <div id="dpad" class="d-pad">
            <button id="up">↑</button>
            <button id="left">←</button>
            <button id="right">→</button>
            <button id="down">↓</button>
          </div>
          <div class="action-buttons">
            <button id="action-a">A</button>
            <button id="action-b">B</button>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      #game-container {
        position: relative;
        width: 100%;
        height: 80vh;
        overflow: hidden;
      }
      
      #game-canvas {
        display: block;
        width: 100%;
        height: 100%;
        background-color: #1a1a2e;
      }
      
      .controls-overlay {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
      }
      
      .mobile-controls {
        display: none;
        pointer-events: auto;
      }
      
      @media (max-width: 768px) {
        .mobile-controls {
          display: flex;
          width: 100%;
          justify-content: space-between;
        }
      }
      
      .d-pad {
        display: grid;
        grid-template-areas:
          ". up ."
          "left . right"
          ". down .";
        grid-gap: 5px;
      }
      
      .d-pad button {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        border-radius: 50%;
        font-size: 20px;
      }
      
      .action-buttons {
        display: flex;
        gap: 10px;
      }
      
      .action-buttons button {
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        border-radius: 50%;
        font-size: 20px;
      }
    </style>
  `;
}
