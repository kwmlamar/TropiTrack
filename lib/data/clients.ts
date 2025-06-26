import type { ApiResponse } from "@/lib/types";
import type {
  Client,
  NewClient,
  UpdateClient,
  ClientFilters,
  ClientWithDetails,
} from "@/lib/types/client";
import { getProfile } from "./data";
import { supabase } from "@/lib/supabaseClient";
import { escapeSearchTerm } from "@/lib/utils";

/**
 * Get clients with optional filtering (company scoped)
 */
export async function getClients(
  companyId: string,
  filters: ClientFilters = {}
): Promise<ApiResponse<ClientWithDetails[]>> {
  try {
    let query = supabase
      .from("clients")
      .select(
        `
        *,
        projects:projects(id, name, status),
        _count:projects(count)
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.created_by) {
      query = query.eq("created_by", filters.created_by);
    }

    if (filters.search) {
      // Escape special characters that could cause PostgreSQL parsing errors
      const escapedSearch = escapeSearchTerm(filters.search);
      
      query = query.or(
        `name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,company.ilike.%${escapedSearch}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching clients:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as ClientWithDetails[], error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching clients:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Get a single client by ID (company scoped)
 */
export async function getClient(
  companyId: string,
  id: string
): Promise<ApiResponse<ClientWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(
        `
        *,
        projects:projects(id, name, status),
        _count:projects(count)
      `
      )
      .eq("company_id", companyId)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as ClientWithDetails, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching client:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Insert a new client
 */
export async function insertClient(
  userId: string,
  client: NewClient
): Promise<ApiResponse<Client>> {
  const profile = await getProfile(userId);
  try {
    // Normalize empty email to null to avoid unique constraint issues
    const normalizedClient = {
      ...client,
      email: client.email && client.email.trim() !== "" ? client.email.trim() : null,
    };

    const { data, error } = await supabase
      .from("clients")
      .insert([{ ...normalizedClient, company_id: profile.company_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as Client, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error creating client:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Update an existing client (company scoped)
 */
export async function updateClient(
  userId: string,
  id: string,
  client: UpdateClient
): Promise<ApiResponse<Client>> {
    const profile = await getProfile(userId);
  try {
    // Normalize empty email to null to avoid unique constraint issues
    const normalizedClient = {
      ...client,
      email: client.email && client.email.trim() !== "" ? client.email.trim() : null,
    };

    const { data, error } = await supabase
      .from("clients")
      .update(normalizedClient)
      .eq("company_id", profile.company_id)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as Client, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error updating client:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Delete a client (company scoped)
 */
export async function deleteClient(
  companyId: string,
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      console.error("Error deleting client:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error deleting client:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}
