import axios from 'axios';
import { runtimeConfig } from '../config/runtime';
import { authStorage } from './authStorage';

export const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const isAuthError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  return status === 401
    || (status === 403 && message === 'Invalid token')
    || message === 'jwt expired'
    || message === 'Access token required';
};

const redirectToLogin = () => {
  authStorage.clearSession();

  if (typeof window === 'undefined') {
    return;
  }

  const loginPath = runtimeConfig.routerMode === 'hash'
    ? '#/login'
    : `${runtimeConfig.routerBasename === '/' ? '' : runtimeConfig.routerBasename}/login`;

  if (runtimeConfig.routerMode === 'hash') {
    window.location.hash = loginPath;
    return;
  }

  window.location.assign(loginPath);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error)) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);
