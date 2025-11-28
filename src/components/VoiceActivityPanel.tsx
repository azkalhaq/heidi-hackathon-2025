'use client';

interface VoiceLogEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface VoiceActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceLog: VoiceLogEntry[];
  onClear: () => void;
}

export default function VoiceActivityPanel({
  isOpen,
  onClose,
  voiceLog,
  onClear,
}: VoiceActivityPanelProps) {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
            Voice workflow activity
          </p>
          <h2 className="text-lg font-semibold text-gray-900">
            Automated actions
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Close
        </button>
      </div>

      <div className="px-6 py-4 h-[calc(100%-100px)] overflow-y-auto">
        {voiceLog.length > 0 ? (
          <>
            <div className="flex items-center justify-end mb-3">
              <button
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={onClear}
              >
                Clear
              </button>
            </div>
            <ul className="space-y-3">
              {voiceLog.map((entry) => (
                <li
                  key={entry.id}
                  className="border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{entry.timestamp}</span>
                    <span>Voice agent</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.title}
                  </p>
                  <p className="text-sm text-gray-700">{entry.description}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-gray-500">
              No automated actions yet.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Voice commands will appear here when executed.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

