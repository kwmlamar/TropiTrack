'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldX, ShieldCheck } from 'lucide-react'
import { ProjectDocumentUpload } from './project-document-upload'
import { ProjectFilesList } from './project-files-list'
import { getUserProfile } from '@/lib/data/userProfiles'

interface ProjectDocumentsNewProps {
  projectId: string
}

export function ProjectDocumentsNew({ projectId }: ProjectDocumentsNewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)
  const [canUpload, setCanUpload] = useState(false)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile()
        
        // Check if user can upload (admin or project manager)
        const hasUploadPermission = profile?.role === 'admin' || profile?.role === 'manager'
        setCanUpload(hasUploadPermission)
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Access Control Notice */}
      {!canUpload && (
        <Alert>
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            You need admin or manager permissions to upload documents. Contact your administrator for access.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      {canUpload && (
        <ProjectDocumentUpload
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Files List */}
      <ProjectFilesList
        projectId={projectId}
        refreshTrigger={refreshTrigger}
      />

      {/* Security Info */}
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>
              Files are stored securely with encrypted access. Only project members can view and download files.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 