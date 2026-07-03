'use client';

import React, { useState } from 'react';
import { Download, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CertificatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:5000/api/v1');
      const response = await fetch(`${backendUrl}/warranties/${params.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SUBHAG_Warranty_${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4 border border-primary/20 text-primary">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Warranty Active</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Your product warranty is successfully registered.
          </p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Certificate Number</p>
            <p className="text-lg font-mono font-bold text-gray-900">{params.id}</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Download PDF Certificate</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-200 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </button>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-xs font-medium text-gray-400">
              This certificate contains your digital warranty details and is required for future service claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
