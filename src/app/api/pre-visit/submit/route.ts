import { NextRequest, NextResponse } from 'next/server';
import type { PreVisitFormData } from '@/types/previsit';

export const runtime = 'nodejs';

// In-memory store for demo (in production, use a database)
const preVisitSubmissions = new Map<string, PreVisitFormData>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.personalInfo?.firstName || !body.personalInfo?.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    if (!body.personalInfo?.dateOfBirth || !body.personalInfo?.phoneNumber) {
      return NextResponse.json(
        { error: 'Date of birth and phone number are required' },
        { status: 400 }
      );
    }

    if (!body.medicalInfo?.reasonForVisit) {
      return NextResponse.json(
        { error: 'Reason for visit is required' },
        { status: 400 }
      );
    }

    // Generate submission ID
    const submissionId = `previsit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const submission: PreVisitFormData = {
      id: submissionId,
      sessionId: body.sessionId,
      sessionCode: body.sessionCode || body.appointmentId,
      appointmentId: body.appointmentId,
      submittedAt: new Date().toISOString(),
      personalInfo: body.personalInfo,
      medicalInfo: body.medicalInfo,
      uploads: body.uploads || { images: [], ocrResults: [] },
      verified: true,
    };

    // Store submission
    preVisitSubmissions.set(submissionId, submission);
    
    // Also store by session code if available
    if (submission.sessionCode) {
      preVisitSubmissions.set(`session-${submission.sessionCode}`, submission);
    }

    return NextResponse.json({
      success: true,
      submissionId,
      message: 'Pre-visit form submitted successfully',
    });
  } catch (error) {
    console.error('[PRE-VISIT SUBMIT API]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit pre-visit form',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const sessionCode = searchParams.get('sessionCode');
    const appointmentId = searchParams.get('appointmentId');
    const listAll = searchParams.get('listAll') === 'true';

    // If listAll is true, return all submissions
    if (listAll) {
      const allSubmissions = Array.from(preVisitSubmissions.values()).filter(
        (s) => s.id && s.id.startsWith('previsit-') // Only return actual submissions
      );
      return NextResponse.json({ submissions: allSubmissions });
    }

    let submission: PreVisitFormData | undefined;

    // First check if the provided ID is a direct submission ID
    if (sessionId && preVisitSubmissions.has(sessionId)) {
      submission = preVisitSubmissions.get(sessionId);
    } else if (sessionId) {
      // Find by session ID
      submission = Array.from(preVisitSubmissions.values()).find(
        (s) => s.sessionId === sessionId || s.id === sessionId
      );
    } else if (sessionCode) {
      submission = preVisitSubmissions.get(`session-${sessionCode}`);
    } else if (appointmentId) {
      // First check if it's a direct submission ID
      if (preVisitSubmissions.has(appointmentId)) {
        submission = preVisitSubmissions.get(appointmentId);
      } else {
        submission = Array.from(preVisitSubmissions.values()).find(
          (s) => s.appointmentId === appointmentId || s.id === appointmentId
        );
      }
    }

    if (!submission) {
      return NextResponse.json(
        { error: 'Pre-visit form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('[PRE-VISIT GET API]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch pre-visit form',
      },
      { status: 500 }
    );
  }
}

