'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased font-sans flex items-center justify-center min-h-screen">
        <div className="z-10 bg-neutral-900 border border-white/10 p-10 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 tracking-tight">Critical Application Failure</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            The application encountered a fatal layout or routing error. We've notified our engineering team and logged the incident.
          </p>

          <button 
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Recover & Reload
          </button>
        </div>
      </body>
    </html>
  );
}
