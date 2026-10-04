import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial; // blocked storage or corrupt JSON
    }
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota exceeded or private mode: keep working in memory only
      }
    },
    [key],
  );

  const clear = useCallback(() => {
    setValue(initial);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key, initial]);

  return [value, set, clear] as const;
}
