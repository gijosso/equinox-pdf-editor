"use client"

import React from "react"

import type {AnnotationDiff} from "@/lib/types"

import {DIFF_OVERLAY_CONFIG} from "./diff-overlay-configs"

export type DiffItem = {
  id: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  annotationType: AnnotationDiff["type"]
}

function AnnotationDiffHighlight({
  x,
  y,
  width,
  height,
  type,
  scale,
}: {
  x: number
  y: number
  width: number
  height: number
  type: AnnotationDiff["type"]
  scale: number
}) {
  const config = DIFF_OVERLAY_CONFIG[type]
  return (
    <div
      className={`absolute pointer-events-none border-2 rounded bg-transparent ${config.outlineClasses}`}
      style={{left: x * scale, top: y * scale, width: width * scale, height: height * scale}}
    >
      <div
        className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

const UntouchedAnnotationHighlight = ({
  x,
  y,
  width,
  height,
  scale,
}: {
  x: number
  y: number
  width: number
  height: number
  scale: number
}) => {
  const config = DIFF_OVERLAY_CONFIG.untouched
  return (
    <div
      className={`absolute pointer-events-none border-2 rounded bg-transparent ${config.outlineClasses}`}
      style={{left: x * scale, top: y * scale, width: width * scale, height: height * scale}}
    >
      <div
        className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

interface DiffOverlayProps {
  diffItems: DiffItem[]
  pageNumber: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

function DiffOverlayImpl({diffItems, pageNumber, scale, viewportWidth, viewportHeight}: DiffOverlayProps) {
  const pageItems = React.useMemo(() => diffItems.filter(i => i.pageNumber === pageNumber), [diffItems, pageNumber])

  if (pageItems.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10" style={{width: viewportWidth, height: viewportHeight}}>
      {pageItems.map((item, idx) => {
        if (item.annotationType === "untouched") {
          return (
            <UntouchedAnnotationHighlight
              key={`untouched-${idx}`}
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              scale={scale}
            />
          )
        }
        return (
          <AnnotationDiffHighlight
            key={`diff-${idx}`}
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            type={item.annotationType}
            scale={scale}
          />
        )
      })}
    </div>
  )
}

export const DiffOverlay = React.memo(DiffOverlayImpl)
