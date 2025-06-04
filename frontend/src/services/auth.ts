import api from './api';

export interface LoginResponse {
  token: string;
  refresh: string;
  user: {
    id: string;
    username: string;
  };
}

export interface RegisterResponse {
  token: string;
  refresh: string;
  user: {
    id: string;
    username: string;
  };
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/token/', { username, password });
  // Store tokens in localStorage
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('refresh_token', response.data.refresh);
  return response.data;
};

export const register = async (username: string, password: string, email: string): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register/', { username, password, email });
  // Store tokens in localStorage
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('refresh_token', response.data.refresh);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token found for logout');
  }
  await api.post('/auth/logout/', { refresh: refreshToken });
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};
