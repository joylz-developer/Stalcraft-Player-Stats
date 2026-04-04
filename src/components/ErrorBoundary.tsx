import React, { ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  props!: { children: React.ReactNode };
  state = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-zinc-400">
              Произошла непредвиденная ошибка в работе приложения. Пожалуйста, перезагрузите страницу или обратитесь в поддержку.
            </p>
            {this.state.error && (
              <div className="bg-zinc-950 p-4 rounded-lg text-left overflow-auto text-xs font-mono text-red-400 border border-red-500/20">
                {(this.state.error as Error).message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
