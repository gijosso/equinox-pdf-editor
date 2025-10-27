export class DocumentNamesCacheService {
  private static instance: DocumentNamesCacheService
  private cache = new Set<string>()
  private initialized = false

  private constructor() {}

  static getInstance(): DocumentNamesCacheService {
    if (!DocumentNamesCacheService.instance) {
      DocumentNamesCacheService.instance = new DocumentNamesCacheService()
    }
    return DocumentNamesCacheService.instance
  }

  initialize(documentNames: string[]) {
    this.cache.clear()
    documentNames.forEach(name => this.cache.add(name))
    this.initialized = true
  }

  clear() {
    this.cache.clear()
    this.initialized = false
  }

  add(name: string) {
    this.cache.add(name)
  }

  remove(name: string) {
    this.cache.delete(name)
  }

  getCache(): Set<string> {
    return this.cache
  }

  isInitialized(): boolean {
    return this.initialized
  }

  size(): number {
    return this.cache.size
  }
}

export const documentNamesCache = DocumentNamesCacheService.getInstance()
