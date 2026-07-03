'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, CheckCircle, XCircle, RefreshCw, CreditCard } from 'lucide-react';
import Script from 'next/script';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/utils/api';

interface Warranty {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  activation_channel: string;
  serial_number: {
    serial_number: string;
    product: {
      sku: string;
      name: string;
      description?: string;
    };
  };
  certificate?: {
    certificate_number: string;
  };
  amc_contracts?: {
    status: string;
    end_date: string;
  }[];
}

const handleDownloadPdf = async (certificateNumber: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/warranties/${certificateNumber}/pdf`, {
      method: 'GET',
    });
    
    if (!response.ok) throw new Error('Failed to download PDF');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SUBHAG_Warranty_${certificateNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download PDF');
  }
};

export default function PortalWarrantiesPage() {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration Modal States
  const [showModal, setShowModal] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const fetchWarranties = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/warranties');
      // Filter warranties matching current user's email
      const myWarranties = data.filter((w: any) => w.customer && w.customer.email === user.email);
      setWarranties(myWarranties);
    } catch (err: any) {
      setError(err.message || 'Failed to load warranties');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAmc = async (warrantyId: string) => {
    try {
      const orderData = await apiFetch('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ warranty_id: warrantyId })
      });

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SUBHAG",
        description: "AMC Purchase",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Usually AMC starts from warranty end date, or current date if expired
            const warranty = warranties.find(w => w.id === warrantyId);
            if (!warranty) return;

            const warrantyEndDate = new Date(warranty.end_date);
            const now = new Date();
            const startDate = warrantyEndDate > now ? warrantyEndDate : now;
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);

            await apiFetch('/payments/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                warranty_id: warrantyId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                price: (orderData.amount / 100).toString(),
              })
            });
            alert('AMC activated successfully!');
            fetchWarranties();
          } catch (err: any) {
            alert(err.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: `${user?.first_name} ${user?.last_name || ''}`,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: "#0369a1" // matches primary color
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert(response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Failed to initialize payment');
    }
  };

  useEffect(() => {
    fetchWarranties();
    if (user) {
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await apiFetch('/warranties/activate', {
        method: 'POST',
        body: JSON.stringify({
          serial_number: serialNumber,
          customer: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: phone,
            address_line1: addressLine1 || undefined,
            city: city || undefined,
            state: state || undefined,
          },
          channel: 'PORTAL',
        }),
      });

      setShowModal(false);
      setSerialNumber('');
      setAddressLine1('');
      setCity('');
      setState('');
      fetchWarranties();
      alert('Product registered and warranty activated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to register product. Please check the serial number.');
    }
  };

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Registered Products</h1>
          <p className="text-gray-500 mt-1 font-medium font-sans">View your products, active warranties, and register new purchases.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Register New Product</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading your warranties...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
          <h2 className="font-bold mb-2">Error Loading Warranties</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchWarranties} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
        </div>
      ) : warranties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Products Registered</h2>
          <p className="text-gray-500 font-medium">It looks like you haven't registered any purchases yet. Click the button below to activate your warranty using your product's serial number.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-colors inline-block cursor-pointer text-sm"
          >
            Register Product Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warranties.map((wr) => (
            <div key={wr.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{wr.serial_number.product.name}</h2>
                    <p className="text-xs font-mono text-gray-500 mt-1">SN: {wr.serial_number.serial_number}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center space-x-1 ${
                    wr.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {wr.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    <span>{wr.status}</span>
                  </span>
                </div>
                
                {wr.serial_number.product.description && (
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">{wr.serial_number.product.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 pt-2 border-t border-gray-50">
                  <div>
                    <p className="text-gray-400 font-medium">Activation Date</p>
                    <p className="text-gray-900 mt-0.5">{new Date(wr.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Expiration Date</p>
                    <p className="text-gray-900 mt-0.5">{new Date(wr.end_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {wr.certificate && wr.status === 'ACTIVE' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDownloadPdf(wr.certificate!.certificate_number)}
                      className="px-3 py-1.5 bg-primary/10 text-primary font-semibold text-sm rounded-lg hover:bg-primary/20 transition-colors cursor-pointer flex items-center border-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Certificate
                    </button>
                  </div>
                )}
                
                {/* AMC Section */}
                <div className="mt-2 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {wr.amc_contracts && wr.amc_contracts.some(c => c.status === 'ACTIVE') ? (
                      <span className="text-green-600 font-semibold flex items-center">
                        <ShieldCheck size={14} className="mr-1" /> AMC Active
                      </span>
                    ) : (
                      <span>Protect your product further</span>
                    )}
                  </div>
                  {!(wr.amc_contracts && wr.amc_contracts.some(c => c.status === 'ACTIVE')) && (
                    <button
                      onClick={() => handleBuyAmc(wr.id)}
                      className="px-3 py-1.5 bg-gray-900 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center border-none"
                    >
                      <CreditCard size={14} className="mr-2" />
                      Buy AMC
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">Register New Purchase</h2>
            <p className="text-sm text-gray-500">Activate your warranty by entering the serial number from your product.</p>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Serial Number</label>
                <input 
                  type="text" 
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                  placeholder="e.g. WM-24-X89211"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Purchase Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Authorized Dealer</label>
                  <input 
                    type="text" 
                    placeholder="Search dealer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Upload Invoice</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number for Verification</label>
                <input 
                  type="text" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivery Address (Optional)</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input 
                      type="text" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors text-sm cursor-pointer"
                >
                  Activate Warranty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
