import type { ChainId, ComplianceSummary } from './types'
import { computeRiskScore, scoreLabel } from './utils'

export function generateComplianceSummary(
  address: string,
  chain: ChainId,
  chainBaseRisk: number,
  modeDelta: number,
  nonce = 0,
): ComplianceSummary {
  const metrics = computeRiskScore(address, chainBaseRisk, modeDelta, nonce)
  const { riskScore } = metrics
  const seed = metrics.scanHash

  const overallStatus: ComplianceSummary['overallStatus'] =
    riskScore >= 70 ? 'flagged' : riskScore >= 45 ? 'review' : 'compliant'

  const checks: ComplianceSummary['checks'] = [
    {
      id: 'kyc',
      label: 'KYC / Identity',
      status: seed % 5 === 0 ? 'warn' : 'pass',
      detail: seed % 5 === 0 ? 'Beneficial owner verification pending' : 'Identity records verified',
    },
    {
      id: 'sanctions',
      label: 'Sanctions screening',
      status: riskScore >= 70 ? 'fail' : riskScore >= 45 ? 'warn' : 'pass',
      detail:
        riskScore >= 70
          ? 'Potential match on OFAC-adjacent address cluster'
          : 'No sanctions list matches',
    },
    {
      id: 'travel',
      label: 'Travel Rule',
      status: seed % 7 === 0 ? 'warn' : 'pass',
      detail: seed % 7 === 0 ? 'Counterparty VASP unknown' : 'VASP metadata available',
    },
    {
      id: 'exposure',
      label: 'High-risk exposure',
      status: riskScore >= 55 ? 'warn' : 'pass',
      detail: `${scoreLabel(riskScore)} — ${riskScore}/100 composite score`,
    },
    {
      id: 'audit',
      label: 'Audit trail',
      status: 'pass',
      detail: 'Transaction history indexed and timestamped',
    },
  ]

  return {
    address,
    chain,
    generatedAt: Date.now(),
    overallStatus,
    riskScore,
    checks,
    sanctionsScreening: riskScore >= 70 ? 'Potential match — manual review required' : 'Clear',
    travelRuleStatus: seed % 7 === 0 ? 'Incomplete counterparty data' : 'Compliant',
    lastAuditDate: new Date(Date.now() - (seed % 30) * 86400000).toLocaleDateString(),
  }
}