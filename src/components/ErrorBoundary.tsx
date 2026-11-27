import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-lg w-full hm-card p-8 space-y-4" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#C8FF00' }}>Runtime Error</p>
            <h2 className="font-display text-2xl font-bold" style={{ color: '#EAE8E3' }}>Something went wrong</h2>
            <div className="p-3 rounded-lg text-xs font-mono overflow-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {this.state.error.message}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="hm-btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
