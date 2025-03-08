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
  });

  test('Player can view the map', async ({ page }) => {
    // Mini-map should be visible
    const miniMap = page.locator('#mini-map-canvas');
    await expect(miniMap).toBeVisible();
    
    // Player coordinates should be visible and match a pattern
    const coords = await world.playerCoordinates.innerText();
    expect(coords).toMatch(/X: -?\d+ Y: -?\d+/);
  });
});
