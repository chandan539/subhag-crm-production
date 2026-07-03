'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/utils/api';

interface Warranty {
  id: string;
  status: string;
  serial_number: {
    serial_number: string;
    product: {
      name: string;
    };
  };
  customer: {
    email?: string;
  };
  certificate?: {
    certificate_number: string;
  };
}

const handleDownloadPdf = async (certificateNumber: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/warranties/${certificateNumber}/pdf`, {
      method: 'GET',
    });
    
    if (!response.ok) throw new Error('Failed to download PDF');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SUBHAG_Warranty_${certificateNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download PDF');
  }
};

interface TicketData {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  created_at: string;
  customer: {
    email?: string;
  };
}

export default function PortalDashboard() {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortalData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [warrantiesData, ticketsData] = await Promise.all([
        apiFetch('/warranties'),
        apiFetch('/tickets'),
      ]);

      // Client-side filtering by user's email
      const myWarranties = warrantiesData.filter(
        (w: any) => w.customer && w.customer.email === user.email
      );
      const myTickets = ticketsData.filter(
        (t: any) => t.customer && t.customer.email === user.email
      );

      setWarranties(myWarranties);
      setTickets(myTickets);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [user]);

  const activeWarrantiesCount = warranties.filter(w => w.status === 'ACTIVE').length;
  const openTicketsCount = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'].includes(t.status)).length;
  const resolvedTicketsCount = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
        <h2 className="font-bold mb-2">Error Loading Dashboard</h2>
        <p className="mb-4">{error}</p>
        <button onClick={fetchPortalData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.first_name}</h1>
          <p className="text-gray-500 mt-2 font-medium">Here's an overview of your products and services.</p>
        </div>
        <button 
          onClick={fetchPortalData}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-primary rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Warranties</p>
            <p className="text-2xl font-bold text-gray-900">{activeWarrantiesCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Open Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{openTicketsCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved Issues</p>
            <p className="text-2xl font-bold text-gray-900">{resolvedTicketsCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Warranties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">My Products</h2>
            <Link href="/portal/warranties" className="text-sm text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {warranties.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-medium">
                No products registered yet.
              </div>
            ) : (
              warranties.slice(0, 3).map((wr) => (
                <div key={wr.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-150 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{wr.serial_number.product.name}</p>
                      <p className="text-sm text-gray-500">SN: {wr.serial_number.serial_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      wr.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-750'
                    }`}>
                      {wr.status}
                    </span>
                    {wr.certificate && wr.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDownloadPdf(wr.certificate!.certificate_number)}
                        className="text-xs text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Support Requests</h2>
            <Link href="/portal/tickets" className="text-sm text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-medium">
                No tickets raised yet.
              </div>
            ) : (
              tickets.slice(0, 3).map((ticket) => (
                <div key={ticket.id} className="p-4 border border-gray-50 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{ticket.ticket_number}</p>
                      <p className="text-sm text-gray-700 font-medium">{ticket.issue_description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      ['RESOLVED', 'CLOSED'].includes(ticket.status) ? 'bg-gray-100 text-gray-750' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Opened: {new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
