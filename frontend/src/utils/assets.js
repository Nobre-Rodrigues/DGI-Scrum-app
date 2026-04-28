import { runtimeConfig } from '../config/runtime';

export const getAssetUrl = (assetPath) => {
  const normalizedAssetPath = String(assetPath || '').replace(/^\/+/, '');

  if (!normalizedAssetPath) {
    return runtimeConfig.assetBasePath || '';
  }

  if (!runtimeConfig.assetBasePath) {
    return `/${normalizedAssetPath}`;
  }

  return `${runtimeConfig.assetBasePath}/${normalizedAssetPath}`;
};

