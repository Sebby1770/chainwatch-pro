import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AlertHistoryItem } from '../lib/types'
import { formatTimeAgo } from '../lib/utils'

function buildDigestHtml(history: AlertHistoryItem[]) {
  const rows = history
    .slice(0, 8)
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">${item.ruleName}</strong><br/>
          <span style="color:#6b7280;font-size:13px;">${item.message}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">${item.chain}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;background:${item.severity === 'critical' ? '#fee2e2' : item.severity === 'watch' ? '#fff2d6' : '#dff7f2'};color:${item.severity === 'critical' ? '#991b1b' : item.severity === 'watch' ? '#92400e' : '#0f766e'};">${item.severity}</span>
        </td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>ChainWatch Daily Digest</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;background:linear-gradient(135deg,#0f766e,#111827);color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">ChainWatch Pro</div>
        <h1 style="margin:8px 0 0;font-size:24px;">Daily alert digest</h1>
        <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Your watchlist summary for the last 24 hours</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;">
        <p style="margin:0 0 16px;color:#374151;font-size:14px;">Hi there — here are the most important signals from your configured rules.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;">Alert</th>
              <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;">Chain</th>
              <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;">Severity</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:20px 0 0;color:#6b7280;font-size:12px;">Manage rules in ChainWatch Pro · Unsubscribe in Settings</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function AlertDigestPreview({ history }: { history: AlertHistoryItem[] }) {
  const [open, setOpen] = useState(false)
  const digestHtml = useMemo(() => buildDigestHtml(history), [history])

  return (
    <>
      <button type="button" className="secondary-button small-btn" onClick={() => setOpen(true)}>
        <Mail size={15} aria-hidden="true" />
        Preview digest
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="digest-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="digest-title"
          >
            <motion.div
              className="digest-modal panel"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <div className="digest-modal-header">
                <div>
                  <span className="eyebrow">
                    <Mail size={14} aria-hidden="true" />
                    Email preview
                  </span>
                  <h2 id="digest-title">Daily alert digest</h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close digest preview">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="digest-preview-frame">
                <iframe title="Daily digest email preview" srcDoc={digestHtml} sandbox="" />
              </div>

              <div className="digest-summary-list">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className={clsx('digest-summary-row', item.severity)}>
                    <strong>{item.ruleName}</strong>
                    <span>{item.message}</span>
                    <small>{formatTimeAgo(item.timestamp)} · {item.chain}</small>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}