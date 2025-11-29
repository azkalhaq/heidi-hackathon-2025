'use client';

import { LayoutGrid, Plus, ArrowUp, AlertTriangle, ChevronUp } from 'lucide-react';

export default function BottomBar() {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex flex-col gap-2">
        {/* AI Assistant Input */}
        <div className="relative">
          <LayoutGrid
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
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

        {/* Warning + Tutorials row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-orange-600">
            <AlertTriangle size={14} />
            <span>
              Review your note before use to ensure it accurately represents the visit
            </span>
          </div>
          <button
            type="button"
            className="ml-4 inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span>Tutorials</span>
            <div className="flex items-center gap-1 text-[11px] text-gray-600">
              <span>42%</span>
              <ChevronUp size={12} className="text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

