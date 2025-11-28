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
  User
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

export default function SessionsList() {
  const [sessions] = useState<Session[]>(mockSessions);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesFilter;
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
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Right Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Search size={18} className="cursor-pointer hover:text-gray-900" />
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
              <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
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
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No sessions found</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-4">Patient</div>
                <div className="col-span-2">Date & Time</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Template</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              
              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <Link
                    key={session.id}
                    href="/"
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
                      {/* Patient */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-purple-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{session.patientName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <Globe size={12} />
                            <span>{session.language}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="col-span-2 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{session.date}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{session.time}</div>
                      </div>
                      
                      {/* Duration */}
                      <div className="col-span-2 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          <span>{session.duration}</span>
                        </div>
                      </div>
                      
                      {/* Template */}
                      <div className="col-span-2">
                        {session.template ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {session.template}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status === 'in-progress' ? 'In Progress' : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
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

