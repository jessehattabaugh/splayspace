export default class KeyboardHandler {
  constructor(onInputChanged) {
    this.onInputChanged = onInputChanged;
    this.keyState = new Set();
    this.enabled = true;

    // Bind handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Add listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(event) {
    if (!this.enabled) return;
    
    if (event.repeat) return; // Ignore key repeat events
    this.keyState.add(event.code);
    this.updateMovement();
  }

  handleKeyUp(event) {
    if (!this.enabled) return;
    
    this.keyState.delete(event.code);
    this.updateMovement();
  }

  updateMovement() {
    const movement = { x: 0, y: 0 };
    
    // WASD movement
    if (this.keyState.has('KeyW') || this.keyState.has('ArrowUp')) movement.y -= 1;
    if (this.keyState.has('KeyS') || this.keyState.has('ArrowDown')) movement.y += 1;
    if (this.keyState.has('KeyA') || this.keyState.has('ArrowLeft')) movement.x -= 1;
    if (this.keyState.has('KeyD') || this.keyState.has('ArrowRight')) movement.x += 1;
    
    // Normalize diagonal movement
    if (movement.x !== 0 && movement.y !== 0) {
      const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
      movement.x /= length;
      movement.y /= length;
    }

    // Other actions
    const action = this.keyState.has('Space');
    const menu = this.keyState.has('Escape');
    const chat = this.keyState.has('Enter');

    this.onInputChanged({ movement, action, menu, chat });
  }

  disable() {
    this.enabled = false;
    this.keyState.clear();
    this.updateMovement();
  }

  enable() {
    this.enabled = true;
  }
}
