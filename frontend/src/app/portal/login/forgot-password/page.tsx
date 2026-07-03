'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/utils/api';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(res.message || 'If an account exists, a reset link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess('Password has been successfully updated. You can now log in.');
      setTimeout(() => {
        router.push('/portal/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {token ? 'Reset your password' : 'Forgot your password?'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-650 font-medium">
          {token ? 'Enter your new password below' : 'Enter your email address to receive a reset link'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold flex flex-col">
              <div className="flex items-center space-x-2">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            </div>
          )}

          {!token ? (
            <form className="space-y-6" onSubmit={handleRequestReset}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting || !!success}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting || !!success}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-gray-150 pt-6 text-center text-xs text-gray-500 font-medium space-y-4">
            <div>
              <Link href="/portal/login" className="text-primary hover:underline font-bold text-sm">
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12"><div className="text-center font-bold">Loading...</div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
