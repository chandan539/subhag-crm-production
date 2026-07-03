'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, ArrowRight, Activity, Cpu, Laptop, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans overflow-x-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/15 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-slate-900 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">SUBHAG</span>
            <span className="text-xs block text-slate-400 font-bold uppercase tracking-widest mt-[-2px]">Warranty CRM</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/portal/login"
            className="text-sm font-semibold text-slate-350 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/portal/login" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/15 transition-all hover:translate-y-[-1px] cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 flex-1 flex flex-col justify-center items-center relative z-10 text-center space-y-12">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Star size={12} className="fill-current" />
            <span>Next-Gen Enterprise Warranty Infrastructure</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Automated Warranty & Service Operations
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            SUBHAG Warranty Management CRM streamlines product registrations, digital certificates, engineer scheduling, and AMC contracts.
          </p>
        </div>

        {/* Portals Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl pt-4">
          {/* Customer Portal */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/85 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all hover:translate-y-[-4px] text-left group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center">
                <Laptop size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white">Customer Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Register new purchases, track active warranty validity, verify digital certificates, and submit instant repair service tickets.
              </p>
            </div>
            <Link 
              href="/portal/login"
              className="mt-8 flex items-center space-x-2 text-blue-400 font-bold hover:text-blue-300 transition-colors group-hover:translate-x-1 cursor-pointer"
            >
              <span>Access Customer Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Admin / Agent Portal */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/85 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all hover:translate-y-[-4px] text-left group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-900/30 text-purple-400 flex items-center justify-center">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white">Staff & Admin Operations</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Run CRM operations, toggle catalog items, generate serial batch keys, schedule technicians, track SLA logs, and view performance analytics.
              </p>
            </div>
            <Link 
              href="/portal/login"
              className="mt-8 flex items-center space-x-2 text-purple-400 font-bold hover:text-purple-300 transition-colors group-hover:translate-x-1 cursor-pointer"
            >
              <span>Access Operations Control</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-4xl w-full pt-10 text-xs uppercase tracking-widest font-black text-slate-500">
          <div className="flex flex-col items-center p-4 bg-slate-900/20 border border-slate-900 rounded-xl">
            <Cpu className="text-blue-500 mb-2" size={20} />
            <span>Prisma 6 Core</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-slate-900/20 border border-slate-900 rounded-xl">
            <Activity className="text-purple-500 mb-2" size={20} />
            <span>SLA Monitoring</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col items-center p-4 bg-slate-900/20 border border-slate-900 rounded-xl">
            <ShieldCheck className="text-emerald-500 mb-2" size={20} />
            <span>Digital Certs</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-600 font-medium relative z-10">
        <p>© {new Date().getFullYear()} SUBHAG Ind. LLC. All rights reserved. Powered by Next.js & Coolify.</p>
      </footer>
    </div>
  );
}
