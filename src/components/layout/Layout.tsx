import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle starfield background */}
      <div className="fixed inset-0 starfield opacity-30 pointer-events-none" />
      
      {/* Mist overlay at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-64 mist-overlay pointer-events-none" />
      
      <Header />
      
      <main className="flex-1 relative">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}
