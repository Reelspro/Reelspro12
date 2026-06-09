import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-4">Try refreshing the page. If the problem persists, contact support.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
