import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SESSION_IDS } from '@/lib/heidi/constants';
import { fetchHeidiSessions } from '@/lib/heidi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids');
    const ids = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : DEFAULT_SESSION_IDS;

    if (!ids.length) {
      return NextResponse.json({ sessions: [] });
    }

    const { sessions, errors } = await fetchHeidiSessions(ids);

    const failedSessions = errors.map(({ id, message }) => ({
      id,
      error: message,
    }));

    if (!sessions.length && failedSessions.length) {
      return NextResponse.json(
        {
          error: 'Unable to load Heidi sessions',
          failedSessions,
        },
        { status: 502 },
      );
    }

    const normalizedSessions = sessions.map((session) => ({
      id: session.id,
      patientName: session.patientName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      durationSeconds: session.durationSeconds ?? null,
      languageCode: session.languageCode ?? 'en',
      consultNoteStatus: session.consultNoteStatus ?? 'UNKNOWN',
      notePreview: session.notePreview ?? null,
    }));

    return NextResponse.json({ sessions: normalizedSessions, failedSessions });
  } catch (error) {
    console.error('[heidi sessions] failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error fetching sessions',
      },
      { status: 500 },
    );
  }
}

