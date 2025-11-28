"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import BottomBar from '@/components/BottomBar';
import SessionsPanel from '@/components/SessionsPanel';
import TasksPanel from '@/components/TasksPanel';
import { DEFAULT_SESSION_IDS } from '@/lib/heidi/constants';

export default function Home() {
  const searchParams = useSearchParams();
  const [isSessionsPanelOpen, setIsSessionsPanelOpen] = useState(false);
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(true); // Default to open
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    DEFAULT_SESSION_IDS[0] ?? null,
  );
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [voiceLog, setVoiceLog] = useState<
    { id: string; title: string; description: string; timestamp: string }[]
  >([]);

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get("sessionId");
    if (sessionIdFromQuery) {
      setSelectedSessionId(sessionIdFromQuery);
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        onViewSessions={() => setIsSessionsPanelOpen(true)}
      />
      <SessionsPanel 
        isOpen={isSessionsPanelOpen} 
        onClose={() => setIsSessionsPanelOpen(false)} 
        selectedSessionId={selectedSessionId}
        onSelectSession={(id) => {
          setSelectedSessionId(id);
          setIsSessionsPanelOpen(false);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <MainContent 
          selectedSessionId={selectedSessionId} 
          onNoteContentChange={setNoteContent}
          onToggleTasksPanel={() => setIsTasksPanelOpen(!isTasksPanelOpen)}
          isTasksPanelOpen={isTasksPanelOpen}
          onVoiceLogChange={setVoiceLog}
        />
        <BottomBar />
      </div>
      <TasksPanel
        isOpen={isTasksPanelOpen}
        onClose={() => setIsTasksPanelOpen(false)}
        noteContent={noteContent}
        voiceLog={voiceLog}
        onClearVoiceLog={() => setVoiceLog([])}
      />
    </div>
  );
}
