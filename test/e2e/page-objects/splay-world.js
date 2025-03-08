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
   * Open chat panel
   */
  async openChat() {
    // Check if chat is already open
    const isChatHidden = await this.page.$eval('#chat-panel', el => 
      el.classList.contains('hidden')
    );
    
    if (isChatHidden) {
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
}
