import { useState, useEffect } from "react";
import { getFeatureFlags } from "@/lib/data/subscriptions";
import type { FeatureFlags } from "@/lib/types/subscription";

export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const result = await getFeatureFlags();
      if (result.success && result.data) {
        setFeatureFlags(result.data);
      } else {
        setError(result.error || "Failed to load feature flags");
      }
    } catch (err) {
      setError("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const canUseFeature = (feature: keyof FeatureFlags): boolean => {
    if (!featureFlags) return false;
    return featureFlags[feature] as boolean;
  };

  const getLimit = (limitKey: keyof FeatureFlags): number => {
    if (loading) return -1; // Return -1 while loading to indicate unlimited temporarily
    if (!featureFlags) return 0;
    return featureFlags[limitKey] as number;
  };

  return {
    featureFlags,
    loading: loading,
    featureFlagsLoading: loading,
    error,
    canUseFeature,
    getLimit,
    refresh: loadFeatureFlags,
  };
} 