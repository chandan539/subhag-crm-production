'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, PieChart, RefreshCw, Award, Activity, CheckSquare, Settings } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface DashboardStats {
  total_customers: number;
  active_warranties: number;
  open_tickets: number;
  active_amcs: number;
}

interface ProductWarranties {
  serial_number_id: string;
  _count: number;
}

interface TicketStatusData {
  status: string;
  _count: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [warrantiesByProduct, setWarrantiesByProduct] = useState<ProductWarranties[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<TicketStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, warrantiesData, ticketsData] = await Promise.all([
        apiFetch('/analytics/dashboard'),
        apiFetch('/analytics/warranties-by-product'),
        apiFetch('/analytics/tickets-by-status'),
      ]);
      setStats(statsData);
      setWarrantiesByProduct(warrantiesData);
      setTicketsByStatus(ticketsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1 font-medium font-sans">Enterprise failure analysis, SLAs, and warranty distribution.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Computing analytics aggregates...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Analytics</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Aggregates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.total_customers}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Warranties</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.active_warranties}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <CheckSquare size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.open_tickets}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Settings size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active AMCs</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.active_amcs}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ticket status breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                <PieChart size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Service Ticket Status Distribution</h2>
              </div>
              
              <div className="space-y-4">
                {ticketsByStatus.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No service tickets recorded yet.</p>
                ) : (
                  ticketsByStatus.map((t, idx) => {
                    const total = ticketsByStatus.reduce((acc, curr) => acc + curr._count, 0);
                    const percentage = total > 0 ? ((t._count / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-gray-700">
                          <span>{t.status.replace('_', ' ')}</span>
                          <span>{t._count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              t.status === 'OPEN' ? 'bg-blue-500' :
                              t.status === 'ASSIGNED' ? 'bg-indigo-500' :
                              t.status === 'IN_PROGRESS' ? 'bg-orange-500' :
                              t.status === 'RESOLVED' ? 'bg-green-500' :
                              t.status === 'CLOSED' ? 'bg-zinc-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Product failure breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                <BarChart3 size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Warranty Distribution</h2>
              </div>

              <div className="space-y-4">
                {warrantiesByProduct.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No active warranties registered yet.</p>
                ) : (
                  warrantiesByProduct.map((wp, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Product Unit Allocation {idx + 1}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {wp.serial_number_id.slice(0, 8)}...</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{wp._count} Warranties</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
