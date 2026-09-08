import { hashText } from './utils'

export type SanctionStatus = 'clear' | 'watch' | 'hit'

const LISTS = ['OFAC SDN', 'EU Restrictive', 'UN 1267'] as const

export interface SanctionScreen {
  address: string
  status: SanctionStatus
  score: number
  lists: string[]
}

export function screenAddress(address: string): SanctionScreen {
  const seed = hashText(String(address ?? '').trim().toLowerCase())
  const status: SanctionStatus = seed % 17 === 0 ? 'hit' : seed % 7 === 0 ? 'watch' : 'clear'
  return {
    address,
    status,
    score: status === 'hit' ? 92 : status === 'watch' ? 58 : 8,
    lists: status === 'clear' ? [] : [LISTS[seed % LISTS.length]],
  }
}

export function screenMany(addresses: string[]): SanctionScreen[] {
  return addresses.map(screenAddress)
}
