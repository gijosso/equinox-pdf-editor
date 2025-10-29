import type {AnnotationDiff} from "@/lib/types"

interface DiffOverlayConfig {
  highlightClasses: string
  outlineClasses: string
  iconClasses: string
  icon: string
}

export const DIFF_OVERLAY_CONFIG: Record<AnnotationDiff["type"], DiffOverlayConfig> = {
  added: {
    highlightClasses: "bg-green-500/50 border-green-500",
    outlineClasses: "border-green-500",
    iconClasses: "bg-green-500",
    icon: "+",
  },
  removed: {
    highlightClasses: "bg-red-500/50 border-red-500",
    outlineClasses: "border-red-500",
    iconClasses: "bg-red-500",
    icon: "-",
  },
  modified: {
    highlightClasses: "bg-yellow-500/50 border-yellow-500",
    outlineClasses: "border-yellow-500",
    iconClasses: "bg-yellow-500",
    icon: "~",
  },
  untouched: {
    highlightClasses: "bg-gray-500/30 border-gray-500",
    outlineClasses: "border-gray-500",
    iconClasses: "bg-gray-500",
    icon: "=",
  },
} satisfies Record<AnnotationDiff["type"], DiffOverlayConfig>
