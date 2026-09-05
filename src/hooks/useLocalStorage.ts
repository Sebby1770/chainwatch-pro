import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Captured once at mount so `readValue` stays referentially stable. Depending
  // on `initialValue` directly meant a caller passing an inline literal —
  // `useLocalStorage('k', [])` — produced a new reader every render, which fed
  // a setState-inside-useEffect cascade that re-rendered without settling.
  const [fallback] = useState(() => initialValue)

  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  }, [fallback, key])

  const [storedValue, setStoredValue] = useState<T>(readValue)
  const [lastKey, setLastKey] = useState(key)

  // Re-read during render when the key changes (React's recommended pattern for
  // state derived from props) rather than from an effect, so there is no extra
  // render pass and no synchronous setState in an effect body.
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
