const Resource = require('../../domain/models/Resource');

/**
 * Repository for resource data access with improved query efficiency
 */
class ResourceRepository {
  constructor(dynamoTables, logger) {
    this.tables = dynamoTables;
    this.logger = logger || console;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 60000; // 1 minute
    console.log('🗃️ Resource repository initialized 🧩 constructor');
  }

  /**
   * Get a resource by ID with caching
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Resource|null>}
   */
  async getResource(resourceId) {
    // Check cache first
    const cachedResource = this.getCached(resourceId);
    if (cachedResource) {
      console.debug('🗃️ Cache hit for resource 🎯 getResource', { resourceId });
      return cachedResource;
    }
    
    console.debug('🗃️ Cache miss for resource 🔍 getResource', { resourceId });
    
    try {
      const result = await this.tables.resources.get({ resourceId });
      
      if (result) {
        console.debug('🗃️ Resource found in database 📦 getResource', { resourceId, type: result.type });
        const resource = new Resource(result);
        this.setCached(resourceId, resource);
        return resource;
      }
      console.debug('🗃️ Resource not found in database ❓ getResource', { resourceId });
      return null;
    } catch (err) {
      console.log('🗃️ Failed to get resource ❌ getResource', { resourceId, error: err.message });
      this.logger.error('Failed to get resource', { resourceId, error: err.message });
      throw err;
    }
  }

  /**
   * Save a resource
   * @param {Resource} resource - Resource to save
   * @returns {Promise<Resource>}
   */
  async saveResource(resource) {
    try {
      console.log('🗃️ Saving resource to database 💾 saveResource', { resourceId: resource.id, type: resource.type });
      await this.tables.resources.put(resource.toDb());
      this.setCached(resource.id, resource);
      return resource;
    } catch (err) {
      console.log('🗃️ Failed to save resource ⚠️ saveResource', { resourceId: resource.id, error: err.message });
      this.logger.error('Failed to save resource', { 
        resourceId: resource.id, 
        error: err.message 
      });
      throw err;
    }
  }

  /**
   * Delete a resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise<void>}
   */
  async deleteResource(resourceId) {
    try {
      console.log('🗃️ Deleting resource from database 🗑️ deleteResource', { resourceId });
      await this.tables.resources.delete({ resourceId });
      this.removeCached(resourceId);
    } catch (err) {
      console.log('🗃️ Failed to delete resource 🚫 deleteResource', { resourceId, error: err.message });
      this.logger.error('Failed to delete resource', { resourceId, error: err.message });
      throw err;
    }
  }

  /**
   * Batch save resources for better performance
   * @param {Resource[]} resources - Resources to save
   * @returns {Promise<{success: Resource[], failed: Resource[]}>}
   */
  async batchSaveResources(resources) {
    if (!resources || resources.length === 0) {
      console.debug('🗃️ No resources to batch save 📭 batchSaveResources');
      return { success: [], failed: [] };
    }
    
    console.log('🗃️ Batch saving resources 📚 batchSaveResources', { count: resources.length });
    
    const success = [];
    const failed = [];
    
    // Process in batches of 25 (DynamoDB batch limit)
    for (let i = 0; i < resources.length; i += 25) {
      const batch = resources.slice(i, i + 25);
      
      try {
        // Convert resources to DB format
        const dbItems = batch.map(resource => ({
          Put: {
            TableName: process.env.RESOURCE_TABLE_NAME || 'resources',
            Item: resource.toDb()
          }
        }));
        
        // Perform batch write
        const result = await this.tables.batchWrite({ RequestItems: dbItems });
        
        // Update cache and track successes
        batch.forEach(resource => {
          this.setCached(resource.id, resource);
          success.push(resource);
        });
      } catch (err) {
        console.log('🗃️ Batch save failed for chunk 📛 batchSaveResources', { 
          batchSize: batch.length, 
          error: err.message
        });
        this.logger.error('Batch save resources failed', { error: err.message });
        batch.forEach(resource => failed.push(resource));
      }
    }
    
    console.log('🗃️ Batch save completed 📊 batchSaveResources', { 
      totalCount: resources.length,
      successCount: success.length, 
      failureCount: failed.length 
    });
    
    return { success, failed };
  }

  /**
   * Get resources in a region with spatial indexing optimization
   * @param {number} minX - Minimum X coordinate
   * @param {number} minY - Minimum Y coordinate
   * @param {number} maxX - Maximum X coordinate
   * @param {number} maxY - Maximum Y coordinate
   * @returns {Promise<Resource[]>}
   */
  async getResourcesInRegion(minX, minY, maxX, maxY) {
    // Generate a region key for caching
    const regionKey = `region:${minX},${minY},${maxX},${maxY}`;
    const cached = this.getCached(regionKey);
    if (cached) {
      console.debug('🗃️ Cache hit for region query 🌐 getResourcesInRegion', { 
        region: { minX, minY, maxX, maxY }, 
        resourceCount: cached.length
      });
      return cached;
    }
    
    console.log('🗃️ Querying resources in region 🗺️ getResourcesInRegion', { region: { minX, minY, maxX, maxY } });
    
    try {
      // Check if a GSI exists for spatial queries
      const hasGSI = process.env.RESOURCES_SPATIAL_INDEX;
      
      let resources = [];
      
      if (hasGSI) {
        // Use GSI for efficient spatial queries
        // This would require setting up a GSI in the DynamoDB table
        // with geohash or quadtree indexing
        const quadKey = this.calculateQuadKey(
          (minX + maxX) / 2, 
          (minY + maxY) / 2, 
          Math.max(maxX - minX, maxY - minY)
        );
        
        console.debug('🗃️ Using spatial index for query 📍 getResourcesInRegion', { quadKey });
        
        const result = await this.tables.resources.query({
          IndexName: 'SpatialIndex',
          KeyConditionExpression: 'quadKey = :qk',
          ExpressionAttributeValues: { ':qk': quadKey }
        });
        
        resources = result.Items || [];
      } else {
        // Fall back to filtering results from a scan
        console.debug('🗃️ Using scan and filter (no spatial index) 🔍 getResourcesInRegion');
        const result = await this.tables.resources.scan();
        
        resources = (result.Items || []).filter(item => {
          if (!item.position) return false;
          const { x, y } = item.position;
          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        });
      }
      
      // Convert to domain objects and cache
      const domainResources = resources.map(item => new Resource(item));
      this.setCached(regionKey, domainResources, 5000); // Shorter TTL for regions
      
      console.log('🗃️ Region query completed 📊 getResourcesInRegion', { 
        region: { minX, minY, maxX, maxY }, 
        resourceCount: domainResources.length
      });
      
      return domainResources;
    } catch (err) {
      console.log('🗃️ Failed to query region ⚠️ getResourcesInRegion', {
        region: { minX, minY, maxX, maxY },
        error: err.message
      });
      this.logger.error('Failed to get resources in region', {
        region: { minX, minY, maxX, maxY },
        error: err.message
      });
      return [];
    }
  }

  // Cache management methods
  getCached(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  setCached(key, value, customTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (customTTL || this.cacheTTL)
    });
  }
  
  removeCached(key) {
    this.cache.delete(key);
  }
  
  // Simple quadkey calculation for spatial indexing example
  calculateQuadKey(x, y, size) {
    // This is a simplified version - a production implementation would
    // use a proper geospatial indexing algorithm
    const precision = 10;
    const gridX = Math.floor(x / size * precision);
    const gridY = Math.floor(y / size * precision);
    return `${gridX}:${gridY}`;
  }
}

module.exports = ResourceRepository;
