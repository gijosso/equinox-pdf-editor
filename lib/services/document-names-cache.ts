/**
 * Document Names Cache Service
 * Manages the cache of document names for efficient duplicate name generation
 */
class DocumentNamesCacheService {
  private cache = new Set<string>()
  private initialized = false

  /**
   * Initialize the cache with current document names
   */
  initialize(documentNames: string[]) {
    this.cache.clear()
    documentNames.forEach(name => this.cache.add(name))
    this.initialized = true
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear()
    this.initialized = false
  }

  /**
   * Add a new document name to the cache
   */
  add(name: string) {
    this.cache.add(name)
  }

  /**
   * Remove a document name from the cache
   */
  remove(name: string) {
    this.cache.delete(name)
  }

  /**
   * Get the current cache as a Set
   */
  getCache(): Set<string> {
    return this.cache
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const documentNamesCache = new DocumentNamesCacheService()
