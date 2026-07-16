'use client'

import { useState, useEffect } from 'react'

interface AuditRecord {
  id: string
  userName: string
  action: string
  entity: string
  oldValue: string | null
  newValue: string | null
  timestamp: string
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
    <div style={{ padding: 24 }}>
      <h1>Audit History</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Time</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>User</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Action</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Old Value</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>New Value</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.userName}</td>
              <td>{log.action} ({log.entity})</td>
              <td>{log.oldValue ?? '—'}</td>
              <td>{log.newValue ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}