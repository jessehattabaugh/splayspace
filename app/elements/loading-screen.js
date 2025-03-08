export default function LoadingScreen({ html }) {
  return html`
    <div id="loading-screen" class="loading-screen">
      <div class="loading-content">
        <h2>SplaySpace</h2>
        <div class="spinner"></div>
        <p id="loading-message">Generating world...</p>
        <div class="loading-bar">
          <div id="loading-progress" class="loading-progress"></div>
        </div>
      </div>
    </div>
    
    <style>
      .loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1a1a2e;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .loading-content {
        text-align: center;
        color: white;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-top: 5px solid #0066cc;
        border-radius: 50%;
        margin: 20px auto;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-bar {
        width: 300px;
        height: 10px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        margin: 20px auto;
        overflow: hidden;
      }
      
      .loading-progress {
        height: 100%;
        width: 0%;
        background: #0066cc;
        transition: width 0.3s ease;
      }
      
      .hidden {
        display: none;
      }
    </style>
  `;
}
