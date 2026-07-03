'use client';

import Link from "next/link";
import { Shield, Home, Ticket, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-primary text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-primary-container">
          <h2 className="text-2xl font-bold tracking-tight">SUBHAG</h2>
          <p className="text-sm text-blue-200 mt-1">Customer Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/portal" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-container transition-colors">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/portal/warranties" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-container transition-colors">
            <Shield size={20} />
            <span>My Warranties</span>
          </Link>
          <Link href="/portal/tickets" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-container transition-colors">
            <Ticket size={20} />
            <span>Service Tickets</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-primary-container">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-primary-container transition-colors text-left cursor-pointer"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">SUBHAG</h1>
          <button className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
