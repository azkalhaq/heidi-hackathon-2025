'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  ChevronDown,
  Pencil,
  RefreshCw,
  Trash2,
  Calendar,
  Globe,
  Zap,
  Copy,
  Undo2,
  Redo2,
  MoreVertical,
  Loader2,
  ListTodo,
  AlertTriangle,
  Pill,
  Activity,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  X,
  Lock,
} from 'lucide-react';
import EmrSnapshotPanel from '@/components/EmrSnapshotPanel';
import EmrSnapshotVisual from '@/components/EmrSnapshotVisual';
import type { EmrSnapshotData } from '@/types/emr';
import type { PrechartData } from '@/types/prechart';

interface MainContentProps {
  selectedSessionId: string | null;
  onNoteContentChange?: (content: string | null) => void;
  onToggleTasksPanel?: () => void;
  isTasksPanelOpen?: boolean;
  onVoiceLogChange?: (voiceLog: { id: string; title: string; description: string; timestamp: string }[]) => void;
}

interface SessionDetailPayload {
  id: string;
  patientName: string;
  createdAt: string | null;
  durationSeconds: number | null;
  languageCode: string | null;
  consultNoteStatus: string | null;
  noteResult: string | null;
  heading: string | null;
}

// Minimal SpeechRecognition types for browsers that support the Web Speech API.
// These are intentionally lightweight to avoid pulling in DOM lib typings.
interface MinimalSpeechRecognitionEvent {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface MinimalSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface ReferralDraft {
  service: string;
  reason: string;
  patientName: string;
  notePreview: string;
  emrSnapshot?: EmrSnapshotData | null;
}

function looseMatch(text: string, patterns: string[]): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
  return patterns.some((pattern) => {
    const normP = pattern.toLowerCase().replace(/[^a-z]/g, '');
    if (!normP) return false;
    if (normalized.includes(normP)) return true;
    const sliceLen = Math.max(3, Math.floor(normP.length * 0.6));
    return normalized.includes(normP.slice(0, sliceLen));
  });
}

// Mock data for demo purposes
const getMockPrechartData = (patientName: string): PrechartData => ({
  demographics: {
    name: patientName || 'John Doe',
    dob: '1985-03-15',
    sex: 'Male',
  },
  reasonForVisit: 'Follow-up visit for dental abscess. Patient reports improvement in pain but still experiencing some discomfort when chewing.',
  pastEncounters: [
    {
      date: '2024-11-20',
      summary: 'Initial consultation for dental abscess. Prescribed amoxicillin and pain relief. Scheduled follow-up.',
    },
    {
      date: '2024-10-15',
      summary: 'Routine dental cleaning and examination. No issues found.',
    },
  ],
  vitals: [
    { label: 'Blood Pressure', value: '120/80 mmHg' },
    { label: 'Heart Rate', value: '72 bpm' },
    { label: 'Temperature', value: '98.6°F' },
    { label: 'Weight', value: '175 lbs' },
  ],
  flags: [
    'Allergy: Penicillin - Use alternative antibiotics',
    'Recent lab results pending review',
  ],
});

const getMockEmrSnapshotData = (): EmrSnapshotData => ({
  problems: [
    { name: 'Dental Abscess, Lower Right First Molar', onsetDate: '2024-11-20' },
    { name: 'Hypertension', onsetDate: '2020-05-10' },
    { name: 'Type 2 Diabetes Mellitus', onsetDate: '2019-08-15' },
  ],
  medications: [
    { name: 'Amoxicillin', dose: '500mg', frequency: 'Three times daily' },
    { name: 'Ibuprofen', dose: '400mg', frequency: 'As needed for pain' },
    { name: 'Metformin', dose: '1000mg', frequency: 'Twice daily' },
    { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily' },
  ],
  allergies: [
    { substance: 'Penicillin', reaction: 'Rash and hives' },
    { substance: 'Latex', reaction: 'Contact dermatitis' },
  ],
  labs: [
    { test: 'Hemoglobin A1c', value: '7.2', unit: '%', date: '2024-11-01' },
    { test: 'Fasting Glucose', value: '135', unit: 'mg/dL', date: '2024-11-01' },
    { test: 'Complete Blood Count', value: 'Normal', date: '2024-10-15' },
  ],
  metadata: {
    source: 'mock',
    message: 'Showing mock EMR data for demo purposes',
  },
});

const GENERIC_REFERRAL_TEMPLATE = `[Today's Date]

Dear [Name and title of clinician the letter is addressed to], (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

Re: [Patient’s full name] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

"Thank you for seeing the patient below."

I am writing to refer my patient, [Patient’s full name] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely), who is known with [Known medical conditions including past diagnoses, chronic diseases or relevant background medical history] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely) and is currently using [Medications, including prescription medications, over-the-counter medications, supplements] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely).

[He/She/They] (Only include gender-specific pronouns if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise use gender-neutral pronouns by default) presented to me today with the following problem which includes [History of presenting complaint, current concerns or symptoms, clinical context, relevant background to the issue, and discussion topics covered] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely. Write in full sentences.)

Your expertise would be greatly appreciated in assisting with further management strategies for this patient.

"Thank you for your attention to this matter."

Yours sincerely,

[Clinician’s title, full name and surname] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)
[Clinician type or specialty] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)
[Clinician’s contact details or registration number] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

(Never come up with your own patient details, medical history, symptoms, diagnosis, assessment, management plan or clinician information—use only what is explicitly provided in the transcript, contextual notes or clinical note. If information related to a placeholder has not been mentioned, omit that section or placeholder entirely. Do not insert generic statements, summaries, or assumptions in place of missing data. Maintain the letter’s structure and tone, ensuring the final document is clinically accurate.)`;

export default function MainContent({ 
  selectedSessionId, 
  onNoteContentChange,
  onToggleTasksPanel,
  isTasksPanelOpen,
  onVoiceLogChange,
}: MainContentProps) {
  const [sessionDetails, setSessionDetails] = useState<SessionDetailPayload | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmrPanelOpen, setIsEmrPanelOpen] = useState(false);
  const [emrSnapshot, setEmrSnapshot] = useState<EmrSnapshotData | null>(null);
  const [isEmrLoading, setIsEmrLoading] = useState(false);
  const [emrError, setEmrError] = useState<string | null>(null);
  const [prechart, setPrechart] = useState<PrechartData | null>(null);
  const [isPrechartLoading, setIsPrechartLoading] = useState(false);
  const [prechartError, setPrechartError] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceLog, setVoiceLog] = useState<
    { id: string; title: string; description: string; timestamp: string }[]
  >([]);
  const [activeTemplate, setActiveTemplate] = useState<string>('Goldilocks');
  const [referralDraft, setReferralDraft] = useState<ReferralDraft | null>(null);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [referralGenerationError, setReferralGenerationError] = useState<string | null>(null);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [activeTab, setActiveTab] = useState<'context' | 'transcript' | 'note'>('note');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  const noteContent =
    sessionDetails?.noteResult ?? 'No consult note is available yet.';
  const patientNameForDisplay = sessionDetails?.patientName ?? 'No session selected';
  const normalizedNoteForEmr =
    noteContent === 'No consult note is available yet.' ? '' : noteContent;
  const patientNameForEmr =
    sessionDetails?.patientName && sessionDetails.patientName !== 'Unknown patient'
      ? sessionDetails.patientName
      : '';

  const fetchSessionDetails = useCallback(async () => {
    if (!selectedSessionId) {
      setSessionDetails(null);
      setTranscription(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/heidi/sessions/${selectedSessionId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to fetch session');
      }

      setSessionDetails(payload.session);
      setTranscription(payload.transcription ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error loading session',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSessionId]);

  const fetchEmrSnapshot = useCallback(async () => {
    setIsEmrLoading(true);
    setEmrError(null);
    try {
      const response = await fetch('/api/emr-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteContent: normalizedNoteForEmr,
          patientName: patientNameForEmr,
        }),
      });
      const payload = (await response.json()) as EmrSnapshotData & { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to fetch EMR snapshot');
      }
      setEmrSnapshot(payload);
    } catch (err) {
      // Use mock data for demo purposes when API fails
      console.warn('EMR Snapshot API failed, using mock data for demo:', err);
      setEmrSnapshot(getMockEmrSnapshotData());
      setEmrError(null); // Clear error so UI shows mock data
    } finally {
      setIsEmrLoading(false);
    }
  }, [normalizedNoteForEmr, patientNameForEmr]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  useEffect(() => {
    if (onNoteContentChange) {
      const content =
        sessionDetails?.noteResult ?? 'No consult note is available yet.';
      onNoteContentChange(
        content === 'No consult note is available yet.' ? null : content,
      );
    }
  }, [sessionDetails?.noteResult, onNoteContentChange]);

  useEffect(() => {
    if (onVoiceLogChange) {
      onVoiceLogChange(voiceLog);
    }
  }, [voiceLog, onVoiceLogChange]);

  const handleTranscribe = async () => {
    if (!selectedSessionId) return;
    setIsRefreshing(true);
    await fetchSessionDetails();
  };

  const fetchPrechart = useCallback(async () => {
    if (!selectedSessionId && !patientNameForEmr) return;
    setIsPrechartLoading(true);
    setPrechartError(null);
    try {
      const response = await fetch('/api/prechart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          patientName: patientNameForEmr || patientNameForDisplay,
        }),
      });
      const payload = (await response.json()) as { prechart?: PrechartData; error?: string };
      if (!response.ok || !payload.prechart) {
        throw new Error(payload.error ?? 'Failed to load pre-chart data');
      }
      setPrechart(payload.prechart);
    } catch (err) {
      // Use mock data for demo purposes when API fails
      console.warn('Pre-chart API failed, using mock data for demo:', err);
      setPrechart(getMockPrechartData(patientNameForEmr || patientNameForDisplay));
      setPrechartError(null); // Clear error so UI shows mock data
    } finally {
      setIsPrechartLoading(false);
    }
  }, [patientNameForDisplay, patientNameForEmr, selectedSessionId]);

  const handleOpenEmrSnapshot = () => {
    setIsEmrPanelOpen(true);
  };

  const generateReferral = useCallback(async (
    service: string,
    patientName: string,
    noteContent: string,
  ) => {
    setIsGeneratingReferral(true);
    setReferralGenerationError(null);
    try {
      const response = await fetch('/api/generate-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteContent,
          patientName,
          service,
          prechart: prechart || null,
          emrSnapshot: emrSnapshot || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to generate referral letter');
      }
      // Use the EMR snapshot from state (what we sent) or from payload (what was returned)
      // If neither exists, use mock data for demo purposes
      const finalEmrSnapshot = emrSnapshot || payload.emrSnapshot || getMockEmrSnapshotData();
      
      console.log('[Referral Generation] EMR Snapshot:', {
        fromState: emrSnapshot,
        fromPayload: payload.emrSnapshot,
        final: finalEmrSnapshot,
        patientName,
        hasProblems: finalEmrSnapshot?.problems?.length,
        hasMeds: finalEmrSnapshot?.medications?.length,
      });

      const draftData = {
        service,
        reason: payload.referralLetter || GENERIC_REFERRAL_TEMPLATE,
        patientName,
        notePreview:
          noteContent !== 'No consult note is available yet.'
            ? noteContent.slice(0, 400)
            : '',
        emrSnapshot: finalEmrSnapshot,
      };
      
      console.log('[Referral Generation] Setting draft with EMR snapshot:', draftData.emrSnapshot);
      setReferralDraft(draftData);
      // Auto-open inline share panel when referral is ready
      setShowShareModal(true);
    } catch (err) {
      setReferralGenerationError(
        err instanceof Error ? err.message : 'Unknown error generating referral',
      );
      // Fallback to template if generation fails
      // Still include EMR snapshot if available
      const fallbackEmrSnapshot = emrSnapshot || getMockEmrSnapshotData();
      setReferralDraft({
        service,
        reason: GENERIC_REFERRAL_TEMPLATE,
        patientName,
        notePreview:
          noteContent !== 'No consult note is available yet.'
            ? noteContent.slice(0, 400)
            : '',
        emrSnapshot: fallbackEmrSnapshot,
      });
      setShowShareModal(true);
    } finally {
      setIsGeneratingReferral(false);
    }
  }, [prechart, emrSnapshot, noteContent]);

  const handleShareReferral = async () => {
    if (!referralDraft) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const response = await fetch('/api/referral/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralLetter: referralDraft.reason,
          emrSnapshot: referralDraft.emrSnapshot,
          patientName: referralDraft.patientName,
          service: referralDraft.service,
          notePreview: referralDraft.notePreview,
          password: sharePassword || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create shareable link');
      }

      setShareUrl(payload.shareUrl);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to share referral');
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2000);
    }
  };

  const copySharePassword = () => {
    if (sharePassword) {
      navigator.clipboard.writeText(sharePassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const generateRandomPassword = () => {
    // Simple random secret key generator for demo purposes
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const length = 12;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSharePassword(result);
  };

  useEffect(() => {
    setEmrSnapshot(null);
    setEmrError(null);
    setIsEmrLoading(false);
    setPrechart(null);
    setPrechartError(null);
    setIsPrechartLoading(false);
    setLastVoiceCommand(null);
    setVoiceError(null);
  }, [selectedSessionId]);

  // Voice command handling (browser-only, uses Web Speech API where available)
  const handleVoiceCommand = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setLastVoiceCommand(text);
      setVoiceError(null);

      const pushVoiceLog = (title: string, description: string) => {
        setVoiceLog((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title,
            description,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);
      };

      const lc = text.toLowerCase();

      if (
        looseMatch(lc, ['pre chart', 'pre-chart', 'prechart', 'pre charting', 'free chart'])
      ) {
        void fetchPrechart();
        pushVoiceLog('Pre-chart requested', 'Gathering visit context from OpenEMR.');
        return;
      }
      if (
        looseMatch(lc, [
          'fetch emr',
          'emr snapshot',
          'fetch snapshot',
          'fetch from emr',
          'open emr',
        ])
      ) {
        void fetchEmrSnapshot();
        pushVoiceLog('EMR snapshot requested', 'Refreshing snapshot panel with latest data.');
        return;
      }
      if (
        looseMatch(lc, [
          'start referral',
          'referral',
          'refer',
          'send referral',
          'generate referral',
          'create referral',
          'new referral',
          'make referral',
          'open referral',
        ])
      ) {
        const inferredService =
          looseMatch(lc, ['cardio', 'cardiology'])
            ? 'Cardiology'
            : looseMatch(lc, ['neuro', 'neurology'])
            ? 'Neurology'
            : looseMatch(lc, ['gastro', 'gi'])
            ? 'Gastroenterology'
            : 'Specialist clinic';
        void generateReferral(
          inferredService,
          patientNameForDisplay,
          noteContent,
        );
        pushVoiceLog(
          'Referral initiated',
          'Generating referral letter from consult note using AI...',
        );
        return;
      }
      if (
        looseMatch(lc, ['send summary', 'send note', 'email', 'message patient', 'send letter'])
      ) {
        pushVoiceLog(
          'Post-visit summary queued',
          'Drafted patient summary and routed it to the preferred communication channel.',
        );
        return;
      }
      if (looseMatch(lc, ['select template', 'auto template', 'choose template'])) {
        const suggested =
          looseMatch(lc + ' ' + noteContent.toLowerCase(), ['abdominal'])
            ? 'Abdominal Pain – ED'
            : prechart?.reasonForVisit?.toLowerCase().includes('follow') ?? false
            ? 'Follow-up Visit'
            : 'General Acute Visit';
        setActiveTemplate(suggested);
        pushVoiceLog('Template selected', `Activated "${suggested}" for this consultation.`);
        return;
      }

      setVoiceError('Voice command not recognized. Try: "pre chart", "fetch EMR", or "start referral".');
    },
    [fetchEmrSnapshot, fetchPrechart, noteContent, patientNameForDisplay, prechart?.reasonForVisit, generateReferral],
  );

  const startVoiceRecognition = useCallback(() => {
    type WithSpeechRecognition = Window &
      typeof globalThis & {
        SpeechRecognition?: new () => MinimalSpeechRecognition;
        webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
      };
    const w = window as WithSpeechRecognition;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceActive(true);
        setVoiceError(null);
      };

      recognition.onerror = (speechEvent: unknown) => {
        setIsVoiceActive(false);
        recognitionRef.current = null;
        const anyEvent = speechEvent as { error?: string };
        setVoiceError(anyEvent.error || 'Voice recognition error');
      };

      recognition.onresult = (speechEvent: MinimalSpeechRecognitionEvent) => {
        setIsVoiceActive(false);
        recognitionRef.current = null;
        const transcript = speechEvent.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setVoiceError(
        err instanceof Error
          ? err.message
          : 'Unable to start voice recognition in this environment.',
      );
    }
  }, [handleVoiceCommand]);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    setIsVoiceActive(false);
    setShowVoiceCommands(false);
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Ctrl+Shift+H toggles voice listening
    // Keyboard shortcut: ? shows available commands when voice is active
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        startVoiceRecognition();
      }
      if (event.key === '?' && isVoiceActive) {
        event.preventDefault();
        setShowVoiceCommands(!showVoiceCommands);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startVoiceRecognition, isVoiceActive, showVoiceCommands]);

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || Number.isNaN(seconds)) {
      return 'Unknown duration';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const formatDate = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'Unknown date';
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const transcriptContent =
    transcription ?? 'No transcription has been generated for this session.';

  return (
    <>
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      {isVoiceActive && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center mt-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg border border-purple-200">
            <div className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-60 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-purple-800 tracking-wide uppercase">
                Listening for command
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceCommands(!showVoiceCommands)}
                className="text-left text-[11px] text-purple-600 hover:text-purple-800 underline"
              >
                {showVoiceCommands ? 'Hide' : 'Show'} available commands (Press ?)
              </button>
            </div>
            <button
              type="button"
              onClick={stopVoiceRecognition}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Stop listening"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
      )}
      {showVoiceCommands && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center mt-4 px-4">
          <div className="pointer-events-auto bg-white rounded-lg shadow-xl border border-purple-200 p-4 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Available Voice Commands</h3>
              <button
                type="button"
                onClick={() => setShowVoiceCommands(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Pre-charting</p>
                <ul className="space-y-0.5 text-gray-600">
                  <li>• &quot;Pre chart from EMR&quot;</li>
                  <li>• &quot;Pre-chart&quot;</li>
                  <li>• &quot;Pre charting&quot;</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">EMR Snapshot</p>
                <ul className="space-y-0.5 text-gray-600">
                  <li>• &quot;Fetch EMR snapshot&quot;</li>
                  <li>• &quot;Fetch from EMR&quot;</li>
                  <li>• &quot;Open EMR&quot;</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Referral</p>
                <ul className="space-y-0.5 text-gray-600">
                  <li>• &quot;Generate referral&quot;</li>
                  <li>• &quot;Send referral&quot;</li>
                  <li>• &quot;Create referral&quot;</li>
                  <li>• &quot;Start referral&quot;</li>
                  <li>• &quot;New referral&quot;</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Communication</p>
                <ul className="space-y-0.5 text-gray-600">
                  <li>• &quot;Send summary&quot;</li>
                  <li>• &quot;Email patient&quot;</li>
                  <li>• &quot;Message patient&quot;</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Template</p>
                <ul className="space-y-0.5 text-gray-600">
                  <li>• &quot;Select template&quot;</li>
                  <li>• &quot;Auto template&quot;</li>
                  <li>• &quot;Choose template&quot;</li>
                </ul>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 pt-3 border-t border-gray-200">
              Tip: Commands are flexible - you can use variations like &quot;Generate Referral&quot;, &quot;Send Referral&quot;, or &quot;Create Referral&quot; - they all work the same way.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Right Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-3">
          {onToggleTasksPanel && (
            <button
              onClick={onToggleTasksPanel}
              className={`inline-flex items-center gap-2 bg-white border font-medium py-2.5 px-4 rounded-lg transition-colors ${
                isTasksPanelOpen
                  ? 'border-purple-200 text-purple-700 hover:bg-purple-50'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ListTodo size={18} />
              <span>Tasks</span>
            </button>
          )}
          <button
            onClick={handleTranscribe}
            disabled={!selectedSessionId || isRefreshing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            {isRefreshing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mic size={18} />
            )}
              <span>Transcribe</span>
            </button>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-mono text-sm">00:00</span>
            <div className="flex items-center gap-1">
              <Mic size={14} className={isVoiceActive ? 'text-purple-600' : ''} />
              <div className="flex gap-0.5 items-end h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${
                      isVoiceActive
                        ? 'bg-purple-600 voice-bar-animated'
                        : 'bg-green-500'
                    }`}
                    style={
                      isVoiceActive
                        ? {
                            animationDelay: `${i * 0.15}s`,
                          }
                        : { height: '16px' }
                    }
                  />
                ))}
              </div>
            </div>
            <ChevronDown size={16} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              type="button"
              onClick={startVoiceRecognition}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition-colors ${
                isVoiceActive
                  ? 'border-purple-400 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Mic size={12} />
              <span>{isVoiceActive ? 'Listening…' : 'Voice: Ctrl+Shift+H or click'}</span>
            </button>
          </div>
        </div>

        {/* Session Details */}
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {patientNameForDisplay}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <Pencil size={14} />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <RefreshCw size={14} />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
             <button
               onClick={handleOpenEmrSnapshot}
               className="inline-flex items-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-1.5 px-3 rounded-lg transition-colors text-sm"
             >
               <Loader2
                 size={14}
                 className={`${
                   isEmrLoading ? 'opacity-100 animate-spin' : 'opacity-0'
                 } transition-opacity`}
               />
               <span>{isEmrLoading ? 'Fetching EMR…' : 'EMR Snapshot'}</span>
             </button>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{formatDate(sessionDetails?.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>{sessionDetails?.languageCode ?? 'Unknown language'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500" />
              <span>{formatDuration(sessionDetails?.durationSeconds ?? null)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('context')}
              className={`py-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'context'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
            Context
          </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'transcript'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
            Transcript
          </button>
            <button
              onClick={() => setActiveTab('note')}
              className={`py-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'note'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
            <Pencil size={14} />
            <span>Note</span>
            </button>
          </div>
          <button
            onClick={() => {
              if (noteContent !== 'No consult note is available yet.' && patientNameForDisplay !== 'No session selected') {
                void generateReferral('Specialist clinic', patientNameForDisplay, noteContent);
              }
            }}
            disabled={isGeneratingReferral || noteContent === 'No consult note is available yet.' || patientNameForDisplay === 'No session selected'}
            className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium py-1.5 px-3 rounded-lg transition-colors text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
          >
            <Loader2
              size={14}
              className={`${
                isGeneratingReferral ? 'opacity-100 animate-spin' : 'opacity-0'
              } transition-opacity`}
            />
            <span>{isGeneratingReferral ? 'Generating…' : 'Generate Referral'}</span>
          </button>
        </div>

        {/* Note Actions - Only show when Note tab is active */}
        {activeTab === 'note' && (
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Select a template
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 transition-colors">
              <Pencil size={14} />
                <span>{activeTemplate}</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Mic size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Undo2 size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <Redo2 size={18} />
            </button>
            <button className="text-gray-400 hover:text-gray-600 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 flex items-center gap-1.5 transition-colors">
              <Copy size={16} />
              <span>Copy</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {voiceError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs">
              {voiceError}
            </div>
          )}
          {lastVoiceCommand && !voiceError && (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 rounded-lg text-xs flex items-center justify-between">
              <span>
                Last voice command:&nbsp;
                <span className="font-mono">"{lastVoiceCommand}"</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide">
                Parsed & routed
              </span>
            </div>
          )}

          {/* Context Tab Content */}
          {activeTab === 'context' && (
            <>
              {/* Pre-chart Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                        Pre-chart
                      </p>
                      {prechart && !prechartError && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Demo Data
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Visit context from EMR
            </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Pulled from OpenEMR via desktop RPA. Read-only, no changes are made.
            </p>
          </div>
              <button
                    onClick={fetchPrechart}
                    disabled={isPrechartLoading}
                    className="inline-flex items-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-1.5 px-3 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                  >
                    {isPrechartLoading && <Loader2 size={14} className="animate-spin" />}
                    <span>{isPrechartLoading ? 'Pre-charting…' : 'Pre-chart from EMR'}</span>
                  </button>
          </div>

            {prechartError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {prechartError}
              </div>
            )}

            {isPrechartLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ) : prechart ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Demographics</h3>
                  <p className="text-sm text-gray-700">
                    {prechart.demographics.name}
                    {prechart.demographics.dob && ` · DOB: ${prechart.demographics.dob}`}
                    {prechart.demographics.sex && ` · Sex: ${prechart.demographics.sex}`}
                  </p>
                </div>

                {prechart.reasonForVisit && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Reason for visit
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {prechart.reasonForVisit}
                    </p>
                  </div>
                )}

                {prechart.pastEncounters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Recent encounters
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {prechart.pastEncounters.map((encounter, idx) => (
                        <li key={`${encounter.date}-${idx}`} className="border border-gray-200 rounded-md px-3 py-2">
                          <div className="text-xs text-gray-500 mb-0.5">
                            {encounter.date || 'Unknown date'}
                          </div>
                          <div className="whitespace-pre-wrap">{encounter.summary}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {prechart.vitals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Recent vitals</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                      {prechart.vitals.map((vital, idx) => (
                        <div key={`${vital.label}-${idx}`} className="flex justify-between">
                          <dt className="text-gray-500">{vital.label}</dt>
                          <dd className="font-medium">{vital.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {prechart.flags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Flags & alerts</h3>
                    <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                      {prechart.flags.map((flag, idx) => (
                        <li key={`${flag}-${idx}`}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!prechart.reasonForVisit &&
                  !prechart.pastEncounters.length &&
                  !prechart.vitals.length &&
                  !prechart.flags.length && (
                    <p className="text-xs text-gray-500">
                      No additional pre-chart information was found in the EMR.
                    </p>
                  )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No pre-chart data loaded yet. Click &quot;Pre-chart from EMR&quot; to pull
                context from OpenEMR.
              </p>
            )}
              </div>

              {/* EMR Snapshot Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                <div className="flex items-center gap-2">
                      <Activity className="text-purple-600" size={20} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                            EMR Snapshot
                          </p>
                          {emrSnapshot?.metadata?.source === 'mock' && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              Demo Data
                            </span>
                          )}
                          {emrSnapshot && emrSnapshot.metadata?.source !== 'mock' && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Live
                            </span>
                          )}
                </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Current EMR Data
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Latest patient data from OpenEMR. Click to view full snapshot panel.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
              <button
                      onClick={handleOpenEmrSnapshot}
                      disabled={isEmrLoading}
                      className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-medium py-1.5 px-3 rounded-lg text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Loader2
                        size={14}
                        className={`${
                          isEmrLoading ? 'opacity-100 animate-spin' : 'opacity-0'
                        } transition-opacity`}
                      />
                      <Eye size={14} />
                      <span>{isEmrLoading ? 'Fetching…' : 'View Full'}</span>
              </button>
                    <button
                      onClick={() => void fetchEmrSnapshot()}
                      disabled={isEmrLoading}
                      className="inline-flex items-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-1.5 px-3 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors"
                      title="Refresh EMR data"
                    >
                      <RefreshCw size={14} className={isEmrLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {emrError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {emrError}
                  </div>
                )}

                {isEmrLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ) : emrSnapshot ? (
                  <div className="space-y-4">
                    {emrSnapshot.problems && emrSnapshot.problems.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={18} />
                            <h3 className="text-sm font-semibold text-gray-900">Problems</h3>
                            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              {emrSnapshot.problems.length}
                            </span>
                </div>
                  <button
                            onClick={handleOpenEmrSnapshot}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View All
              </button>
                        </div>
                        <div className="space-y-2">
                          {emrSnapshot.problems.slice(0, 3).map((problem, idx) => (
                            <div
                              key={`${problem.name}-${idx}`}
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
                            </div>
                          ))}
                          {emrSnapshot.problems.length > 3 && (
                  <button
                              onClick={handleOpenEmrSnapshot}
                              className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              +{emrSnapshot.problems.length - 3} more problems
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {emrSnapshot.medications && emrSnapshot.medications.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Pill className="text-blue-500" size={18} />
                            <h3 className="text-sm font-semibold text-gray-900">Medications</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              {emrSnapshot.medications.length}
                            </span>
                          </div>
                  <button
                            onClick={handleOpenEmrSnapshot}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View All
                  </button>
                        </div>
                        <div className="space-y-2">
                          {emrSnapshot.medications.slice(0, 3).map((med, idx) => (
                            <div
                              key={`${med.name}-${idx}`}
                              className="border border-blue-100 bg-blue-50/50 rounded-lg px-4 py-3 text-sm hover:bg-blue-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
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
                            </div>
                          ))}
                          {emrSnapshot.medications.length > 3 && (
                            <button
                              onClick={handleOpenEmrSnapshot}
                              className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              +{emrSnapshot.medications.length - 3} more medications
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {emrSnapshot.allergies && emrSnapshot.allergies.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="text-amber-500" size={18} />
                            <h3 className="text-sm font-semibold text-gray-900">Allergies</h3>
                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              {emrSnapshot.allergies.length}
                            </span>
                          </div>
                          <button
                            onClick={handleOpenEmrSnapshot}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View All
                  </button>
                        </div>
                        <div className="space-y-2">
                          {emrSnapshot.allergies.map((allergy, idx) => (
                            <div
                              key={`${allergy.substance}-${idx}`}
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!emrSnapshot.problems || emrSnapshot.problems.length === 0) &&
                      (!emrSnapshot.medications || emrSnapshot.medications.length === 0) &&
                      (!emrSnapshot.allergies || emrSnapshot.allergies.length === 0) && (
                        <p className="text-xs text-gray-500">
                          No EMR data available. Click &quot;View EMR Snapshot&quot; to fetch from OpenEMR.
                        </p>
                      )}
          </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No EMR snapshot loaded yet. Click &quot;View EMR Snapshot&quot; to fetch current patient data from OpenEMR.
                  </p>
                )}
        </div>
            </>
          )}

          {/* Transcript Tab Content */}
          {activeTab === 'transcript' && (
            <>
              {isLoading ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                    Transcript
                  </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mic size={14} />
                      <span>Synced from Heidi</span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {transcriptContent}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Note Tab Content */}
          {activeTab === 'note' && (
            <>
              {isLoading ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {sessionDetails?.consultNoteStatus ?? 'UNKNOWN'}
                      </p>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {sessionDetails?.heading ?? 'Consult Note'}
                      </h2>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {noteContent}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
      <EmrSnapshotPanel
        isOpen={isEmrPanelOpen}
        onClose={() => setIsEmrPanelOpen(false)}
        onFetch={() => void fetchEmrSnapshot()}
        isLoading={isEmrLoading}
        error={emrError}
        data={emrSnapshot}
      />
      {(referralDraft || isGeneratingReferral) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReferralDraft(null);
              setIsGeneratingReferral(false);
              setReferralGenerationError(null);
            }
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-indigo-100 flex flex-col">
            <div className="flex-shrink-0 px-8 pt-8 pb-4 border-b border-gray-200">
              <button
                type="button"
                    onClick={() => {
                  setReferralDraft(null);
                  setIsGeneratingReferral(false);
                  setReferralGenerationError(null);
                    }}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-sm z-10"
                  >
                Close
                  </button>
              <div>
                <p className="text-xs font-semibold uppercase text-indigo-600 tracking-wide">
                  Edit template
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generic Referral Letter
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {isGeneratingReferral
                    ? 'Generating referral letter from consult note using AI...'
                    : 'Generated from consult note using AI. Review and send when ready.'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8">
              <div className="space-y-3 text-sm pb-4">
              {referralGenerationError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
                  {referralGenerationError}
                </div>
              )}
              {isGeneratingReferral && !referralDraft && (
                <div className="mt-2 border border-gray-200 rounded-xl bg-gray-50 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Generating referral letter from consult note...</p>
                    <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
            </div>
                </div>
              )}
              {referralDraft && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Patient:&nbsp;
                      <span className="font-medium text-gray-800">
                        {referralDraft.patientName || 'Not specified'}
                      </span>
                    </span>
                    <span>
                      Service:&nbsp;
                      <span className="font-medium text-gray-800">
                        {referralDraft.service}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Template body</span>
                      <span className="text-[10px] text-gray-400">
                        AI-generated from consult note
                      </span>
                    </div>
                    <div className="px-4 py-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-mono">
                      <TypingText key={referralDraft.reason.slice(0, 50)} text={referralDraft.reason} />
                    </div>
                  </div>

                  {/* EMR Snapshot Visualization */}
                  {referralDraft.emrSnapshot ? (
                    <div className="mt-6">
                      <EmrSnapshotVisual emrSnapshot={referralDraft.emrSnapshot} />
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 text-center">
                        No EMR snapshot data available. Fetch EMR snapshot from the Context tab to include patient data in the referral.
            </p>
          </div>
                  )}
                </>
              )}

              {referralDraft?.notePreview && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Note excerpt (source context for this referral)
                  </label>
                  <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-800 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {referralDraft.notePreview}
                  </div>
                </div>
              )}

              </div>
            </div>
            {/* Footer with Close + Sharing controls */}
            <div className="flex-shrink-0 px-8 py-3 border-t border-gray-200 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => {
                  setReferralDraft(null);
                  setIsGeneratingReferral(false);
                  setReferralGenerationError(null);
                  setShowShareModal(false);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors self-end md:self-auto"
              >
                <span>Close</span>
              </button>
              <div className="flex flex-col md:flex-row md:items-center gap-2 text-[11px]">
                {/* Password controls */}
                <div className="flex items-center gap-2">
                  <Lock className="text-gray-400" size={14} />
                  <input
                    type="text"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Password / secret (optional)"
                    className="w-40 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Zap size={12} />
                    <span>Gen</span>
                  </button>
                  <button
                    type="button"
                    onClick={copySharePassword}
                    disabled={!sharePassword}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Copy size={12} />
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {/* Link controls */}
                <div className="flex items-center gap-2">
                  {shareUrl && (
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="hidden md:block w-52 px-2 py-1 bg-white border border-green-200 rounded text-[11px] font-mono"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleShareReferral}
                    disabled={isSharing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-medium hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Share2 size={12} />
                        {shareUrl ? 'Refresh link' : 'Create link'}
                      </>
                    )}
                  </button>
                  {shareUrl && (
                    <>
                      <button
                        type="button"
                        onClick={copyShareUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        {copiedShareUrl ? (
                          <>
                            <CheckCircle2 size={12} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Link
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = shareUrl;
                          if (!url) return;
                          const subject = encodeURIComponent('Secure referral link');
                          const bodyLines = [
                            'Here is your secure referral link:',
                            '',
                            url,
                            '',
                            sharePassword
                              ? `Password / Secret key: ${sharePassword}`
                              : 'This link is not password protected.',
                            '',
                            'Please keep this information confidential.',
                          ];
                          const body = encodeURIComponent(bodyLines.join('\n'));
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        <Share2 size={12} />
                        Email
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

interface TypingTextProps {
  text: string;
}

function TypingText({ text }: TypingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!text) {
      return;
    }
    // Start typing from empty
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
        intervalRef.current = null;
      }
    }, 12);
    intervalRef.current = interval;
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text]);

  const isTyping = displayed.length < text.length;

  return (
    <span>
      {displayed}
      <span
        className={`ml-0.5 inline-block w-[1px] h-[1em] align-middle ${
          isTyping ? 'bg-gray-700 animate-pulse' : 'bg-transparent'
        }`}
      />
    </span>
  );
}

