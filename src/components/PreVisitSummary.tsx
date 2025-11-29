'use client';

import { useState, useEffect } from 'react';
import type { PreVisitFormData } from '@/types/previsit';
import {
  User,
  Calendar,
  Phone,
  Mail,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface PreVisitSummaryProps {
  sessionId: string | null;
  appointmentId?: string | null;
  onClose?: () => void;
}

export default function PreVisitSummary({ sessionId, appointmentId, onClose }: PreVisitSummaryProps) {
  const [preVisitData, setPreVisitData] = useState<PreVisitFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    medical: true,
    documents: true,
  });

  useEffect(() => {
    if (sessionId || appointmentId) {
      fetchPreVisitData();
    }
  }, [sessionId, appointmentId]);

  const fetchPreVisitData = async () => {
    if (!sessionId && !appointmentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParam = appointmentId ? `appointmentId=${appointmentId}` : `sessionId=${sessionId}`;
      const response = await fetch(`/api/pre-visit/submit?${queryParam}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pre-visit data');
      }
      
      setPreVisitData(result.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pre-visit data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-purple-600" size={24} />
        </div>
      </div>
    );
  }

  if (error || !preVisitData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">No Pre-Visit Form Submitted</p>
            <p className="text-sm text-amber-600 mt-1">
              This patient has not submitted a pre-visit form. They may be a new patient without EMR data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pre-Visit Form</h3>
            <p className="text-xs text-gray-500">
              Submitted {preVisitData.submittedAt ? new Date(preVisitData.submittedAt).toLocaleDateString() : 'Recently'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Personal Information Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('personal')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-600" />
            <span className="font-medium text-gray-900">Personal Information</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              expandedSections.personal ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSections.personal && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-700">
                <strong>Name:</strong> {preVisitData.personalInfo.firstName}{' '}
                {preVisitData.personalInfo.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-700">
                <strong>DOB:</strong> {preVisitData.personalInfo.dateOfBirth}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              <span className="text-gray-700">
                <strong>Phone:</strong> {preVisitData.personalInfo.phoneNumber}
              </span>
            </div>
            {preVisitData.personalInfo.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-700">
                  <strong>Email:</strong> {preVisitData.personalInfo.email}
                </span>
              </div>
            )}
            {preVisitData.personalInfo.visitDateTime && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-700">
                  <strong>Visit Date & Time:</strong>{' '}
                  {new Date(preVisitData.personalInfo.visitDateTime).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medical Information Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('medical')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-600" />
            <span className="font-medium text-gray-900">Medical Information</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              expandedSections.medical ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSections.medical && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">Reason for Visit</p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {preVisitData.medicalInfo.reasonForVisit}
              </p>
            </div>
            {preVisitData.medicalInfo.currentSymptoms && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Current Symptoms</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {preVisitData.medicalInfo.currentSymptoms}
                </p>
              </div>
            )}
            {preVisitData.medicalInfo.medicalHistory && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Medical History</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {preVisitData.medicalInfo.medicalHistory}
                </p>
              </div>
            )}
            {preVisitData.medicalInfo.currentMedications && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Current Medications</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {preVisitData.medicalInfo.currentMedications}
                </p>
              </div>
            )}
            {preVisitData.medicalInfo.allergies && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Allergies</p>
                <p className="text-gray-700">{preVisitData.medicalInfo.allergies}</p>
              </div>
            )}
            {preVisitData.medicalInfo.additionalNotes && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Additional Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {preVisitData.medicalInfo.additionalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents & OCR Results Section */}
      {preVisitData.uploads && preVisitData.uploads.images.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('documents')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-gray-600" />
              <span className="font-medium text-gray-900">
                Documents & OCR Results ({preVisitData.uploads.images.length})
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                expandedSections.documents ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.documents && (
            <div className="mt-2 space-y-3">
              {preVisitData.uploads.images.map((image) => {
                const ocrResult = preVisitData.uploads.ocrResults.find(
                  (ocr) => ocr.imageId === image.id
                );

                const hasStructuredData =
                  !!(
                    ocrResult?.structuredData?.impression ||
                    ocrResult?.structuredData?.findings ||
                    ocrResult?.structuredData?.measurements ||
                    ocrResult?.structuredData?.radiologistComments
                  );

                return (
                  <div
                    key={image.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{image.filename}</span>
                      {ocrResult && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          OCR Complete
                        </span>
                      )}
                    </div>
                    {ocrResult && (
                      <div className="mt-3 space-y-2">
                        {ocrResult.structuredData?.impression && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Impression:</p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {ocrResult.structuredData.impression}
                            </p>
                          </div>
                        )}
                        {ocrResult.structuredData?.findings && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Findings:</p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {ocrResult.structuredData.findings}
                            </p>
                          </div>
                        )}
                        {ocrResult.structuredData?.measurements && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Measurements:</p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {ocrResult.structuredData.measurements}
                            </p>
                          </div>
                        )}
                        {ocrResult.structuredData?.radiologistComments && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              Radiologist Comments:
                            </p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {ocrResult.structuredData.radiologistComments}
                            </p>
                          </div>
                        )}
                        {!hasStructuredData && ocrResult.extractedText && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Extracted Text:</p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {ocrResult.extractedText}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EMR Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">EMR Status</p>
            <p>
              This patient may not have existing EMR data. Information was provided manually via
              pre-visit form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

