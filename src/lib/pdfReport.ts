import { jsPDF } from 'jspdf'
import type { ChainId } from './types'
import { formatCurrency, scoreLabel } from './utils'

interface ReportData {
  address: string
  chain: string
  riskScore: number
  healthScore: number
  portfolioValue: number
  activePositions: number
  walletAge: number
  mode: string
}

export function generateRiskReportPdf(data: ReportData) {
  const doc = new jsPDF()
  const generatedAt = new Date().toLocaleString()

  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text('ChainWatch Pro', 14, 18)
  doc.setFontSize(11)
  doc.text('Wallet Risk Report', 14, 28)

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  doc.text(`Generated: ${generatedAt}`, 140, 18)
  doc.text(`Chain: ${data.chain}`, 140, 26)

  let y = 48
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39)
  doc.text('Wallet Summary', 14, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  const lines = [
    `Address: ${data.address}`,
    `Risk Mode: ${data.mode}`,
    `Risk Score: ${data.riskScore}/100 (${scoreLabel(data.riskScore)})`,
    `Health Score: ${data.healthScore}/100`,
    `Portfolio Value: ${formatCurrency(data.portfolioValue)}`,
    `Active Positions: ${data.activePositions}`,
    `Wallet Age: ${data.walletAge.toLocaleString()} days`,
  ]

  lines.forEach((line) => {
    doc.text(line, 14, y)
    y += 7
  })

  y += 6
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39)
  doc.text('Risk Assessment', 14, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  const assessment =
    data.riskScore >= 70
      ? 'Elevated risk detected. Review contract interactions and concentration.'
      : data.riskScore >= 45
        ? 'Moderate risk profile. Monitor alerts and rebalance exposure.'
        : 'Healthy risk profile. Continue periodic scans.'

  const wrapped = doc.splitTextToSize(assessment, 180)
  doc.text(wrapped, 14, y)
  y += wrapped.length * 7 + 8

  doc.setDrawColor(221, 228, 232)
  doc.line(14, y, 196, y)
  y += 10

  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(
    'Disclaimer: Demo report for evaluation only. Not financial or compliance advice.',
    14,
    y,
  )

  const safeAddress = data.address.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)
  doc.save(`chainwatch-risk-${safeAddress}-${data.chain as ChainId}.pdf`)
}