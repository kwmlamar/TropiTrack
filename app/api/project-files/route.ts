import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getProfile } from '@/lib/data/data'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const file = formData.get('file') as File

    if (!projectId || !name || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size too large. Maximum size is 50MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    // Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError)
      return NextResponse.json({ 
        error: "Storage service unavailable. Please contact your administrator to set up file storage." 
      }, { status: 500 })
    }

    const projectDocumentsBucket = buckets?.find(bucket => bucket.id === 'project_documents')
    if (!projectDocumentsBucket) {
      console.log('Storage bucket not found, creating mock file record for testing...')
      
      // TEMPORARY: Create a mock file record for testing when bucket doesn't exist
      const mockFileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
      const mockFilePath = `${projectId}/${mockFileName}`
      
      // Store file metadata in database without actual file upload
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_name: mockFileName,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: `mock://${mockFilePath}`, // Mock URL
          description: description || null,
          category: category || 'other',
          uploaded_by: user.id
        })
        .select(`
          *,
          uploaded_by_profile:profiles!project_files_uploaded_by_fkey(
            id,
            name,
            email
          )
        `)
        .single()

      if (dbError) {
        console.error('Error storing mock file metadata:', dbError)
        return NextResponse.json({ 
          error: "Failed to save file information. Please ensure the storage bucket is properly configured." 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        data: fileRecord,
        warning: "File uploaded as mock record. Storage bucket needs to be configured for actual file storage."
      })
    }

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(`${projectId}/${Date.now()}-${file.name}`, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(uploadData.path)

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: uploadData.path,
        file_url: urlData.publicUrl,
        description: description || null,
        category: category || 'other',
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error storing file metadata:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('project-files')
        .remove([uploadData.path])
      return NextResponse.json({ 
        error: "Failed to save file information. The file was uploaded but the record could not be created." 
      }, { status: 500 })
    }

    return NextResponse.json({ data: fileRecord })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred. Please try again or contact support if the problem persists." 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Get files for the project
    const { data: files, error } = await supabase
      .from('project_files')
      .select(`
        *,
        uploaded_by_profile:profiles!project_files_uploaded_by_fkey(
          id,
          name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching project files:', error)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 