import { customAPI } from '../../config/setup';
import Cookies from 'js-cookie';
import { getCookieNameForPath, getCookieNameForRole } from './auth';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const refreshAccessToken = async (roleName?: string): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => token as string | null)
      .catch((err) => {
        throw err;
      });
  }

  isRefreshing = true;

  try {
    // Determine which refresh token to use
    let refreshToken: string | undefined;
    
    if (roleName) {
      const cookieName = getCookieNameForRole(roleName);
      if (cookieName) {
        refreshToken = Cookies.get(`${cookieName}Refresh`);
      }
    } else if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const cookieName = getCookieNameForPath(pathname);
      if (cookieName) {
        refreshToken = Cookies.get(`${cookieName}Refresh`);
      }
    }

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await customAPI.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const newAccessToken = response.data.access_token;

    if (!newAccessToken) {
      throw new Error('No access token in refresh response');
    }

    // Update the access token cookie
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const cookieName = getCookieNameForPath(pathname);
      
      if (cookieName) {
        const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
        Cookies.set(cookieName, newAccessToken, { expires: accessTokenExpiry });
      }
    }

    processQueue(null, newAccessToken);
    isRefreshing = false;
    return newAccessToken;
  } catch (error) {
    processQueue(error, null);
    isRefreshing = false;
    
    // Clear tokens on refresh failure
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const cookieName = getCookieNameForPath(pathname);
      
      if (cookieName) {
        Cookies.remove(cookieName);
        Cookies.remove(`${cookieName}Refresh`);
      }
    }
    
    throw error;
  }
};

