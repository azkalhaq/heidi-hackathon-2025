'use client';

import { useState } from 'react';
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
  X
} from 'lucide-react';

interface Session {
  id: string;
  patientName: string;
  date: string;
  time: string;
  duration: string;
  language: string;
  status: 'completed' | 'in-progress' | 'draft';
  template?: string;
}

const mockSessions: Session[] = [
  {
    id: '1',
    patientName: 'John Doe',
    date: 'Today',
    time: '11:45 AM',
    duration: '15:32',
    language: 'English',
    status: 'completed',
    template: 'Goldilocks'
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    date: 'Yesterday',
    time: '2:30 PM',
    duration: '22:15',
    language: 'English',
    status: 'completed',
    template: 'Standard'
  },
  {
    id: '3',
    patientName: 'Robert Johnson',
    date: 'Jan 15, 2025',
    time: '9:00 AM',
    duration: '18:45',
    language: 'Spanish',
    status: 'completed'
  },
  {
    id: '4',
    patientName: 'Emily Davis',
    date: 'Jan 14, 2025',
    time: '3:20 PM',
    duration: '12:30',
    language: 'English',
    status: 'draft'
  },
  {
    id: '5',
    patientName: 'Michael Brown',
    date: 'Jan 13, 2025',
    time: '10:15 AM',
    duration: '25:00',
    language: 'English',
    status: 'completed',
    template: 'Comprehensive'
  },
];

interface SessionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionsPanel({ isOpen, onClose }: SessionsPanelProps) {
  const [sessions] = useState<Session[]>(mockSessions);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-sm">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <Link
                    key={session.id}
                    href="/"
                    onClick={onClose}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-purple-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{session.patientName}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{session.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{session.duration}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(session.status)}`}>
                          {session.status === 'in-progress' ? 'In Progress' : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="ml-[52px] flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe size={12} />
                          <span>{session.language}</span>
                        </div>
                        {session.template && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {session.template}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
    </div>
  );
}

