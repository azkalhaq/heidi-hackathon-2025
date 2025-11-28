'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import BottomBar from '@/components/BottomBar';
import SessionsPanel from '@/components/SessionsPanel';

export default function Home() {
  const [isSessionsPanelOpen, setIsSessionsPanelOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onViewSessions={() => setIsSessionsPanelOpen(true)} />
      <SessionsPanel 
        isOpen={isSessionsPanelOpen} 
        onClose={() => setIsSessionsPanelOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <MainContent />
        <BottomBar />
      </div>
    </div>
  );
}
