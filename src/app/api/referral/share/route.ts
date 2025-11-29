import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { referralStore } from '@/lib/referralStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralLetter, emrSnapshot, patientName, service, notePreview, password, timelineSummary } = body;

    if (!referralLetter) {
      return NextResponse.json(
        { error: 'Referral letter is required' },
        { status: 400 },
      );
    }

    // Generate a unique ID for the referral
    const referralId = randomBytes(16).toString('hex');
    
    // Store the referral with password
    referralStore.set(referralId, {
      referralLetter,
      emrSnapshot: emrSnapshot || null,
      patientName: patientName || 'Unknown patient',
      service: service || 'Specialist clinic',
      notePreview: notePreview || '',
      timelineSummary: timelineSummary || null,
      password: password || '',
      createdAt: new Date(),
    });

    // Clean up old referrals (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const [id, data] of referralStore.entries()) {
      if (data.createdAt < sevenDaysAgo) {
        referralStore.delete(id);
      }
    }

    return NextResponse.json({
      referralId,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/referral/${referralId}`,
    });
  } catch (error) {
    console.error('[Share Referral API]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create shareable referral',
      },
      { status: 500 },
    );
  }
}

