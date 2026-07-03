'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Barcode from 'react-barcode';

function PrintBarcodesContent() {
  const searchParams = useSearchParams();
  const [serials, setSerials] = useState<string[]>([]);

  useEffect(() => {
    const serialsParam = searchParams.get('serials');
    if (serialsParam) {
      setSerials(serialsParam.split(',').filter(Boolean));
    }
  }, [searchParams]);

  useEffect(() => {
    if (serials.length > 0) {
      // Trigger print automatically after a short delay for rendering
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [serials]);

  if (serials.length === 0) {
    return <div className="p-8 text-center text-gray-500">No serial numbers selected for printing.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8 print:hidden text-center">
          <h1 className="text-2xl font-bold mb-2">Print Barcodes</h1>
          <p className="text-gray-500 mb-4">Please configure your printer to hide headers and footers.</p>
          <button 
            onClick={() => window.print()}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-container"
          >
            Print Now
          </button>
        </div>

        {/* 
          Grid setup: 4 columns wide. 
          Each serial number gets 4 copies so it fills exactly one row.
        */}
        <div className="grid grid-cols-4 gap-4 print:gap-2">
          {serials.map((serial) => {
            // Render 4 copies of each serial number
            return Array.from({ length: 4 }).map((_, idx) => (
              <div 
                key={`${serial}-${idx}`} 
                className="flex flex-col items-center justify-center p-2 border border-gray-200 border-dashed rounded-lg bg-white overflow-hidden page-break-inside-avoid"
              >
                <div className="scale-75 origin-center">
                  <Barcode 
                    value={serial} 
                    width={1.5} 
                    height={40} 
                    fontSize={14} 
                    margin={5} 
                    displayValue={true} 
                  />
                </div>
              </div>
            ));
          })}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0.5cm;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default function AdminPrintSerialsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PrintBarcodesContent />
    </Suspense>
  );
}
