export default function HudOverlay({ html }) {
  return html`
    <div id="hud-overlay" class="hud">
      <div class="coordinates">
        <span id="player-coordinates">X: 0 Y: 0</span>
      </div>
      
      <div class="online-users">
        <span>Players Online: </span><span id="online-count">0</span>
      </div>
      
      <div id="notifications" class="notifications"></div>
      
      <div class="mini-map">
        <canvas id="mini-map-canvas" width="100" height="100"></canvas>
      </div>
    </div>
    
    <style>
      .hud {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        color: white;
        font-family: 'Courier New', monospace;
        text-shadow: 1px 1px 1px black;
      }
      
      .coordinates {
        background: rgba(0, 0, 0, 0.5);
        padding: 5px 10px;
        border-radius: 5px;
      }
      
      .online-users {
        background: rgba(0, 0, 0, 0.5);
        padding: 5px 10px;
        border-radius: 5px;
      }
      
      .notifications {
        position: absolute;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        max-height: 150px;
        overflow-y: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .notification {
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        margin-bottom: 5px;
        border-radius: 5px;
        opacity: 1;
        transition: opacity 0.5s;
      }
      
      .mini-map {
        background: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
        padding: 5px;
      }
      
      #mini-map-canvas {
        display: block;
        border: 1px solid #444;
      }
    </style>
  `;
}
