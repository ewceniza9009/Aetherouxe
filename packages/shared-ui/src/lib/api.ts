import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed.tenantId) {
        config.headers['x-tenant-id'] = parsed.tenantId;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const resp = await axios.post('/api/auth/refresh', { refreshToken });
        const body = resp.data?.data ?? resp.data;
        const accessToken: string | undefined = body?.accessToken;
        const newRefreshToken: string | undefined = body?.refreshToken;
        if (!accessToken) throw new Error('No access token in refresh response');
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export { api };
