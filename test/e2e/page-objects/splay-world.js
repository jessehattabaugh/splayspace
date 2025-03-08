/**
 * Page Object Model for the SplaySpace world
 */
import { waitForWebSocketEvent } from '../utils/test-environment';

export class SplayWorld {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.canvas = page.locator('#game-canvas');
    this.chatToggle = page.locator('#toggle-chat');
    this.chatInput = page.locator('#chat-input');
    this.sendMessageButton = page.locator('#send-message');
    this.chatMessages = page.locator('#chat-messages');
    this.playerCoordinates = page.locator('#player-coordinates');
    this.loadingScreen = page.locator('#loading-screen');
    this.inventoryButton = page.locator('#toggle-inventory');
    this.inventoryPanel = page.locator('#inventory-panel');
    this.resourceCounter = page.locator('#resource-counter');
    this.notificationArea = page.locator('#notification-area');
  }

  /**
   * Wait for game to fully load
   */
  async waitForGameLoad() {
    // Wait for loading screen to disappear
    await this.loadingScreen.waitFor({ state: 'hidden', timeout: 10000 });
    // Wait for canvas to be visible
    await this.canvas.waitFor({ state: 'visible' });
    // Ensure we have coordinate information
    await this.playerCoordinates.waitFor();
    // Give a moment for WebSocket connection to establish
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if game is already loaded
   */
  async isGameLoaded() {
    return await this.canvas.isVisible() && 
           !(await this.loadingScreen.isVisible());
  }

  /**
   * Move the player using keyboard controls
   * @param {string} direction - 'up', 'down', 'left', or 'right'
   * @param {number} steps - Number of steps to take
   */
  async movePlayer(direction, steps = 1) {
    const key = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    }[direction];

    if (!key) {
      throw new Error(`Invalid direction: ${direction}`);
    }

    // Focus the canvas first
    await this.canvas.click({ position: { x: 50, y: 50 } });
    
    // Press the key multiple times for steps
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press(key);
      // Small wait between presses to ensure they register
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Move to specific coordinates
   */
  async moveToPosition(targetX, targetY) {
    const currentPos = await this.getPlayerPosition();
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;
    
    // Move horizontally
    if (dx > 0) {
      await this.movePlayer('right', dx);
    } else if (dx < 0) {
      await this.movePlayer('left', -dx);
    }
    
    // Move vertically
    if (dy > 0) {
      await this.movePlayer('down', dy);
    } else if (dy < 0) {
      await this.movePlayer('up', -dy);
    }
  }

  /**
   * Move towards other player based on latest event
   */
  async moveTowardsOtherPlayer() {
    try {
      // Wait for USER_POSITION event
      const positionEvent = await waitForWebSocketEvent(this.page, 'USER_POSITION', 5000);
      if (positionEvent && positionEvent.position) {
        await this.moveToPosition(positionEvent.position.x, positionEvent.position.y);
        return true;
      }
    } catch (e) {
      console.log('Could not find other player position');
    }
    return false;
  }

  /**
   * Open chat panel
   */
  async openChat() {
    // Check if chat is already open
    const isChatVisible = await this.chatInput.isVisible();
    
    if (!isChatVisible) {
      await this.chatToggle.click();
      await this.chatInput.waitFor({ state: 'visible' });
    }
  }

  /**
   * Send a chat message
   * @param {string} message - Message to send
   */
  async sendChatMessage(message) {
    await this.openChat();
    await this.chatInput.fill(message);
    await this.sendMessageButton.click();
  }

  /**
   * Wait for a chat message to appear
   * @param {string} messageText - Text to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForChatMessage(messageText, timeout = 5000) {
    await this.openChat();
    await this.page.waitForFunction(
      ([selector, text]) => {
        const messages = document.querySelector(selector);
        return messages && messages.innerText.includes(text);
      },
      ['#chat-messages', messageText],
      { timeout }
    );
  }

  /**
   * Wait for another player to appear
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForOtherPlayer(timeout = 5000) {
    return await waitForWebSocketEvent(this.page, 'USER_JOINED', timeout);
  }

  /**
   * Wait for a player to move
   * @param {string} userId - User ID to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForPlayerMove(userId, timeout = 5000) {
    return await waitForWebSocketEvent(this.page, 'USER_MOVED', timeout);
  }

  /**
   * Wait for resource-related events
   */
  async waitForResourceEvent(eventType, timeout = 5000) {
    return await waitForWebSocketEvent(this.page, eventType, timeout);
  }

  /**
   * Wait for terrain-related events
   */
  async waitForTerrainEvent(eventType, timeout = 5000) {
    return await waitForWebSocketEvent(this.page, eventType, timeout);
  }

  /**
   * Wait for a notification to appear
   */
  async waitForNotification(textPattern, timeout = 5000) {
    await this.page.waitForFunction(
      ([selector, pattern]) => {
        const notification = document.querySelector(selector);
        return notification && new RegExp(pattern).test(notification.innerText);
      },
      ['#notification-area', textPattern.toString()],
      { timeout }
    );
  }

  /**
   * Get player's current position
   */
  async getPlayerPosition() {
    const text = await this.playerCoordinates.innerText();
    const match = text.match(/X: (-?\d+) Y: (-?\d+)/);
    if (!match) {
      throw new Error(`Failed to parse coordinates: ${text}`);
    }
    return {
      x: parseInt(match[1], 10),
      y: parseInt(match[2], 10)
    };
  }

  /**
   * Collect a resource if nearby
   */
  async collectResource() {
    // Press space to interact
    await this.canvas.click({ position: { x: 50, y: 50 } });
    await this.page.keyboard.press(' ');
  }

  /**
   * Open inventory
   */
  async openInventory() {
    // Check if inventory is already open
    const isInventoryVisible = await this.inventoryPanel.isVisible();
    
    if (!isInventoryVisible) {
      await this.inventoryButton.click();
      await this.inventoryPanel.waitFor({ state: 'visible' });
    }
  }

  /**
   * Get number of resources in inventory
   */
  async getResourceCount() {
    try {
      const countText = await this.resourceCounter.innerText();
      const match = countText.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch (e) {
      return 0; // Counter may not be visible yet
    }
  }

  /**
   * Drop a resource at player's location
   * @param {number} slotIndex - Inventory slot index to drop
   */
  async dropResource(slotIndex) {
    await this.openInventory();
    const slot = this.page.locator(`.inventory-item:nth-child(${slotIndex + 1})`);
    await slot.click();
    await this.page.locator('#drop-item-button').click();
  }

  /**
   * Check if terrain modification is available
   */
  async canModifyTerrain() {
    return await this.page.locator('#build-button').isVisible();
  }

  /**
   * Place a structure at current location
   */
  async placeStructure(name) {
    await this.page.locator('#build-button').click();
    await this.page.locator('#structure-name').fill(name);
    await this.page.locator('#confirm-build').click();
  }

  /**
   * Interact with a structure at current location
   */
  async interactWithStructure() {
    await this.collectResource(); // Often the same key as general interaction
  }
}
