// Use VITE_API_URL if set, otherwise use empty string for relative paths (same-origin)
const getApiURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly set to empty string or undefined, use relative path
  if (envUrl === '' || envUrl === undefined) {
    return '';
  }
  return envUrl;
};

export const API_URL = getApiURL();
export const POLLING_INTERVAL = 10000; // 10 seconds
export const APP_NAME = 'KVM-UI';
