import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";
import config from './index';

export const customAPI: AxiosInstance = axios.create({
  baseURL: config().apiURL,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    authorization: Cookies.get("authToken")
      ? `Bearer ${Cookies.get("authToken")}`
      : null,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "no-referrer",
  },
});
