export const readStorage = (key, fallback = null, storage = localStorage) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error("Storage read failed", error);
    return fallback;
  }
};

export const writeStorage = (key, value, storage = localStorage) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Storage write failed", error);
  }
};

