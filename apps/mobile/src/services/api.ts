import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export async function mobileFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem('user_token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || 'Network request failed');
  }
  return data.data !== undefined ? data.data : data;
}
