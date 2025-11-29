import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Generates a simple prescription-style text from a consult note.
 * For demo purposes, this is a lightweight template-based transform that
 * does not call external APIs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noteContent, patientName, emrSnapshot } = body;

    if (!noteContent || typeof noteContent !== 'string') {
      return NextResponse.json(
        { error: 'noteContent is required and must be a string' },
        { status: 400 },
      );
    }

    const safePatientName =
      typeof patientName === 'string' && patientName.trim().length > 0
        ? patientName.trim()
        : 'the patient';

    const primaryMedication =
      emrSnapshot?.medications?.[0]?.name || 'Amoxicillin 500 mg';

    const prescriptionText = `Prescription for ${safePatientName}

Medication:
- ${primaryMedication}

Directions:
- Take as directed in the clinical note. Adjust dose and frequency according to the note and local prescribing guidelines.

Safety:
- Check allergies, interactions, renal/hepatic function, and relevant monitoring as per local policies before issuing.

Note:
- This prescription text is a draft generated from the consult note only and must be reviewed, edited, and signed by the responsible clinician before use.`;

    const reasoning = `Heidi identified a primary medication${
      emrSnapshot?.medications?.[0]?.name
        ? ` (${emrSnapshot.medications[0].name}) from the EMR snapshot`
        : ' based on common first-line choices for similar cases'
    } and generated a high-level prescription scaffold.

The draft intentionally omits specific dose, route, and frequency decisions where they are not explicitly documented, so that the prescribing clinician can complete and validate these details according to local protocols, allergy profile, interactions, and organ function.

The goal is to give the clinician a head start while keeping full clinical judgment and final authorization with the prescriber.`;

    return NextResponse.json({
      prescriptionText,
      reasoning,
    });
  } catch (error) {
    console.error('[GENERATE PRESCRIPTION API]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate prescription text',
      },
      { status: 500 },
    );
  }
}


