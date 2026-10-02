'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-error" />
      </div>
      <h1 className="text-4xl font-heading font-bold text-text mb-4">Something went wrong</h1>
      <p className="text-text-muted mb-8 max-w-md">
        We encountered an unexpected error while trying to load this page.
      </p>
      <button
        onClick={() => reset()}
        className="bg-primary hover:bg-primary-hover text-bg px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
      >
        <RefreshCw size={18} />
        Try Again
      </button>
    </div>
  );
}
