import { NextResponse } from 'next/server';
import { runEmrSnapshotAutomation } from '@/rpa/openEmrAutomation';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const data = await runEmrSnapshotAutomation();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[EMR SNAPSHOT API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Automation failed' },
      { status: 500 },
    );
  }
}


