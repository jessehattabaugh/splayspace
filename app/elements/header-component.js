export default function HeaderComponent({ html }) {
  return html`
    <header class="header">
      <h1>SplaySpace</h1>
      <nav>
        <button id="toggle-editor">Art Editor</button>
        <button id="toggle-inventory">Inventory</button>
        <button id="toggle-chat">Chat</button>
        <button id="toggle-help">Help</button>
      </nav>
    </header>
  `;
}
