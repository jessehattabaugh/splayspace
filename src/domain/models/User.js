/**
 * User domain model
 */
class User {
  constructor({
    userId,
    connectionId,
    position = { x: 0, y: 0 },
    color,
    inventory = [],
    ownershipWindow = { width: 10, height: 10, level: 'basic' },
    lastActive = Date.now()
  }) {
    this.userId = userId;
    this.connectionId = connectionId;
    this.position = position;
    this.color = color;
    this.inventory = inventory;
    this.ownershipWindow = ownershipWindow;
    this.lastActive = lastActive;
  }

  /**
   * Create a public representation of the user, hiding sensitive data
   * @returns {Object} User data safe for sending to clients
   */
  toPublic() {
    return {
      userId: this.userId,
      position: this.position,
      color: this.color
    };
  }

  /**
   * Update user position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  move(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.lastActive = Date.now();
  }

  /**
   * Add a resource to user's inventory
   * @param {Object} resource - Resource to add
   */
  addResource(resource) {
    this.inventory.push(resource);
  }
}

module.exports = User;
