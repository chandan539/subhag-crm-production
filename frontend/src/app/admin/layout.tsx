'use client';

import Link from "next/link";
import { LayoutDashboard, Users, Package, BarChart3, ShieldCheck, Settings, LogOut, Ticket, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, logout } = useAuth();
  
  const initials = user 
    ? `${user.first_name[0] || ''}${user.last_name[0] || ''}`.toUpperCase() 
    : 'AD';
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 text-gray-300 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight text-white">SUBHAG</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800 text-white transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/products" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <Package size={20} />
            <span>Products & Serials</span>
          </Link>
          <Link href="/admin/warranties" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <ShieldCheck size={20} />
            <span>Warranties</span>
          </Link>
          <Link href="/admin/amc" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <FileText size={20} />
            <span>AMC Contracts</span>
          </Link>
          <Link href="/admin/tickets" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <Ticket size={20} />
            <span>Service Tickets</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <Users size={20} />
            <span>Customers & Staff</span>
          </Link>
          <Link href="/admin/analytics" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <BarChart3 size={20} />
            <span>Analytics & Reports</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/admin/settings" className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-800 hover:text-white transition-colors text-left mb-2">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-800 hover:text-white transition-colors text-left text-red-400"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <div className="md:hidden flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">SUBHAG Admin</h1>
          </div>
          <div className="hidden md:block">
            {/* Breadcrumbs or Context Title could go here */}
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
