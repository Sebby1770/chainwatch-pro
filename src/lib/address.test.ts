import { describe, expect, it } from 'vitest'
import {
  addressesEqual,
  chainFamily,
  decodeBase58,
  detectAddressKind,
  isEnsName,
  isValidAddress,
  shortenAddress,
  toChecksumAddress,
  validateAddress,
  validateWalletInput,
} from './address'

/** The canonical checksum vectors published in EIP-55 itself. */
const EIP55_VECTORS = [
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
  // Additional vectors from the spec's test list.
  '0x52908400098527886E0F7030069857D2E4169EE7',
  '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
  '0xde709f2102306220921060314715629080e2fb77',
  '0x27b1fdb04752bbc536007a920d24acb045561c26',
]

describe('toChecksumAddress', () => {
  it('reproduces every EIP-55 reference vector from its lowercase form', () => {
    for (const expected of EIP55_VECTORS) {
      expect(toChecksumAddress(expected.toLowerCase())).toBe(expected)
    }
  })

  it('is idempotent', () => {
    for (const expected of EIP55_VECTORS) {
      expect(toChecksumAddress(expected)).toBe(expected)
    }
  })

  it('accepts input without the 0x prefix', () => {
    expect(toChecksumAddress('5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(EIP55_VECTORS[0])
  })
})

describe('validateAddress — EVM', () => {
  it('accepts every reference vector and returns the checksummed form', () => {
    for (const address of EIP55_VECTORS) {
      const result = validateAddress(address)
      expect(result.valid, address).toBe(true)
      expect(result.kind).toBe('evm')
      expect(result.normalized).toBe(address)
    }
  })

  it('accepts caseless addresses and normalises them', () => {
    const lower = EIP55_VECTORS[0].toLowerCase()
    expect(validateAddress(lower).normalized).toBe(EIP55_VECTORS[0])

    const upper = `0x${EIP55_VECTORS[0].slice(2).toUpperCase()}`
    expect(validateAddress(upper).valid).toBe(true)
    expect(validateAddress(upper).normalized).toBe(EIP55_VECTORS[0])
  })

  it('rejects a mixed-case address with a single wrong-case character', () => {
    // Flip the case of one character in a valid checksummed address: this is
    // exactly the class of typo EIP-55 exists to catch.
    const good = EIP55_VECTORS[0]
    const broken = `${good.slice(0, 4)}${good[4] === good[4].toUpperCase() ? good[4].toLowerCase() : good[4].toUpperCase()}${good.slice(5)}`
    expect(broken).not.toBe(good)

    const result = validateAddress(broken)
    expect(result.valid).toBe(false)
    expect(result.problem).toBe('evm-bad-checksum')
    // Still hands back the corrected form so a UI can offer a fix.
    expect(result.normalized).toBe(good)
  })

  it('rejects wrong lengths', () => {
    expect(validateAddress('0x1234').problem).toBe('evm-bad-length')
    expect(validateAddress(`${EIP55_VECTORS[0]}00`).problem).toBe('evm-bad-length')
  })

  it('rejects non-hex characters', () => {
    expect(validateAddress(`0x${'z'.repeat(40)}`).problem).toBe('evm-non-hex')
  })

  it('rejects the free text that used to be accepted as a wallet', () => {
    for (const junk of ['hello world', 'not an address', 'Treasury ops', '  ']) {
      expect(isValidAddress(junk), junk).toBe(false)
    }
  })

  it('tolerates surrounding whitespace', () => {
    expect(validateAddress(`  ${EIP55_VECTORS[0]}  `).valid).toBe(true)
  })
})

describe('decodeBase58', () => {
  it('decodes known values', () => {
    expect(Array.from(decodeBase58('1')!)).toEqual([0])
    // "Hello World!" per the standard base58 example.
    expect(new TextDecoder().decode(decodeBase58('2NEpo7TZRRrLZSi2U')!)).toBe('Hello World!')
  })

  it('rejects characters outside the base58 alphabet', () => {
    for (const bad of ['0OIl', 'abc0', 'I am not base58']) {
      expect(decodeBase58(bad), bad).toBeNull()
    }
  })
})

describe('validateAddress — Solana', () => {
  // Well-known 32-byte program addresses.
  const VALID = [
    'So11111111111111111111111111111111111111112',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    '11111111111111111111111111111111',
  ]

  it('accepts 32-byte base58 addresses unchanged', () => {
    for (const address of VALID) {
      const result = validateAddress(address)
      expect(result.valid, address).toBe(true)
      expect(result.kind).toBe('solana')
      expect(result.normalized).toBe(address)
    }
  })

  it('rejects base58 that does not decode to 32 bytes', () => {
    expect(validateAddress('2NEpo7TZRRrLZSi2U2NEpo7TZRRrLZSi2U').problem).toBe('solana-bad-length')
  })

  it('rejects non-base58 alphabets', () => {
    expect(validateAddress('So1111111111111111111111111111111111111111O').problem).toBe(
      'solana-bad-alphabet',
    )
  })
})

describe('chain family', () => {
  it('maps chains to address families', () => {
    expect(chainFamily('ethereum')).toBe('evm')
    expect(chainFamily('base')).toBe('evm')
    expect(chainFamily('solana')).toBe('solana')
  })

  it('rejects an EVM address entered for Solana and vice versa', () => {
    expect(validateAddress(EIP55_VECTORS[0], 'solana').problem).toBe('wrong-chain-family')
    expect(validateAddress('So11111111111111111111111111111111111111112', 'ethereum').problem).toBe(
      'wrong-chain-family',
    )
  })

  it('accepts an EVM address on any EVM chain', () => {
    for (const chain of ['ethereum', 'base', 'arbitrum', 'polygon'] as const) {
      expect(validateAddress(EIP55_VECTORS[0], chain).valid, chain).toBe(true)
    }
  })
})

describe('detectAddressKind', () => {
  it('classifies by shape', () => {
    expect(detectAddressKind('0xabc')).toBe('evm')
    expect(detectAddressKind('So11111111111111111111111111111111111111112')).toBe('solana')
    expect(detectAddressKind('hello')).toBeNull()
  })
})

describe('addressesEqual', () => {
  it('treats EVM checksum casing as the same address', () => {
    expect(addressesEqual(EIP55_VECTORS[0], EIP55_VECTORS[0].toLowerCase())).toBe(true)
  })

  it('keeps distinct Solana addresses distinct', () => {
    expect(
      addressesEqual(
        'So11111111111111111111111111111111111111112',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      ),
    ).toBe(false)
  })
})

describe('shortenAddress', () => {
  it('elides the middle of a long address', () => {
    expect(shortenAddress(EIP55_VECTORS[0])).toBe('0x5aAe…eAed')
  })

  it('leaves short values alone', () => {
    expect(shortenAddress('0xabc')).toBe('0xabc')
  })
})

describe('isEnsName', () => {
  it('accepts well-formed names', () => {
    for (const name of ['vitalik.eth', 'my-wallet.eth', 'a.eth', 'sub.domain.eth', 'VITALIK.ETH']) {
      expect(isEnsName(name), name).toBe(true)
    }
  })

  it('rejects malformed names', () => {
    for (const name of ['.eth', 'no-tld', 'vitalik.com', '-bad.eth', 'bad-.eth', 'has space.eth']) {
      expect(isEnsName(name), name).toBe(false)
    }
  })
})

describe('validateWalletInput', () => {
  const VALID = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'

  it('accepts an ENS name and lowercases it', () => {
    const result = validateWalletInput('Vitalik.ETH')
    expect(result.valid).toBe(true)
    expect(result.kind).toBe('ens')
    expect(result.normalized).toBe('vitalik.eth')
  })

  it('accepts an address and checksums it', () => {
    const result = validateWalletInput(VALID.toLowerCase())
    expect(result.valid).toBe(true)
    expect(result.kind).toBe('evm')
    expect(result.normalized).toBe(VALID)
  })

  it('still refuses free text', () => {
    const result = validateWalletInput('hello world')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/address or ENS/i)
  })

  it('surfaces a checksum failure rather than a generic message', () => {
    const broken = '0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
    expect(validateWalletInput(broken).message).toMatch(/checksum/i)
  })

  it('refuses an empty field', () => {
    expect(validateWalletInput('   ').valid).toBe(false)
  })
})
