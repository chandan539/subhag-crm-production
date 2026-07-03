'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Shield, Bell, Database, Save, Building, Users, RefreshCw, CheckCircle, Mail, MessageSquare, Clock, CreditCard, X, Link, Unlink } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface NotificationLog {
  id: string;
  channel: string;
  type: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'logs' | 'payments'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Razorpay App-like Modal State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [tempRazorpayKeyId, setTempRazorpayKeyId] = useState('');
  const [tempRazorpayKeySecret, setTempRazorpayKeySecret] = useState('');

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    companyName: 'SUBHAG Warranty CRM',
    supportEmail: 'support@subhag.in',
    gracePeriod: '15',
    currency: 'INR',
    slaCritical: '4',
    slaHigh: '12',
    slaMediumLow: '48',
    emailEnabled: 'true',
    whatsappEnabled: 'true',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: '587',
    smtpUser: 'apikey',
    smtpPass: 'SG.mock_pass_key_123456789',
    brevoApiKey: 'your_brevo_api_key_here',
    cheerioApiKey: 'your_cheerio_api_key_here',
    cheerioWarrantyWorkflowId: '',
    cheerioTicketCreateWorkflowId: '',
    cheerioTicketUpdateWorkflowId: '',
    googleSheetWebhook: '',
    razorpayEnabled: 'false',
    razorpayAccessToken: '',
    razorpayAccountId: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
  });

  // Notification logs state
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const settingsData = await apiFetch('/settings');
      if (settingsData && Object.keys(settingsData).length > 0) {
        setSettings((prev) => ({ ...prev, ...settingsData }));
      }

      // Fetch logs
      const logsData = await apiFetch('/notifications');
      setLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      alert('Configuration saved successfully and synced with the database!');
      fetchSettingsAndLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CRM System Settings</h1>
        <p className="text-gray-500 mt-2 font-medium font-sans">Configure global warranty policies, SLA parameters, and message dispatch integrations.</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Fetching system configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Menu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left ${
                activeTab === 'general' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings size={18} />
              <span>General Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left ${
                activeTab === 'notifications' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bell size={18} />
              <span>Notification Channels</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left ${
                activeTab === 'logs' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Clock size={18} />
              <span>Notification Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left ${
                activeTab === 'payments' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CreditCard size={18} />
              <span>Payment Gateways</span>
            </button>
            <div className="border-t border-gray-100 my-2 pt-2 space-y-1 opacity-50">
              <button disabled className="w-full flex items-center space-x-3 p-3 text-gray-400 text-sm font-semibold text-left cursor-not-allowed">
                <Shield size={18} />
                <span>Security & Access (Enterprise Only)</span>
              </button>
              <button disabled className="w-full flex items-center space-x-3 p-3 text-gray-400 text-sm font-semibold text-left cursor-not-allowed">
                <Database size={18} />
                <span>Database & Backups (S3 Config)</span>
              </button>
            </div>
          </div>

          {/* Configuration Forms */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="divide-y divide-gray-100">
                <div className="p-6 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900">General Settings</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure parameters for warranty periods, support email, and SLA targets.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                      <input 
                        type="text" 
                        required
                        value={settings.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Support Email</label>
                      <input 
                        type="email" 
                        required
                        value={settings.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grace Period (Days)</label>
                      <input 
                        type="number" 
                        required
                        value={settings.gracePeriod}
                        onChange={(e) => handleChange('gracePeriod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
                      <select 
                        value={settings.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">SLA Parameters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Critical Priority (Hrs)</label>
                        <input 
                          type="number" 
                          required
                          value={settings.slaCritical}
                          onChange={(e) => handleChange('slaCritical', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">High Priority (Hrs)</label>
                        <input 
                          type="number" 
                          required
                          value={settings.slaHigh}
                          onChange={(e) => handleChange('slaHigh', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Medium/Low (Hrs)</label>
                        <input 
                          type="number" 
                          required
                          value={settings.slaMediumLow}
                          onChange={(e) => handleChange('slaMediumLow', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Export Settings</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Sheets Webhook URL</label>
                        <input 
                          type="url" 
                          value={settings.googleSheetWebhook || ''}
                          onChange={(e) => handleChange('googleSheetWebhook', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                          placeholder="https://script.google.com/macros/s/.../exec"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end p-6 bg-gray-50/50">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer text-sm"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <form onSubmit={handleSave} className="divide-y divide-gray-100">
                <div className="p-6 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900">Notification Channels</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure automated Email and WhatsApp alerts triggered on warranty activations and service ticket actions.</p>
                </div>

                <div className="p-6 space-y-8">
                  {/* Email Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-950">Email Dispatch System</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Automated confirmation emails for customer events.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.emailEnabled === 'true'}
                          onChange={(e) => handleChange('emailEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    {settings.emailEnabled === 'true' && (
                      <div className="grid grid-cols-1 gap-4 pl-12 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wide mb-1">Brevo API Key (For .env)</label>
                          <input 
                            type="password" 
                            value={settings.brevoApiKey}
                            onChange={(e) => handleChange('brevoApiKey', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            placeholder="Enter Brevo API Key"
                          />
                        </div>
                        <p className="text-xs text-gray-400">Note: The system currently reads `BREVO_API_KEY` from the backend environment. Storing it here will sync it with the database for future configuration updates.</p>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Settings */}
                  <div className="space-y-4 pt-4 border-t border-gray-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-950">WhatsApp Confirmation API</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Send transaction messages directly to customer phone numbers.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.whatsappEnabled === 'true'}
                          onChange={(e) => handleChange('whatsappEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    {settings.whatsappEnabled === 'true' && (
                      <div className="grid grid-cols-1 gap-4 pl-12 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wide mb-1">Cheerio API Key (For .env)</label>
                          <input 
                            type="password" 
                            value={settings.cheerioApiKey}
                            onChange={(e) => handleChange('cheerioApiKey', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            placeholder="Enter Cheerio API Key"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wide mb-1">Warranty Activation Workflow ID</label>
                          <input 
                            type="text" 
                            value={settings.cheerioWarrantyWorkflowId || ''}
                            onChange={(e) => handleChange('cheerioWarrantyWorkflowId', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            placeholder="e.g. 673cb434..."
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Template must accept variables: <code>productName, serialNumber, activationLink, certificateDownloadLink</code>. Get ID from Cheerio Dashboard -&gt; Workflows.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wide mb-1">Ticket Creation Workflow ID</label>
                          <input 
                            type="text" 
                            value={settings.cheerioTicketCreateWorkflowId || ''}
                            onChange={(e) => handleChange('cheerioTicketCreateWorkflowId', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            placeholder="e.g. 673cb434..."
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Template must accept variables: <code>ticketNumber, issueDescription</code>.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wide mb-1">Ticket Update Workflow ID</label>
                          <input 
                            type="text" 
                            value={settings.cheerioTicketUpdateWorkflowId || ''}
                            onChange={(e) => handleChange('cheerioTicketUpdateWorkflowId', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            placeholder="e.g. 673cb434..."
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Template must accept variables: <code>ticketNumber, statusLabel</code>.</p>
                        </div>
                        <p className="text-xs text-gray-400">Note: The system currently reads `CHEERIO_API_KEY` from the backend environment. Storing it here will sync it with the database for future configuration updates.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end p-6 bg-gray-50/50">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer text-sm"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Configurations'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'payments' && (
              <form onSubmit={handleSave} className="divide-y divide-gray-100">
                <div className="p-6 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900">Payment Gateways</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure payment gateways like Razorpay for AMC purchases and product upgrades.</p>
                </div>

                <div className="p-6 space-y-8">
                  {/* Razorpay Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-950">Razorpay Integration</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Enable direct payment collections using Razorpay.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.razorpayEnabled === 'true'}
                          onChange={(e) => handleChange('razorpayEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    {settings.razorpayAccessToken ? (
                      <div className="pl-12 pt-2 flex flex-col space-y-3">
                        <div className="bg-green-50/50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-green-900">Connected to Razorpay via OAuth</p>
                              <p className="text-[10px] text-green-700">Account ID: {settings.razorpayAccountId || 'Linked'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleChange('razorpayAccessToken', '');
                              handleChange('razorpayAccountId', '');
                              handleChange('razorpayEnabled', 'false');
                            }}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Unlink size={12} />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    ) : settings.razorpayKeyId ? (
                      <div className="pl-12 pt-2 flex flex-col space-y-3">
                        <div className="bg-green-50/50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-green-900">Connected to Razorpay via Manual Keys</p>
                              <p className="text-[10px] text-green-700">Using Key ID: {settings.razorpayKeyId}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleChange('razorpayKeyId', '');
                              handleChange('razorpayKeySecret', '');
                              handleChange('razorpayEnabled', 'false');
                            }}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Unlink size={12} />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-12 pt-2 space-y-4">
                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            onClick={() => {
                              const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');
                              window.location.href = `${baseUrl}/api/razorpay/authorize`;
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
                          >
                            <Link size={14} />
                            <span>Connect via OAuth</span>
                          </button>
                          
                          <span className="text-xs text-gray-400 font-semibold">OR</span>
                          
                          <button
                            type="button"
                            onClick={() => setShowRazorpayModal(true)}
                            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
                          >
                            <CreditCard size={14} />
                            <span>Enter Keys Manually</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400">Choose OAuth if you are a registered Razorpay Partner, otherwise enter your API keys manually.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end p-6 bg-gray-50/50">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer text-sm"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Configurations'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'logs' && (
              <div className="divide-y divide-gray-100">
                <div className="p-6 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Notification Log Audits</h2>
                    <p className="text-xs text-gray-500 mt-1">Trace real-time email and WhatsApp confirmation alerts dispatched to customer devices.</p>
                  </div>
                  <button 
                    onClick={fetchSettingsAndLogs}
                    className="flex items-center space-x-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3.5 py-2 rounded-lg transition-colors border border-primary/10 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Refresh Log</span>
                  </button>
                </div>

                <div className="p-0 overflow-x-auto">
                  {logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 space-y-2">
                      <Bell size={32} className="mx-auto text-gray-300" />
                      <p className="font-bold text-sm">No Notifications Dispatched Yet</p>
                      <p className="text-xs font-medium font-sans">Register a warranty or open a support ticket to trigger alerts.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-450 uppercase font-bold border-b border-gray-150 select-none">
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Alert Type</th>
                          <th className="py-3 px-4">Recipient Info</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 font-medium">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold flex items-center space-x-1.5 mt-0.5">
                              {log.channel === 'EMAIL' ? (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Email</span>
                              ) : (
                                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">WhatsApp</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-900 font-bold">{log.type.replace('_', ' ')}</td>
                            <td className="py-3.5 px-4 text-gray-500 font-mono">{log.title}</td>
                            <td className="py-3.5 px-4">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 w-fit">
                                <CheckCircle size={10} />
                                <span>{log.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                            <td className="py-3.5 px-4 text-center">
                              <button 
                                onClick={() => setSelectedLog(log)}
                                className="text-primary hover:underline font-bold cursor-pointer"
                              >
                                View Msg
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Content Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-black text-gray-900">Message Content Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                <span>CHANNEL: {selectedLog.channel}</span>
                <span>STATUS: {selectedLog.status}</span>
              </div>
              <p className="text-xs text-gray-750 font-bold leading-relaxed whitespace-pre-wrap font-sans">{selectedLog.content}</p>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Razorpay App-like Integration Modal */}
      {showRazorpayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-[#02042b] p-6 relative">
              <button 
                onClick={() => setShowRazorpayModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="flex items-center space-x-3 text-white">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-inner">
                  <CreditCard size={24} className="text-[#3395ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide">Connect Razorpay</h3>
                  <p className="text-xs text-blue-200">Secure Payment Gateway</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-xs text-gray-600 font-medium">
                To connect your Razorpay account manually, you need to provide your API keys. You can generate these from your Razorpay Dashboard under Settings &gt; API Keys.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Key ID</label>
                  <input 
                    type="text" 
                    value={tempRazorpayKeyId}
                    onChange={(e) => setTempRazorpayKeyId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="rzp_live_xxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Key Secret</label>
                  <input 
                    type="password" 
                    value={tempRazorpayKeySecret}
                    onChange={(e) => setTempRazorpayKeySecret(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••••••••••••••••••"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button 
                onClick={() => setShowRazorpayModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleChange('razorpayKeyId', tempRazorpayKeyId);
                  handleChange('razorpayKeySecret', tempRazorpayKeySecret);
                  handleChange('razorpayEnabled', 'true');
                  setShowRazorpayModal(false);
                }}
                disabled={!tempRazorpayKeyId || !tempRazorpayKeySecret}
                className="px-6 py-2.5 bg-[#3395ff] text-white text-sm font-bold rounded-lg shadow hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Link size={16} />
                <span>Connect via Keys</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
