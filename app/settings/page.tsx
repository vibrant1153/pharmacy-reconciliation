'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface Employee {
  id: string
  name: string
  username: string
  createdAt: string
}

interface SettingsData {
  lowStockThreshold: number
  discrepancyThreshold: string
  staleItemMultiplier: string
}

export default function SettingsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [settings, setSettings] = useState<SettingsData | null>(null)

  const [empName, setEmpName] = useState('')
  const [empUsername, setEmpUsername] = useState('')
  const [empPin, setEmpPin] = useState('')
  const [empError, setEmpError] = useState('')

  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [resetPin, setResetPin] = useState('')

  const [lowStock, setLowStock] = useState('')
  const [discrepancy, setDiscrepancy] = useState('')
  const [staleMultiplier, setStaleMultiplier] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')

  async function loadEmployees() {
    const res = await fetch('/api/employees')
    const data = await res.json()
    if (data.success) setEmployees(data.employees)
  }

  async function loadSettings() {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.success) {
      setSettings(data.settings)
      setLowStock(String(data.settings.lowStockThreshold))
      setDiscrepancy(String(data.settings.discrepancyThreshold))
      setStaleMultiplier(String(data.settings.staleItemMultiplier))
    }
  }

  useEffect(() => {
    loadEmployees()
    loadSettings()
  }, [])

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    setEmpError('')

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: empName, username: empUsername, pin: empPin }),
    })
    const data = await res.json()

    if (!data.success) {
      setEmpError(data.message)
      return
    }

    setEmpName(''); setEmpUsername(''); setEmpPin('')
    loadEmployees()
  }

  async function submitPinReset(id: string) {
    if (!resetPin || resetPin.length < 4) {
      alert('PIN must be at least 4 digits.')
      return
    }
    const res = await fetch(`/api/employees/${id}/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: resetPin }),
    })
    const data = await res.json()
    if (!data.success) {
      alert(data.message)
      return
    }
    setResetTarget(null)
    setResetPin('')
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMessage('')

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lowStockThreshold: lowStock,
        discrepancyThreshold: discrepancy,
        staleItemMultiplier: staleMultiplier,
      }),
    })
    const data = await res.json()
    if (!data.success) {
      setSettingsMessage(data.message)
      return
    }
    setSettingsMessage('Saved.')
    loadSettings()
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 900 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Settings
        </h1>

        <div className="card fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Employees</h2>

          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.username}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    {new Date(emp.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {resetTarget === emp.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="input"
                          placeholder="New PIN"
                          value={resetPin}
                          onChange={(e) => setResetPin(e.target.value)}
                          style={{ width: 100 }}
                        />
                        <button onClick={() => submitPinReset(emp.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>Save</button>
                        <button onClick={() => { setResetTarget(null); setResetPin('') }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setResetTarget(emp.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Reset PIN</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={addEmployee} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="label">Name</label>
              <input className="input" value={empName} onChange={(e) => setEmpName(e.target.value)} style={{ width: 160 }} />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} style={{ width: 140 }} />
            </div>
            <div>
              <label className="label">PIN</label>
              <input className="input" value={empPin} onChange={(e) => setEmpPin(e.target.value)} style={{ width: 100 }} />
            </div>
            <button type="submit" className="btn btn-primary">Add Employee</button>
          </form>
          {empError && <div className="badge badge-danger" style={{ marginTop: 10 }}>{empError}</div>}
        </div>

        <div className="card fade-in" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Alert Thresholds</h2>
          {!settings ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : (
            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
              <div>
                <label className="label">Low stock threshold (base units)</label>
                <input className="input" type="number" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
              </div>
              <div>
                <label className="label">Discrepancy threshold (Birr, for yellow vs red)</label>
                <input className="input" type="number" step="0.01" value={discrepancy} onChange={(e) => setDiscrepancy(e.target.value)} />
              </div>
              <div>
                <label className="label">Stale-item multiplier (× normal sale pace)</label>
                <input className="input" type="number" step="0.1" value={staleMultiplier} onChange={(e) => setStaleMultiplier(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 140 }}>Save Settings</button>
              {settingsMessage && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{settingsMessage}</span>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}