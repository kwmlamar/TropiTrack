import { supabase } from "@/lib/supabaseClient"
import { getProfileClient } from "./profile-client"
import type { 
  ProjectDocument, 
  NewProjectDocument, 
  UpdateProjectDocument,
  DocumentCategory 
} from "@/lib/types/document"

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Get all documents for a project
 */
export async function getProjectDocuments(
  projectId: string,
  userId: string
): Promise<ApiResponse<ProjectDocument[]>> {
  try {
    const profile = await getProfileClient(userId)
    const { data, error } = await supabase
      .from("project_documents")
      .select(`
        *,
        uploaded_by_profile:profiles!project_documents_uploaded_by_fkey(name, email)
      `)
      .eq("project_id", projectId)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project documents:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectDocument[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project documents:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get documents by category for a project
 */
export async function getProjectDocumentsByCategory(
  projectId: string,
  category: DocumentCategory,
  userId: string
): Promise<ApiResponse<ProjectDocument[]>> {
  try {
    const profile = await getProfileClient(userId)
    const { data, error } = await supabase
      .from("project_documents")
      .select(`
        *,
        uploaded_by_profile:profiles!project_documents_uploaded_by_fkey(name, email)
      `)
      .eq("project_id", projectId)
      .eq("company_id", profile.company_id)
      .eq("category", category)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project documents by category:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectDocument[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project documents by category:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new project document
 */
export async function createProjectDocument(
  userId: string,
  document: NewProjectDocument
): Promise<ApiResponse<ProjectDocument>> {
  try {
    const profile = await getProfileClient(userId)
    const { data, error } = await supabase
      .from("project_documents")
      .insert([{ ...document, uploaded_by: userId, company_id: profile.company_id }])
      .select()
      .single()

    if (error) {
      console.error("Error creating project document:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectDocument, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating project document:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update a project document
 */
export async function updateProjectDocument(
  userId: string,
  documentId: string,
  updates: UpdateProjectDocument
): Promise<ApiResponse<ProjectDocument>> {
  try {
    const profile = await getProfileClient(userId)
    const { data, error } = await supabase
      .from("project_documents")
      .update(updates)
      .eq("id", documentId)
      .eq("company_id", profile.company_id)
      .eq("uploaded_by", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating project document:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectDocument, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating project document:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a project document
 */
export async function deleteProjectDocument(
  userId: string,
  documentId: string
): Promise<ApiResponse<boolean>> {
  try {
    const profile = await getProfileClient(userId)
    const { error } = await supabase
      .from("project_documents")
      .delete()
      .eq("id", documentId)
      .eq("company_id", profile.company_id)
      .eq("uploaded_by", userId)

    if (error) {
      console.error("Error deleting project document:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting project document:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get document statistics for a project
 */
export async function getProjectDocumentStats(
  projectId: string,
  userId: string
): Promise<ApiResponse<{ total: number; byCategory: Record<DocumentCategory, number> }>> {
  try {
    const profile = await getProfileClient(userId)
    const { data, error } = await supabase
      .from("project_documents")
      .select("category")
      .eq("project_id", projectId)
      .eq("company_id", profile.company_id)

    if (error) {
      console.error("Error fetching project document stats:", error)
      return { data: null, error: error.message, success: false }
    }

    const total = data.length
    const byCategory = data.reduce((acc, doc) => {
      acc[doc.category as DocumentCategory] = (acc[doc.category as DocumentCategory] || 0) + 1
      return acc
    }, {} as Record<DocumentCategory, number>)

    return { data: { total, byCategory }, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project document stats:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
} 