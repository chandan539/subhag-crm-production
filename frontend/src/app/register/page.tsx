'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/utils/api';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PublicWarrantyRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [serialNumber, setSerialNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [authorizedDealer, setAuthorizedDealer] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [country, setCountry] = useState('India');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check for bots
    const form = e.target as HTMLFormElement;
    const honeypot = (form.elements.namedItem('website') as HTMLInputElement)?.value;
    if (honeypot) {
      // Silently fail for bots
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch('/warranties/activate', {
        method: 'POST',
        body: JSON.stringify({
          serial_number: serialNumber,
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            address_line1: addressLine1 || undefined,
            city: city || undefined,
            state: state || undefined,
            zip_code: pinCode || undefined,
            country: country || undefined,
          },
          channel: 'PORTAL',
          installation_date: installationDate || undefined,
          invoice_date: invoiceDate || undefined,
          invoice_number: invoiceNumber || undefined,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register product. Please check the serial number.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Warranty Activated!</h2>
            <p className="text-sm text-gray-500">
              Your product has been successfully registered. We have sent a confirmation email to <strong>{email}</strong> along with a link to activate your customer portal account.
            </p>
            <div className="pt-6">
              <Link href="/" className="text-primary font-medium hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">SUBHAG</h2>
          <p className="mt-2 text-sm text-gray-650 font-medium">
            Register your product and activate your warranty
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {/* Honeypot field for bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Serial Number *</label>
                  <input 
                    type="text" 
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-mono"
                    placeholder="e.g. WM-24-X89211"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Installation Date *</label>
                    <input 
                      type="date" 
                      required
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Date *</label>
                    <input 
                      type="date" 
                      required
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                    <input 
                      type="text" 
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      placeholder="e.g. INV-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Authorized Dealer *</label>
                    <input 
                      type="text" 
                      required
                      value={authorizedDealer}
                      onChange={(e) => setAuthorizedDealer(e.target.value)}
                      placeholder="Dealer name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                    <input 
                      type="text" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">PIN Code</label>
                    <input 
                      type="text" 
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      placeholder="e.g. 110001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <span>Activate Warranty</span>
                )}
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link href="/portal/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
