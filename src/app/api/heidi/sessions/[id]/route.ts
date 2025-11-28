import { NextResponse } from 'next/server';
import {
  fetchHeidiSessions,
  fetchSessionTranscription,
  type HeidiSessionSummary,
} from '@/lib/heidi';

export const dynamic = 'force-dynamic';

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: 'Session id is required' },
      { status: 400 },
    );
  }

  try {
    const { sessions, errors } = await fetchHeidiSessions([id]);
    const session = sessions[0];

    if (!session) {
      const message =
        errors[0]?.message ??
        `Session ${id} not found`;
      const status = errors.length ? 502 : 404;
      return NextResponse.json({ error: message }, { status });
    }

    let transcription: string | null = null;
    try {
      const transcriptionResponse = await fetchSessionTranscription(id);
      transcription = transcriptionResponse?.transcription ?? null;
    } catch (transcriptionError) {
      console.warn('[heidi session detail] transcription unavailable', {
        id,
        error: transcriptionError,
      });
    }

    return NextResponse.json({
      session: normalizeSession(session),
      transcription,
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
      { status: 502 },
    );
  }
}

function normalizeSession(session: HeidiSessionSummary) {
  return {
    id: session.id,
    patientName: session.patientName,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    durationSeconds: session.durationSeconds ?? null,
    languageCode: session.languageCode ?? 'en',
    consultNoteStatus: session.consultNoteStatus ?? 'UNKNOWN',
    noteResult: session.notePreview ?? null,
    heading: session.template ?? null,
  };
}

