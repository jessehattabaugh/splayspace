export default function ChatPanel({ html }) {
  return html`
    <div id="chat-panel" class="chat-panel hidden">
      <div class="chat-header">
        <h3>Chat</h3>
        <button id="close-chat" class="close-button">×</button>
      </div>
      
      <div id="chat-messages" class="chat-messages"></div>
      
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message..." maxlength="100">
        <button id="send-message">Send</button>
      </div>
    </div>
    
    <style>
      .chat-panel {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 300px;
        height: 300px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s;
      }
      
      .hidden {
        transform: translateY(calc(100% - 30px));
      }
      
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        border-bottom: 1px solid #444;
      }
      
      .chat-header h3 {
        margin: 0;
      }
      
      .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      }
      
      .chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
      }
      
      .message {
        margin-bottom: 5px;
        padding: 5px;
        border-radius: 5px;
        max-width: 80%;
      }
      
      .message.self {
        align-self: flex-end;
        background: #0066cc;
      }
      
      .message.other {
        align-self: flex-start;
        background: #444;
      }
      
      .chat-input-area {
        display: flex;
        padding: 10px;
        border-top: 1px solid #444;
      }
      
      #chat-input {
        flex-grow: 1;
        border: 1px solid #444;
        background: #222;
        color: white;
        padding: 5px;
        border-radius: 3px;
      }
      
      #send-message {
        margin-left: 5px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 0 10px;
        cursor: pointer;
      }
    </style>
  `;
}
