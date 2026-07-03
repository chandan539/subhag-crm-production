'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface Warranty {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  activation_channel: string;
  serial_number: {
    serial_number: string;
    product: {
      sku: string;
      name: string;
    };
  };
  customer: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone: string;
  };
}

export default function AdminWarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Activation modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    serial_number: '',
    customer: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address_line1: '',
      city: '',
      state: '',
      country: 'India',
    },
    channel: 'MANUAL' as 'MANUAL' | 'PORTAL' | 'QR',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/warranties');
      setWarranties(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch warranties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/warranties/activate', {
        method: 'POST',
        body: JSON.stringify({
          serial_number: form.serial_number,
          customer: {
            first_name: form.customer.first_name,
            last_name: form.customer.last_name || undefined,
            email: form.customer.email || undefined,
            phone: form.customer.phone,
            address_line1: form.customer.address_line1 || undefined,
            city: form.customer.city || undefined,
            state: form.customer.state || undefined,
            country: form.customer.country || undefined,
          },
          channel: form.channel,
        }),
      });
      setShowModal(false);
      setForm({
        serial_number: '',
        customer: {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address_line1: '',
          city: '',
          state: '',
          country: 'India',
        },
        channel: 'MANUAL',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to activate warranty');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Management</h1>
          <p className="text-gray-500 mt-1 font-medium">Review active warranties, expirations, and claim histories.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Manual Activation</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading warranties...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Warranties</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Product/Serial</th>
                  <th className="px-6 py-4 font-semibold">Start & End Dates</th>
                  <th className="px-6 py-4 font-semibold">Channel</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warranties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No active warranties found</td>
                  </tr>
                ) : (
                  warranties.map((wr) => (
                    <tr key={wr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{wr.customer.first_name} {wr.customer.last_name || ''}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{wr.customer.phone}</div>
                        {wr.customer.email && <div className="text-xs text-gray-400">{wr.customer.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{wr.serial_number.product.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">SN: {wr.serial_number.serial_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">
                          {new Date(wr.start_date).toLocaleDateString()} to {new Date(wr.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded text-gray-650">{wr.activation_channel}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center justify-center space-x-1 w-fit mx-auto ${
                          wr.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {wr.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{wr.status}</span>
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

      {/* Manual Activation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">Activate Warranty Manually</h2>
            <form onSubmit={handleActivateSubmit} className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Product Details</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number (Exact match required)</label>
                  <input 
                    type="text" 
                    required
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                    placeholder="e.g. WM-24-X89211"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={form.customer.first_name}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, first_name: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={form.customer.last_name}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, last_name: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={form.customer.phone}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, phone: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={form.customer.email}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, email: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input 
                    type="text" 
                    value={form.customer.address_line1}
                    onChange={(e) => setForm({ 
                      ...form, 
                      customer: { ...form.customer, address_line1: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={form.customer.city}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, city: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input 
                      type="text" 
                      value={form.customer.state}
                      onChange={(e) => setForm({ 
                        ...form, 
                        customer: { ...form.customer, state: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Activate Warranty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
