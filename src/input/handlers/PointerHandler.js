export default class PointerHandler {
  constructor(onInputChanged, onDeviceSwitch) {
    this.onInputChanged = onInputChanged;
    this.onDeviceSwitch = onDeviceSwitch;
    this.enabled = true;
    this.pointers = new Map();
    this.virtualJoystick = null;
    this.joystickSize = 150;

    // Bind handlers
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    // Add listeners with pointer capture for better control
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    window.addEventListener('contextmenu', this.handleContextMenu);

    // Create virtual joystick for touch input
    this.createVirtualJoystick();
  }

  createVirtualJoystick() {
    this.virtualJoystick = {
      container: document.createElement('div'),
      stick: document.createElement('div'),
      visible: false,
      center: { x: 0, y: 0 }
    };

    Object.assign(this.virtualJoystick.container.style, {
      position: 'fixed',
      width: `${this.joystickSize}px`,
      height: `${this.joystickSize}px`,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      display: 'none',
      touchAction: 'none',
      userSelect: 'none'
    });

    Object.assign(this.virtualJoystick.stick.style, {
      position: 'absolute',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.8)',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none'
    });

    this.virtualJoystick.container.appendChild(this.virtualJoystick.stick);
    document.body.appendChild(this.virtualJoystick.container);
  }

  handlePointerDown(event) {
    if (!this.enabled) return;
    event.preventDefault();

    this.pointers.set(event.pointerId, {
      type: event.pointerType,
      position: { x: event.clientX, y: event.clientY },
      pressure: event.pressure
    });

    // Notify device switch
    this.onDeviceSwitch(event.pointerType);

    if (event.pointerType === 'touch') {
      // Show virtual joystick for touch input
      this.virtualJoystick.visible = true;
      this.virtualJoystick.container.style.display = 'block';
      this.virtualJoystick.center = {
        x: event.clientX,
        y: event.clientY
      };
      this.virtualJoystick.container.style.left = `${event.clientX - this.joystickSize/2}px`;
      this.virtualJoystick.container.style.top = `${event.clientY - this.joystickSize/2}px`;
    }

    this.updateInputState(event);
  }

  handlePointerMove(event) {
    if (!this.enabled) return;
    
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;

    pointer.position = { x: event.clientX, y: event.clientY };
    pointer.pressure = event.pressure;

    if (event.pointerType === 'touch' && this.virtualJoystick.visible) {
      this.updateVirtualJoystick(event);
    }

    this.updateInputState(event);
  }

  updateVirtualJoystick(event) {
    const dx = event.clientX - this.virtualJoystick.center.x;
    const dy = event.clientY - this.virtualJoystick.center.y;
    const maxRadius = this.joystickSize / 2;

    // Normalize movement
    const movement = {
      x: Math.min(Math.max(dx / maxRadius, -1), 1),
      y: Math.min(Math.max(dy / maxRadius, -1), 1)
    };

    // Update stick position
    const stickX = Math.min(Math.max(dx, -maxRadius), maxRadius);
    const stickY = Math.min(Math.max(dy, -maxRadius), maxRadius);
    this.virtualJoystick.stick.style.transform = 
      `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

    this.onInputChanged({ movement });
  }

  handlePointerUp(event) {
    if (!this.enabled) return;
    
    this.pointers.delete(event.pointerId);

    if (event.pointerType === 'touch' && this.virtualJoystick.visible) {
      this.virtualJoystick.visible = false;
      this.virtualJoystick.container.style.display = 'none';
      this.virtualJoystick.stick.style.transform = 'translate(-50%, -50%)';
      this.onInputChanged({ movement: { x: 0, y: 0 } });
    }

    this.updateInputState(event);
  }

  handlePointerCancel(event) {
    this.handlePointerUp(event);
  }

  handleContextMenu(event) {
    if (!this.enabled) return;
    event.preventDefault();
  }

  updateInputState(event) {
    // Handle primary button (left click, touch, or pen contact)
    const action = event.buttons === 1;
    // Handle secondary button (right click or auxiliary pointer button)
    const menu = event.buttons === 2;
    
    this.onInputChanged({
      cursor: { x: event.clientX, y: event.clientY },
      pointer: this.pointers.size > 0,
      action,
      menu,
      pressure: event.pressure,
      tilt: event.pointerType === 'pen' ? { x: event.tiltX, y: event.tiltY } : undefined
    });
  }

  disable() {
    this.enabled = false;
    this.pointers.clear();
    if (this.virtualJoystick) {
      this.virtualJoystick.container.style.display = 'none';
    }
    this.onInputChanged({
      movement: { x: 0, y: 0 },
      action: false,
      menu: false,
      pointer: false,
      pressure: 0
    });
  }

  enable() {
    this.enabled = true;
  }
}
