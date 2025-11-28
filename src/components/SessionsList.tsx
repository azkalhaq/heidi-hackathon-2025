'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Globe,
  Search,
  Filter,
  ChevronRight,
  FileText,
  User,
  Loader2,
} from 'lucide-react';

interface SessionRow {
  id: string;
  patientName: string;
  createdAt: string | null;
  updatedAt: string | null;
  durationSeconds: number | null;
  languageCode: string | null;
  consultNoteStatus: string | null;
  notePreview: string | null;
}

export default function SessionsList() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/heidi/sessions');
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load sessions');
        }
        setSessions(payload.sessions ?? []);
        if (payload.failedSessions?.length) {
          const failedIds = payload.failedSessions
            .map((failure: { id: string }) =>
              failure.id.length > 6 ? failure.id.slice(-6) : failure.id,
            )
            .join(', ');
          setWarning(
            `Some sessions could not be loaded (${payload.failedSessions.length}): ${failedIds}`,
          );
        } else {
          setWarning(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unknown error loading sessions',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const normalizeStatus = (status: string | null | undefined) => {
    const normalized = status?.toLowerCase() ?? 'unknown';
    if (normalized === 'created' || normalized === 'completed') return 'completed';
    if (normalized === 'processing' || normalized === 'in-progress') return 'in-progress';
    if (normalized === 'draft') return 'draft';
    return 'unknown';
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesFilter =
        filterStatus === 'all' ||
        normalizeStatus(session.consultNoteStatus) === filterStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        session.patientName.toLowerCase().includes(query) ||
        (session.notePreview ?? '').toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filterStatus, searchQuery, sessions]);

  const getStatusColor = (status: string | null | undefined) => {
    switch (normalizeStatus(status)) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatusLabel = (status: string | null | undefined) => {
    if (!status) return 'Unknown';
    return status
      .toLowerCase()
      .split(/[_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (createdAt: string | null) => {
    if (!createdAt) return 'Unknown';
    const date = new Date(createdAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (createdAt: string | null) => {
    if (!createdAt) return '—';
    const date = new Date(createdAt);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Right Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by patient, note, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>
            <Filter
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Session Details Header */}
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>All time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>All languages</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-6 border-t border-gray-200">
          <button className="py-3 text-gray-600 hover:text-gray-900 transition-colors border-b-2 border-transparent">
            All
          </button>
          <button className="py-3 text-gray-600 hover:text-gray-900 transition-colors border-b-2 border-transparent">
            Recent
          </button>
          <button className="py-3 text-blue-600 border-b-2 border-blue-600 font-medium">
            Favorites
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {warning && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warning}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No sessions found</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-4">Patient</div>
                <div className="col-span-3">Date & Time</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Preview</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/?sessionId=${encodeURIComponent(session.id)}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-purple-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {session.patientName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <Globe size={12} />
                            <span>{session.languageCode ?? 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatTime(session.createdAt)}
                        </div>
                      </div>

                      <div className="col-span-2 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          <span>{formatDuration(session.durationSeconds)}</span>
                        </div>
                      </div>

                      <div className="col-span-2 text-xs text-gray-500 truncate">
                        {session.notePreview ?? 'No note yet'}
                      </div>

                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            session.consultNoteStatus,
                          )}`}
                        >
                          {formatStatusLabel(session.consultNoteStatus)}
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

