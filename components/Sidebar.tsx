'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ownerLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Medicine Management' },
  { href: '/history', label: 'Sales History' },
  { href: '/reconciliation', label: 'Reconciliation' },
  { href: '/audit', label: 'Audit History' },
]

const employeeLinks = [
  { href: '/sales', label: 'Sell Medicine' },
  { href: '/history', label: 'My Sales' },
]

export default function Sidebar({ userName, role }: { userName: string; role: 'OWNER' | 'EMPLOYEE' }) {
  const pathname = usePathname()
  const links = role === 'OWNER' ? ownerLinks : employeeLinks

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--color-sidebar)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '0 12px', marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Trusty</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{userName}</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: active ? 'white' : '#94A3B8',
                background: active ? 'var(--color-primary)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={logout}
        className="btn btn-ghost"
        style={{ color: '#94A3B8', justifyContent: 'flex-start' }}
      >
        Logout
      </button>
    </div>
  )
}