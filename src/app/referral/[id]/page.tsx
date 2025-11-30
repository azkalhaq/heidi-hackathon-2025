'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import EmrSnapshotVisual from '@/components/EmrSnapshotVisual';
import type { EmrSnapshotData } from '@/types/emr';

interface ReferralData {
  referralLetter: string;
  emrSnapshot: EmrSnapshotData | null;
  patientName: string;
  service: string;
  notePreview: string;
  timelineSummary?: string | null;
}

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const referralId = params.id as string;

  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to load without password first
    loadReferral();
  }, [referralId]);

  const loadReferral = async (providedPassword?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/referral/${referralId}`, window.location.origin);
      if (providedPassword) {
        url.searchParams.set('password', providedPassword);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPassword) {
          setIsLoading(false);
          return; // Show password form
        }
        throw new Error(data.error || 'Failed to load referral');
      }

      setReferralData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);

    try {
      await loadReferral(password);
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (error && !referralData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <Lock size={48} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Password form
  if (!referralData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="text-indigo-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Protected</h1>
            <p className="text-gray-600">This referral is password protected. Please enter the password to view it.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verifying...
                </>
              ) : (
                'Access Referral'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Referral content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Referral Letter</h1>
            <p className="text-sm text-gray-500">
              {referralData.patientName} · {referralData.service}
            </p>
          </div>
          <button
            onClick={copyUrl}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            {copied ? (
              <>
                <CheckCircle2 size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Referral Letter */}
          <div className="mb-8">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Referral Letter</h2>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {referralData.referralLetter}
              </pre>
            </div>
          </div>

          {/* EMR Snapshot */}
          {referralData.emrSnapshot && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <EmrSnapshotVisual emrSnapshot={referralData.emrSnapshot} />
            </div>
          )}

          {/* Patient Timeline */}
          {referralData.timelineSummary && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Patient Timeline</h3>
              <p className="text-xs text-gray-500 mb-3">
                Chronological view of EMR events and labs leading up to this consultation.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <ol className="space-y-3">
                  {referralData.timelineSummary.split('\n').map((line, index) => {
                    const trimmed = line.replace(/^-\s*/, '').trim();
                    if (!trimmed) return null;
                    const parts = trimmed.split('|').map((p) => p.trim());
                    const datePart = parts[0] ?? '';
                    const sourcePart = (parts[1] ?? '').toLowerCase();
                    const label = parts.slice(2).join(' | ').replace(/^:+/, '').trim();

                    let sourceLabel = 'EMR';
                    let sourceUrl: string | null = null;
                    let sourceColor = 'bg-gray-100 text-gray-700';

                    if (sourcePart === 'prechart') {
                      sourceLabel = 'Pre-chart EMR';
                      sourceUrl = 'https://www.open-emr.org/';
                      sourceColor = 'bg-blue-50 text-blue-700';
                    } else if (sourcePart === 'emr') {
                      sourceLabel = 'EMR Snapshot';
                      sourceUrl = 'https://www.open-emr.org/';
                      sourceColor = 'bg-green-50 text-green-700';
                    } else if (sourcePart === 'session') {
                      sourceLabel = 'Heidi Session';
                      sourceUrl = null;
                      sourceColor = 'bg-purple-50 text-purple-700';
                    } else if (sourcePart === 'transcript') {
                      sourceLabel = 'From Transcript';
                      sourceUrl = null;
                      sourceColor = 'bg-orange-50 text-orange-700';
                    }

                    return (
                      <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {datePart}
                          </p>
                          {label && (
                            <p className="text-sm text-gray-600 mt-0.5">
                              {label}
                            </p>
                          )}
                          <div className="mt-1.5">
                            {sourceUrl ? (
                              <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-block text-[10px] ${sourceColor} px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity`}
                              >
                                {sourceLabel}
                              </a>
                            ) : (
                              <span className={`inline-block text-[10px] ${sourceColor} px-2 py-0.5 rounded-full font-medium`}>
                                {sourceLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          {/* Note Preview */}
          {referralData.notePreview && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Source Context</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-xs text-gray-700">
                  {referralData.notePreview}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

