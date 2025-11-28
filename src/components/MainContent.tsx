'use client';

import { useState, useEffect, useRef } from 'react';
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
  MoreVertical
} from 'lucide-react';

export default function MainContent() {
  const [showTranscribeDropdown, setShowTranscribeDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Transcribing');
  const transcribeDropdownRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (transcribeDropdownRef.current && !transcribeDropdownRef.current.contains(event.target as Node)) {
        setShowTranscribeDropdown(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Right Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-3">
          <div className="relative" ref={transcribeDropdownRef}>
            <button
              onClick={() => setShowTranscribeDropdown(!showTranscribeDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mic size={18} />
              <span>Transcribe</span>
              <ChevronDown size={16} />
            </button>
            {showTranscribeDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                    Transcribe
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                    Dictate
                  </button>
                </div>
              </div>
            )}
          </div>
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
                <span className="font-medium text-gray-900">John Doe</span>
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
              <span>Today 11:45AM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>English</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500" />
              <span>14 days</span>
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start this session using the header
            </h2>
            <p className="text-gray-600">
              Your note will appear here once your session is complete
            </p>
          </div>

          {/* Session Mode Selection */}
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="relative inline-block w-full" ref={modeDropdownRef}>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mic size={18} />
                  <span>Start transcribing</span>
                </div>
                <ChevronDown size={16} />
              </button>
              
              {showModeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedMode('Transcribing');
                      setShowModeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between first:rounded-t-lg"
                  >
                    <span>Transcribing</span>
                    {selectedMode === 'Transcribing' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMode('Dictating');
                      setShowModeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Dictating</span>
                    {selectedMode === 'Dictating' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMode('Upload session audio');
                      setShowModeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between last:rounded-b-lg"
                  >
                    <span>Upload session audio</span>
                    {selectedMode === 'Upload session audio' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </button>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600 text-center">
              Select your visit mode in the dropdown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

