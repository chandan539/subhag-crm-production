const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:5000/api/v1');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('subhag_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  } as any;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Only redirect to login on 401 if it's not a login request itself
    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('subhag_token');
      localStorage.removeItem('subhag_user');
      window.location.href = '/portal/login';
      // We don't throw an error here to prevent further unhandled promise rejections
      // while the page is redirecting.
      return new Promise(() => {}); // Return a promise that never resolves
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.error === 'string' 
      ? errorData.error 
      : (Array.isArray(errorData.error) ? errorData.error.map((i: any) => i.message).join(', ') : `HTTP error! status: ${response.status}`);
    throw new Error(errorMessage);
  }

  return response.json();
}
