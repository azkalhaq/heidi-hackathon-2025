import { NextResponse } from 'next/server';
import {
  fetchSession,
  fetchSessionTranscription,
  HeidiSessionResponse,
} from '@/lib/heidi';

interface Params {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: Params) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'Session id is required' },
      { status: 400 },
    );
  }

  try {
    const [sessionResponse, transcriptionResponse] = await Promise.all([
      fetchSession(id),
      fetchSessionTranscription(id),
    ]);

    console.log('[heidi session detail]', {
      id,
      session: sessionResponse.session,
      transcription: transcriptionResponse?.transcription ?? null,
    });

    return NextResponse.json({
      session: normalizeSession(sessionResponse),
      transcription: transcriptionResponse?.transcription ?? null,
    });
  } catch (error) {
    console.error('[heidi session detail] failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error fetching session details',
      },
      { status: 500 },
    );
  }
}

function normalizeSession(response: HeidiSessionResponse) {
  const session = response.session;
  return {
    id: session.session_id,
    patientName: session.patient?.name ?? 'Unknown patient',
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    durationSeconds: session.duration ?? null,
    languageCode: session.language_code ?? 'en',
    consultNoteStatus: session.consult_note?.status ?? 'UNKNOWN',
    noteResult: session.consult_note?.result ?? null,
    heading: session.consult_note?.heading ?? null,
  };
}

