interface ApiResponse {
  data?: unknown;
  error?: string;
  message?: string;
  success?: boolean;
}

// Generic API call function for admin operations
export async function callAdminApi(
  endpoint: string,
  method: 'POST' | 'GET' | 'DELETE' | 'PUT' = 'POST',
  payload?: unknown
): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/admin/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Failed to ${method} ${endpoint}`);
    }

    return result;
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * "Error creating player history: Left On can't be before Joined On." - the
 * fallback plus the server's reason when there is one. callAdminApi throws
 * with the route's `error` message (e.g. a 400 from validation), so this is
 * what tells the admin what to fix rather than just that something failed.
 */
export function describeAdminError(fallback: string, error: unknown): string {
  return error instanceof Error && error.message ? `${fallback}: ${error.message}` : fallback;
}

// Function to create entity and reload data
export async function createEntityAndReload<T>(
  endpoint: string,
  payload: unknown,
  reloadEndpoint: string,
  setData: (data: T[]) => void
): Promise<void> {
  try {
    await callAdminApi(endpoint, 'POST', payload);
    
    // Reload data
    const reloadResponse = await callAdminApi(reloadEndpoint, 'GET');
    if (reloadResponse.data) {
      setData(reloadResponse.data as T[]);
    }
  } catch (error) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
}
