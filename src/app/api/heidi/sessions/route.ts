import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SESSION_IDS,
  fetchSession,
  HeidiSessionResponse,
} from '@/lib/heidi';

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

    const settled = await Promise.allSettled(
      ids.map((id) => fetchSession(id)),
    );

    const successfulSessions: HeidiSessionResponse[] = [];
    const failedSessions: { id: string; error: string }[] = [];

    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulSessions.push(result.value);
      } else {
        failedSessions.push({
          id: ids[index],
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown Heidi API error',
        });
      }
    });

    if (!successfulSessions.length && failedSessions.length) {
      return NextResponse.json(
        {
          error: 'Unable to load Heidi sessions',
          failedSessions,
        },
        { status: 502 },
      );
    }

    const sessions = successfulSessions.map((response: HeidiSessionResponse) => {
      const session = response.session;
      console.log('[heidi session data]', session.session_id, session);
      return {
        id: session.session_id,
        patientName: session.patient?.name ?? 'Unknown patient',
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        durationSeconds: session.duration ?? null,
        languageCode: session.language_code ?? 'en',
        consultNoteStatus: session.consult_note?.status ?? 'UNKNOWN',
        notePreview: session.consult_note?.result ?? null,
      };
    });

    return NextResponse.json({ sessions, failedSessions });
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

