'use client';

import { useMemo } from 'react';
import { 
  AlertTriangle, 
  Pill, 
  AlertCircle, 
  Activity, 
  Copy, 
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Activity className="text-purple-600" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">EMR Snapshot</h2>
              {data?.metadata?.source === 'mock' ? (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Demo
                </span>
              ) : data && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Fetched from OpenEMR via desktop RPA
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-4 space-y-4 h-[calc(100%-150px)] overflow-y-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={onFetch}
            disabled={isLoading}
            className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Fetching…' : 'Refresh from EMR'}
          </button>
          <button
            onClick={handleCopy}
            disabled={!summary}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-2"
            title="Copy summary to clipboard"
          >
            <Copy size={16} />
          </button>
        </div>

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-500" size={18} />
              <h3 className="font-medium text-gray-900">Recent Labs</h3>
              {data?.labs?.length ? (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {data.labs.length}
                </span>
              ) : null}
            </div>
          </div>
          {data?.labs?.length ? (
            <div className="space-y-2">
              {data.labs.map((lab, idx) => (
                <div
                  key={`${lab.test}-${lab.date ?? lab.value ?? idx}`}
                  className="border border-indigo-100 bg-indigo-50/50 rounded-lg px-4 py-3 text-sm hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-indigo-600" />
                        <div className="font-semibold text-gray-900">{lab.test}</div>
                      </div>
                      <div className="ml-6">
                        <span className="text-gray-900 font-medium">
                          {lab.value}
                          {lab.unit ? ` ${lab.unit}` : ''}
                        </span>
                      </div>
                      {lab.date && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs ml-6 mt-1">
                          <Clock size={12} />
                          <span>{lab.date}</span>
                        </div>
                      )}
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700 p-1"
                      title="Add to note"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No labs captured yet.</p>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleCopy}
          disabled={!summary}
          className="w-full border border-gray-300 rounded-lg py-2.5 font-medium text-gray-700 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2 transition-colors"
        >
          <Copy size={16} />
          Copy Summary to Clipboard
        </button>
      </div>
    </aside>
  );
}

function renderProblemsSection(data: EmrSnapshotData | null) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={18} />
          <h3 className="font-medium text-gray-900">Problems</h3>
          {data?.problems?.length ? (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.problems.length}
            </span>
          ) : null}
        </div>
      </div>
      {data?.problems?.length ? (
        <ul className="space-y-2">
          {data.problems.map((problem, idx) => (
            <li
              key={`${problem.name}-${problem.onsetDate ?? idx}`}
              className="border border-red-100 bg-red-50/50 rounded-lg px-4 py-3 text-sm hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="font-semibold text-gray-900">{problem.name}</div>
                  </div>
                  {problem.onsetDate && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs ml-4">
                      <Clock size={12} />
                      <span>Onset: {problem.onsetDate}</span>
                    </div>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700 p-1"
                  title="Add to note"
                >
                  <Plus size={14} />
                </button>
              </div>
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pill className="text-blue-500" size={18} />
          <h3 className="font-medium text-gray-900">Medications</h3>
          {data?.medications?.length ? (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.medications.length}
            </span>
          ) : null}
        </div>
      </div>
      {data?.medications?.length ? (
        <ul className="space-y-2">
          {data.medications.map((med, idx) => (
            <li
              key={`${med.name}-${med.dose ?? idx}`}
              className="border border-blue-100 bg-blue-50/50 rounded-lg px-4 py-3 text-sm hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Pill size={14} className="text-blue-600" />
                    <div className="font-semibold text-gray-900">{med.name}</div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <div className="text-gray-700 text-xs ml-6">
                    {[med.dose, med.frequency].filter(Boolean).join(' · ') || 'No dose documented'}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700 p-1"
                  title="Add to note"
                >
                  <Plus size={14} />
                </button>
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-amber-500" size={18} />
          <h3 className="font-medium text-gray-900">Allergies</h3>
          {data?.allergies?.length ? (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.allergies.length}
            </span>
          ) : null}
        </div>
      </div>
      {data?.allergies?.length ? (
        <ul className="space-y-2">
          {data.allergies.map((allergy, idx) => (
            <li
              key={`${allergy.substance}-${allergy.reaction ?? idx}`}
              className="border border-amber-200 bg-amber-50/50 rounded-lg px-4 py-3 text-sm hover:bg-amber-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <div className="font-semibold text-gray-900">{allergy.substance}</div>
                    <span className="bg-red-100 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      Alert
                    </span>
                  </div>
                  {allergy.reaction && (
                    <div className="text-gray-700 text-xs ml-6">
                      Reaction: <span className="font-medium">{allergy.reaction}</span>
                    </div>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700 p-1"
                  title="Add to note"
                >
                  <Plus size={14} />
                </button>
              </div>
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


