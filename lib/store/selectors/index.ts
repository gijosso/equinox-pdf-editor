// Combined selectors object for convenience
import {documentSelectors} from "./documents"
import {versionSelectors} from "./versions"

// Re-export all selectors from organized modules
export * from "./documents"
export * from "./versions"

export const selectors = {
  ...documentSelectors,
  ...versionSelectors,
}
