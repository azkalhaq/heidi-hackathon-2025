'use client';

import { AlertTriangle, Pill, Activity, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { EmrSnapshotData } from '@/types/emr';

interface EmrSnapshotVisualProps {
  emrSnapshot: EmrSnapshotData;
}

export default function EmrSnapshotVisual({ emrSnapshot }: EmrSnapshotVisualProps) {
  return (
    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-purple-600" size={20} />
        <h3 className="text-sm font-semibold text-gray-900">EMR Snapshot Data</h3>
        {emrSnapshot.metadata?.source === 'mock' && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            Demo Data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Problems */}
        {emrSnapshot.problems && emrSnapshot.problems.length > 0 && (
          <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-red-500" size={18} />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Active Problems
              </h4>
              <span className="bg-red-100 text-red-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {emrSnapshot.problems.length}
              </span>
            </div>
            <div className="space-y-2">
              {emrSnapshot.problems.map((problem, idx) => (
                <div
                  key={`problem-${idx}`}
                  className="bg-white border border-red-100 rounded-md px-3 py-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{problem.name}</div>
                      {problem.onsetDate && (
                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                          <Clock size={10} />
                          <span>Since {problem.onsetDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {emrSnapshot.medications && emrSnapshot.medications.length > 0 && (
          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="text-blue-500" size={18} />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Current Medications
              </h4>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {emrSnapshot.medications.length}
              </span>
            </div>
            <div className="space-y-2">
              {emrSnapshot.medications.map((med, idx) => (
                <div
                  key={`med-${idx}`}
                  className="bg-white border border-blue-100 rounded-md px-3 py-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <Pill size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{med.name}</div>
                      <div className="text-gray-600 mt-0.5">
                        {[med.dose, med.frequency].filter(Boolean).join(' · ') || 'Dose not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {emrSnapshot.allergies && emrSnapshot.allergies.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-amber-500" size={18} />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Allergies
              </h4>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {emrSnapshot.allergies.length}
              </span>
            </div>
            <div className="space-y-2">
              {emrSnapshot.allergies.map((allergy, idx) => (
                <div
                  key={`allergy-${idx}`}
                  className="bg-white border border-amber-200 rounded-md px-3 py-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{allergy.substance}</div>
                      {allergy.reaction && (
                        <div className="text-gray-600 mt-0.5">
                          Reaction: <span className="font-medium">{allergy.reaction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labs */}
        {emrSnapshot.labs && emrSnapshot.labs.length > 0 && (
          <div className="border border-green-100 bg-green-50/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="text-green-500" size={18} />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Recent Lab Results
              </h4>
              <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {emrSnapshot.labs.length}
              </span>
            </div>
            <div className="space-y-2">
              {emrSnapshot.labs.map((lab, idx) => (
                <div
                  key={`lab-${idx}`}
                  className="bg-white border border-green-100 rounded-md px-3 py-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{lab.test}</div>
                      <div className="text-gray-600 mt-0.5">
                        {lab.value} {lab.unit || ''}
                        {lab.date && (
                          <span className="ml-2 text-gray-500">
                            · {lab.date}
                          </span>
                        )}
                      </div>
                    </div>
                    {lab.interpretation && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        {lab.interpretation}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(!emrSnapshot.problems || emrSnapshot.problems.length === 0) &&
        (!emrSnapshot.medications || emrSnapshot.medications.length === 0) &&
        (!emrSnapshot.allergies || emrSnapshot.allergies.length === 0) &&
        (!emrSnapshot.labs || emrSnapshot.labs.length === 0) && (
          <div className="text-center py-4 text-xs text-gray-500">
            No EMR snapshot data available
          </div>
        )}
    </div>
  );
}

