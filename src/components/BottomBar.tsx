'use client';

import { LayoutGrid, Plus, ArrowUp, AlertTriangle, ChevronUp } from 'lucide-react';

export default function BottomBar() {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* AI Assistant Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <LayoutGrid size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ask Heidi to do anything..."
              className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <Plus size={18} />
              </button>
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <ArrowUp size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-orange-600">
          <AlertTriangle size={16} />
          <span>Review your note before use to ensure it accurately represents the visit</span>
        </div>

        {/* Tutorials Progress */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tutorials</span>
            <div className="relative w-12 h-12">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - 0.42)}`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">42%</span>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

