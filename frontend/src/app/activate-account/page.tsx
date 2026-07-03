'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing activation token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/portal/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to activate account. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 text-center space-y-4">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Account Activated!</h2>
        <p className="text-sm text-gray-500">
          Your password has been set successfully. You are being redirected to the login page.
        </p>
        <div className="pt-6">
          <Link href="/portal/login" className="text-primary font-medium hover:underline">
            Click here if not redirected
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">New Password *</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password *</label>
          <input 
            type="password" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <span>Set Password & Activate</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">SUBHAG</h2>
          <p className="mt-2 text-sm text-gray-650 font-medium">
            Set your password to access your customer portal
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <ActivateAccountForm />
        </Suspense>
      </div>
    </div>
  );
}
