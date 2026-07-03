'use client';

import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Clock, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/utils/api';

interface TicketData {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  resolution_notes?: string;
  warranty?: {
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
  serial_number: {
    serial_number: string;
    product: {
      name: string;
    };
  };
}

export default function PortalTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [warranties, setWarranties] = useState<WarrantyOption[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [warrantyId, setWarrantyId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const fetchTicketsData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, warrantiesData, customersData] = await Promise.all([
        apiFetch('/tickets'),
        apiFetch('/warranties'),
        apiFetch('/customers'),
      ]);

      // Client-side filtering by user's email
      const myTickets = ticketsData.filter((t: any) => t.customer && t.customer.email === user.email);
      const myWarranties = warrantiesData.filter((w: any) => w.customer && w.customer.email === user.email);
      const matchingCustomer = customersData.find((c: any) => c.email === user.email);

      setTickets(myTickets);
      setWarranties(myWarranties);
      if (matchingCustomer) {
        setCustomerId(matchingCustomer.id);
      } else if (myWarranties.length > 0) {
        setCustomerId(myWarranties[0].customer.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsData();
  }, [user]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Could not resolve your customer account. Please ensure you have a registered product.');
      return;
    }

    try {
      await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          warranty_id: warrantyId || undefined,
          issue_description: issueDescription,
          priority,
        }),
      });

      setShowModal(false);
      setWarrantyId('');
      setIssueDescription('');
      setPriority('MEDIUM');
      fetchTicketsData();
      alert('Support ticket raised successfully! Our team will contact you soon.');
    } catch (err: any) {
      alert(err.message || 'Failed to raise support ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Tickets</h1>
          <p className="text-gray-500 mt-1 font-medium font-sans">Track support requests, view resolution notes, and raise service tickets.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>File Support Request</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading your service history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Tickets</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchTicketsData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-650 rounded-full flex items-center justify-center mx-auto">
            <Ticket size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Support Tickets</h2>
          <p className="text-gray-500 font-medium font-sans">You haven't filed any service requests yet. If you have an issue with your registered appliance, raise a support ticket and our engineers will investigate.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors inline-block cursor-pointer text-sm"
          >
            File Support Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t.ticket_number}</h2>
                  <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1 font-medium">
                    <Clock size={12} />
                    <span>Opened: {new Date(t.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    ['RESOLVED', 'CLOSED'].includes(t.status) ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-700 font-medium border-l-2 border-gray-150 pl-3 leading-relaxed">
                {t.issue_description}
              </div>

              {t.warranty && (
                <div className="text-xs text-gray-500 font-medium flex items-center space-x-1">
                  <AlertCircle size={14} className="text-primary" />
                  <span>Product: **{t.warranty.serial_number.product.name}** (SN: {t.warranty.serial_number.serial_number})</span>
                </div>
              )}

              {t.resolution_notes && (
                <div className="bg-green-50/55 p-4 rounded-lg border border-green-100/50 space-y-2 mt-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-green-800">
                    <MessageSquare size={14} />
                    <span>Resolution Notes from Engineer</span>
                  </div>
                  <p className="text-xs text-green-800/90 leading-relaxed font-sans">{t.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">File Support Request</h2>
            <p className="text-sm text-gray-500">Provide details about the issue. Our technicians will review and assign an engineer.</p>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Select Affected Product</label>
                <select 
                  value={warrantyId}
                  onChange={(e) => setWarrantyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                >
                  <option value="">-- No Specific Product / General Query --</option>
                  {warranties.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.serial_number.product.name} (SN: {w.serial_number.serial_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Priority</label>
                <select 
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
                >
                  <option value="LOW">Low - General query, non-critical issue</option>
                  <option value="MEDIUM">Medium - Performance issue, not completely broken</option>
                  <option value="HIGH">High - Fully broken appliance, needs urgent repair</option>
                  <option value="CRITICAL">Critical - Hazardous issue (leakage, smoke, sparks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Describe the Issue</label>
                <textarea 
                  required
                  minLength={10}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[120px] font-medium"
                  placeholder="Provide details about what went wrong, error codes, and steps to reproduce..."
                />
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
