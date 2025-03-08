#!/usr/bin/env node

/**
 * Migration script for SplaySpace data model updates
 * This script helps migrate data between versions when the data model changes
 */

const arc = require('@architect/functions');

async function migrateData() {
  console.log('Starting data migration...');
  
  try {
    // Connect to DynamoDB tables
    const tables = await arc.tables();
    
    // Scan all users - for example, to add a new field to all users
    const { Items: users } = await tables.users.scan({});
    
    console.log(`Found ${users.length} users to migrate`);
    
    let updated = 0;
    
    // Process each user
    for (const user of users) {
      // Example migration: add ownershipWindow if not present
      if (!user.ownershipWindow) {
        await tables.users.update({
          Key: { userId: user.userId },
          UpdateExpression: 'SET ownershipWindow = :window',
          ExpressionAttributeValues: {
            ':window': { width: 10, height: 10, level: 'basic' }
          }
        });
        updated++;
      }
    }
    
    console.log(`Migration complete. Updated ${updated} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
