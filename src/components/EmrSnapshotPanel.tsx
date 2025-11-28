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
        <div>
          <h2 className="text-lg font-semibold text-gray-900">EMR Snapshot</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fetched from OpenEMR via desktop RPA
          </p>
        </div>
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
        {data?.metadata?.source === 'mock' && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {data.metadata.message ??
              'Showing mock EMR data because the automation service is unavailable.'}
          </div>
        )}

        {renderProblemsSection(data)}
        {renderMedicationsSection(data)}
        {renderAllergiesSection(data)}

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Recent Labs</h3>
          {data?.labs?.length ? (
            <div className="space-y-2">
              {data.labs.map((lab, idx) => (
                <div
                  key={`${lab.test}-${lab.date ?? lab.value ?? idx}`}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="font-semibold">{lab.test}</div>
                  <div>
                    {lab.value}
                    {lab.unit ? ` ${lab.unit}` : ''}
                  </div>
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

function renderProblemsSection(data: EmrSnapshotData | null) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">Problems</h3>
      {data?.problems?.length ? (
        <ul className="space-y-2">
          {data.problems.map((problem, idx) => (
            <li
              key={`${problem.name}-${problem.onsetDate ?? idx}`}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <div className="font-semibold">{problem.name}</div>
              {problem.onsetDate && (
                <div className="text-gray-500">Onset: {problem.onsetDate}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No problems found.</p>
      )}
    </div>
  );
}

function renderMedicationsSection(data: EmrSnapshotData | null) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">Medications</h3>
      {data?.medications?.length ? (
        <ul className="space-y-2">
          {data.medications.map((med, idx) => (
            <li
              key={`${med.name}-${med.dose ?? idx}`}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <div className="font-semibold">{med.name}</div>
              <div className="text-gray-700">
                {[med.dose, med.frequency].filter(Boolean).join(' · ') || 'No dose documented'}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No medications found.</p>
      )}
    </div>
  );
}

function renderAllergiesSection(data: EmrSnapshotData | null) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">Allergies</h3>
      {data?.allergies?.length ? (
        <ul className="space-y-2">
          {data.allergies.map((allergy, idx) => (
            <li
              key={`${allergy.substance}-${allergy.reaction ?? idx}`}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <div className="font-semibold">{allergy.substance}</div>
              {allergy.reaction && (
                <div className="text-gray-700">Reaction: {allergy.reaction}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No allergies found.</p>
      )}
    </div>
  );
}

function buildClipboardSummary(data: EmrSnapshotData | null) {
  if (!data) return '';
  const lines: string[] = [
    'EMR Snapshot Summary',
    '--------------------',
    'Problems:',
  ];

  if (data.problems.length) {
    lines.push(
      ...data.problems.map((p) =>
        p.onsetDate ? `- ${p.name} (${p.onsetDate})` : `- ${p.name}`,
      ),
    );
  } else {
    lines.push('- None documented');
  }

  lines.push('', 'Medications:');
  if (data.medications.length) {
    lines.push(
      ...data.medications.map((m) => {
        const details = [m.dose, m.frequency].filter(Boolean).join(' ');
        return details ? `- ${m.name} ${details}` : `- ${m.name}`;
      }),
    );
  } else {
    lines.push('- None documented');
  }

  lines.push('', 'Allergies:');
  if (data.allergies.length) {
    lines.push(
      ...data.allergies.map((a) =>
        a.reaction ? `- ${a.substance} – ${a.reaction}` : `- ${a.substance}`,
      ),
    );
  } else {
    lines.push('- None documented');
  }

  lines.push('', 'Recent Labs:');
  if (data.labs.length) {
    lines.push(
      ...data.labs.map((lab) => {
        const base = `- ${lab.test}: ${lab.value}${lab.unit ? ` ${lab.unit}` : ''}`;
        return lab.date ? `${base} (${lab.date})` : base;
      }),
    );
  } else {
    lines.push('- None documented');
  }

  return lines.join('\n');
}


