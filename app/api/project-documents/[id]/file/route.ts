import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the document
    const { data: document, error: documentError } = await supabase
      .from('project_documents')
      .select(`
        *,
        projects!inner(company_id)
      `)
      .eq('id', id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user has access to this document's project
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.company_id !== document.projects.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For now, we'll create a mock file response
    // In a real implementation, you'd fetch the actual file from Supabase Storage
    let mockContent = ''
    
    if (document.file_type.includes('pdf')) {
      mockContent = `PDF Document Preview: ${document.name}

This is a preview of the PDF document content.
In a real implementation, this would show the actual PDF content.

Document Information:
- Title: ${document.name}
- Type: Portable Document Format
- Size: ${document.file_size} bytes
- Category: ${document.category}
- Uploaded: ${new Date(document.created_at).toLocaleDateString()}
- Uploaded by: ${document.uploaded_by_profile?.name || 'Unknown'}

Estimated page count: ${Math.ceil(document.file_size / 5000)} pages

This preview shows the document metadata and structure.
The actual PDF content would be rendered here using a PDF viewer component.`
    } else if (document.file_type.includes('word') || document.file_type.includes('document')) {
      mockContent = `Microsoft Word Document: ${document.name}

Document Content Preview:
This is a preview of the Word document content.

Document Information:
- Title: ${document.name}
- Type: Microsoft Word Document
- Size: ${document.file_size} bytes
- Category: ${document.category}
- Uploaded: ${new Date(document.created_at).toLocaleDateString()}

Estimated word count: ${Math.ceil(document.file_size / 5)} words

This preview shows the document structure and metadata.
The actual Word document content would be rendered here.`
    } else if (document.file_type.includes('excel') || document.file_type.includes('spreadsheet')) {
      mockContent = `Microsoft Excel Spreadsheet: ${document.name}

Spreadsheet Content Preview:
This is a preview of the Excel spreadsheet content.

Document Information:
- Title: ${document.name}
- Type: Microsoft Excel Spreadsheet
- Size: ${document.file_size} bytes
- Category: ${document.category}
- Uploaded: ${new Date(document.created_at).toLocaleDateString()}

Estimated cells: ${Math.ceil(document.file_size / 10)} cells

This preview shows the spreadsheet structure and metadata.
The actual Excel content would be rendered here as a table.`
    } else if (document.file_type.includes('image')) {
      // For images, we'll return a placeholder since they're displayed differently
      mockContent = `Image File: ${document.name}

This is an image file that would be displayed as a visual preview.
Image files are shown directly in the preview dialog.`
    } else {
      mockContent = `File Preview: ${document.name}

This is a preview of the file content.

Document Information:
- Title: ${document.name}
- Type: ${document.file_type}
- Size: ${document.file_size} bytes
- Category: ${document.category}
- Uploaded: ${new Date(document.created_at).toLocaleDateString()}

This preview shows the file metadata and structure.
The actual file content would be displayed here based on the file type.`
    }

    // Return the file content with appropriate headers
    return new NextResponse(mockContent, {
      headers: {
        'Content-Type': document.file_type || 'text/plain',
        'Content-Disposition': `inline; filename="${document.name}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error serving document file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 