'use client'

import { useState, useEffect } from 'react'

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
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Medicine Management</h1>

      <div style={{ display: 'flex', gap: 40, marginBottom: 32 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
          <h3>Add Medicine</h3>
          <input placeholder="Medicine name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Price per strip (Birr)" type="number" step="0.01" value={pricePerStrip} onChange={(e) => setPricePerStrip(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Strips per carton" type="number" value={stripsPerCarton} onChange={(e) => setStripsPerCarton(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Starting cartons in stock" type="number" value={startingCartons} onChange={(e) => setStartingCartons(e.target.value)} style={{ padding: 8 }} />

          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }} style={{ padding: 8 }}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedCategoryForForm && selectedCategoryForForm.subcategories.length > 0 && (
            <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} style={{ padding: 8 }}>
              <option value="">No subcategory</option>
              {selectedCategoryForForm.subcategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding: 10 }}>
            {loading ? 'Adding...' : 'Add Medicine'}
          </button>
        </form>

        <div style={{ width: 280 }}>
          <h3>Categories</h3>
          <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input placeholder="New category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ padding: 8, flex: 1 }} />
            <button type="submit" style={{ padding: 8 }}>Add</button>
          </form>

          <form onSubmit={addSubcategory} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={subcategoryParentId} onChange={(e) => setSubcategoryParentId(e.target.value)} style={{ padding: 8 }}>
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="New subcategory" value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} style={{ padding: 8, flex: 1 }} />
              <button type="submit" style={{ padding: 8 }}>Add</button>
            </div>
          </form>

          <ul style={{ marginTop: 12 }}>
            {categories.map((c) => (
              <li key={c.id}>
                {c.name}
                {c.subcategories.length > 0 && (
                  <ul>
                    {c.subcategories.map((s) => <li key={s.id}>{s.name}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Current Medicines</h2>
        <label>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          {' '}Show archived
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Category</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Price/Strip</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Strips/Carton</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Remaining</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ opacity: p.archived ? 0.5 : 1 }}>
              <td>
                {editingId === p.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: 4, width: 100 }} />
                ) : (
                  p.name
                )}
              </td>
              <td>{p.category?.name ?? '—'}{p.subcategory ? ` / ${p.subcategory.name}` : ''}</td>
              <td>
                {editingId === p.id ? (
                  <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: 4, width: 70 }} />
                ) : (
                  p.pricePerStrip
                )}
              </td>
              <td>{p.stripsPerCarton}</td>
              <td>{p.batches[0]?.remainingStrips ?? 0}</td>
              <td>
                {editingId === p.id ? (
                  <>
                    <button onClick={() => saveEdit(p.id)} style={{ marginRight: 4 }}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(p)} style={{ marginRight: 4 }}>Edit</button>
                    <button onClick={() => toggleArchive(p)}>{p.archived ? 'Unarchive' : 'Archive'}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}