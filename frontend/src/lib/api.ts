/**
 * Frontend API client wrappers for calling Express backend routes.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_URL}${cleanPath}`;
}

export interface ProvisionResponse {
  success: boolean;
  message?: string;
  error?: string;
  school?: any;
  profile?: any;
  staff?: any;
  student?: any;
}

export async function postRequest<T = any>(endpoint: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let data: any = null;

  try {
    data = JSON.parse(responseText);
  } catch {
    // If not JSON, check if it was an error page
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${responseText.slice(0, 100) || 'Unknown error'}`);
    }
    // If server returned 200 with HTML (e.g. Vite SPA fallback when backend route wasn't matched)
    throw new Error(`Backend route ${endpoint} is not responding with JSON. Please ensure the backend server is running.`);
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request to ${endpoint} failed (${response.status})`);
  }

  return data as T;
}

export const api = {
  provisionSchool: (schoolData: any, token?: string) => 
    postRequest<ProvisionResponse>('/api/provision/school', schoolData, token),

  provisionStaff: (staffData: any, token?: string) => 
    postRequest<ProvisionResponse>('/api/provision/staff', staffData, token),

  provisionStudent: (studentData: any, token?: string) => 
    postRequest<ProvisionResponse>('/api/provision/student', studentData, token),

  resetPassword: (email: string, token?: string) => 
    postRequest<ProvisionResponse>('/api/provision/reset-password', { email }, token),

  checkStatus: async () => {
    const response = await fetch(getApiUrl('/api/supabase/status'));
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    return response.json();
  }
};
