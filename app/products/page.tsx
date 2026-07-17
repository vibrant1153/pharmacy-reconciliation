'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface Category {
  id: string
  name: string
  subcategories: { id: string; name: string }[]
}

interface Product {
  id: string
  name: string
  pricePerStrip: string
  stripsPerCarton: number
  archived: boolean
  category: { id: string; name: string } | null
  subcategory: { id: string; name: string } | null
  batches: { remainingStrips: number }[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showArchived, setShowArchived] = useState(false)

  const [name, setName] = useState('')
  const [pricePerStrip, setPricePerStrip] = useState('')
  const [stripsPerCarton, setStripsPerCarton] = useState('')
  const [startingCartons, setStartingCartons] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [subcategoryParentId, setSubcategoryParentId] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  async function loadProducts() {
    const res = await fetch(`/api/products?includeArchived=${showArchived}`)
    const data = await res.json()
    if (data.success) setProducts(data.products)
  }

  async function loadCategories() {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.success) setCategories(data.categories)
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [showArchived])

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
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
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
    setCategoryId('')
    setSubcategoryId('')
    loadProducts()
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    })
    setNewCategoryName('')
    loadCategories()
  }

  async function addSubcategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubcategoryName.trim() || !subcategoryParentId) return

    await fetch(`/api/categories/${subcategoryParentId}/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubcategoryName.trim() }),
    })
    setNewSubcategoryName('')
    loadCategories()
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditName(product.name)
    setEditPrice(product.pricePerStrip)
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, pricePerStrip: parseFloat(editPrice) }),
    })
    const data = await res.json()

    if (!data.success) {
      alert(data.message)
      return
    }

    setEditingId(null)
    loadProducts()
  }

  async function toggleArchive(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !product.archived }),
    })
    loadProducts()
  }

  const selectedCategoryForForm = categories.find((c) => c.id === categoryId)

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 1200 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Medicine Management
        </h1>

        <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start' }}>
          <form onSubmit={handleAdd} className="card fade-in" style={{ padding: 24, width: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Add Medicine</h3>

            <div>
              <label className="label">Medicine name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Price per strip (Birr)</label>
              <input className="input" type="number" step="0.01" value={pricePerStrip} onChange={(e) => setPricePerStrip(e.target.value)} />
            </div>
            <div>
              <label className="label">Strips per carton</label>
              <input className="input" type="number" value={stripsPerCarton} onChange={(e) => setStripsPerCarton(e.target.value)} />
            </div>
            <div>
              <label className="label">Starting cartons</label>
              <input className="input" type="number" value={startingCartons} onChange={(e) => setStartingCartons(e.target.value)} />
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedCategoryForForm && selectedCategoryForForm.subcategories.length > 0 && (
              <div>
                <label className="label">Subcategory</label>
                <select className="input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                  <option value="">No subcategory</option>
                  {selectedCategoryForForm.subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className="badge badge-danger">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </form>

          <div className="card fade-in" style={{ padding: 24, width: 280 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Categories</h3>

            <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="input" placeholder="New category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add</button>
            </form>

            <form onSubmit={addSubcategory} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <select className="input" value={subcategoryParentId} onChange={(e) => setSubcategoryParentId(e.target.value)}>
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="New subcategory" value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} />
                <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add</button>
              </div>
            </form>

            {categories.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                {c.subcategories.map((s) => (
                  <div key={s.id} style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 12 }}>
                    {s.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Current Medicines</h2>
            <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price/Strip</th>
                <th>Strips/Carton</th>
                <th>Remaining</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ opacity: p.archived ? 0.5 : 1 }}>
                  <td>
                    {editingId === p.id ? (
                      <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 120 }} />
                    ) : (
                      p.name
                    )}
                  </td>
                  <td>{p.category?.name ?? '—'}{p.subcategory ? ` / ${p.subcategory.name}` : ''}</td>
                  <td>
                    {editingId === p.id ? (
                      <input className="input" type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: 80 }} />
                    ) : (
                      `${p.pricePerStrip} Birr`
                    )}
                  </td>
                  <td>{p.stripsPerCarton}</td>
                  <td>
                    <span className={`badge ${(p.batches[0]?.remainingStrips ?? 0) === 0 ? 'badge-danger' : (p.batches[0]?.remainingStrips ?? 0) <= 20 ? 'badge-warning' : 'badge-neutral'}`}>
                      {p.batches[0]?.remainingStrips ?? 0}
                    </span>
                  </td>
                  <td>
                    {editingId === p.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveEdit(p.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>Save</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(p)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Edit</button>
                        <button onClick={() => toggleArchive(p)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }}>
                          {p.archived ? 'Unarchive' : 'Archive'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}