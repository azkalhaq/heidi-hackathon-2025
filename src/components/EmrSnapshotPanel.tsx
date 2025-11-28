'use client';

import { useMemo } from 'react';
import type { EmrSnapshotData } from '@/types/emr';

interface EmrSnapshotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFetch: () => void;
  isLoading: boolean;
  error?: string | null;
  data: EmrSnapshotData | null;
}

export default function EmrSnapshotPanel({
  isOpen,
  onClose,
  onFetch,
  isLoading,
  error,
  data,
}: EmrSnapshotPanelProps) {
  const summary = useMemo(() => buildClipboardSummary(data), [data]);

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">EMR Snapshot</h2>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
          Close
        </button>
      </div>

      <div className="px-6 py-4 space-y-4 h-[calc(100%-150px)] overflow-y-auto">
        <button
          onClick={onFetch}
          disabled={isLoading}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Fetching…' : 'Fetch from EMR'}
        </button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {renderListSection('Problems', data?.problems)}
        {renderListSection('Medications', data?.medications)}
        {renderListSection('Allergies', data?.allergies)}

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Recent Labs</h3>
          {data?.labs?.length ? (
            <div className="space-y-2">
              {data.labs.map((lab) => (
                <div key={`${lab.name}-${lab.date ?? lab.value}`} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <div className="font-semibold">{lab.name}</div>
                  <div>{lab.value}</div>
                  {lab.date && <div className="text-gray-500">{lab.date}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No labs captured yet.</p>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={handleCopy}
          disabled={!summary}
          className="w-full border border-gray-300 rounded-lg py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
        >
          Copy Summary to Clipboard
        </button>
      </div>
    </aside>
  );
}

function renderListSection(title: string, items?: string[]) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
      {items?.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No data captured yet.</p>
      )}
    </div>
  );
}

function buildClipboardSummary(data: EmrSnapshotData | null) {
  if (!data) return '';
  const lines = [
    'EMR Snapshot Summary',
    '--------------------',
    'Problems:',
    ...(data.problems.length ? data.problems.map((p) => `- ${p}`) : ['- None documented']),
    '',
    'Medications:',
    ...(data.medications.length ? data.medications.map((m) => `- ${m}`) : ['- None documented']),
    '',
    'Allergies:',
    ...(data.allergies.length ? data.allergies.map((a) => `- ${a}`) : ['- None documented']),
    '',
    'Recent Labs:',
    ...(data.labs.length
      ? data.labs.map((lab) => `- ${lab.name}: ${lab.value}${lab.date ? ` (${lab.date})` : ''}`)
      : ['- None documented']),
  ];
  return lines.join('\n');
}


