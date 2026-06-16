export interface ScanOptions {
  chain?: 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'solana'
  riskMode?: 'conservative' | 'balanced' | 'aggressive'
}

export interface ScanResult {
  wallet: string
  chain: string
  riskScore: number
  healthScore: number
  portfolioValueUsd: number
  activePositions: number
  gasMedian: string
  allocation: Record<string, number>
}

export class ChainWatchClient {
  private apiKey: string
  private baseUrl: string

  constructor(opts: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = opts.apiKey || process.env.CHAINWATCH_API_KEY || ''
    if (!this.apiKey) throw new Error('API key required')
    this.baseUrl = (opts.baseUrl || 'https://api.chainwatch.pro').replace(/\/$/, '')
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json() as Promise<T>
  }

  async scanWallet(address: string, opts: ScanOptions = {}): Promise<ScanResult> {
    const body = {
      address,
      chain: opts.chain || 'base',
      risk_mode: opts.riskMode || 'balanced',
    }
    const data = await this.request<any>('/v1/scan', { method: 'POST', body: JSON.stringify(body) })
    return {
      wallet: data.wallet,
      chain: data.chain,
      riskScore: data.risk_score,
      healthScore: data.health,
      portfolioValueUsd: data.value_usd,
      activePositions: data.positions,
      gasMedian: data.gas,
      allocation: data.allocation || {},
    }
  }

  async listVaults(limit = 10) {
    return this.request(`/v1/vaults?limit=${limit}`)
  }

  async getAlerts() {
    return this.request('/v1/alerts')
  }
}
