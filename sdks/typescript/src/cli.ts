#!/usr/bin/env node
import { ChainWatchClient } from './client'

async function main() {
  const [cmd, ...args] = process.argv.slice(2)
  const client = new ChainWatchClient()

  if (cmd === 'scan' || cmd === 's') {
    const address = args[0] || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    const res = await client.scanWallet(address)
    console.log(`ChainWatch Pro • ${res.chain}`)
    console.log(`Risk: ${res.riskScore}/100  Health: ${res.healthScore}/100`)
    console.log(`Value: $${Math.round(res.portfolioValueUsd)}`)
    process.exit(0)
  }

  if (cmd === 'vaults') {
    const v = await client.listVaults()
    console.dir(v, { depth: 2 })
    process.exit(0)
  }

  console.log('chainwatch-ts scan <address> | vaults')
}

main().catch(e => { console.error(e); process.exit(1) })
