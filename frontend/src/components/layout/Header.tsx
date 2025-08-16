import React from 'react';
import { Button } from '../ui';

interface HeaderProps {
  title?: string;
  onNewStream?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Talking Head',
  onNewStream 
}) => {
  return (
    <header className="p-6 border-b border-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">TH</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
        </div>
        
        <nav className="flex items-center gap-6">
          <Button variant="ghost">Dashboard</Button>
          <Button variant="ghost">Streams</Button>
          <Button variant="ghost">Settings</Button>
          {onNewStream && (
            <Button variant="primary" onClick={onNewStream}>
              New Stream
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
