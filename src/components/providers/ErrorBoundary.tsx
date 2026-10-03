'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'next-view-transitions';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-black pointer-events-none" />
          
          <div className="z-10 bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Something Went Wrong</h1>
            <p className="text-white/60 mb-8 leading-relaxed">
              We encountered an unexpected error while rendering this view. Our systems have logged the issue.
            </p>

            <div className="flex gap-4 w-full sm:flex-row flex-col">
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} /> Try Again
              </button>
              
              <Link 
                href="/"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home size={18} /> Return Home
              </Link>
            </div>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-8 p-4 bg-black/50 rounded-lg w-full text-left overflow-x-auto text-xs font-mono text-red-400 border border-red-500/20">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
