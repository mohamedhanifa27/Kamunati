import React from 'react';
import { Link } from 'next-view-transitions';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-9xl font-heading font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-heading font-semibold text-text mb-6">Lost your way?</h2>
      <p className="text-text-muted mb-10 max-w-md">
        Sorry, we can't find that page. You'll find lots to explore on the home page.
      </p>
      <Link
        href="/"
        className="bg-surface hover:bg-surface-raised border border-border text-text px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
      >
        <Home size={18} />
        Kamunati Home
      </Link>
    </div>
  );
}
