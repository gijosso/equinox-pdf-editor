"use client"

import {Edit3, FileText, Trash2} from "lucide-react"

import type {TextEditOperation} from "@/lib/types"

export type TextEditOperationConfig = {operation: TextEditOperation["type"]; icon: React.ReactNode; label: string}

export const TEXT_EDIT_CONFIGS = {
  insert: {operation: "insert", icon: <Edit3 className="h-4 w-4 text-green-600" />, label: "Insert"},
  delete: {operation: "delete", icon: <Trash2 className="h-4 w-4 text-red-600" />, label: "Delete"},
  replace: {operation: "replace", icon: <FileText className="h-4 w-4 text-blue-600" />, label: "Replace"},
} as const satisfies {[K in TextEditOperation["type"]]: TextEditOperationConfig}

export const TEXT_EDIT_CONFIGS_ARRAY = Object.values(TEXT_EDIT_CONFIGS)
