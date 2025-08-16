import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onNewStream?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title,
  onNewStream 
}) => {
  return (
    <div className="min-h-screen bg-primary">
      <Header title={title} onNewStream={onNewStream} />
      <main className="container p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
