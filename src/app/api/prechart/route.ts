import { NextResponse } from 'next/server';
import type { PrechartData } from '@/types/prechart';

export const runtime = 'nodejs';

/**
 * Pre-charting bridge between Heidi and the local computer_use_ootb desktop RPA agent.
 *
 * Assumes a controller like showlab/computer_use_ootb is running locally and exposes
 * an HTTP API. By default we call http://localhost:8000/api/task but this can be
 * overridden via the COMPUTER_USE_ENDPOINT env var.
 */
export async function POST(request: Request) {
  try {
    let sessionId = '';
    let patientName = '';

    try {
      const body = await request.json();
      if (body && typeof body.sessionId === 'string') {
        sessionId = body.sessionId;
      }
      if (body && typeof body.patientName === 'string') {
        patientName = body.patientName;
      }
    } catch {
      // ignore invalid JSON
    }

    const controllerEndpoint =
      process.env.COMPUTER_USE_ENDPOINT ?? 'http://localhost:8000/api/task';

    const taskPrompt = buildPrechartTaskPrompt({ sessionId, patientName });

    const controllerResponse = await fetch(controllerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskPrompt,
        output_format: 'json',
      }),
    });

    if (!controllerResponse.ok) {
      const text = await controllerResponse.text().catch(() => '');
      throw new Error(
        `Desktop agent request failed (${controllerResponse.status}): ${text || 'No response body'}`,
      );
    }

    const raw = await controllerResponse.json();
    const prechart = normalizePrechart(raw);

    return NextResponse.json({ prechart });
  } catch (error) {
    console.error('[PRECHART API]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Automation failed while fetching pre-chart data',
      },
      { status: 500 },
    );
  }
}

function buildPrechartTaskPrompt(input: { sessionId: string; patientName: string }) {
  const parts: string[] = [];

  parts.push(
    'You are a careful clinical desktop automation agent controlling OpenEMR on the clinician’s computer.',
  );
  parts.push(
    'The clinician already has OpenEMR open and is logged in, with the correct demo patient selected.',
  );

  if (input.patientName) {
    parts.push(
      `The patient name (from Heidi) is: "${input.patientName}". Use this only as a hint to confirm you are on the right chart.`,
    );
  }

  if (input.sessionId) {
    parts.push(
      `The Heidi session ID is "${input.sessionId}". You do not need to use it inside OpenEMR; it is just reference context.`,
    );
  }

  parts.push(
    [
      'TASK:',
      '1. Ensure the main OpenEMR window is focused.',
      '2. For the currently open patient, navigate to their main summary/overview page.',
      '3. Collect the following pre-charting information from the EMR UI:',
      '   - Demographics: patient name, date of birth, and sex (if visible).',
      '   - Reason for visit / chief complaint (if visible).',
      '   - Recent encounters: at least the 3 most recent visits with date and a one-sentence summary.',
      '   - Recent vitals: key vitals such as blood pressure, heart rate, temperature, weight, etc.',
      '   - Flags / alerts: any important clinical alerts or banner messages that are relevant to today’s visit.',
      '4. DO NOT change, delete, or edit any EMR data. Read-only access only.',
      '5. When you are finished, return the result strictly as JSON with shape:',
      '   {',
      '     "demographics": { "name": string, "dob"?: string, "sex"?: string },',
      '     "reasonForVisit"?: string,',
      '     "pastEncounters": [{ "date": string, "summary": string }],',
      '     "vitals": [{ "label": string, "value": string }],',
      '     "flags": string[]',
      '   }',
      '6. If a section has no data, return an empty array for that key (or omit the optional string fields).',
      '7. Do not wrap the JSON in markdown, text, or any additional explanation.',
    ].join('\n'),
  );

  return parts.join('\n\n');
}

function normalizePrechart(raw: any): PrechartData {
  const demographics = normalizeDemographics(raw?.demographics);
  const reasonForVisit =
    typeof raw?.reasonForVisit === 'string' ? raw.reasonForVisit : undefined;
  const pastEncounters = normalizeEncounters(raw?.pastEncounters);
  const vitals = normalizeVitals(raw?.vitals);
  const flags = normalizeFlags(raw?.flags);

  return {
    demographics,
    reasonForVisit,
    pastEncounters,
    vitals,
    flags,
  };
}

function normalizeDemographics(input: any): PrechartData['demographics'] {
  if (!input || typeof input !== 'object') {
    return { name: 'Unknown patient' };
  }
  const name =
    typeof input.name === 'string'
      ? input.name
      : String(input.name ?? '').trim() || 'Unknown patient';
  const dob =
    typeof input.dob === 'string'
      ? input.dob
      : typeof input.dateOfBirth === 'string'
      ? input.dateOfBirth
      : undefined;
  const sex =
    typeof input.sex === 'string'
      ? input.sex
      : typeof input.gender === 'string'
      ? input.gender
      : undefined;
  return { name, dob, sex };
}

function normalizeEncounters(input: any): PrechartData['pastEncounters'] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { date: '', summary: item };
      }
      const date =
        typeof item.date === 'string'
          ? item.date
          : typeof item.encounterDate === 'string'
          ? item.encounterDate
          : '';
      const summary =
        typeof item.summary === 'string'
          ? item.summary
          : typeof item.description === 'string'
          ? item.description
          : String(item.summary ?? item.description ?? '').trim();
      if (!summary) return null;
      return { date, summary };
    })
    .filter((e): e is PrechartData['pastEncounters'][number] => Boolean(e));
}

function normalizeVitals(input: any): PrechartData['vitals'] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { label: item, value: '' };
      }
      const label =
        typeof item.label === 'string'
          ? item.label
          : typeof item.name === 'string'
          ? item.name
          : '';
      const value =
        typeof item.value === 'string'
          ? item.value
          : item.value != null
          ? String(item.value)
          : '';
      if (!label) return null;
      return { label, value };
    })
    .filter((v): v is PrechartData['vitals'][number] => Boolean(v));
}

function normalizeFlags(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) =>
        typeof item === 'string' ? item : String(item ?? '').trim(),
      )
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return [input];
  }
  return [];
}


