import axios, { AxiosInstance, AxiosError } from "axios";
import Cookies from "js-cookie";
import config from "./index";
import { getCookieNameForPath } from "../src/utils/auth";
import { refreshAccessToken } from "../src/utils/tokenRefresh";

const customAPI: AxiosInstance = axios.create({
  baseURL: config().apiURL,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_BE_URL || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "X-CSRF-Token, Content-Type, Authorization, Accept, Content-Type",
  },
});

customAPI.interceptors.request.use((config) => {
  let token: string | undefined;

  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const cookieName = getCookieNameForPath(pathname);

    // Only use role-specific cookie if we're on a role-specific route
    if (cookieName) {
      token = Cookies.get(cookieName);
    }
    // Don't use fallback - if we can't determine the route, don't send a token
    // This prevents using the wrong role's token
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Response interceptor to handle token refresh
customAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError["config"] & {
      _retry?: boolean;
    };

    // Don't try to refresh token for login/auth endpoints
    // These endpoints return 401 for invalid credentials, not expired tokens
    const isAuthEndpoint =
      originalRequest.url?.includes("/login") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/forgot-password") ||
      originalRequest.url?.includes("/reset-password") ||
      originalRequest.url?.includes("/complete-registration");

    // If error is 401 and we haven't already tried to refresh, and it's not an auth endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          // Update the authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request
          return customAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/home";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { customAPI };
