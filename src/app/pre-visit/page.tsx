'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function PreVisitFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('code') || searchParams.get('sessionCode');
  const appointmentId = searchParams.get('appointmentId');

  const [step, setStep] = useState<'info' | 'medical' | 'uploads' | 'review' | 'submitted'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; file: File; preview: string; type: 'mri' | 'scan' | 'document' | 'other' }>>([]);
  const [ocrResults, setOcrResults] = useState<Record<string, any>>({});
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phoneNumber: '',
      email: '',
      address: '',
      visitDateTime: '',
    },
    medicalInfo: {
      reasonForVisit: '',
      currentSymptoms: '',
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      additionalNotes: '',
    },
    sessionCode: sessionCode || '',
    appointmentId: appointmentId || '',
  });

  const handleInputChange = (section: 'personalInfo' | 'medicalInfo', field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      type: 'document' as const,
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);

    // Process OCR for each image
    for (const image of newImages) {
      await processOCR(image.id, image.file);
    }
  };

  const processOCR = async (imageId: string, file: File) => {
    setIsProcessingOcr(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/pre-visit/ocr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.extractedText) {
        setOcrResults((prev) => ({
          ...prev,
          [imageId]: result,
        }));
      }
    } catch (err) {
      console.error('OCR processing failed:', err);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    setOcrResults((prev) => {
      const newResults = { ...prev };
      delete newResults[id];
      return newResults;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        uploads: {
          images: uploadedImages.map((img) => ({
            id: img.id,
            filename: img.file.name,
            type: img.type,
            uploadedAt: new Date().toISOString(),
          })),
          ocrResults: Object.entries(ocrResults).map(([imageId, result]) => ({
            imageId,
            extractedText: result.extractedText,
            structuredData: result.structuredData,
          })),
        },
      };

      const response = await fetch('/api/pre-visit/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setStep('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToMedical = () => {
    return (
      formData.personalInfo.firstName &&
      formData.personalInfo.lastName &&
      formData.personalInfo.dateOfBirth &&
      formData.personalInfo.phoneNumber &&
      formData.personalInfo.visitDateTime
    );
  };

  const canProceedToReview = () => {
    return formData.medicalInfo.reasonForVisit.length > 0;
  };

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for providing your information. Your clinician will review this before your visit.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pre-Visit Information Form</h1>
          <p className="text-gray-600 text-sm">
            Please fill out this form to help your clinician prepare for your visit.
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {['Personal Info', 'Medical Info', 'Documents', 'Review'].map((label, idx) => {
              const stepIndex = ['info', 'medical', 'uploads', 'review'].indexOf(step);
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;
              
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-medium text-purple-600' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 'info' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.personalInfo.dateOfBirth}
                  onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.personalInfo.phoneNumber}
                  onChange={(e) => handleInputChange('personalInfo', 'phoneNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.personalInfo.visitDateTime}
                  onChange={(e) => handleInputChange('personalInfo', 'visitDateTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please select when you plan to visit the clinic
                </p>
              </div>

              {(sessionCode || appointmentId) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700">
                    <strong>Session Code:</strong> {sessionCode || appointmentId}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep('medical')}
                  disabled={!canProceedToMedical()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Medical Information */}
          {step === 'medical' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Visit *
                </label>
                <textarea
                  value={formData.medicalInfo.reasonForVisit}
                  onChange={(e) => handleInputChange('medicalInfo', 'reasonForVisit', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Please describe why you're visiting today..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Symptoms (Optional)
                </label>
                <textarea
                  value={formData.medicalInfo.currentSymptoms}
                  onChange={(e) => handleInputChange('medicalInfo', 'currentSymptoms', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe any symptoms you're currently experiencing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History (Optional)
                </label>
                <textarea
                  value={formData.medicalInfo.medicalHistory}
                  onChange={(e) => handleInputChange('medicalInfo', 'medicalHistory', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Any relevant medical history, past surgeries, or conditions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications (Optional)
                </label>
                <textarea
                  value={formData.medicalInfo.currentMedications}
                  onChange={(e) => handleInputChange('medicalInfo', 'currentMedications', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="List any medications you're currently taking..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies (Optional)
                </label>
                <input
                  type="text"
                  value={formData.medicalInfo.allergies}
                  onChange={(e) => handleInputChange('medicalInfo', 'allergies', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="List any known allergies..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.medicalInfo.additionalNotes}
                  onChange={(e) => handleInputChange('medicalInfo', 'additionalNotes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Any other information you'd like to share..."
                />
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep('info')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('uploads')}
                  disabled={!canProceedToReview()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Document Uploads */}
          {step === 'uploads' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
              <p className="text-sm text-gray-600">
                Upload MRI reports, scan images, referral letters, or other medical documents. We'll extract text automatically.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Click to upload</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </label>
              </div>

              {isProcessingOcr && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                  <span className="text-sm text-blue-700">Processing documents with OCR...</span>
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Uploaded Documents</h3>
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{image.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(image.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => removeImage(image.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          {ocrResults[image.id] && (
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="text-green-600" size={16} />
                                <span className="text-xs font-medium text-green-700">Text Extracted</span>
                              </div>
                              <p className="text-xs text-gray-700 line-clamp-2">
                                {ocrResults[image.id].extractedText.substring(0, 150)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep('medical')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Review & Submit
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review Your Information</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
                    <p><strong>DOB:</strong> {formData.personalInfo.dateOfBirth}</p>
                    <p><strong>Phone:</strong> {formData.personalInfo.phoneNumber}</p>
                    {formData.personalInfo.email && <p><strong>Email:</strong> {formData.personalInfo.email}</p>}
                    {formData.personalInfo.visitDateTime && (
                      <p>
                        <strong>Visit Date & Time:</strong>{' '}
                        {new Date(formData.personalInfo.visitDateTime).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Medical Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Reason for Visit:</strong></p>
                    <p className="text-gray-700">{formData.medicalInfo.reasonForVisit}</p>
                    {formData.medicalInfo.currentSymptoms && (
                      <>
                        <p className="mt-3"><strong>Current Symptoms:</strong></p>
                        <p className="text-gray-700">{formData.medicalInfo.currentSymptoms}</p>
                      </>
                    )}
                    {formData.medicalInfo.allergies && (
                      <p><strong>Allergies:</strong> {formData.medicalInfo.allergies}</p>
                    )}
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Uploaded Documents ({uploadedImages.length})
                    </h3>
                    <div className="space-y-2 text-sm">
                      {uploadedImages.map((img) => (
                        <div key={img.id} className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <span>{img.file.name}</span>
                          {ocrResults[img.id] && (
                            <span className="text-green-600 text-xs">✓ OCR Complete</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep('uploads')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Submit Form</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

