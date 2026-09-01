import AsyncStorage from '@react-native-async-storage/async-storage';

// On a real device, `localhost` refers to the phone itself — not your PC.
// Set EXPO_PUBLIC_API_URL in apps/mobile/.env to your PC's LAN IP, e.g.:
//   EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api/v1
// Find your PC's IP by running: ipconfig (look for IPv4 Address under Wi-Fi)
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
