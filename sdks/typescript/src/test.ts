// Basic smoke test (run after build)
import { ChainWatchClient } from './client'

async function main() {
  const client = new ChainWatchClient({ apiKey: 'cw_live_demo_only_replace_me' })
  console.log('TS SDK client created successfully')

  // In real env this would call the API; here we just validate construction
  if (!client) throw new Error('Client failed')
  console.log('All basic TS SDK checks passed')
}

main().catch(e => { console.error(e); process.exit(1) })