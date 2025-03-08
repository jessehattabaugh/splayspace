export class InputManager {
  constructor() {
    this.handlers = new Map();
    this.inputState = {
      movement: { x: 0, y: 0 },
      action: false,
      menu: false,
      chat: false,
      cursor: { x: 0, y: 0 },
      pointer: false,
      currentDevice: null
    };

    // Bind methods
    this.onInputChanged = this.onInputChanged.bind(this);
    this.handleDeviceSwitch = this.handleDeviceSwitch.bind(this);

    // Initialize handlers
    this.initHandlers();
    
    // Listen for device preference changes
    window.matchMedia('(hover: none)').addListener(this.updateInputPreferences.bind(this));
    this.updateInputPreferences();
  }

  initHandlers() {
    // Import and initialize all handlers
    import('./handlers/KeyboardHandler.js').then(m => 
      this.handlers.set('keyboard', new m.default(this.onInputChanged, this.handleDeviceSwitch)));
    import('./handlers/PointerHandler.js').then(m => 
      this.handlers.set('pointer', new m.default(this.onInputChanged, this.handleDeviceSwitch)));
    import('./handlers/GamepadHandler.js').then(m => 
      this.handlers.set('gamepad', new m.default(this.onInputChanged, this.handleDeviceSwitch)));
  }

  handleDeviceSwitch(device) {
    this.inputState.currentDevice = device;
    window.dispatchEvent(new CustomEvent('input:device', { detail: device }));
  }

  updateInputPreferences() {
    // Remove touch/mouse specific preferences since we use pointer events now
    this.enable('pointer');
  }

  onInputChanged(newState) {
    this.inputState = { ...this.inputState, ...newState };
    window.dispatchEvent(new CustomEvent('input:changed', { detail: this.inputState }));
  }

  disable(handlerType) {
    const handler = this.handlers.get(handlerType);
    if (handler) handler.disable();
  }

  enable(handlerType) {
    const handler = this.handlers.get(handlerType);
    if (handler) handler.enable();
  }

  getCurrentState() {
    return { ...this.inputState };
  }
}
