import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the document to check access
    const { data: existingDocument, error: fetchError } = await supabase
      .from('project_documents')
      .select(`
        *,
        projects!inner(company_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has access to this document's project
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.company_id !== existingDocument.projects.company_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update the document
    const { data, error } = await supabase
      .from('project_documents')
      .update({
        name: body.name,
        description: body.description,
        category: body.category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the document to check access
    const { data: existingDocument, error: fetchError } = await supabase
      .from('project_documents')
      .select(`
        *,
        projects!inner(company_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has access to this document's project
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.company_id !== existingDocument.projects.company_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete the document
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
        projects!inner(company_id),
        uploaded_by_profile:profiles!project_documents_uploaded_by_fkey(name, email)
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

    // For now, we'll return the document metadata
    // In a real implementation, you'd serve the actual file from Supabase Storage
    return NextResponse.json({
      id: document.id,
      name: document.name,
      description: document.description,
      file_path: document.file_path,
      file_size: document.file_size,
      file_type: document.file_type,
      category: document.category,
      created_at: document.created_at,
      uploaded_by_profile: document.uploaded_by_profile
    })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 