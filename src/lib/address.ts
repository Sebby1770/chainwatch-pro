import { keccak_256 } from '@noble/hashes/sha3.js'
import type { ChainId } from './types'

/**
 * Address parsing and validation.
 *
 * The watchlist and scanner previously accepted any non-empty string as a
 * wallet address, so `hello world` could be added, screened, scored and filed
 * into a compliance report. Everything here is pure and offline — it checks the
 * shape and the integrity of an address, not whether it exists on chain.
 */

export type AddressKind = 'evm' | 'solana'

/** An address, or an ENS name the dashboard accepts in place of one. */
export type WalletInputKind = AddressKind | 'ens'

export type AddressProblem =
  | 'empty'
  | 'unknown-format'
  | 'evm-bad-length'
  | 'evm-non-hex'
  | 'evm-bad-checksum'
  | 'solana-bad-alphabet'
  | 'solana-bad-length'
  | 'wrong-chain-family'

export interface AddressCheck {
  valid: boolean
  /** Canonical form: EIP-55 checksummed for EVM, unchanged for Solana. */
  normalized: string
  kind: AddressKind | null
  problem: AddressProblem | null
  /** Human-readable reason, suitable for a toast or a CSV import report. */
  message: string | null
}

const EVM_CHAINS: ChainId[] = ['ethereum', 'base', 'arbitrum', 'polygon']

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const PROBLEM_MESSAGES: Record<AddressProblem, string> = {
  empty: 'Enter a wallet address',
  'unknown-format': 'Not a recognised EVM (0x…) or Solana address',
  'evm-bad-length': 'EVM addresses are 40 hex characters after 0x',
  'evm-non-hex': 'EVM addresses may only contain 0-9 and a-f after 0x',
  'evm-bad-checksum':
    'Checksum failed — this address has a typo (EIP-55 mixed-case check did not match)',
  'solana-bad-alphabet': 'Solana addresses use base58 (no 0, O, I or l)',
  'solana-bad-length': 'Solana addresses decode to 32 bytes',
  'wrong-chain-family': 'That address does not belong to the selected chain',
}

function fail(problem: AddressProblem, normalized = '', kind: AddressKind | null = null): AddressCheck {
  return { valid: false, normalized, kind, problem, message: PROBLEM_MESSAGES[problem] }
}

/** Which chain family an address is shaped like, before validating it. */
export function detectAddressKind(value: string): AddressKind | null {
  const trimmed = value.trim()
  if (/^0x/i.test(trimmed)) return 'evm'
  if (trimmed.length >= 32 && trimmed.length <= 44 && !trimmed.includes('0x')) return 'solana'
  return null
}

export function chainFamily(chain: ChainId): AddressKind {
  return EVM_CHAINS.includes(chain) ? 'evm' : 'solana'
}

/**
 * EIP-55 checksum encoding: uppercase a hex digit when the matching nibble of
 * keccak256(lowercase address, without 0x) is >= 8.
 */
export function toChecksumAddress(address: string): string {
  const lower = address.trim().toLowerCase().replace(/^0x/, '')
  const hash = keccak_256(new TextEncoder().encode(lower))

  let out = '0x'
  for (let i = 0; i < lower.length; i += 1) {
    // Two hex digits per byte: even index takes the high nibble.
    const nibble = i % 2 === 0 ? hash[i >> 1] >> 4 : hash[i >> 1] & 0x0f
    out += nibble >= 8 ? lower[i].toUpperCase() : lower[i]
  }
  return out
}

/** Decodes base58 to bytes, or null if the input is not valid base58. */
export function decodeBase58(value: string): Uint8Array | null {
  if (value.length === 0) return null

  // Starts empty: seeding a zero here would add a phantom leading byte, so an
  // all-'1' address (32 zero bytes) decoded to 33.
  const bytes: number[] = []
  for (const char of value) {
    const digit = BASE58_ALPHABET.indexOf(char)
    if (digit === -1) return null

    let carry = digit
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  // Each leading '1' is a leading zero byte.
  for (const char of value) {
    if (char !== '1') break
    bytes.push(0)
  }

  return Uint8Array.from(bytes.reverse())
}

/**
 * Validates an address, optionally against the chain it was entered for.
 *
 * An all-lowercase or all-uppercase EVM address carries no checksum, so it is
 * accepted and normalised. A *mixed-case* one is checked against EIP-55: that
 * is the case where a single mistyped character is detectable, and silently
 * accepting it is how a compliance report ends up filed against the wrong
 * wallet.
 */
export function validateAddress(value: string, chain?: ChainId): AddressCheck {
  const trimmed = value.trim()
  if (!trimmed) return fail('empty')

  const kind = detectAddressKind(trimmed)
  if (!kind) return fail('unknown-format')

  if (chain && chainFamily(chain) !== kind) {
    return fail('wrong-chain-family', trimmed, kind)
  }

  if (kind === 'evm') {
    const body = trimmed.slice(2)
    if (body.length !== 40) return fail('evm-bad-length', trimmed, kind)
    if (!/^[0-9a-fA-F]{40}$/.test(body)) return fail('evm-non-hex', trimmed, kind)

    const checksummed = toChecksumAddress(trimmed)
    const isCaseless = body === body.toLowerCase() || body === body.toUpperCase()
    if (!isCaseless && `0x${body}` !== checksummed) {
      return fail('evm-bad-checksum', checksummed, kind)
    }

    return { valid: true, normalized: checksummed, kind, problem: null, message: null }
  }

  const decoded = decodeBase58(trimmed)
  if (!decoded) return fail('solana-bad-alphabet', trimmed, kind)
  if (decoded.length !== 32) return fail('solana-bad-length', trimmed, kind)

  return { valid: true, normalized: trimmed, kind, problem: null, message: null }
}

export function isValidAddress(value: string, chain?: ChainId): boolean {
  return validateAddress(value, chain).valid
}

/** Case-insensitive for EVM (checksum casing is cosmetic), exact for Solana. */
export function addressesEqual(a: string, b: string): boolean {
  const left = validateAddress(a)
  const right = validateAddress(b)
  if (left.kind === 'solana' || right.kind === 'solana') {
    return a.trim() === b.trim()
  }
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** Short display form: 0x1234…abcd */
export function shortenAddress(value: string, lead = 6, tail = 4): string {
  const trimmed = value.trim()
  if (trimmed.length <= lead + tail + 1) return trimmed
  return `${trimmed.slice(0, lead)}…${trimmed.slice(-tail)}`
}

/**
 * ENS names, which the dashboard accepts in place of a raw address.
 *
 * Labels are 1-63 characters of letters, digits and hyphens, and may not start
 * or end with a hyphen. Resolution needs a node; this only checks the shape.
 */
const ENS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

export function isEnsName(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed.endsWith('.eth')) return false

  const labels = trimmed.split('.')
  if (labels.length < 2) return false
  return labels.every((label) => ENS_LABEL.test(label))
}

export interface WalletInputCheck {
  valid: boolean
  normalized: string
  kind: WalletInputKind | null
  message: string | null
}

/**
 * Validates the dashboard's "wallet or ENS" field: an address gets the full
 * checksum treatment, an ENS name only has to be well formed.
 */
export function validateWalletInput(value: string, chain?: ChainId): WalletInputCheck {
  const trimmed = value.trim()
  if (!trimmed) {
    return { valid: false, normalized: '', kind: null, message: 'Enter a wallet address or ENS name' }
  }

  if (isEnsName(trimmed)) {
    return { valid: true, normalized: trimmed.toLowerCase(), kind: 'ens', message: null }
  }

  const check = validateAddress(trimmed, chain)
  if (check.valid) {
    return { valid: true, normalized: check.normalized, kind: check.kind, message: null }
  }

  return {
    valid: false,
    normalized: check.normalized,
    kind: check.kind,
    message:
      check.problem === 'unknown-format'
        ? 'Not a recognised address or ENS name'
        : check.message,
  }
}
