export const readJson = (key, fallback = null) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const removeJson = (key) => {
  sessionStorage.removeItem(key);
};
