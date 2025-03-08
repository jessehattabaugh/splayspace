export default class GamepadHandler {
  constructor(onInputChanged) {
    this.onInputChanged = onInputChanged;
    this.enabled = true;
    this.deadzone = 0.1;
    this.connectedGamepads = new Map();

    // Bind handlers
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    
    // Add connection listeners
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    // Start polling loop
    this.pollGamepads();
  }

  handleGamepadConnected(event) {
    if (!this.enabled) return;
    this.connectedGamepads.set(event.gamepad.index, event.gamepad);
  }

  handleGamepadDisconnected(event) {
    this.connectedGamepads.delete(event.gamepad.index);
  }

  pollGamepads() {
    if (this.enabled && this.connectedGamepads.size > 0) {
      const gamepads = navigator.getGamepads();
      
      // Use first connected gamepad
      const gamepad = gamepads[this.connectedGamepads.keys().next().value];
      if (!gamepad) return;

      // Get analog stick values
      const movement = {
        x: this.applyDeadzone(gamepad.axes[0]),
        y: this.applyDeadzone(gamepad.axes[1])
      };

      // Map buttons to actions
      const action = gamepad.buttons[0].pressed; // A button
      const menu = gamepad.buttons[9].pressed;   // Start button
      const chat = gamepad.buttons[3].pressed;   // Y button

      this.onInputChanged({ movement, action, menu, chat });
    }

    // Continue polling
    requestAnimationFrame(() => this.pollGamepads());
  }

  applyDeadzone(value) {
    const absValue = Math.abs(value);
    if (absValue < this.deadzone) return 0;
    return value > 0 
      ? (absValue - this.deadzone) / (1 - this.deadzone)
      : -(absValue - this.deadzone) / (1 - this.deadzone);
  }

  disable() {
    this.enabled = false;
    this.onInputChanged({ movement: { x: 0, y: 0 }, action: false });
  }

  enable() {
    this.enabled = true;
  }
}
