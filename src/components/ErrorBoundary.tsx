import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-red-500 font-mono p-8">
                    <h1 className="text-4xl mb-4 font-bold">SYSTEM FAILURE</h1>
                    <p className="text-xl mb-8">The Exegete has encountered a critical error.</p>
                    <div className="bg-red-900/20 p-4 rounded border border-red-500/50 max-w-2xl overflow-auto">
                        <code className="text-sm whitespace-pre-wrap">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <button
                        className="mt-8 px-6 py-2 border border-red-500 hover:bg-red-500 hover:text-black transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
