'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  ChevronDown,
  Pencil,
  RefreshCw,
  Trash2,
  Calendar,
  Globe,
  Zap,
  Copy,
  Undo2,
  Redo2,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import EmrSnapshotPanel from '@/components/EmrSnapshotPanel';
import type { EmrSnapshotData } from '@/types/emr';

interface MainContentProps {
  selectedSessionId: string | null;
}

interface SessionDetailPayload {
  id: string;
  patientName: string;
  createdAt: string | null;
  durationSeconds: number | null;
  languageCode: string | null;
  consultNoteStatus: string | null;
  noteResult: string | null;
  heading: string | null;
}

export default function MainContent({ selectedSessionId }: MainContentProps) {
  const [sessionDetails, setSessionDetails] = useState<SessionDetailPayload | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmrPanelOpen, setIsEmrPanelOpen] = useState(false);
  const [emrSnapshot, setEmrSnapshot] = useState<EmrSnapshotData | null>(null);
  const [isEmrLoading, setIsEmrLoading] = useState(false);
  const [emrError, setEmrError] = useState<string | null>(null);

  const fetchSessionDetails = useCallback(async () => {
    if (!selectedSessionId) {
      setSessionDetails(null);
      setTranscription(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/heidi/sessions/${selectedSessionId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to fetch session');
      }

      setSessionDetails(payload.session);
      setTranscription(payload.transcription ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error loading session',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSessionId]);

  const fetchEmrSnapshot = useCallback(async () => {
    setIsEmrLoading(true);
    setEmrError(null);
    try {
      const response = await fetch('/api/emr-snapshot', { method: 'POST' });
      const payload = (await response.json()) as EmrSnapshotData & { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to fetch EMR snapshot');
      }
      setEmrSnapshot(payload);
    } catch (err) {
      setEmrError(err instanceof Error ? err.message : 'Unknown EMR snapshot error');
    } finally {
      setIsEmrLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const handleTranscribe = async () => {
    if (!selectedSessionId) return;
    setIsRefreshing(true);
    await fetchSessionDetails();
  };

  const handleOpenEmrSnapshot = () => {
    setIsEmrPanelOpen(true);
    if (!emrSnapshot && !isEmrLoading) {
      void fetchEmrSnapshot();
    }
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || Number.isNaN(seconds)) {
      return 'Unknown duration';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const formatDate = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'Unknown date';
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const noteContent =
    sessionDetails?.noteResult ?? 'No consult note is available yet.';

  const transcriptContent =
    transcription ?? 'No transcription has been generated for this session.';

  return (
    <>
      <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Right Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-3">
          <button
            onClick={handleOpenEmrSnapshot}
            className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            EMR Snapshot
          </button>
          <button
            onClick={handleTranscribe}
            disabled={!selectedSessionId || isRefreshing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            {isRefreshing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mic size={18} />
            )}
            <span>Transcribe</span>
          </button>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-mono text-sm">00:00</span>
            <div className="flex items-center gap-1">
              <Mic size={14} />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-1 h-4 bg-green-500 rounded-full"></div>
                ))}
              </div>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Session Details */}
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {sessionDetails?.patientName ?? 'No session selected'}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <Pencil size={14} />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <RefreshCw size={14} />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{formatDate(sessionDetails?.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>{sessionDetails?.languageCode ?? 'Unknown language'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500" />
              <span>{formatDuration(sessionDetails?.durationSeconds ?? null)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-6 border-t border-gray-200">
          <button className="py-3 text-gray-600 hover:text-gray-900 transition-colors">
            Context
          </button>
          <button className="py-3 text-gray-600 hover:text-gray-900 transition-colors">
            Transcript
          </button>
          <button className="py-3 text-blue-600 border-b-2 border-blue-600 font-medium flex items-center gap-1.5">
            <Pencil size={14} />
            <span>Note</span>
          </button>
        </div>

        {/* Note Actions */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Select a template
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 transition-colors">
              <Pencil size={14} />
              <span>Goldilocks</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Mic size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Undo2 size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Redo2 size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 flex items-center gap-1.5 transition-colors">
              <Copy size={16} />
              <span>Copy</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {sessionDetails?.consultNoteStatus ?? 'UNKNOWN'}
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {sessionDetails?.heading ?? 'Consult Note'}
                    </h2>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {noteContent}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transcript
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mic size={14} />
                    <span>Synced from Heidi</span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {transcriptContent}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      <EmrSnapshotPanel
        isOpen={isEmrPanelOpen}
        onClose={() => setIsEmrPanelOpen(false)}
        onFetch={() => void fetchEmrSnapshot()}
        isLoading={isEmrLoading}
        error={emrError}
        data={emrSnapshot}
      />
    </>
  );
}

