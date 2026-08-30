const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve signed session token from secure storage
  let authToken = '';
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cebu_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token) {
          authToken = parsed.token;
        }
      }
    } catch {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || `API request failed with status ${response.status}`);
  }

  // Handle both standard format { success: true, data: [...] } and direct objects
  return data.data !== undefined ? data.data : data;
}
