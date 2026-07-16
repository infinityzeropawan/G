'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import ThermalReceipt, { ReceiptData } from '@/components/ThermalReceipt';
import { Plus, ShoppingCart, Package, TrendingUp, AlertTriangle, X, Edit2, Trash2, Printer, RefreshCw, Save } from 'lucide-react';
import { storeApi, type Product, type Order, type StoreSummary } from '@/lib/api';

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const CATEGORIES = ['Supplements', 'Accessories', 'Equipment', 'Merchandise', 'Others'];
const METHODS    = ['UPI', 'Cash', 'Card'];

export default function Store() {
  const [tab, setTab]               = useState('Products');
  const [products, setProducts]     = useState<Product[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [summary, setSummary]       = useState<StoreSummary | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);
  const [printData, setPrintData]   = useState<ReceiptData | null>(null);

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProductId, setEditProductId]       = useState<number | null>(null);
  const [productForm, setProductForm]           = useState({ name: '', category: 'Supplements', price: '', stock: '', description: '' });

  // Order (POS) modal
  const [showOrderModal, setShowOrderModal]     = useState(false);
  const [orderItems, setOrderItems]             = useState<{ productId: number; qty: number; name: string; price: number }[]>([]);
  const [orderMethod, setOrderMethod]           = useState('Cash');

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, summaryRes] = await Promise.all([
        storeApi.getProducts(),
        storeApi.getOrders({ limit: '100' }),
        storeApi.getStoreSummary(),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data.orders);
      setSummary(summaryRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Product CRUD ─────────────────────────────────────────────────────────

  const openAddProduct = () => { setEditProductId(null); setProductForm({ name: '', category: 'Supplements', price: '', stock: '', description: '' }); setShowProductModal(true); };
  const openEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setProductForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), description: p.description || '' });
    setShowProductModal(true);
  };
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
      if (editProductId) { await storeApi.updateProduct(editProductId, payload); showToast('Product updated!', 'success'); }
      else { await storeApi.createProduct(payload); showToast('Product added!', 'success'); }
      setShowProductModal(false); await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };
  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await storeApi.removeProduct(id); showToast('Product deleted', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  // ── Order / POS ─────────────────────────────────────────────────────────

  const addToOrder = (p: Product) => {
    const existing = orderItems.find(i => i.productId === p.id);
    if (existing) setOrderItems(orderItems.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
    else setOrderItems([...orderItems, { productId: p.id, qty: 1, name: p.name, price: p.price }]);
  };
  const removeFromOrder = (productId: number) => setOrderItems(orderItems.filter(i => i.productId !== productId));
  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (orderItems.length === 0) return showToast('Add items to order first', 'error');
    setSaving(true);
    try {
      const res = await storeApi.createOrder({ items: orderItems.map(i => ({ productId: i.productId, qty: i.qty })), method: orderMethod }) as { data: Order };
      showToast('Order placed!', 'success');
      // Print receipt
      setPrintData({
        gymName: 'GymSmart Store', gymPhone: '+91 83479 77566',
        receiptNo: `ORD-${res.data.id}`, date: new Date().toLocaleDateString('en-IN'),
        customerName: 'Walk-in Customer',
        items: orderItems.map(i => ({ name: i.name, price: i.price, amount: i.price * i.qty })),
        total: orderTotal, paymentMethod: orderMethod,
      });
      setTimeout(() => window.print(), 100);
      setOrderItems([]); setShowOrderModal(false); await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-full pb-10">
      <Header title="Store" subtitle="Manage products, inventory and sales" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: summary?.totalProducts || 0, icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Total Orders',   value: summary?.totalOrders || 0,   icon: ShoppingCart, color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Store Revenue',  value: fmt(summary?.totalRevenue || 0), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Low Stock',      value: summary?.lowStockProducts?.length || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={19} className={s.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {(summary?.lowStockProducts?.length ?? 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">Low stock alert: {summary!.lowStockProducts.map(p => p.name).join(', ')}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {['Products', 'Orders'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{t}</button>
              ))}
            </div>
            <div className="px-4 flex gap-2">
              <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
              {tab === 'Products' && <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Add Product</button>}
              {tab === 'Orders'   && <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><ShoppingCart size={14} /> New Sale</button>}
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tab === 'Products' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.category}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><Edit2 size={13} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">{fmt(p.price)}</span>
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-700' : p.stock <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock} in stock
                      </span>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400">No products added yet.</div>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Order ID', 'Total', 'Method', 'Status', 'Date', 'Receipt'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">ORD-{String(o.id).padStart(4, '0')}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-700">{fmt(o.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{o.method}</td>
                        <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{o.status}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><button onClick={() => setPrintData({ gymName: 'GymSmart Store', gymPhone: '+91 83479 77566', receiptNo: `ORD-${o.id}`, date: new Date(o.createdAt).toLocaleDateString('en-IN'), customerName: 'Customer', items: (o.items || []).map(i => ({ name: i.product?.name || '', price: i.price, amount: i.price * i.qty })), total: o.total, paymentMethod: o.method })} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><Printer size={14} /></button></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editProductId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveProduct} className="p-4 sm:p-6 space-y-4">
              {[{ label: 'Product Name', key: 'name', type: 'text' }, { label: 'Price (₹)', key: 'price', type: 'number' }, { label: 'Stock Quantity', key: 'stock', type: 'number' }, { label: 'Description', key: 'description', type: 'text' }].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input required={f.key !== 'description'} type={f.type} value={(productForm as Record<string, string>)[f.key]} onChange={e => setProductForm({ ...productForm, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editProductId ? 'Update' : 'Add Product'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS / New Sale Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">New Sale — POS</h3>
              <button onClick={() => { setShowOrderModal(false); setOrderItems([]); }} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-2 gap-4">
              {/* Product Grid */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Select Products</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {products.filter(p => p.stock > 0).map(p => (
                    <button key={p.id} onClick={() => addToOrder(p)} className="w-full text-left p-3 border border-gray-100 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{fmt(p.price)} · Stock: {p.stock}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Cart */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Cart</p>
                <div className="space-y-2 min-h-[100px]">
                  {orderItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No items added</p>}
                  {orderItems.map(i => (
                    <div key={i.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div><p className="text-xs font-medium text-gray-900">{i.name}</p><p className="text-xs text-gray-500">x{i.qty} · {fmt(i.price * i.qty)}</p></div>
                      <button onClick={() => removeFromOrder(i.productId)} className="p-1 text-red-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between mb-3"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-lg text-green-700">{fmt(orderTotal)}</span></div>
                  <select value={orderMethod} onChange={e => setOrderMethod(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <button onClick={placeOrder} disabled={saving || orderItems.length === 0} className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer size={15} /> Complete & Print</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {printData && <ThermalReceipt data={printData} />}
    </div>
  );
}
