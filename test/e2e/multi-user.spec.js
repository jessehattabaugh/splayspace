import { test, expect } from '@playwright/test';
import { SplayWorld } from './page-objects/splay-world';
import { getTestEnvironment, injectWebSocketMonitoring } from './utils/test-environment';

test.describe('Multi-user interaction', () => {
  let userA;
  let userB;
  let worldA;
  let worldB;
  
  test.beforeAll(async ({ browser: browserA }, testInfo) => {
    // Get test environment
    const env = getTestEnvironment();
    console.log(`Running tests against environment: ${env.name} (${env.baseUrl})`);

    // Create contexts for both users
    const browserB = await browserA.browserType().launch();
    const contextA = await browserA.newContext();
    const contextB = await browserB.newContext();
    
    // Create pages for both users
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    
    // Set up WebSocket monitoring
    await injectWebSocketMonitoring(pageA);
    await injectWebSocketMonitoring(pageB);
    
    // Create page objects
    worldA = new SplayWorld(pageA);
    worldB = new SplayWorld(pageB);
    
    // Store for later use
    userA = { browser: browserA, context: contextA, page: pageA };
    userB = { browser: browserB, context: contextB, page: pageB };
  });

  test('Two users can see each other and chat', async () => {
    // Navigate both users to the application
    await userA.page.goto('/');
    await userB.page.goto('/');
    
    // Wait for both games to load
    await worldA.waitForGameLoad();
    await worldB.waitForGameLoad();
    
    // User B should see User A appear (wait for USER_JOINED event)
    const userJoinedEvent = await worldB.waitForOtherPlayer();
    expect(userJoinedEvent).toBeDefined();
    expect(userJoinedEvent.user).toBeDefined();
    
    // User A should also see User B
    const userJoinedEvent2 = await worldA.waitForOtherPlayer();
    expect(userJoinedEvent2).toBeDefined();
    
    // Get User A's initial position
    const initialPosition = await worldA.getPlayerPosition();
    
    // User A moves (sending MOVE messages)
    await worldA.movePlayer('right', 5);
    await worldA.movePlayer('down', 3);
    
    // User B should see User A move
    const moveEvent = await worldB.waitForPlayerMove(userJoinedEvent.user.userId);
    expect(moveEvent).toBeDefined();
    expect(moveEvent.position).toBeDefined();
    
    // User A's position should have changed
    const newPosition = await worldA.getPlayerPosition();
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBeGreaterThan(initialPosition.y);
    
    // User A sends a chat message
    const testMessage = `Hello from test at ${Date.now()}`;
    await worldA.sendChatMessage(testMessage);
    
    // User B should see the chat message
    await worldB.waitForChatMessage(testMessage);
    
    // User B replies
    const replyMessage = `Reply from test at ${Date.now()}`;
    await worldB.sendChatMessage(replyMessage);
    
    // User A should see the reply
    await worldA.waitForChatMessage(replyMessage);
  });

  test.afterAll(async () => {
    // Clean up
    await userA.context.close();
    await userB.context.close();
    await userB.browser.close();
    // Don't close browserA - Playwright handles that automatically
  });
});
