import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose/10 flex items-center justify-center rounded-full text-rose mb-4">
              <AlertTriangle size={32} />
            </div>
            <h1 className="font-display text-3xl text-onyx">Oops! Something went wrong</h1>
            <p className="text-stone">
              We're having a little trouble loading this page right now. Please try refreshing or return to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-onyx px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-onyx/90"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-onyx/20 px-6 py-3 text-sm font-medium text-onyx transition-colors hover:bg-stone/10"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;