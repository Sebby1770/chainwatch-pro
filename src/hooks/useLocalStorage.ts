import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [initialValue, key])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Reset when the storage key changes (render-time derived-state pattern —
  // avoids the cascading-render hazard of a synchronous setState in an effect).
  const [lastKey, setLastKey] = useState(key)
  if (lastKey !== key) {
    setLastKey(key)
    setStoredValue(readValue())
  }

  const setValue = useCallback(
    (value: T | ((current: T) => T)) => {
      try {
        const nextValue = value instanceof Function ? value(storedValue) : value
        window.localStorage.setItem(key, JSON.stringify(nextValue))
        setStoredValue(nextValue)
      } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue] as const
}