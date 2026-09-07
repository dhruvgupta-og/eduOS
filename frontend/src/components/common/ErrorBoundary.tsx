import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EduOS Application Error Boundary caught:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
            <div className="w-14 h-14 bg-red-100 border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-black text-neutral-400 block">
                System Notice
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight text-black">
                {this.props.fallbackTitle || 'Something Went Wrong'}
              </h1>
              <p className="text-xs text-neutral-600 font-mono leading-relaxed">
                An unexpected interface state occurred. Your session and records are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-stone-100 border border-black/20 text-left font-mono text-[10px] text-neutral-700 overflow-x-auto max-h-32">
                <span className="font-bold text-red-600 block mb-1">Diagnostic Log:</span>
                {this.state.error.message || 'Unknown runtime exception'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 bg-black text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-neutral-800 transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-white text-black font-mono text-xs uppercase font-bold tracking-wider hover:bg-neutral-100 transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
