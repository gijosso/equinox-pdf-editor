"use client"

import {LazyAnnotations, LazyEditHistory} from "@/components/lazy"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

interface SidebarProps {
  documentId: string
}

export function Sidebar({documentId}: SidebarProps) {
  return (
    <Tabs defaultValue="annotations" className="flex h-full flex-col" data-sidebar>
      <div className="flex justify-between items-center border-b border-border p-4">
        <TabsList className="w-full">
          <TabsTrigger value="annotations" className="flex-1">
            Annotations
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            Edits
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="annotations" className="mt-0 flex-1 overflow-hidden">
        <LazyAnnotations documentId={documentId} />
      </TabsContent>

      <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
        <LazyEditHistory documentId={documentId} />
      </TabsContent>
    </Tabs>
  )
}
