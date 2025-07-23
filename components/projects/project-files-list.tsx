'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Download, Trash2, FileText, Calendar, User, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { getProjectFiles, deleteProjectFile, getSignedUrl } from '@/lib/data/project-files'
import { ProjectFile, FileCategory, FILE_CATEGORIES } from '@/lib/types/project-file'

interface ProjectFilesListProps {
  projectId: string
  refreshTrigger: number
}

export function ProjectFilesList({ projectId, refreshTrigger }: ProjectFilesListProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all')
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const projectFiles = await getProjectFiles(projectId)
      setFiles(projectFiles)
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load project files')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadFiles()
  }, [projectId, refreshTrigger, loadFiles])

  const handleDelete = async (fileId: string) => {
    try {
      setDeletingFileId(fileId)
      await deleteProjectFile(fileId)
      toast.success('File deleted successfully')
      loadFiles() // Refresh the list
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleDownload = async (file: ProjectFile) => {
    try {
      // Create a signed URL for secure download
      const filePath = `${file.project_id}/${file.file_name}`
      const signedUrl = await getSignedUrl(filePath, 3600) // 1 hour expiry
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = file.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈'
    return '📎'
  }

  const getCategoryColor = (category: FileCategory) => {
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

  // Filter files based on search and category
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Files</h3>
        <p className="text-sm text-gray-500">
          {files.length} file{files.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value: FileCategory | 'all') => setSelectedCategory(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {FILE_CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Files List Card */}
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardContent className="p-6">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload your first document to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* File Icon */}
                  <div className="text-2xl">{getFileIcon(file.file_type)}</div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{file.original_name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(file.category)}`}
                      >
                        {FILE_CATEGORIES.find(c => c.value === file.category)?.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{file.uploaded_by_profile?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(file.uploaded_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    
                    {file.description && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {file.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingFileId === file.id}
                          title="Delete file"
                        >
                          {deletingFileId === file.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{file.original_name}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(file.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 