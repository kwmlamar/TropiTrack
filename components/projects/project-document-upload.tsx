'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { uploadProjectFile } from '@/lib/data/project-files'
import { FileUploadData, FileCategory, FILE_CATEGORIES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/types/project-file'

interface ProjectDocumentUploadProps {
  projectId: string
  onUploadComplete: () => void
}

export function ProjectDocumentUpload({ projectId, onUploadComplete }: ProjectDocumentUploadProps) {
  const [uploadData, setUploadData] = useState<FileUploadData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadData({
        file,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for name
        description: '',
        category: 'other' as FileCategory
      })
      setError(null)
      setDialogOpen(true)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setError('File type not supported. Please upload PDF, PNG, JPG, or DOCX files.')
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size too large. Maximum size is 50MB.')
        return
      }

      setUploadData({
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: 'other' as FileCategory
      })
      setError(null)
      setDialogOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!uploadData || !uploadData.name.trim()) {
      setError('Please provide a document name')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log('Starting file upload...', {
        projectId,
        fileName: uploadData.name,
        fileSize: uploadData.file.size,
        fileType: uploadData.file.type
      })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await uploadProjectFile(projectId, uploadData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      console.log('Upload successful:', result)
      toast.success('Document uploaded successfully!')
      setUploadData(null)
      setUploadProgress(0)
      setDialogOpen(false)
      onUploadComplete()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document'
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Check if it's a storage bucket issue
      if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
        setError(`${errorMessage}\n\nPlease ensure the storage bucket is set up correctly. Check the browser console for more details.`)
      }
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setUploadData(null)
    setError(null)
    setDialogOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  return (
    <>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive && !isDragReject 
              ? 'border-secondary bg-secondary/10' 
              : isDragReject 
                ? 'border-destructive bg-destructive/5' 
                : 'border-secondary/60 bg-secondary/5 hover:border-secondary hover:bg-secondary/10'
            }
          `}
        >
          <input {...getInputProps()} />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div>
              <p className="text-lg font-medium mb-2">
                {isDragActive && !isDragReject 
                  ? 'Drop the file here' 
                  : isDragReject 
                    ? 'File type not supported' 
                    : 'Drag & drop a file here'
                }
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>Supported formats: PDF, PNG, JPG, DOCX, XLSX, PPTX</p>
              <p>Maximum file size: 50MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          
          {uploadData && (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl">{getFileIcon(uploadData.file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadData.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadData.file.size)} • {uploadData.file.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    value={uploadData.name}
                    onChange={(e) => setUploadData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter document name"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <Label htmlFor="document-description">Description (Optional)</Label>
                  <Textarea
                    id="document-description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Brief description of the document"
                    rows={2}
                    disabled={uploading}
                  />
                </div>

                <div>
                  <Label htmlFor="document-category">Category</Label>
                  <Select
                    value={uploadData.category}
                    onValueChange={(value: FileCategory) => 
                      setUploadData(prev => prev ? { ...prev, category: value } : null)
                    }
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !uploadData.name.trim()}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={removeFile}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 