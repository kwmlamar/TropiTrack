"use client";

import { useState, useEffect } from 'react';
import { isWorkersStepSmartCompleted } from '@/components/onboarding/workers-completion-strategies';

export function useSmartCompletion() {
  const [isWorkersCompleted, setIsWorkersCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkCompletion() {
      try {
        setLoading(true);
        setError(null);
        const { isCompleted } = await isWorkersStepSmartCompleted();
        setIsWorkersCompleted(isCompleted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsWorkersCompleted(false);
      } finally {
        setLoading(false);
      }
    }

    checkCompletion();
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const { isCompleted } = await isWorkersStepSmartCompleted();
      setIsWorkersCompleted(isCompleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsWorkersCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isWorkersCompleted,
    loading,
    error,
    refresh
  };
} 