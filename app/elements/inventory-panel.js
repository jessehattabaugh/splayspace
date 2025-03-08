export default function InventoryPanel({ html }) {
  return html`
    <div id="inventory-panel" class="inventory-panel hidden">
      <div class="inventory-header">
        <h3>Inventory</h3>
        <button id="close-inventory" class="close-button">×</button>
      </div>
      
      <div id="inventory-slots" class="inventory-slots"></div>
      
      <div class="inventory-stats">
        <div>Ownership Window: <span id="ownership-window">10x10</span></div>
        <button id="upgrade-window" class="upgrade-button">Upgrade</button>
      </div>
    </div>
    
    <style>
      .inventory-panel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 500px;
        height: 400px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        z-index: 100;
      }
      
      .hidden {
        display: none;
      }
      
      .inventory-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #444;
      }
      
      .inventory-header h3 {
        margin: 0;
      }
      
      .inventory-slots {
        flex-grow: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 10px;
        padding: 15px;
        overflow-y: auto;
      }
      
      .inventory-slot {
        height: 60px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #444;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .inventory-slot img {
        max-width: 80%;
        max-height: 70%;
      }
      
      .inventory-slot .quantity {
        font-size: 12px;
        margin-top: 2px;
      }
      
      .inventory-stats {
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #444;
      }
      
      .upgrade-button {
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
      }
    </style>
  `;
}
