import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('falls back to the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('missing', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('reads an existing value', () => {
    window.localStorage.setItem('present', JSON.stringify({ a: 1 }))
    const { result } = renderHook(() => useLocalStorage('present', { a: 0 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('persists writes and supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))
    act(() => result.current[1](2))
    expect(result.current[0]).toBe(2)
    act(() => result.current[1]((current) => current + 3))
    expect(result.current[0]).toBe(5)
    expect(window.localStorage.getItem('count')).toBe('5')
  })

  it('settles with an unstable inline initial value', () => {
    let renders = 0
    const { result, rerender } = renderHook(() => {
      renders += 1
      // A fresh array reference on every render — the shape that used to drive
      // an unbounded render cascade.
      return useLocalStorage<string[]>('unstable', [])
    })

    expect(result.current[0]).toEqual([])
    const rendersAfterMount = renders
    rerender()
    expect(renders - rendersAfterMount).toBe(1)
  })

  it('re-reads when the key changes', () => {
    window.localStorage.setItem('a', JSON.stringify('from-a'))
    window.localStorage.setItem('b', JSON.stringify('from-b'))
    const { result, rerender } = renderHook(({ key }) => useLocalStorage(key, 'none'), {
      initialProps: { key: 'a' },
    })
    expect(result.current[0]).toBe('from-a')
    rerender({ key: 'b' })
    expect(result.current[0]).toBe('from-b')
  })

  it('falls back when stored JSON is corrupt', () => {
    window.localStorage.setItem('broken', '{not json')
    const { result } = renderHook(() => useLocalStorage('broken', 'safe'))
    expect(result.current[0]).toBe('safe')
  })
})
