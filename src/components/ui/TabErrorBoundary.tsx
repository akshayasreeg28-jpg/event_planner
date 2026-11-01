import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  tabName?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[TabErrorBoundary:${this.props.tabName || 'Tab'}] Uncaught render error:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 rounded-2xl bg-rose-50/70 border border-rose-200 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-rose-950">
              Unable to load {this.props.tabName || 'section'}
            </h3>
            <p className="text-sm text-rose-700/90 mt-1">
              {this.state.error?.message || 'A rendering error occurred in this workspace module.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-white border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              Try Reloading Tab
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
