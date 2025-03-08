const SPRITE_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HARVEST: 'harvest',
  EMOTE: 'emote'
};

const DIRECTIONS = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

export class Sprite {
  constructor(type = 'player') {
    this.type = type;
    this.state = SPRITE_STATES.IDLE;
    this.direction = DIRECTIONS.DOWN;
    this.frame = 0;
    this.animationSpeed = 100; // ms per frame
    this.lastUpdate = Date.now();
    
    // Default sprite sheet configuration
    this.spriteSheet = {
      idle: { frames: 2, row: 0 },
      walk: { frames: 4, row: 1 },
      attack: { frames: 3, row: 2 },
      harvest: { frames: 2, row: 3 },
      emote: { frames: 4, row: 4 }
    };
  }
  
  update() {
    const now = Date.now();
    if (now - this.lastUpdate > this.animationSpeed) {
      this.frame = (this.frame + 1) % this.spriteSheet[this.state].frames;
      this.lastUpdate = now;
    }
  }
  
  getSpriteCoordinates() {
    const frameData = this.spriteSheet[this.state];
    return {
      x: this.frame * 32, // 32px sprite width
      y: frameData.row * 32 + (this.direction * 32),
      width: 32,
      height: 32
    };
  }
  
  startAnimation(state) {
    if (this.spriteSheet[state]) {
      this.state = state;
      this.frame = 0;
    }
  }
  
  setDirection(direction) {
    if (direction in DIRECTIONS) {
      this.direction = DIRECTIONS[direction];
    }
  }
}
