import { useEffect, useState } from "react";

const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  // eslint-disable-next-line no-unused-vars
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    // Retrieve from localStorage
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // Recover from stale or malformed storage value.
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value);
    // Save to localStorage
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures (quota/private mode) and keep in-memory state.
    }
  };
  return [storedValue, setValue];
};

export default useLocalStorage;
