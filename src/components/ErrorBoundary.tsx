import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Pearl Travel app:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pearl-slate text-pearl-text flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-pearl-dark border border-pearl-border rounded-2xl p-6 shadow-lg space-y-6 text-center">
            <div className="w-16 h-16 bg-pearl-gold/10 border border-pearl-gold/20 text-pearl-accent rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-pearl-text tracking-tight">
                Portal Recovery
              </h1>
              <p className="text-sm text-pearl-placeholder leading-relaxed">
                An unexpected display error occurred while rendering the portal. You can refresh or reset saved data to restore normal operation.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-pearl-surface rounded-lg p-3 text-left border border-pearl-border/80">
                <p className="text-xs font-mono text-pearl-danger-light break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="btn-reload-page"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pearl-gold hover:bg-pearl-gold-light text-pearl-navy text-sm font-semibold rounded-xl transition shadow-lg shadow-amber-950"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                id="btn-reset-clear-cache"
                onClick={this.handleResetAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pearl-dark hover:bg-pearl-surface text-pearl-text-secondary text-sm font-medium rounded-xl transition border border-pearl-border"
              >
                <Trash2 className="w-4 h-4 text-pearl-placeholder" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
