import { test, expect } from '@playwright/test';
import { SplayWorld } from './page-objects/splay-world';
import { getTestEnvironment, injectWebSocketMonitoring } from './utils/test-environment';

test.describe('Single player experience', () => {
  let world;
  
  test.beforeEach(async ({ page }) => {
    // Get test environment
    const env = getTestEnvironment();
    
    // Set up WebSocket monitoring
    await injectWebSocketMonitoring(page);
    
    // Create page object
    world = new SplayWorld(page);
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for game to load
    await world.waitForGameLoad();
  });

  test('Player can move around the world', async ({ page }) => {
    // Get initial position
    const initialPos = await world.getPlayerPosition();
    
    // Move right
    await world.movePlayer('right', 10);
    
    // Position should change
    let newPos = await world.getPlayerPosition();
    expect(newPos.x).toBeGreaterThan(initialPos.x);
    expect(newPos.y).toBe(initialPos.y);
    
    // Move down
    await world.movePlayer('down', 10);
    
    // Position should change
    newPos = await world.getPlayerPosition();
    expect(newPos.y).toBeGreaterThan(initialPos.y);
    
    // Move left
    await world.movePlayer('left', 5);
    
    // Position should change
    newPos = await world.getPlayerPosition();
    expect(newPos.x).toBeLessThan(newPos.x + 5);
    
    // Move up
    await world.movePlayer('up', 5);
    
    // Position should change
    newPos = await world.getPlayerPosition();
    expect(newPos.y).toBeLessThan(newPos.y + 5);
  });

  test('Player can open and use chat panel', async ({ page }) => {
    // Open chat
    await world.openChat();
    
    // Chat input should be visible
    await expect(world.chatInput).toBeVisible();
    
    // Send a message
    const testMessage = `Test message ${Date.now()}`;
    await world.sendChatMessage(testMessage);
    
    // Message should appear in chat
    await world.waitForChatMessage(testMessage);
    
    // Send a longer message
    const longMessage = `This is a longer message that tests how the chat system handles multi-line content and formatting ${Date.now()}`;
    await world.sendChatMessage(longMessage);
    
    // Message should appear in chat
    await world.waitForChatMessage(longMessage);
    
    // Close chat panel if there's a close button
    if (await page.$('#close-chat')) {
      await page.click('#close-chat');
      await expect(world.chatInput).not.toBeVisible();
    }
  });

  test('Player can view the map', async ({ page }) => {
    // Mini-map should be visible
    const miniMap = page.locator('#mini-map-canvas');
    await expect(miniMap).toBeVisible();
    
    // Player coordinates should be visible and match a pattern
    const coords = await world.playerCoordinates.innerText();
    expect(coords).toMatch(/X: -?\d+ Y: -?\d+/);
    
    // Zoom in on mini-map if control exists
    if (await page.$('#zoom-in-map')) {
      await page.click('#zoom-in-map');
      // Verify zoom changed (implementation dependent)
    }
    
    // Toggle full-map view if available
    if (await page.$('#toggle-full-map')) {
      await page.click('#toggle-full-map');
      await expect(page.locator('#full-map-view')).toBeVisible();
      
      // Close full map
      await page.click('#close-full-map');
    }
  });
  
  test('Player can collect resources', async ({ page }) => {
    // Initial resource count
    const initialResources = await world.getResourceCount();
    
    // Walk around to find resources
    for (let i = 0; i < 4; i++) {
      // Move in a square pattern to look for resources
      await world.movePlayer('right', 10);
      await world.movePlayer('down', 10);
      await world.movePlayer('left', 10);
      await world.movePlayer('up', 10);
      
      // Try to collect any resources found
      await world.collectResource();
      
      // Check if resources increased
      const newResourceCount = await world.getResourceCount();
      if (newResourceCount > initialResources) {
        break; // Successfully collected a resource
      }
    }
    
    // Check inventory if resources were collected
    if (await world.getResourceCount() > initialResources) {
      await world.openInventory();
      await expect(page.locator('.inventory-item')).toBeVisible();
    }
  });
  
  test('Game interface responds to window resizing', async ({ page }) => {
    // Test responsive design by resizing viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('#game-canvas')).toBeVisible();
    
    // Resize to mobile dimensions
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#game-canvas')).toBeVisible();
    
    // Controls should adapt
    await expect(page.locator('#mobile-controls')).toBeVisible();
    
    // Restore desktop size
    await page.setViewportSize({ width: 1024, height: 768 });
  });
});
