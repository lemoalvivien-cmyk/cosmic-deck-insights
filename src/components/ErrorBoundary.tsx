import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Erreur inconnue';
      const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                          errorMessage.toLowerCase().includes('session');

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Une erreur est survenue
              </h1>
              <p className="text-muted-foreground">
                {isAuthError 
                  ? "Un problème de session s'est produit. Essayez de recharger la page ou de vous reconnecter."
                  : "Quelque chose s'est mal passé. Veuillez réessayer."}
              </p>
            </div>

            {/* Always show a sanitized error hint */}
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {errorMessage.substring(0, 200)}
                {errorMessage.length > 200 && '...'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Réessayer
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recharger
              </Button>
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>

            {isAuthError && (
              <p className="text-sm text-muted-foreground">
                Si le problème persiste,{' '}
                <a href="/auth" className="text-primary hover:underline">
                  reconnectez-vous
                </a>
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
