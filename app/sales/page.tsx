'use client'

import { useState, useEffect } from 'react'
import { baseUnitsPerLevel } from '@/lib/packaging'

interface PackagingLevel {
  id: string
  name: string
  order: number
  quantityInParent: number | null
  isSellable: boolean
  price: string | null
}

interface Product {
  id: string
  name: string
  packagingLevels: PackagingLevel[]
  batches: { remainingBaseUnits: number }[]
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<PackagingLevel | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  async function loadProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) setProducts(data.products)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function openProduct(product: Product) {
    const sellableLevels = product.packagingLevels.filter((l) => l.isSellable)
    if (sellableLevels.length === 0) return
    setSelectedProduct(product)
    setSelectedLevel(sellableLevels[0])
    setQuantity(1)
    setMessage('')
  }

  async function confirmSale() {
    if (!selectedProduct || !selectedLevel) return

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        packagingLevelId: selectedLevel.id,
        quantity,
      }),
    })
    const data = await res.json()

    if (!data.success) {
      setMessage(data.message)
      setMessageType('error')
      return
    }

    setLastSaleId(data.sale.id)
    setMessage(`Sold ${quantity} x ${selectedLevel.name} of ${selectedProduct.name}`)
    setMessageType('success')
    setSelectedProduct(null)
    setSelectedLevel(null)
    loadProducts()
  }

  async function undoLastSale() {
    if (!lastSaleId) return
    const res = await fetch(`/api/sales/${lastSaleId}/undo`, { method: 'POST' })
    const data = await res.json()

    if (!data.success) {
      setMessage(data.message)
      setMessageType('error')
      return
    }

    setMessage('Last sale undone.')
    setMessageType('success')
    setLastSaleId(null)
    loadProducts()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: 'var(--color-sidebar)' }}>
        <div style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Trusty</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/history" className="btn btn-ghost" style={{ color: '#94A3B8' }}>My Sales</a>
          <button onClick={undoLastSale} disabled={!lastSaleId} className="btn btn-secondary">Undo Last Sale</button>
          <button onClick={logout} className="btn btn-ghost" style={{ color: '#94A3B8' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        {message && (
          <div className={`badge ${messageType === 'success' ? 'badge-success' : 'badge-danger'} fade-in`} style={{ marginBottom: 20, fontSize: 14, padding: '8px 16px' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {products.map((p) => {
            const remainingBaseUnits = p.batches[0]?.remainingBaseUnits ?? 0
            const isOut = remainingBaseUnits === 0
            const sellableLevels = p.packagingLevels.filter((l) => l.isSellable)
            const displayLevel = sellableLevels[0]

            const unitsPerDisplayLevel = displayLevel ? baseUnitsPerLevel(p.packagingLevels, displayLevel.order) : 1
            const remainingAtDisplayLevel = displayLevel ? Math.floor(remainingBaseUnits / unitsPerDisplayLevel) : 0

            return (
              <button
                key={p.id}
                onClick={() => openProduct(p)}
                disabled={isOut || sellableLevels.length === 0}
                className="card card-hover fade-in"
                style={{ padding: 20, textAlign: 'left', border: 'none', cursor: isOut ? 'not-allowed' : 'pointer', opacity: isOut ? 0.5 : 1 }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                  {displayLevel ? `${displayLevel.price} Birr / ${displayLevel.name}` : 'No price set'}
                </div>
                <span className={`badge ${isOut ? 'badge-danger' : remainingAtDisplayLevel <= 5 ? 'badge-warning' : 'badge-neutral'}`}>
                  {isOut
                    ? 'Out of stock'
                    : displayLevel
                    ? `${remainingAtDisplayLevel} ${displayLevel.name}${remainingAtDisplayLevel !== 1 ? 's' : ''} left`
                    : `${remainingBaseUnits} units left`}
                </span>
                {displayLevel && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    ({remainingBaseUnits} base units)
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedProduct && selectedLevel && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelectedProduct(null)}
        >
          <div className="card fade-in" style={{ width: 340, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedProduct.name}</h3>

            {selectedProduct.packagingLevels.filter((l) => l.isSellable).length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Sell as</label>
                <select
                  className="input"
                  value={selectedLevel.id}
                  onChange={(e) => {
                    const lvl = selectedProduct.packagingLevels.find((l) => l.id === e.target.value)
                    if (lvl) setSelectedLevel(lvl)
                  }}
                >
                  {selectedProduct.packagingLevels.filter((l) => l.isSellable).map((l) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.price} Birr</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {selectedLevel.price} Birr per {selectedLevel.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="btn btn-secondary" style={{ width: 44, height: 44, fontSize: 20, padding: 0 }}>−</button>
              <span style={{ fontSize: 28, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="btn btn-secondary" style={{ width: 44, height: 44, fontSize: 20, padding: 0 }}>+</button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedProduct(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmSale} className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}