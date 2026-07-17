import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "data" in body) {
      const result = (body as any).data;
      if ((body as any).meta !== undefined) (result as any).meta = (body as any).meta;
      return { ...response, data: result };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const resp = await axios.post("/api/v1/auth/refresh", { refreshToken });
        const inner = (resp.data && (resp.data as any).data) ? (resp.data as any).data : resp.data;
        localStorage.setItem("accessToken", inner.accessToken);
        originalRequest.headers.Authorization = `Bearer ${inner.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
