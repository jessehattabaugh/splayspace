/**
 * Resource domain model
 */
class Resource {
  constructor({
    id,
    resourceId,
    type,
    position,
    quantity = 1,
    creator = null,
    data = null,
    createdAt = Date.now()
  }) {
    this.id = id || resourceId; // Support either id or resourceId
    this.type = type;
    this.position = position;
    this.quantity = quantity;
    this.creator = creator;
    this.data = data;
    this.createdAt = createdAt;
  }

  /**
   * Check if this resource is an art piece
   * @returns {boolean}
   */
  isArt() {
    return this.type === 'art' && this.data !== null;
  }

  /**
   * Create a database representation of this resource
   * @returns {Object} Database object
   */
  toDb() {
    return {
      resourceId: this.id,
      type: this.type,
      position: this.position,
      quantity: this.quantity,
      creator: this.creator,
      data: this.data,
      createdAt: this.createdAt
    };
  }
}

module.exports = Resource;
