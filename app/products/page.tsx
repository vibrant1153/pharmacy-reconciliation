'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  pricePerStrip: string
  stripsPerCarton: number
  batches: { remainingStrips: number }[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [pricePerStrip, setPricePerStrip] = useState('')
  const [stripsPerCarton, setStripsPerCarton] = useState('')
  const [startingCartons, setStartingCartons] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function loadProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) setProducts(data.products)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        pricePerStrip: parseFloat(pricePerStrip),
        stripsPerCarton: parseInt(stripsPerCarton),
        startingCartons: parseInt(startingCartons),
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.message)
      return
    }

    setName('')
    setPricePerStrip('')
    setStripsPerCarton('')
    setStartingCartons('')
    loadProducts()
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditName(product.name)
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()

    if (!data.success) {
      alert(data.message)
      return
    }

    setEditingId(null)
    loadProducts()
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Medicine Management</h1>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        <input placeholder="Medicine name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Price per strip (Birr)" type="number" step="0.01" value={pricePerStrip} onChange={(e) => setPricePerStrip(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Strips per carton" type="number" value={stripsPerCarton} onChange={(e) => setStripsPerCarton(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Starting cartons in stock" type="number" value={startingCartons} onChange={(e) => setStartingCartons(e.target.value)} style={{ padding: 8 }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? 'Adding...' : 'Add Medicine'}
        </button>
      </form>

      <h2>Current Medicines</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Price/Strip</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Strips/Carton</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Remaining Strips</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {editingId === p.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: 4 }} />
                ) : (
                  p.name
                )}
              </td>
              <td>{p.pricePerStrip}</td>
              <td>{p.stripsPerCarton}</td>
              <td>{p.batches[0]?.remainingStrips ?? 0}</td>
              <td>
                {editingId === p.id ? (
                  <>
                    <button onClick={() => saveEdit(p.id)} style={{ marginRight: 4 }}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => startEdit(p)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}