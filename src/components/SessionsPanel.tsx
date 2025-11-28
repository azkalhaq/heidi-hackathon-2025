'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Search, 
  Filter,
  FileText,
  User,
  X,
  Loader2,
} from 'lucide-react';

interface SessionListItem {
  id: string;
  patientName: string;
  createdAt: string | null;
  updatedAt: string | null;
  durationSeconds: number | null;
  languageCode: string | null;
  consultNoteStatus: string | null;
}

interface SessionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
}

export default function SessionsPanel({
  isOpen,
  onClose,
  selectedSessionId,
  onSelectSession,
}: SessionsPanelProps) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const failedList = payload.failedSessions
            .map(
              (failure: { id: string }) =>
                failure.id.slice(-6) || failure.id,
            )
            .join(', ');
          setError(
            `Some sessions could not be loaded (${payload.failedSessions.length}): ${failedList}`,
          );
        } else {
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unknown error loading sessions',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const normalizeStatus = (status: string | null | undefined) => {
    const normalized = status?.toLowerCase() ?? 'unknown';
    if (normalized === 'created' || normalized === 'completed') return 'completed';
    if (normalized === 'processing' || normalized === 'in-progress') return 'in-progress';
    if (normalized === 'draft') return 'draft';
    return 'unknown';
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.patientName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      normalizeStatus(session.consultNoteStatus) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string | null | undefined) => {
    switch (normalizeStatus(status)) {
      case 'completed':
      case 'created':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
      case 'processing':
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const formatDate = (createdAt: string | null) => {
    if (!createdAt) return 'Unknown date';
    const date = new Date(createdAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-80' : 'w-0'
      }`}>
        {isOpen && (
        <div className="flex flex-col h-full w-80">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4 text-sm text-red-600">
                {error}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-sm">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession?.(session.id);
                      onClose();
                    }}
                    className={`block w-full text-left hover:bg-gray-50 transition-colors ${
                      selectedSessionId === session.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-purple-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {session.patientName}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{formatDuration(session.durationSeconds)}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
                            session.consultNoteStatus,
                          )}`}
                        >
                          {formatStatusLabel(session.consultNoteStatus)}
                        </span>
                      </div>

                      <div className="ml-[52px] flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe size={12} />
                          <span>{session.languageCode ?? 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
    </div>
  );
}

