const normalizeBasePath = (value) => {
  if (!value || value === '/') {
    return '/';
  }

  const trimmed = String(value).trim().replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const normalizeAssetBasePath = (value) => {
  if (!value) {
    return '';
  }

  return String(value).trim().replace(/\/+$/, '');
};

const windowConfig = window.__SCRUM_APP_CONFIG__ || {};

const routerMode = windowConfig.routerMode || process.env.REACT_APP_ROUTER_MODE || 'browser';
const routerBasename = normalizeBasePath(
  windowConfig.routerBasename ?? process.env.REACT_APP_ROUTER_BASENAME ?? process.env.PUBLIC_URL ?? '/'
);
const assetBasePath = normalizeAssetBasePath(
  windowConfig.assetBasePath ?? process.env.REACT_APP_ASSET_BASE_PATH ?? process.env.PUBLIC_URL ?? ''
);

export const runtimeConfig = {
  apiBaseUrl: String(
    windowConfig.apiBaseUrl ?? process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api'
  ).replace(/\/+$/, ''),
  routerMode: routerMode === 'hash' ? 'hash' : 'browser',
  routerBasename,
  tokenStorageKey: windowConfig.tokenStorageKey ?? process.env.REACT_APP_TOKEN_STORAGE_KEY ?? 'scrum-app.token',
  userStorageKey:
    windowConfig.userStorageKey ??
    process.env.REACT_APP_USER_STORAGE_KEY ??
    'scrum-app.user',
  assetBasePath,
  isSharePointHost: Boolean(windowConfig.isSharePointHost),
};

