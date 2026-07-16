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
      return
    }

    setLastSaleId(data.sale.id)
    setMessage(`Sold ${quantity} x ${selectedProduct.name}`)
    setSelectedProduct(null)
    loadProducts()
  }

  async function undoLastSale() {
    if (!lastSaleId) return

    const res = await fetch(`/api/sales/${lastSaleId}/undo`, { method: 'POST' })
    const data = await res.json()

    if (!data.success) {
      setMessage(data.message)
      return
    }

    setMessage('Last sale undone.')
    setLastSaleId(null)
    loadProducts()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Sell Medicine</h1>
        <div>
          
          <a href="/history" style={{ marginRight: 16 }}>My Sales</a>
          <button onClick={undoLastSale} disabled={!lastSaleId} style={{ padding: 8, marginRight: 8 }}>
            Undo Last Sale
          </button>
          <button onClick={logout} style={{ padding: 8 }}>Logout</button>
        </div>
      </div>

      {message && <p>{message}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {products.map((p) => {
          const remaining = p.batches[0]?.remainingStrips ?? 0
          return (
            <button
              key={p.id}
              onClick={() => openQuantityPicker(p)}
              disabled={remaining === 0}
              style={{ padding: 16, border: '1px solid #ccc', textAlign: 'left' }}
            >
              <strong>{p.name}</strong>
              <div>{p.pricePerStrip} Birr</div>
              <div>{remaining} left</div>
            </button>
          )
        })}
      </div>

      {selectedProduct && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #333', maxWidth: 300 }}>
          <h3>{selectedProduct.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <button onClick={confirmSale} style={{ padding: 10, marginRight: 8 }}>Confirm Sale</button>
          <button onClick={() => setSelectedProduct(null)} style={{ padding: 10 }}>Cancel</button>
        </div>
      )}
    </div>
  )
}