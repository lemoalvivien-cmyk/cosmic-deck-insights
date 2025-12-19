import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Chargement..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-gold rounded-full" />
        <div className="relative flex flex-col items-center gap-4 p-8">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary animate-float" />
            <Loader2 className="absolute -bottom-2 -right-2 h-5 w-5 text-muted-foreground animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
}
