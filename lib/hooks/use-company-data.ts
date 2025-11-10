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

/**
 * Shared hook for fetching workers and projects for a company
 * Includes loading state, error handling, and cleanup logic
 */
export function useCompanyData(userId: string): UseCompanyDataReturn {
  const [state, setState] = useState<CompanyDataState>({
    workers: [],
    projects: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true
    const abortController = new AbortController()

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const [workersData, projectsData] = await Promise.all([
          fetchWorkersForCompany(userId),
          fetchProjectsForCompany(userId)
        ])
        
        if (mounted && !abortController.signal.aborted) {
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

