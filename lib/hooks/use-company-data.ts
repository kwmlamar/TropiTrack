import { useState, useEffect } from "react"
import { fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

interface CompanyDataState {
  workers: Worker[]
  projects: Project[]
  loading: boolean
  error: string | null
}

interface UseCompanyDataReturn extends CompanyDataState {
  refetch: () => Promise<void>
}

// Cache for company data to prevent redundant fetches
const companyDataCache = new Map<string, {
  workers: Worker[]
  projects: Project[]
  timestamp: number
}>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Shared hook for fetching workers and projects for a company
 * Includes loading state, error handling, cleanup logic, and caching
 */
export function useCompanyData(userId: string): UseCompanyDataReturn {
  const [state, setState] = useState<CompanyDataState>(() => {
    // Check cache on init for instant data
    const cached = companyDataCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        workers: cached.workers,
        projects: cached.projects,
        loading: false,
        error: null
      }
    }
    return {
      workers: [],
      projects: [],
      loading: true,
      error: null
    }
  })

  useEffect(() => {
    let mounted = true
    const abortController = new AbortController()

    const fetchData = async () => {
      // Check cache first
      const cached = companyDataCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Use cached data, no need to fetch
        return
      }

      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const [workersData, projectsData] = await Promise.all([
          fetchWorkersForCompany(userId),
          fetchProjectsForCompany(userId)
        ])
        
        if (mounted && !abortController.signal.aborted) {
          // Cache the data
          companyDataCache.set(userId, {
            workers: workersData,
            projects: projectsData,
            timestamp: Date.now()
          })

          setState({
            workers: workersData,
            projects: projectsData,
            loading: false,
            error: null
          })
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load company data"
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage
          }))
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [userId])

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const [workersData, projectsData] = await Promise.all([
        fetchWorkersForCompany(userId),
        fetchProjectsForCompany(userId)
      ])
      
      // Update cache
      companyDataCache.set(userId, {
        workers: workersData,
        projects: projectsData,
        timestamp: Date.now()
      })
      
      setState({
        workers: workersData,
        projects: projectsData,
        loading: false,
        error: null
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load company data"
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }

  return { ...state, refetch }
}

// Export function to clear cache when needed (e.g., after creating new worker/project)
export function clearCompanyDataCache(userId?: string) {
  if (userId) {
    companyDataCache.delete(userId)
  } else {
    companyDataCache.clear()
  }
}

