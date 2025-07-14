import { useLoading } from "../context/LoadingContext";
import { useCallback } from "react";

export function useRequestLoading() {
  const { startLoading, stopLoading } = useLoading();

  const withLoading = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    startLoading();
    try {
      const result = await requestFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return { withLoading, startLoading, stopLoading };
} 