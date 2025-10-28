import type {TextEdit} from "@/lib/types"

// Shared color scheme for text edit operations
export const TEXT_EDIT_COLORS = {
  insert: {
    background: "rgba(34, 197, 94, 0.1)",
    backgroundGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
    border: "rgba(34, 197, 94, 0.3)",
    text: "#059669",
    shadow: "rgba(34, 197, 94, 0.2)",
  },
  replace: {
    background: "rgba(59, 130, 246, 0.1)",
    backgroundGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
    border: "rgba(59, 130, 246, 0.3)",
    text: "#2563eb",
    shadow: "rgba(59, 130, 246, 0.2)",
  },
  delete: {
    background: "rgba(239, 68, 68, 0.1)",
    backgroundGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#dc2626",
    shadow: "rgba(239, 68, 68, 0.2)",
  },
  default: {
    background: "rgba(107, 114, 128, 0.1)",
    backgroundGradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)",
    border: "rgba(107, 114, 128, 0.3)",
    text: "#6b7280",
    shadow: "rgba(107, 114, 128, 0.2)",
  },
} as const

/**
 * Get Tailwind classes for text edit styling based on operation type
 */
export function getTextEditClasses(operation?: TextEdit["operation"]): {
  container: string
  background: string
  border: string
  text: string
  icon: string
} {
  switch (operation) {
    case "insert":
      return {
        container: "bg-green-50 border-green-200",
        background: "bg-green-100/30",
        border: "border-green-300",
        text: "text-green-800",
        icon: "text-green-600",
      }
    case "delete":
      return {
        container: "bg-red-50 border-red-200",
        background: "bg-red-100/30",
        border: "border-red-300",
        text: "text-red-800",
        icon: "text-red-600",
      }
    case "replace":
      return {
        container: "bg-blue-50 border-blue-200",
        background: "bg-blue-100/30",
        border: "border-blue-300",
        text: "text-blue-800",
        icon: "text-blue-600",
      }
    default:
      return {
        container: "bg-gray-50 border-gray-200",
        background: "bg-gray-100/30",
        border: "border-gray-300",
        text: "text-gray-800",
        icon: "text-gray-600",
      }
  }
}

/**
 * Get color values for text edit operations
 */
export function getTextEditColors(operation?: TextEdit["operation"] | "default") {
  switch (operation) {
    case "insert":
      return TEXT_EDIT_COLORS.insert
    case "replace":
      return TEXT_EDIT_COLORS.replace
    case "delete":
      return TEXT_EDIT_COLORS.delete
    default:
      return TEXT_EDIT_COLORS.default
  }
}
