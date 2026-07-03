'use client';

import React, { useEffect, useState } from 'react';
import { Package, ShieldCheck, Ticket, FileText, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';

interface DashboardStats {
  total_customers: number;
  active_warranties: number;
  open_tickets: number;
  active_amcs: number;
}

interface TicketData {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, ticketsData] = await Promise.all([
        apiFetch('/analytics/dashboard'),
        apiFetch('/tickets'),
      ]);
      setStats(statsData);
      setRecentTickets(ticketsData.slice(0, 5)); // Get top 5 recent tickets
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="animate-spin text-primary" size={36} />
        <p className="text-gray-500 font-medium">Loading dashboard overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700 max-w-2xl mx-auto mt-8">
        <h2 className="font-bold text-lg mb-2">Error Loading Dashboard</h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Customers', value: stats?.total_customers ?? 0, change: '+12%', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', up: true },
    { label: 'Active Warranties', value: stats?.active_warranties ?? 0, change: '+5%', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', up: true },
    { label: 'Open Tickets', value: stats?.open_tickets ?? 0, change: '-2%', icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50', up: false },
    { label: 'Active AMCs', value: stats?.active_amcs ?? 0, change: '+18%', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', up: true },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Real-time metrics for warranties and service operations.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${kpi.up ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{kpi.change}</span>
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{kpi.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Recent Service Tickets</h2>
            <Link href="/admin/tickets" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No service tickets found
                    </td>
                  </tr>
                ) : (
                  recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{ticket.ticket_number}</td>
                      <td className="px-6 py-4">{ticket.customer.first_name} {ticket.customer.last_name || ''}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                          ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            <p className="text-xs text-gray-500 mt-1">Common administrative tasks</p>
          </div>
          <div className="p-6 flex-1 space-y-4 flex flex-col justify-center">
            <Link 
              href="/admin/products"
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/95 transition-colors"
            >
              Add New Product
            </Link>
            <Link 
              href="/admin/warranties"
              className="w-full text-center py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Activate Warranty
            </Link>
            <Link 
              href="/admin/amc"
              className="w-full text-center py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              New AMC Contract
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
