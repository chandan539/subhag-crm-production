'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, User, RefreshCw, Mail, Phone, Calendar, ShieldAlert, Download, UploadCloud, Edit2 } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface Customer {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  address_line1?: string;
  city?: string;
  state?: string;
  created_at: string;
  _count: {
    warranties: number;
    service_tickets: number;
    amc_contracts: number;
  };
}

interface StaffUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPORT' | 'ENGINEERS'>('CUSTOMERS');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'SUPPORT' as 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'ENGINEER',
  });

  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'SUPPORT',
    status: 'ACTIVE',
  });

  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersData, staffData] = await Promise.all([
        apiFetch('/customers'),
        apiFetch('/auth/users')
      ]);
      setCustomers(customersData);
      setStaff(staffData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      setShowStaffModal(false);
      setStaffForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'SUPPORT',
      });
      alert('Account registered successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to register account');
    }
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffId) return;
    try {
      await apiFetch(`/auth/users/${editingStaffId}`, {
        method: 'PUT',
        body: JSON.stringify(editStaffForm),
      });
      setShowEditStaffModal(false);
      alert('Staff details updated successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update staff');
    }
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerId) return;
    try {
      await apiFetch(`/customers/${editingCustomerId}`, {
        method: 'PUT',
        body: JSON.stringify(editCustomerForm),
      });
      setShowEditCustomerModal(false);
      alert('Customer details updated successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    }
  };

  const openEditStaff = (staffMember: StaffUser) => {
    setEditingStaffId(staffMember.id);
    setEditStaffForm({
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      phone: staffMember.phone || '',
      role: staffMember.role,
      status: staffMember.status,
    });
    setShowEditStaffModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditCustomerForm({
      first_name: customer.first_name,
      last_name: customer.last_name || '',
      phone: customer.phone,
      address_line1: customer.address_line1 || '',
      city: customer.city || '',
      state: customer.state || '',
    });
    setShowEditCustomerModal(true);
  };

  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Warranties', 'Tickets', 'AMCs', 'Joined At'];
    const csvContent = [
      headers.join(','),
      ...customers.map(c => [
        c.id,
        `"${c.first_name || ''}"`,
        `"${c.last_name || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.address_line1 || ''}"`,
        `"${c.city || ''}"`,
        `"${c.state || ''}"`,
        c._count.warranties,
        c._count.service_tickets,
        c._count.amc_contracts,
        `"${new Date(c.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const supportTeam = staff.filter(s => ['ADMIN', 'MANAGER', 'SUPPORT'].includes(s.role));
  const engineersTeam = staff.filter(s => s.role === 'ENGINEER');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers & Staff</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage customer list, CRM database, and staff accounts.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Download size={18} />
            <span>Download CSV</span>
          </button>

          <button 
            onClick={() => setShowStaffModal(true)}
            className="flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'CUSTOMERS'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'SUPPORT'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Support Team ({supportTeam.length})
          </button>
          <button
            onClick={() => setActiveTab('ENGINEERS')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ENGINEERS'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Service Engineers ({engineersTeam.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Data</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-750 transition-colors">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'CUSTOMERS' && (
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Customer Details</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Address</th>
                    <th className="px-6 py-4 font-semibold text-center">Warranties</th>
                    <th className="px-6 py-4 font-semibold text-center">Tickets</th>
                    <th className="px-6 py-4 font-semibold text-center">AMCs</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No customers found</td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-50 rounded-full text-gray-600">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{c.first_name} {c.last_name || ''}</p>
                              <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>Joined {new Date(c.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 text-xs font-semibold flex items-center space-x-1">
                            <Phone size={12} className="text-gray-450" />
                            <span>{c.phone}</span>
                          </div>
                          {c.email && (
                            <div className="text-gray-550 text-xs mt-1 flex items-center space-x-1">
                              <Mail size={12} className="text-gray-405" />
                              <span>{c.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {c.address_line1 ? (
                            <>
                              <div>{c.address_line1}</div>
                              <div className="text-gray-400 mt-0.5">{c.city}, {c.state}</div>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">No address provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-900">{c._count.warranties}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            c._count.service_tickets > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {c._count.service_tickets}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-900">{c._count.amc_contracts}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditCustomer(c)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {(activeTab === 'SUPPORT' || activeTab === 'ENGINEERS') && (
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(activeTab === 'SUPPORT' ? supportTeam : engineersTeam).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No members found</td>
                    </tr>
                  ) : (
                    (activeTab === 'SUPPORT' ? supportTeam : engineersTeam).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{s.first_name} {s.last_name}</p>
                              <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>Joined {new Date(s.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 text-xs font-semibold flex items-center space-x-1">
                            <Mail size={12} className="text-gray-405" />
                            <span>{s.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{s.role}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditStaff(s)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Staff"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add Account</h2>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={staffForm.first_name}
                    onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={staffForm.last_name}
                    onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="name@subhag.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e: any) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="SUPPORT">Support Agent</option>
                  <option value="MANAGER">Operations Manager</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="ENGINEER">Service Engineer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Staff Member</h2>
            <form onSubmit={handleEditStaffSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={editStaffForm.first_name}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={editStaffForm.last_name}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editStaffForm.phone}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="+91..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editStaffForm.role}
                    onChange={(e: any) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="SUPPORT">Support Agent</option>
                    <option value="MANAGER">Operations Manager</option>
                    <option value="ADMIN">System Admin</option>
                    <option value="ENGINEER">Service Engineer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editStaffForm.status}
                    onChange={(e: any) => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Customer</h2>
            <form onSubmit={handleEditCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={editCustomerForm.first_name}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={editCustomerForm.last_name}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={editCustomerForm.address_line1}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text" 
                    value={editCustomerForm.city}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input 
                    type="text" 
                    value={editCustomerForm.state}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
