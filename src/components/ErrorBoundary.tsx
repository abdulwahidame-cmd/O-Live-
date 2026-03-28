import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (React.Component as any)<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        // Check if it's a Firestore JSON error
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `A database error occurred during ${parsed.operationType}. Our team has been notified.`;
          }
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={40} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Oops!</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            {errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-black transition-transform active:scale-95"
          >
            <RefreshCw size={20} />
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
