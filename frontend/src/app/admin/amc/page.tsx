'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, CheckCircle, Clock, RefreshCw, DollarSign, Calendar } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface AmcContract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  value: string | number;
  status: string;
  customer: {
    first_name: string;
    last_name?: string;
    phone: string;
  };
  warranty: {
    serial_number: {
      serial_number: string;
      product: {
        name: string;
      };
    };
  };
}

interface WarrantyOption {
  id: string;
  customer: {
    id: string;
    first_name: string;
    last_name?: string;
  };
  serial_number: {
    serial_number: string;
    product: {
      name: string;
    };
  };
}

export default function AdminAmcPage() {
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [warranties, setWarranties] = useState<WarrantyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    warranty_id: '',
    duration_months: '12',
    value: '',
    start_date: '',
  });

  const [renewForm, setRenewForm] = useState({
    duration_months: '12',
    value: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contractsData, warrantiesData] = await Promise.all([
        apiFetch('/amc'),
        apiFetch('/warranties'),
      ]);
      setContracts(contractsData);
      setWarranties(warrantiesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AMC data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find customer_id from selected warranty
      const selectedWarranty = warranties.find((w) => w.id === createForm.warranty_id);
      if (!selectedWarranty) {
        alert('Invalid warranty selected');
        return;
      }

      await apiFetch('/amc', {
        method: 'POST',
        body: JSON.stringify({
          warranty_id: createForm.warranty_id,
          customer_id: selectedWarranty.customer.id,
          duration_months: parseInt(createForm.duration_months),
          value: parseFloat(createForm.value),
          start_date: createForm.start_date || undefined,
        }),
      });

      setShowCreateModal(false);
      setCreateForm({ warranty_id: '', duration_months: '12', value: '', start_date: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create AMC Contract');
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractId) return;

    try {
      await apiFetch(`/amc/${activeContractId}/renew`, {
        method: 'POST',
        body: JSON.stringify({
          duration_months: parseInt(renewForm.duration_months),
          value: parseFloat(renewForm.value),
        }),
      });

      setShowRenewModal(false);
      setActiveContractId(null);
      setRenewForm({ duration_months: '12', value: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to renew AMC Contract');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AMC Contracts</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage Annual Maintenance Contracts (AMC), billing, and renewals.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>New AMC Contract</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading AMC contracts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading AMC</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Contract Info</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Equipment / Serial</th>
                  <th className="px-6 py-4 font-semibold text-right">Value</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No AMC contracts found</td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{contract.contract_number}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{new Date(contract.start_date).toLocaleDateString()} to {new Date(contract.end_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{contract.customer.first_name} {contract.customer.last_name || ''}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{contract.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{contract.warranty.serial_number.product.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">SN: {contract.warranty.serial_number.serial_number}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{typeof contract.value === 'number' ? contract.value.toFixed(2) : parseFloat(contract.value).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center justify-center space-x-1 w-fit mx-auto ${
                          contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          contract.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {contract.status === 'ACTIVE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{contract.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {contract.status !== 'EXPIRED' && (
                          <button 
                            onClick={() => {
                              setActiveContractId(contract.id);
                              setShowRenewModal(true);
                            }}
                            className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                          >
                            Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create AMC Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">New AMC Contract</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Active Warranty</label>
                <select 
                  required
                  value={createForm.warranty_id}
                  onChange={(e) => setCreateForm({ ...createForm, warranty_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="">-- Choose Active Warranty --</option>
                  {warranties.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.customer.first_name} {w.customer.last_name || ''} - {w.serial_number.product.name} ({w.serial_number.serial_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={createForm.duration_months}
                    onChange={(e) => setCreateForm({ ...createForm, duration_months: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={createForm.value}
                    onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="299.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                <input 
                  type="date" 
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew AMC Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Renew AMC Contract</h2>
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Duration</label>
                  <select
                    value={renewForm.duration_months}
                    onChange={(e) => setRenewForm({ ...renewForm, duration_months: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Value (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={renewForm.value}
                    onChange={(e) => setRenewForm({ ...renewForm, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="299.00"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setActiveContractId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Renew Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
