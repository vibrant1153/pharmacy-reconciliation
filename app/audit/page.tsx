'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface AuditRecord {
  id: string
  userName: string
  action: string
  entity: string
  oldValue: string | null
  newValue: string | null
  timestamp: string
}

const actionColors: Record<string, string> = {
  SOLD: 'badge-success',
  SALE_UNDONE: 'badge-warning',
  PRODUCT_RENAMED: 'badge-neutral',
  PRODUCT_UPDATED: 'badge-neutral',
  PRODUCT_ADDED: 'badge-success',
  BATCH_ADDED: 'badge-success',
  RECONCILIATION_SUBMITTED: 'badge-neutral',
  RECONCILIATION_UPDATED: 'badge-neutral',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([])

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.logs)
      })
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 1100 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Audit History
        </h1>

        <div className="card fade-in" style={{ padding: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Old Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>{log.userName}</td>
                  <td>
                    <span className={`badge ${actionColors[log.action] ?? 'badge-neutral'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{log.oldValue ?? '—'}</td>
                  <td>{log.newValue ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, padding: '20px 0' }}>
              No activity recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}