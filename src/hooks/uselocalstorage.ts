// src/hooks/use-local-storage.ts
import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export type SetValue<T> = Dispatch<SetStateAction<T>>;

interface StorageProperties {
  prefix?: string;
  serializer?: (value: any) => string;
  deserializer?: (value: string) => any;
}

/**
 * Custom hook for persisting state in localStorage
 * @template T - The type of the stored value
 * @param {string} key - The localStorage key
 * @param {T} initialValue - The initial value if no value exists in localStorage
 * @param {StorageProperties} options - Additional options for storage handling
 * @returns {[T, SetValue<T>, () => void]} - Returns the stored value, setter, and remove function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: StorageProperties = {}
): [T, SetValue<T>, () => void] {
  const {
    prefix = 'app',
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const fullKey = `${prefix}:${key}`;

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(fullKey);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${fullKey}":`, error);
      return initialValue;
    }
  }, [fullKey, initialValue, deserializer]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: SetValue<T> = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key "${fullKey}" even though environment is not a client`
        );
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(fullKey, serializer(newValue));
        setStoredValue(newValue);
        window.dispatchEvent(new StorageEvent('local-storage', {
          key: fullKey,
          newValue: serializer(newValue),
        }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${fullKey}":`, error);
      }
    },
    [fullKey, serializer, storedValue]
  );

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried removing localStorage key "${fullKey}" even though environment is not a client`
      );
      return;
    }

    try {
      window.localStorage.removeItem(fullKey);
      setStoredValue(initialValue);
      window.dispatchEvent(new StorageEvent('local-storage', {
        key: fullKey,
        newValue: null,
      }));
    } catch (error) {
      console.warn(`Error removing localStorage key "${fullKey}":`, error);
    }
  }, [fullKey, initialValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === fullKey) {
        try {
          const newValue = e.newValue ? deserializer(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(
            `Error parsing localStorage change for key "${fullKey}":`,
            error
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [fullKey, initialValue, deserializer]);

  return [storedValue, setValue, remove];
}

// Type-specific helper hooks
export function useLocalStorageObject<T extends object>(key: string, initialValue: T) {
  return useLocalStorage<T>(key, initialValue);
}

export function useLocalStorageArray<T>(key: string, initialValue: T[] = []) {
  return useLocalStorage<T[]>(key, initialValue);
}

export function useLocalStorageBoolean(key: string, initialValue: boolean = false) {
  return useLocalStorage<boolean>(key, initialValue);
}

export function useLocalStorageNumber(key: string, initialValue: number = 0) {
  return useLocalStorage<number>(key, initialValue);
}

export function useLocalStorageString(key: string, initialValue: string = '') {
  return useLocalStorage<string>(key, initialValue);
}

// Advanced hooks
export function useLocalStorageGroup<T extends Record<string, any>>(
  groupKey: string,
  initialValues: T
): [T, (key: keyof T, value: T[keyof T]) => void, () => void] {
  const [values, setValues] = useLocalStorage<T>(groupKey, initialValues);

  const setValue = (key: keyof T, value: T[keyof T]) => {
    setValues(current => ({
      ...current,
      [key]: value
    }));
  };

  return [values, setValue, () => setValues(initialValues)];
}

export function useVersionedLocalStorage<T>(
  key: string,
  initialValue: T,
  version: number
) {
  const [value, setValue, remove] = useLocalStorage<{
    data: T;
    version: number;
  }>(key, {
    data: initialValue,
    version
  });

  useEffect(() => {
    if (value.version !== version) {
      setValue({
        data: initialValue,
        version
      });
    }
  }, [version]);

  return [
    value.data,
    (newValue: T) => setValue({ data: newValue, version }),
    remove
  ] as const;
}

export function useExpiringLocalStorage<T>(
  key: string,
  initialValue: T,
  expirationMs: number
) {
  const [value, setValue, remove] = useLocalStorage<{
    data: T;
    timestamp: number;
  }>(key, {
    data: initialValue,
    timestamp: Date.now()
  });

  useEffect(() => {
    if (Date.now() - value.timestamp > expirationMs) {
      remove();
    }
  }, [value.timestamp, expirationMs]);

  return [
    value.data,
    (newValue: T) => setValue({ data: newValue, timestamp: Date.now() }),
    remove
  ] as const;
}

export function useLocalStorageQueue<T>(key: string, maxSize: number = 10) {
  const [queue, setQueue] = useLocalStorageArray<T>(key);

  const enqueue = (item: T) => {
    setQueue(current => {
      const newQueue = [...current, item];
      return newQueue.slice(-maxSize);
    });
  };

  const dequeue = () => {
    setQueue(current => current.slice(1));
  };

  return [queue, { enqueue, dequeue, clear: () => setQueue([]) }] as const;
}

export function useLocalStorageSet<T>(key: string, initialValue: T[] = []) {
  const [values, setValues] = useLocalStorageArray<T>(key, initialValue);

  const add = (item: T) => {
    setValues(current => 
      current.includes(item) ? current : [...current, item]
    );
  };

  const remove = (item: T) => {
    setValues(current => current.filter(i => i !== item));
  };

  const toggle = (item: T) => {
    setValues(current => 
      current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item]
    );
  };

  return [
    values,
    { add, remove, toggle, clear: () => setValues([]) }
  ] as const;
}

export function useLocalStorageMap<K extends string, V>(
  key: string,
  initialValue: Record<K, V> = {} as Record<K, V>
) {
  const [map, setMap] = useLocalStorageObject<Record<K, V>>(key, initialValue);

  const set = (key: K, value: V) => {
    setMap(current => ({
      ...current,
      [key]: value
    }));
  };

  const del = (key: K) => {
    setMap(current => {
      const { [key]: _, ...rest } = current;
      return rest as Record<K, V>;
    });
  };

  return [
    map,
    { set, delete: del, clear: () => setMap({} as Record<K, V>) }
  ] as const;
}

export const createStorageSync = () => {
  const listeners = new Set<(event: StorageEvent) => void>();

  const subscribe = (listener: (event: StorageEvent) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const broadcast = (key: string, newValue: any) => {
    const event = new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(newValue)
    });
    listeners.forEach(listener => listener(event));
  };

  return { subscribe, broadcast };
};
