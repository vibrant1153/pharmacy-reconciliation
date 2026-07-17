'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  pricePerStrip: string
  batches: { remainingStrips: number }[]
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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

  function openQuantityPicker(product: Product) {
    setSelectedProduct(product)
    setQuantity(1)
    setMessage('')
  }

  async function confirmSale() {
    if (!selectedProduct) return

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedProduct.id, quantity }),
    })
    const data = await res.json()

    if (!data.success) {
      setMessage(data.message)
      setMessageType('error')
      return
    }

    setLastSaleId(data.sale.id)
    setMessage(`Sold ${quantity} x ${selectedProduct.name}`)
    setMessageType('success')
    setSelectedProduct(null)
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 32px',
          background: 'var(--color-sidebar)',
        }}
      >
        <div style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Trusty
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/history" className="btn btn-ghost" style={{ color: '#94A3B8' }}>My Sales</a>
          <button
            onClick={undoLastSale}
            disabled={!lastSaleId}
            className="btn btn-secondary"
          >
            Undo Last Sale
          </button>
          <button onClick={logout} className="btn btn-ghost" style={{ color: '#94A3B8' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        {message && (
          <div
            className={`badge ${messageType === 'success' ? 'badge-success' : 'badge-danger'} fade-in`}
            style={{ marginBottom: 20, fontSize: 14, padding: '8px 16px' }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {products.map((p) => {
            const remaining = p.batches[0]?.remainingStrips ?? 0
            const isOut = remaining === 0
            return (
              <button
                key={p.id}
                onClick={() => openQuantityPicker(p)}
                disabled={isOut}
                className="card card-hover fade-in"
                style={{
                  padding: 20,
                  textAlign: 'left',
                  border: 'none',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  opacity: isOut ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                  {p.pricePerStrip} Birr
                </div>
                <span className={`badge ${isOut ? 'badge-danger' : remaining <= 20 ? 'badge-warning' : 'badge-neutral'}`}>
                  {isOut ? 'Out of stock' : `${remaining} left`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="card fade-in"
            style={{ width: 320, padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedProduct.name}</h3>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {selectedProduct.pricePerStrip} Birr per strip
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="btn btn-secondary"
                style={{ width: 44, height: 44, fontSize: 20, padding: 0 }}
              >
                −
              </button>
              <span style={{ fontSize: 28, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="btn btn-secondary"
                style={{ width: 44, height: 44, fontSize: 20, padding: 0 }}
              >
                +
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedProduct(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={confirmSale} className="btn btn-primary" style={{ flex: 1 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}