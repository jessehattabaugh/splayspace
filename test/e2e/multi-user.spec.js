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
  
  test('Users can interact with resources and see changes', async () => {
    // Navigate both users to the application if not already there
    if (userA.page.url() !== '/') await userA.page.goto('/');
    if (userB.page.url() !== '/') await userB.page.goto('/');
    
    // Wait for both games to load if needed
    if (!await worldA.isGameLoaded()) await worldA.waitForGameLoad();
    if (!await worldB.isGameLoaded()) await worldB.waitForGameLoad();
    
    // Move users close to each other
    await worldB.moveTowardsOtherPlayer();
    
    // User A collects a resource
    const initialResourcesA = await worldA.getResourceCount();
    
    // Move around to find resources
    await worldA.movePlayer('right', 10);
    await worldA.movePlayer('down', 10);
    await worldA.collectResource();
    
    // Verify User A collected a resource
    const newResourcesA = await worldA.getResourceCount();
    
    if (newResourcesA > initialResourcesA) {
      // Resource was collected, User B should see it disappear
      const resourceCollectedEvent = await worldB.waitForResourceEvent('RESOURCE_COLLECTED');
      expect(resourceCollectedEvent).toBeDefined();
      expect(resourceCollectedEvent.userId).toBe(userJoinedEvent2.user.userId);
    }
    
    // User A can drop a resource for User B
    if (newResourcesA > initialResourcesA) {
      await worldA.dropResource(0); // Drop first resource
      
      // User B should see the dropped resource
      const resourceDroppedEvent = await worldB.waitForResourceEvent('RESOURCE_DROPPED');
      expect(resourceDroppedEvent).toBeDefined();
      
      // User B can collect the dropped resource
      await worldB.moveToPosition(resourceDroppedEvent.position.x, resourceDroppedEvent.position.y);
      await worldB.collectResource();
      
      // Verify User B collected the resource
      const newResourcesB = await worldB.getResourceCount();
      expect(newResourcesB).toBeGreaterThan(0);
    }
  });
  
  test('Users can see terrain changes in real-time', async () => {
    // Test terrain modification if the game supports it
    // For example, if players can build structures or modify the environment
    
    // User A builds a structure or modifies terrain
    if (await worldA.canModifyTerrain()) {
      const structureName = `Test Structure ${Date.now()}`;
      await worldA.placeStructure(structureName);
      
      // User B should see the new structure
      const structureEvent = await worldB.waitForTerrainEvent('TERRAIN_UPDATED');
      expect(structureEvent).toBeDefined();
      
      // User B should be able to interact with it
      await worldB.moveToPosition(structureEvent.position.x, structureEvent.position.y);
      await worldB.interactWithStructure();
      
      // Both users should receive notification
      await worldA.waitForNotification(new RegExp(`.*${structureName}.*`));
      await worldB.waitForNotification(new RegExp(`.*${structureName}.*`));
    }
  });

  test.afterAll(async () => {
    // Clean up
    await userA.context.close();
    await userB.context.close();
    await userB.browser.close();
    // Don't close browserA - Playwright handles that automatically
  });
});
