"use client"

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

import {Annotations} from "./annotations"
import {EditHistory} from "./edit-history"

export function Sidebar() {
  return (
    <Tabs defaultValue="annotations" className="flex h-full flex-col">
      <div className="border-b border-border p-4">
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
        <Annotations />
      </TabsContent>

      <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
        <EditHistory />
      </TabsContent>
    </Tabs>
  )
}
