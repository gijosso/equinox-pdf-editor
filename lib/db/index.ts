import {atomicService} from "./atomic"
import {documentService} from "./documents"
import {versionService} from "./versions"

export {db} from "./database"

export * from "./documents"
export * from "./versions"
export * from "./atomic"

export const dbService = {
  ...documentService,
  ...versionService,
  ...atomicService,
}
