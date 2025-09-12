"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Search, 
  Filter,
  FolderOpen,
  Calendar,
  User
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { ProjectDocument, DocumentCategory } from "@/lib/types/document"
import { DOCUMENT_CATEGORIES, formatFileSize } from "@/lib/types/document"
import { 
  getProjectDocuments, 
  createProjectDocument, 
  updateProjectDocument, 
  deleteProjectDocument,
  getProjectDocumentStats 
} from "@/lib/data/documents"

interface ProjectDocumentsProps {
  projectId: string
  userId: string
}

export function ProjectDocuments({ projectId, userId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<ProjectDocument[]>([])
  const [stats, setStats] = useState<{ total: number; byCategory: Record<DocumentCategory, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<ProjectDocument | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<ProjectDocument | null>(null)
  const [documentContent, setDocumentContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [uploadData, setUploadData] = useState<{
    name: string
    description: string
    category: DocumentCategory
    file: File | null
  }>({
    name: "",
    description: "",
    category: "other",
    file: null
  })

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const [documentsResponse, statsResponse] = await Promise.all([
        getProjectDocuments(projectId, userId),
        getProjectDocumentStats(projectId, userId)
      ])

      if (documentsResponse.success && documentsResponse.data) {
        setDocuments(documentsResponse.data)
      } else {
        toast.error(documentsResponse.error || "Failed to load documents")
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId, userId])

  // Load documents on component mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Filter documents when search term or category changes
  useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, selectedCategory])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadData(prev => ({
        ...prev,
        file,
        name: file.name
      }))
    }
  }

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.name.trim()) {
      toast.error("Please select a file and provide a name")
      return
    }

    setUploading(true)
    try {
      // For now, we'll simulate file upload
      // In a real implementation, you'd upload to Supabase Storage first
      const documentData = {
        project_id: projectId,
        company_id: "", // This will be set by the server
        name: uploadData.name,
        description: uploadData.description,
        file_path: `/projects/${projectId}/${uploadData.file.name}`,
        file_size: uploadData.file.size,
        file_type: uploadData.file.type,
        category: uploadData.category,
        uploaded_by: userId
      }

      const response = await createProjectDocument(userId, documentData)

      if (response.success && response.data) {
        toast.success("Document uploaded successfully")
        setUploadDialogOpen(false)
        setUploadData({
          name: "",
          description: "",
          category: "other",
          file: null
        })
        loadDocuments()
      } else {
        toast.error(response.error || "Failed to upload document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error uploading document:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = async (documentId: string, updates: { name: string; description: string; category: DocumentCategory }) => {
    try {
      const response = await updateProjectDocument(userId, documentId, updates)
      if (response.success) {
        toast.success("Document updated successfully")
        setEditDialogOpen(false)
        setEditingDocument(null)
        loadDocuments()
      } else {
        toast.error(response.error || "Failed to update document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error updating document:", error)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const response = await deleteProjectDocument(userId, documentId)
      if (response.success) {
        toast.success("Document deleted successfully")
        loadDocuments()
      } else {
        toast.error(response.error || "Failed to delete document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error deleting document:", error)
    }
  }

  const openEditDialog = (document: ProjectDocument) => {
    setEditingDocument(document)
    setEditDialogOpen(true)
  }

  const openPreviewDialog = async (document: ProjectDocument) => {
    setPreviewDocument(document)
    setPreviewDialogOpen(true)
    setLoadingContent(true)
    setDocumentContent(null)
    
    try {
      // Fetch the actual document content
      const response = await fetch(`/api/project-documents/${document.id}/file`)
      if (response.ok) {
        const content = await response.text()
        setDocumentContent(content)
      } else {
        console.error('Failed to fetch document content')
        setDocumentContent('Unable to load document content')
      }
    } catch (error) {
      console.error('Error fetching document content:', error)
      setDocumentContent('Error loading document content')
    } finally {
      setLoadingContent(false)
    }
  }

  const getCategoryColor = (category: DocumentCategory) => {
    const colors = {
      contract: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      permit: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      plan: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      invoice: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      receipt: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      specification: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      safety: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      quality: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
    return colors[category]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Documents</h3>
          <p className="text-sm text-gray-500">
            Manage contracts, plans, permits, and other project documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
              </div>
              <div>
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={uploadData.name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter document name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={uploadData.category}
                  onValueChange={(value: DocumentCategory) => 
                    setUploadData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadData.file || !uploadData.name.trim()}
                  className="flex-1"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="text-2xl font-bold text-primary dark:text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {DOCUMENT_CATEGORIES.slice(0, 3).map(category => (
            <Card key={category.value} className="border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/20" />
                  <div>
                    <p className="text-sm text-gray-500">{category.label}</p>
                    <p className="text-2xl font-bold text-primary dark:text-foreground">{stats.byCategory[category.value] || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value: DocumentCategory | "all") => setSelectedCategory(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {DOCUMENT_CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Upload your first document to get started"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-medium text-gray-500">Document</th>
                    <th className="text-left p-4 font-medium text-gray-500">Category</th>
                    <th className="text-left p-4 font-medium text-gray-500">Size</th>
                    <th className="text-left p-4 font-medium text-gray-500">Uploaded By</th>
                    <th className="text-left p-4 font-medium text-gray-500">Date</th>
                    <th className="text-right p-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-muted rounded border flex items-center justify-center overflow-hidden">
                            {document.file_type.includes('image') ? (
                              <Image 
                                src={`/api/project-documents/${document.id}/preview`} 
                                alt={document.name}
                                width={40}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  const target = e.currentTarget as HTMLImageElement
                                  target.style.display = 'none'
                                  const nextElement = target.nextElementSibling as HTMLElement
                                  if (nextElement) {
                                    nextElement.style.display = 'flex'
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-xs ${document.file_type.includes('image') ? 'hidden' : ''}`}>
                              {document.file_type.includes('pdf') ? (
                                <div className="w-full h-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                  <span className="text-red-600 dark:text-red-400 font-bold">PDF</span>
                                </div>
                              ) : document.file_type.includes('word') || document.file_type.includes('document') ? (
                                <div className="w-full h-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">DOC</span>
                                </div>
                              ) : document.file_type.includes('excel') || document.file_type.includes('spreadsheet') ? (
                                <div className="w-full h-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                  <span className="text-green-600 dark:text-green-400 font-bold">XLS</span>
                                </div>
                              ) : document.file_type.includes('powerpoint') || document.file_type.includes('presentation') ? (
                                <div className="w-full h-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                  <span className="text-orange-600 dark:text-orange-400 font-bold">PPT</span>
                                </div>
                              ) : document.file_type.includes('zip') || document.file_type.includes('archive') ? (
                                <div className="w-full h-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                  <span className="text-purple-600 dark:text-purple-400 font-bold">ZIP</span>
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
                                  <span className="text-gray-600 dark:text-gray-400 font-bold">FILE</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 
                              className="font-medium text-primary dark:text-foreground truncate cursor-pointer hover:underline"
                              onClick={() => openPreviewDialog(document)}
                            >
                              {document.name}
                            </h4>
                            {document.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {document.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(document.category)}`}
                        >
                          {DOCUMENT_CATEGORIES.find(c => c.value === document.category)?.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {formatFileSize(document.file_size)}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {document.uploaded_by_profile?.name || "Unknown"}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {format(new Date(document.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // In a real implementation, this would download the file
                              toast.info("Download functionality coming soon")
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(document)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{document.name}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(document.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Document
            </DialogTitle>
          </DialogHeader>
          {editingDocument && (
            <EditDocumentForm
              document={editingDocument}
              onSave={handleEdit}
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingDocument(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewDocument?.name}
            </DialogTitle>
          </DialogHeader>
          {previewDocument && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getCategoryColor(previewDocument.category)}`}
                  >
                    {DOCUMENT_CATEGORIES.find(c => c.value === previewDocument.category)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatFileSize(previewDocument.file_size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{previewDocument.uploaded_by_profile?.name || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(previewDocument.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
              
              {previewDocument.description && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm">{previewDocument.description}</p>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                {previewDocument.file_type.includes('image') ? (
                  <div className="flex items-center justify-center bg-muted/20 p-8">
                    <Image 
                      src={`/api/project-documents/${previewDocument.id}/file`} 
                      alt={previewDocument.name}
                      width={400}
                      height={400}
                      className="max-w-full max-h-96 object-contain"
                    />
                  </div>
                ) : previewDocument.file_type.includes('pdf') ? (
                  <div className="h-96 bg-muted/20 overflow-auto">
                    {loadingContent ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading PDF...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-32 h-40 bg-red-100 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-red-600 dark:text-red-400 text-4xl font-bold">PDF</span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{previewDocument.name}</h3>
                          <p className="text-gray-500 mb-4">
                            PDF Document • {formatFileSize(previewDocument.file_size)}
                          </p>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Pages:</span>
                                <span>Estimated {Math.ceil(previewDocument.file_size / 5000)} pages</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span>Portable Document Format</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Category:</span>
                                <span>{DOCUMENT_CATEGORIES.find(c => c.value === previewDocument.category)?.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : previewDocument.file_type.includes('word') || previewDocument.file_type.includes('document') ? (
                  <div className="h-96 bg-muted/20 overflow-auto">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-32 h-40 bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                          <span className="text-blue-600 dark:text-blue-400 text-4xl font-bold">DOC</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{previewDocument.name}</h3>
                        <p className="text-gray-500 mb-4">
                          Microsoft Word Document • {formatFileSize(previewDocument.file_size)}
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span>Word Document</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Category:</span>
                              <span>{DOCUMENT_CATEGORIES.find(c => c.value === previewDocument.category)?.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : previewDocument.file_type.includes('excel') || previewDocument.file_type.includes('spreadsheet') ? (
                  <div className="h-96 bg-muted/20 overflow-auto">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-32 h-40 bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                          <span className="text-green-600 dark:text-green-400 text-4xl font-bold">XLS</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{previewDocument.name}</h3>
                        <p className="text-gray-500 mb-4">
                          Microsoft Excel Spreadsheet • {formatFileSize(previewDocument.file_size)}
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span>Excel Spreadsheet</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Category:</span>
                              <span>{DOCUMENT_CATEGORIES.find(c => c.value === previewDocument.category)?.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 bg-muted/20 overflow-auto">
                    {loadingContent ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading document...</p>
                        </div>
                      </div>
                    ) : documentContent ? (
                      <div className="p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono text-foreground max-h-64 overflow-auto">
                          {documentContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-32 h-40 bg-gray-100 dark:bg-gray-900/20 border-2 border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-gray-600 dark:text-gray-400 text-4xl font-bold">FILE</span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{previewDocument.name}</h3>
                          <p className="text-gray-500 mb-4">
                            {previewDocument.file_type} • {formatFileSize(previewDocument.file_size)}
                          </p>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span>{previewDocument.file_type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Category:</span>
                                <span>{DOCUMENT_CATEGORIES.find(c => c.value === previewDocument.category)?.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    // In a real implementation, this would download the file
                    toast.info("Download functionality coming soon")
                  }}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(previewDocument)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface EditDocumentFormProps {
  document: ProjectDocument
  onSave: (documentId: string, updates: { name: string; description: string; category: DocumentCategory }) => Promise<void>
  onCancel: () => void
}

function EditDocumentForm({ document, onSave, onCancel }: EditDocumentFormProps) {
  const [name, setName] = useState(document.name)
  const [description, setDescription] = useState(document.description || "")
  const [category, setCategory] = useState<DocumentCategory>(document.category)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Document name is required")
      return
    }

    setSaving(true)
    try {
      await onSave(document.id, { name: name.trim(), description, category })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Document Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter document name"
        />
      </div>
      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="edit-category">Category</Label>
        <Select value={category} onValueChange={(value: DocumentCategory) => setCategory(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
} 