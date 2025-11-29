import { NextRequest, NextResponse } from 'next/server';
import { referralStore } from '@/lib/referralStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const password = request.nextUrl.searchParams.get('password');

    const referral = referralStore.get(id);

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 },
      );
    }

    // Check password if one was set
    if (referral.password && referral.password !== password) {
      return NextResponse.json(
        { error: 'Invalid password', requiresPassword: true },
        { status: 401 },
      );
    }

    // Return referral data (without password)
    const { password: _, ...referralData } = referral;
    return NextResponse.json(referralData);
  } catch (error) {
    console.error('[Get Referral API]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch referral',
      },
      { status: 500 },
    );
  }
}

