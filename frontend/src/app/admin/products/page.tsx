'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Package, Edit, Trash2, RefreshCw, Printer, Type } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  base_warranty_months: number;
  price: string | number;
  status: 'ACTIVE' | 'DISCONTINUED';
}

interface SerialNumber {
  id: string;
  serial_number: string;
  batch_number?: string;
  manufacturing_date?: string;
  status: string;
  product: {
    sku: string;
    name: string;
  };
}

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'serials'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  // Form States
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Washing Machines',
    price: '',
    base_warranty_months: '12',
  });

  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialForm, setSerialForm] = useState({
    product_id: '',
    quantity: '10',
    batch_number: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);

  const [showManualSerialModal, setShowManualSerialModal] = useState(false);
  const [manualSerialForm, setManualSerialForm] = useState({
    product_id: '',
    serial_numbers: '',
    batch_number: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'products') {
        const data = await apiFetch('/products');
        setProducts(data);
      } else {
        const [serialsData, productsData] = await Promise.all([
          apiFetch('/serials'),
          apiFetch('/products'),
        ]);
        setSerials(serialsData);
        setProducts(productsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          base_warranty_months: parseInt(productForm.base_warranty_months),
        }),
      });
      setShowProductModal(false);
      setProductForm({
        sku: '',
        name: '',
        description: '',
        category: 'Washing Machines',
        price: '',
        base_warranty_months: '12',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await apiFetch(`/products/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          sku: editForm.sku,
          name: editForm.name,
          description: editForm.description,
          category: editForm.category,
          price: parseFloat(editForm.price as string),
          base_warranty_months: parseInt(editForm.base_warranty_months as any),
        }),
      });
      setShowEditModal(false);
      setEditForm(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    }
  };

  const handleSerialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/serials/generate', {
        method: 'POST',
        body: JSON.stringify({
          product_id: serialForm.product_id,
          quantity: parseInt(serialForm.quantity),
          batch_number: serialForm.batch_number || undefined,
        }),
      });
      setShowSerialModal(false);
      setSerialForm({
        product_id: '',
        quantity: '10',
        batch_number: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate serial numbers');
    }
  };

  const handleManualSerialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serialsList = manualSerialForm.serial_numbers.split(',').map(s => s.trim()).filter(Boolean);
      if (serialsList.length === 0) {
        alert('Please enter at least one serial number');
        return;
      }

      await apiFetch('/serials/manual', {
        method: 'POST',
        body: JSON.stringify({
          product_id: manualSerialForm.product_id,
          serial_numbers: serialsList,
          batch_number: manualSerialForm.batch_number || undefined,
        }),
      });
      setShowManualSerialModal(false);
      setManualSerialForm({
        product_id: '',
        serial_numbers: '',
        batch_number: '',
      });
      fetchData();
      alert('Manual serial numbers added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add manual serial numbers');
    }
  };

  const toggleSerialSelection = (id: string) => {
    setSelectedSerials(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const printSelectedBarcodes = () => {
    if (selectedSerials.length === 0) {
      alert('Please select at least one serial number to print.');
      return;
    }
    const selectedSerialTexts = serials.filter(s => selectedSerials.includes(s.id)).map(s => s.serial_number);
    const query = new URLSearchParams({ serials: selectedSerialTexts.join(',') });
    window.open(`/admin/products/print?${query.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Inventory</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage product catalog, SKUs, and warranty configurations.</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'products' ? (
            <button 
              onClick={() => setShowProductModal(true)}
              className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          ) : (
            <>
              {selectedSerials.length > 0 && (
                <button 
                  onClick={printSelectedBarcodes}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-900 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer size={18} />
                  <span>Print Selected ({selectedSerials.length})</span>
                </button>
              )}
              <button 
                onClick={() => setShowManualSerialModal(true)}
                className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Type size={18} />
                <span>Manual Entry</span>
              </button>
              <button 
                onClick={() => setShowSerialModal(true)}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={18} />
                <span>Generate Serials</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-4 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab('serials')}
          className={`pb-4 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'serials' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Serial Numbers
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Data</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-750 transition-colors">Retry</button>
        </div>
      ) : activeTab === 'products' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">SKU / Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-center">Warranty</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No products found</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-primary rounded-lg hidden sm:block">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">{product.base_warranty_months} Mos</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setEditForm(product);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-4 font-semibold w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedSerials(e.target.checked ? serials.map(s => s.id) : [])}
                      checked={selectedSerials.length === serials.length && serials.length > 0}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Serial Number</th>
                  <th className="px-6 py-4 font-semibold">Product SKU</th>
                  <th className="px-6 py-4 font-semibold">Batch</th>
                  <th className="px-6 py-4 font-semibold">Manufacturing Date</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No serial numbers found</td>
                  </tr>
                ) : (
                  serials.map((serial) => (
                    <tr key={serial.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedSerials.includes(serial.id)}
                          onChange={() => toggleSerialSelection(serial.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 font-mono">{serial.serial_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{serial.product.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{serial.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{serial.batch_number || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {serial.manufacturing_date ? new Date(serial.manufacturing_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          serial.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                          serial.status === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {serial.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Unique ID)</label>
                <input 
                  type="text" 
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="e.g. WM-24X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="e.g. Professional Washer X1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Optional product description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="1299.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Months)</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.base_warranty_months}
                    onChange={(e) => setProductForm({ ...productForm, base_warranty_months: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="12"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Unique ID)</label>
                <input 
                  type="text" 
                  required
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Months)</label>
                  <input 
                    type="number" 
                    required
                    value={editForm.base_warranty_months}
                    onChange={(e) => setEditForm({ ...editForm, base_warranty_months: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Serial Generation Modal */}
      {showSerialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Generate Serial Numbers</h2>
            <form onSubmit={handleSerialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                <select 
                  required
                  value={serialForm.product_id}
                  onChange={(e) => setAddSerialProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={serialForm.quantity}
                    onChange={(e) => setSerialForm({ ...serialForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input 
                    type="text" 
                    value={serialForm.batch_number}
                    onChange={(e) => setSerialForm({ ...serialForm, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="e.g. BATCH-01"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowSerialModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Serial Entry Modal */}
      {showManualSerialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add Manual Serial Numbers</h2>
            <form onSubmit={handleManualSerialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                <select 
                  required
                  value={manualSerialForm.product_id}
                  onChange={(e) => setManualSerialForm({ ...manualSerialForm, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Numbers (Comma Separated)</label>
                <textarea 
                  required
                  value={manualSerialForm.serial_numbers}
                  onChange={(e) => setManualSerialForm({ ...manualSerialForm, serial_numbers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[100px]"
                  placeholder="e.g. SN-OLD-1234, SN-OLD-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number (Optional)</label>
                <input 
                  type="text" 
                  value={manualSerialForm.batch_number}
                  onChange={(e) => setManualSerialForm({ ...manualSerialForm, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="e.g. LEGACY-01"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowManualSerialModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Add Serials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function setAddSerialProduct(val: string) {
    setSerialForm({ ...serialForm, product_id: val });
  }
}
