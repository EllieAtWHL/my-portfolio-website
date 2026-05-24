interface ApiResponse {
  data?: unknown;
  error?: string;
  message?: string;
  success?: boolean;
}

// Generic API call function for admin operations
export async function callAdminApi(
  endpoint: string,
  method: 'POST' | 'GET' | 'DELETE' = 'POST',
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
