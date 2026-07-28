import { Component, ReactNode } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState title="Something went wrong" description="An unexpected error occurred. Please refresh the page." />;
    }

    return this.props.children;
  }
}
