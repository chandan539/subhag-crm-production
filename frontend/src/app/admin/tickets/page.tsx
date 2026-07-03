'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Ticket, UserCircle2, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface TicketData {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  customer: {
    first_name: string;
    last_name?: string;
    phone: string;
  };
  warranty?: {
    serial_number: {
      serial_number: string;
      product: {
        sku: string;
        name: string;
      };
    };
  };
  engineer?: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  resolution_notes?: string;
}

interface Engineer {
  id: string;
  user: {
    first_name: string;
    last_name: string;
  };
  territory: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNASSIGNED' | 'IN_PROGRESS' | 'ESCALATED'>('ALL');
  const [search, setSearch] = useState('');

  // Assign modal
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [engineerId, setEngineerId] = useState('');

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'IN_PROGRESS',
    resolution_notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, engineersData] = await Promise.all([
        apiFetch('/tickets'),
        apiFetch('/engineers'),
      ]);
      setTickets(ticketsData);
      setEngineers(engineersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await apiFetch(`/tickets/${selectedTicket.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ engineer_id: engineerId }),
      });
      setShowAssignModal(false);
      setSelectedTicket(null);
      setEngineerId('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign engineer');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await apiFetch(`/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusForm),
      });
      setShowStatusModal(false);
      setSelectedTicket(null);
      setStatusForm({ status: 'IN_PROGRESS', resolution_notes: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    // Tab filter
    if (activeTab === 'UNASSIGNED' && t.engineer) return false;
    if (activeTab === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (activeTab === 'ESCALATED' && t.status !== 'ESCALATED') return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchNumber = t.ticket_number.toLowerCase().includes(q);
      const matchCustomer = `${t.customer.first_name} ${t.customer.last_name || ''}`.toLowerCase().includes(q);
      const matchIssue = t.issue_description.toLowerCase().includes(q);
      return matchNumber || matchCustomer || matchIssue;
    }

    return true;
  });

  const unassignedCount = tickets.filter(t => !t.engineer).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Tickets</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage and assign customer service requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`pb-4 text-sm font-bold cursor-pointer transition-colors ${
            activeTab === 'ALL' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Tickets
        </button>
        <button 
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`pb-4 text-sm font-bold cursor-pointer transition-colors flex items-center space-x-2 ${
            activeTab === 'UNASSIGNED' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Unassigned</span>
          {unassignedCount > 0 && (
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">
              {unassignedCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`pb-4 text-sm font-bold cursor-pointer transition-colors ${
            activeTab === 'IN_PROGRESS' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          In Progress
        </button>
        <button 
          onClick={() => setActiveTab('ESCALATED')}
          className={`pb-4 text-sm font-bold cursor-pointer transition-colors ${
            activeTab === 'ESCALATED' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Escalated
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Tickets</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by Ticket ID, Customer, or Issue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
            <button onClick={fetchData} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
              <RefreshCw size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket & Issue</th>
                  <th className="px-6 py-4 font-semibold">Customer / Product</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status / Assignee</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No service tickets found</td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{ticket.ticket_number}</div>
                        <div className="text-sm text-gray-750 mt-1 max-w-xs">{ticket.issue_description}</div>
                        <div className="text-xs text-gray-450 mt-1.5 flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{ticket.customer.first_name} {ticket.customer.last_name || ''}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{ticket.customer.phone}</div>
                        {ticket.warranty && (
                          <div className="text-xs text-primary font-mono mt-1">
                            {ticket.warranty.serial_number.product.name} ({ticket.warranty.serial_number.serial_number})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${
                            ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'OPEN' ? 'bg-gray-100 text-gray-700' :
                            ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'CLOSED' ? 'bg-zinc-150 text-zinc-800' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <UserCircle2 size={14} />
                            {ticket.engineer ? (
                              <span>Eng. {ticket.engineer.user.first_name} {ticket.engineer.user.last_name}</span>
                            ) : (
                              <span className="text-orange-600 font-medium italic">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setEngineerId(ticket.engineer?.id || '');
                              setShowAssignModal(true);
                            }}
                            className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                          >
                            Assign
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setStatusForm({ status: ticket.status, resolution_notes: ticket.resolution_notes || '' });
                              setShowStatusModal(true);
                            }}
                            className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors cursor-pointer"
                          >
                            Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Engineer Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Assign Engineer</h2>
            <p className="text-sm text-gray-500">Assign ticket **{selectedTicket.ticket_number}** to a field service technician.</p>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Engineer</label>
                <select 
                  required
                  value={engineerId}
                  onChange={(e) => setEngineerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="">-- Choose Engineer --</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.user.first_name} {eng.user.last_name} ({eng.territory})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTicket(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Update Ticket Status</h2>
            <p className="text-sm text-gray-500">Update ticket **{selectedTicket.ticket_number}** status and log service notes.</p>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Status</label>
                <select 
                  required
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution / Service Notes</label>
                <textarea 
                  value={statusForm.resolution_notes}
                  onChange={(e) => setStatusForm({ ...statusForm, resolution_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[100px]"
                  placeholder="Provide detailed logs of investigation, repairs, or customer updates..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedTicket(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
