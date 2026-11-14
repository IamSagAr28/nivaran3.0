import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

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
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('popstate', this.handleReset);
    window.addEventListener('pushstate', this.handleReset);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleReset);
    window.removeEventListener('pushstate', this.handleReset);
  }

  handleReset = () => {
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-between bg-gray-50">
          <Header showCategories={false} />
          <div className="max-w-2xl mx-auto my-16 px-4 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🌿
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered a temporary issue displaying this page.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/products';
                }}
                className="bg-[#1f2937] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-black transition-colors"
              >
                Browse All Products
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
