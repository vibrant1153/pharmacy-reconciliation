'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface Category {
  id: string
  name: string
  subcategories: { id: string; name: string }[]
}

interface PackagingLevel {
  id: string
  name: string
  order: number
  quantityInParent: number | null
  isSellable: boolean
  isBaseUnit: boolean
  price: string | null
  purchasePrice: string | null
}

interface Product {
  id: string
  name: string
  archived: boolean
  category: { id: string; name: string } | null
  subcategory: { id: string; name: string } | null
  packagingLevels: PackagingLevel[]
  batches: { remainingBaseUnits: number; totalBaseUnits: number }[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showArchived, setShowArchived] = useState(false)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const [boxName, setBoxName] = useState('Box')
  const [boxPrice, setBoxPrice] = useState('')
  const [boxPurchasePrice, setBoxPurchasePrice] = useState('')
  const [boxSellable, setBoxSellable] = useState(false)

  const [stripName, setStripName] = useState('Strip')
  const [stripsPerBox, setStripsPerBox] = useState('')
  const [stripPrice, setStripPrice] = useState('')
  const [stripSellable, setStripSellable] = useState(true)

  const [tabletName, setTabletName] = useState('Tablet')
  const [tabletsPerStrip, setTabletsPerStrip] = useState('')
  const [tabletPrice, setTabletPrice] = useState('')
  const [tabletSellable, setTabletSellable] = useState(false)

  const [startingBoxes, setStartingBoxes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [subcategoryParentId, setSubcategoryParentId] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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

    if (!boxSellable && !stripSellable && !tabletSellable) {
      setError('At least one packaging level must be sellable.')
      return
    }
    if (!boxPurchasePrice) {
      setError('Box purchase price (cost from supplier) is required.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        boxName, boxPrice: boxPrice ? parseFloat(boxPrice) : null, boxPurchasePrice: parseFloat(boxPurchasePrice), boxSellable,
        stripName, stripsPerBox: parseInt(stripsPerBox), stripPrice: stripPrice ? parseFloat(stripPrice) : null, stripSellable,
        tabletName, tabletsPerStrip: parseInt(tabletsPerStrip), tabletPrice: tabletPrice ? parseFloat(tabletPrice) : null, tabletSellable,
        startingBoxes: parseInt(startingBoxes),
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.message)
      return
    }

    setName('')
    setBoxPrice(''); setBoxPurchasePrice('')
    setStripsPerBox(''); setStripPrice('')
    setTabletsPerStrip(''); setTabletPrice('')
    setStartingBoxes('')
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

        <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <form onSubmit={handleAdd} className="card fade-in" style={{ padding: 24, width: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Add Medicine</h3>

            <div>
              <label className="label">Medicine name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {selectedCategoryForForm && selectedCategoryForForm.subcategories.length > 0 && (
              <div>
                <label className="label">Subcategory</label>
                <select className="input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                  <option value="">No subcategory</option>
                  {selectedCategoryForForm.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Level 1 — {boxName} (purchase unit)</div>
              <input className="input" placeholder="Name" value={boxName} onChange={(e) => setBoxName(e.target.value)} style={{ marginBottom: 6 }} />
              <div>
                <label className="label">Purchase price (cost from supplier, per {boxName})</label>
                <input className="input" type="number" step="0.01" placeholder="e.g. 300" value={boxPurchasePrice} onChange={(e) => setBoxPurchasePrice(e.target.value)} />
              </div>
              <div style={{ marginTop: 6 }}>
                <input className="input" type="number" step="0.01" placeholder="Sell price (only if sold whole)" value={boxPrice} onChange={(e) => setBoxPrice(e.target.value)} disabled={!boxSellable} />
              </div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={boxSellable} onChange={(e) => setBoxSellable(e.target.checked)} /> Sellable at this level
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Level 2 — {stripName}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input className="input" placeholder="Name" value={stripName} onChange={(e) => setStripName(e.target.value)} style={{ flex: 1 }} />
                <input className="input" type="number" placeholder={`per ${boxName}`} value={stripsPerBox} onChange={(e) => setStripsPerBox(e.target.value)} style={{ width: 90 }} />
              </div>
              <input className="input" type="number" step="0.01" placeholder="Sell price" value={stripPrice} onChange={(e) => setStripPrice(e.target.value)} disabled={!stripSellable} style={{ marginBottom: 6 }} />
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={stripSellable} onChange={(e) => setStripSellable(e.target.checked)} /> Sellable at this level
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Level 3 — {tabletName} (base unit)</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input className="input" placeholder="Name" value={tabletName} onChange={(e) => setTabletName(e.target.value)} style={{ flex: 1 }} />
                <input className="input" type="number" placeholder={`per ${stripName}`} value={tabletsPerStrip} onChange={(e) => setTabletsPerStrip(e.target.value)} style={{ width: 90 }} />
              </div>
              <input className="input" type="number" step="0.01" placeholder="Sell price" value={tabletPrice} onChange={(e) => setTabletPrice(e.target.value)} disabled={!tabletSellable} style={{ marginBottom: 6 }} />
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={tabletSellable} onChange={(e) => setTabletSellable(e.target.checked)} /> Sellable at this level
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <label className="label">Starting {boxName}s in stock</label>
              <input className="input" type="number" value={startingBoxes} onChange={(e) => setStartingBoxes(e.target.value)} />
            </div>

            {error && <div className="badge badge-danger">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </form>

          <div className="card fade-in" style={{ padding: 24, width: 280 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Categories</h3>
            <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="input" placeholder="New category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              <button type="submit" className="btn btn-secondary">Add</button>
            </form>
            <form onSubmit={addSubcategory} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <select className="input" value={subcategoryParentId} onChange={(e) => setSubcategoryParentId(e.target.value)}>
                <option value="">Select category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="New subcategory" value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} />
                <button type="submit" className="btn btn-secondary">Add</button>
              </div>
            </form>
            {categories.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                {c.subcategories.map((s) => (
                  <div key={s.id} style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 12 }}>{s.name}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Current Medicines</h2>
            <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived
            </label>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Packaging (Sell price)</th>
                <th>{'Box cost'}</th>
                <th>Remaining (base units)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const remaining = p.batches[0]?.remainingBaseUnits ?? 0
                const box = p.packagingLevels.find((l) => l.order === 0)
                return (
                  <tr key={p.id} style={{ opacity: p.archived ? 0.5 : 1 }}>
                    <td>
                      {editingId === p.id ? (
                        <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 120 }} />
                      ) : p.name}
                    </td>
                    <td>{p.category?.name ?? '—'}{p.subcategory ? ` / ${p.subcategory.name}` : ''}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {p.packagingLevels.map((lvl) => `${lvl.name}${lvl.isSellable ? ` (${lvl.price} Birr)` : ''}`).join(' → ')}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {box?.purchasePrice ? `${box.purchasePrice} Birr / ${box.name}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${remaining === 0 ? 'badge-danger' : remaining <= 50 ? 'badge-warning' : 'badge-neutral'}`}>
                        {remaining}
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}