"use client"

import {FileText, MoreVertical, Trash2} from "lucide-react"
import Image from "next/image"
import {useRouter} from "next/navigation"
import React from "react"

import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {useToast} from "@/hooks/use-toast"
import {useDeleteDocumentMutation, useGetAllDocumentsQuery} from "@/lib/store/api"
import {formatDate} from "@/lib/utils"

export const DocumentList = () => {
  const router = useRouter()
  const {data: documents = []} = useGetAllDocumentsQuery()
  const [deleteDocument] = useDeleteDocumentMutation()
  const {toast} = useToast()

  const handleDelete = React.useCallback(
    async (id: string, name: string) => {
      try {
        await deleteDocument(id).unwrap()
        toast({
          title: "Document deleted",
          description: `${name} has been deleted`,
        })
      } catch (error) {
        console.error("Delete error:", error)
        toast({
          title: "Delete failed",
          description: "There was an error deleting the document",
          variant: "destructive",
        })
      }
    },
    [deleteDocument, toast],
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map(doc => (
        <Card key={doc.id} className="group relative overflow-hidden transition-colors hover:bg-accent/50">
          <button onClick={() => router.push(`/editor/${doc.id}`)} className="flex w-full flex-col gap-4 p-6 text-left">
            <div className="flex items-start gap-3">
              {doc.thumbnail ? (
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={doc.thumbnail || "/placeholder.svg"}
                    alt={`${doc.name} thumbnail`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground">{doc.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Updated {formatDate(doc.updatedAt)}</p>
              </div>
            </div>
          </button>

          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDelete(doc.id, doc.name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  )
}
