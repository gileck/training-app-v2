import { CacheResult } from "@/common/cache/types";
import { createCache } from "@/common/cache";
import { localStorageCacheProvider } from "./localStorageCache";

const clientCache = createCache(localStorageCacheProvider)

export const apiClient = {
  /**
   * Make a POST request to an API endpoint
   * @param endpoint The API endpoint
   * @param body Request body
   * @param options Additional request options
   * @returns Promise with the typed response
   */
  call: async <ResponseType, Params = Record<string, string | number | boolean | undefined | null>>(
    name: string,
    params?: Params,
    options?: ApiOptions
  ): Promise<CacheResult<ResponseType>> => {

    const apiCall = async (): Promise<ResponseType> => {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send credentials so the server can read auth cookie
        credentials: 'include',
        body: JSON.stringify({
          name,
          params,
          options: {
            ...options,
            disableCache: true,
          }
        }),
      });

      // Provide richer errors with response text/json if available
      if (response.status !== 200) {
        let extra = '';
        try {
          const text = await response.text();
          // Try to parse JSON from text to extract known fields
          try {
            const json = JSON.parse(text);
            if (json && typeof json === 'object') {
              if (json.error) extra = ` - ${json.error}`;
              else if (json.message) extra = ` - ${json.message}`;
              else extra = text ? ` - ${text}` : '';
            } else {
              extra = text ? ` - ${text}` : '';
            }
          } catch {
            extra = text ? ` - ${text}` : '';
          }
        } catch {
          // ignore
        }
        throw new Error(`Failed to call ${name}: HTTP ${response.status} ${response.statusText}${extra}`);
      }

      const result = await response.json();

      // Don't cache responses with error fields
      if (result.data && typeof result.data === 'object' && 'error' in result.data && result.data.error !== undefined && result.data.error !== null) {
        throw new Error(`Failed to call ${name}: ${result.data.error}`);
      }

      // Note: null is a valid response for some APIs (e.g., getActiveTrainingPlan when no plan exists)
      return result.data;
    };

    const shouldUseClientCache = options?.useClientCache ?? true;

    // Use client-side cache if enabled
    if (shouldUseClientCache) {
      return await clientCache.withCache(
        apiCall,
        {
          key: name,
          params: params || {},
        },
        {
          bypassCache: options?.bypassCache ?? false,
          disableCache: options?.disableCache ?? false,
          staleWhileRevalidate: options?.staleWhileRevalidate ?? false,
          ttl: options?.ttl,
          maxStaleAge: options?.maxStaleAge,
          isDataValidForCache: options?.isDataValidForCache,
        }
      );
    }

    // Fallback to direct API call
    const data = await apiCall();
    return { data, isFromCache: false };
  }
};

export type ApiOptions = {
  /**
   * Disable caching for this API call - will not save the result to cache
   */
  disableCache?: boolean;
  /**
   * Bypass the cache for this API call - will save the result to cache
   */
  bypassCache?: boolean;
  /**
   * Use client-side cache for this API call
   */
  useClientCache?: boolean;
  /**
   * TTL for client-side cache
   */
  ttl?: number;
  /**
   * Max stale age for client-side cache
   */
  maxStaleAge?: number;
  /**
   * Stale while revalidate for client-side cache
   */
  staleWhileRevalidate?: boolean;
  /**
   * Callback to validate if data should be cached
   */
  isDataValidForCache?: <T>(data: T) => boolean;
};

export default apiClient;
