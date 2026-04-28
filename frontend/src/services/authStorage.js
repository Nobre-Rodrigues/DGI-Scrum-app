import { runtimeConfig } from '../config/runtime';

const isStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const read = (key) => {
  if (!isStorageAvailable()) {
    return null;
  }

  return window.localStorage.getItem(key);
};

const write = (key, value) => {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(key, value);
};

const remove = (key) => {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(key);
};

export const authStorage = {
  getToken() {
    return read(runtimeConfig.tokenStorageKey);
  },
  setToken(token) {
    if (!token) {
      remove(runtimeConfig.tokenStorageKey);
      return;
    }

    write(runtimeConfig.tokenStorageKey, token);
  },
  clearToken() {
    remove(runtimeConfig.tokenStorageKey);
  },
  getUser() {
    const rawValue = read(runtimeConfig.userStorageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      remove(runtimeConfig.userStorageKey);
      return null;
    }
  },
  setUser(user) {
    if (!user) {
      remove(runtimeConfig.userStorageKey);
      return;
    }

    write(runtimeConfig.userStorageKey, JSON.stringify(user));
  },
  clearUser() {
    remove(runtimeConfig.userStorageKey);
  },
  clearSession() {
    this.clearToken();
    this.clearUser();
  },
};

