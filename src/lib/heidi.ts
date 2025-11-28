'use server';

import { HEIDI_API_BASE_URL } from './heidi/constants';

interface JwtResponse {
  token: string;
  expiration_time?: string;
}

export interface HeidiPatient {
  name?: string | null;
  gender?: string | null;
  dob?: string | null;
}

export interface HeidiConsultNote {
  status?: string | null;
  result?: string | null;
  heading?: string | null;
}

export interface HeidiSessionDetails {
  session_id: string;
  session_name?: string | null;
  patient?: HeidiPatient | null;
  duration?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  language_code?: string | null;
  output_language_code?: string | null;
  consult_note?: HeidiConsultNote | null;
}

export interface HeidiSessionResponse {
  session: HeidiSessionDetails;
}

export interface HeidiTranscriptionResponse {
  transcription?: string | null;
}

export interface HeidiSessionSummary {
  id: string;
  name: string | null;
  patientName: string;
  createdAt: string | null;
  updatedAt: string | null;
  durationSeconds: number | null;
  languageCode: string | null;
  consultNoteStatus: string | null;
  notePreview: string | null;
  template?: string | null;
}

export interface HeidiSessionsResponse {
  sessions: HeidiSessionSummary[];
  errors: { id: string; message: string }[];
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

function assertApiKey(): string {
  const apiKey = process.env.HEIDI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing HEIDI_API_KEY. Please set it in your environment before calling the Heidi API.',
    );
  }
  return apiKey;
}

function getCachedToken(): string | null {
  if (!cachedToken) {
    return null;
  }
  const bufferMs = 60 * 1000;
  if (Date.now() >= cachedToken.expiresAt - bufferMs) {
    cachedToken = null;
    return null;
  }
  return cachedToken.token;
}

async function fetchJwtToken(): Promise<string> {
  const existingToken = getCachedToken();
  if (existingToken) {
    return existingToken;
  }

  const url = new URL(`${HEIDI_API_BASE_URL}/jwt`);
  const email =
    process.env.HEIDI_SAMPLE_EMAIL ??
    process.env.HEIDI_FAKE_USER_EMAIL ??
    `heidi-user+${Date.now()}@example.com`;
  const userId =
    process.env.HEIDI_SAMPLE_USER_ID ??
    Math.floor(Math.random() * 10_000_000).toString();
  url.searchParams.set('email', email);
  url.searchParams.set('third_party_internal_id', userId);

  const response = await fetch(url, {
    headers: {
      'Heidi-Api-Key': assertApiKey(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(
      `Failed to fetch Heidi JWT (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  const payload = (await response.json()) as JwtResponse;
  const expiresAt =
    payload.expiration_time != null
      ? Date.parse(payload.expiration_time)
      : Date.now() + 5 * 60 * 1000;

  cachedToken = {
    token: payload.token,
    expiresAt,
  };

  return payload.token;
}

async function fetchFromHeidi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await fetchJwtToken();
  const response = await fetch(`${HEIDI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(
      `Heidi API request failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  return (await response.json()) as T;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: 'Unable to parse error response body' };
  }
}

export async function fetchSession(
  sessionId: string,
): Promise<HeidiSessionResponse> {
  return fetchFromHeidi<HeidiSessionResponse>(`/sessions/${sessionId}`);
}

export async function fetchSessionTranscription(
  sessionId: string,
): Promise<HeidiTranscriptionResponse> {
  return fetchFromHeidi<HeidiTranscriptionResponse>(
    `/sessions/${sessionId}/transcription`,
  );
}

export async function fetchSessions(sessionIds: string[]) {
  return Promise.all(sessionIds.map((id) => fetchSession(id)));
}

export async function fetchHeidiSessions(
  sessionIds: string[],
): Promise<HeidiSessionsResponse> {
  const results = await Promise.allSettled(
    sessionIds.map(async (id) => {
      const response = await fetchSession(id);
      return response.session;
    }),
  );

  const sessions: HeidiSessionSummary[] = [];
  const errors: { id: string; message: string }[] = [];

  results.forEach((result, index) => {
    const id = sessionIds[index];
    if (result.status === 'fulfilled') {
      const session = result.value;
      sessions.push({
        id: session.session_id,
        name: session.session_name ?? null,
        patientName: session.patient?.name ?? 'Unknown patient',
        createdAt: session.created_at ?? null,
        updatedAt: session.updated_at ?? null,
        durationSeconds:
          typeof session.duration === 'number' ? session.duration : null,
        languageCode:
          session.language_code ?? session.output_language_code ?? 'en',
        consultNoteStatus: session.consult_note?.status ?? null,
        notePreview: session.consult_note?.result ?? null,
        template: session.consult_note?.heading ?? null,
      });
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown Heidi API error';
      errors.push({ id, message });
    }
  });

  return { sessions, errors };
}

